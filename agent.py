from __future__ import annotations

import json
import random
import re

import anthropic
from dotenv import load_dotenv

from channels import CHANNELS
from simulate import simulate

load_dotenv()

CHANNEL_NAMES: tuple[str, ...] = tuple(CHANNELS.keys())
DAILY_BUDGET: float = 500.0
TOTAL_DAYS: int = 45

SYSTEM_PROMPT = (
    "You are a media buyer managing $500/day across 4 channels: search, meta, "
    "tiktok, display. Goal: maximize total sales (minimize cost per sale) over a "
    "45-day campaign. Rules: allocations must sum to exactly 500. You may not "
    "change any channel's budget by more than 30% of its current level in one day "
    "(on day 1, start from an even split). Distinguish real trends from daily "
    "noise - do not overreact to single-day swings. Watch for diminishing "
    "returns: if a channel's CPA consistently rises as you increase its spend, "
    "the channel may be saturated. Scaling it further can make results worse - "
    "the marginal dollar may be better spent elsewhere. Consider whether YOUR "
    "OWN spend increases are causing a channel's CPA to drift up. Do all "
    "arithmetic silently before answering. Never show calculations, "
    "corrections, or step-by-step math in the reasoning field. The reasoning "
    "must be 2-3 clean, final sentences - an executive summary of the decision "
    "only. Respond with ONLY a JSON "
    "object, no markdown fences, no prose outside it: "
    '{"allocations": {"search": n, "meta": n, "tiktok": n, "display": n}, '
    '"reasoning": "2-3 sentences explaining your decision"}'
)

_client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env


# ---------------------------------------------------------------------------
# PIECE 1 — report builder
# ---------------------------------------------------------------------------

def _trend_label(history: list, channel: str) -> str:
    """Compare avg CPA of the last 3 days vs the 3 before that; >15% swing = a trend."""
    if len(history) < 6:
        return "STABLE"
    last3 = history[-3:]
    prev3 = history[-6:-3]
    last3_cpas = [h["results"][channel]["cpa"] for h in last3 if h["results"][channel]["cpa"] is not None]
    prev3_cpas = [h["results"][channel]["cpa"] for h in prev3 if h["results"][channel]["cpa"] is not None]
    if not last3_cpas or not prev3_cpas:
        return "STABLE"
    last3_avg = sum(last3_cpas) / len(last3_cpas)
    prev3_avg = sum(prev3_cpas) / len(prev3_cpas)
    if prev3_avg == 0:
        return "STABLE"
    pct_change = (last3_avg - prev3_avg) / prev3_avg
    if pct_change <= -0.15:
        return "IMPROVING"
    if pct_change >= 0.15:
        return "WORSENING"
    return "STABLE"


def build_report(history: list, day: int, budget: float) -> str:
    """Turn raw simulate() history into the text briefing the agent reads.

    Only ever surfaces simulate() outputs (spend, clicks, conversions, cpa) —
    never CHANNELS' hidden params (cpc, conv_rate, saturation, noise).
    """
    header = f"DAY {day} of {TOTAL_DAYS}. Budget today: ${budget}."

    if day == 1 or not history:
        return f"{header}\n\nNo data yet. This is your first day."

    lines = [header, "", "LAST 7 DAYS (or fewer if early in campaign):"]
    window = history[-7:]
    for channel in CHANNEL_NAMES:
        spends = [h["results"][channel]["spend"] for h in window]
        cpas = [h["results"][channel]["cpa"] for h in window if h["results"][channel]["cpa"] is not None]
        avg_spend = sum(spends) / len(spends)
        avg_cpa_str = f"${sum(cpas) / len(cpas):.2f}" if cpas else "N/A"
        trend = _trend_label(history, channel)
        lines.append(f"  {channel}: avg spend ${avg_spend:.2f}/day, avg CPA {avg_cpa_str}, trend {trend}")

    lines.append("")
    lines.append("YESTERDAY:")
    yesterday = history[-1]["results"]
    for channel in CHANNEL_NAMES:
        r = yesterday[channel]
        cpa_str = f"${r['cpa']:.2f}" if r["cpa"] is not None else "N/A"
        lines.append(
            f"  {channel}: spend ${r['spend']:.2f}, clicks {r['clicks']}, "
            f"sales {r['conversions']}, CPA {cpa_str}"
        )

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# PIECE 2 — LLM call + validation
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> dict:
    """Pull the allocations JSON object out of a response, tolerating markdown
    fences or a prose preamble the model wrote before the JSON."""
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    candidate = fenced.group(1) if fenced else text
    match = re.search(r'\{.*"allocations".*\}', candidate, re.DOTALL)
    if not match:
        raise ValueError("no JSON object found in response")
    return json.loads(match.group(0))


def _log_parse_failure(day: int, raw_text: str) -> None:
    """Append a raw, unparseable model response to parse_failures.txt for later inspection."""
    with open("parse_failures.txt", "a") as f:
        f.write(f"=== Day {day} ===\n{raw_text}\n\n")


def ask_agent(report: str, day: int) -> dict | None:
    """Call Claude with the report; retry once on API/parse failure.

    Returns the parsed decision dict, or None if both attempts fail.
    """
    for _ in range(2):
        try:
            response = _client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": report}],
            )
        except Exception:
            continue
        text = response.content[0].text
        try:
            return _extract_json(text)
        except (ValueError, json.JSONDecodeError):
            _log_parse_failure(day, text)
            continue
    return None


def validate_decision(decision: dict | None, previous_allocations: dict) -> dict:
    """Repair/validate a decision dict; fall back to holding steady on failure."""
    fallback = {"allocations": dict(previous_allocations), "reasoning": "parse error - held steady"}

    if not decision or "allocations" not in decision:
        return fallback

    allocations = decision.get("allocations", {})
    reasoning = decision.get("reasoning", "")

    if not all(c in allocations for c in CHANNEL_NAMES):
        return fallback

    try:
        allocations = {c: float(allocations[c]) for c in CHANNEL_NAMES}
    except (TypeError, ValueError):
        return fallback

    if any(v < 0 for v in allocations.values()):
        return fallback

    # clamp each channel to +/-30% of its previous-day level
    clamped = {}
    for c in CHANNEL_NAMES:
        prev_val = previous_allocations[c]
        lo, hi = prev_val * 0.7, prev_val * 1.3
        clamped[c] = min(max(allocations[c], lo), hi)

    # re-scale proportionally so the total is exactly the daily budget
    total = sum(clamped.values())
    if total <= 0:
        return fallback
    scale = DAILY_BUDGET / total
    final = {c: round(clamped[c] * scale, 2) for c in CHANNEL_NAMES}

    # fix any leftover rounding drift on the last channel
    drift = round(DAILY_BUDGET - sum(final.values()), 2)
    if drift:
        final[CHANNEL_NAMES[-1]] = round(final[CHANNEL_NAMES[-1]] + drift, 2)

    return {"allocations": final, "reasoning": reasoning or "no reasoning provided"}


# ---------------------------------------------------------------------------
# PIECE 3 — daily loop
# ---------------------------------------------------------------------------

def _summarize(entries: list) -> dict:
    """Aggregate spend/sales/CPA stats over a slice of history entries."""
    total_spend = sum(r["spend"] for h in entries for r in h["results"].values())
    total_sales = sum(r["conversions"] for h in entries for r in h["results"].values())
    overall_cpa = total_spend / total_sales if total_sales > 0 else None
    avg_sales_per_day = total_sales / len(entries) if entries else 0
    return {
        "total_spend": round(total_spend, 2),
        "total_sales": total_sales,
        "overall_cpa": round(overall_cpa, 2) if overall_cpa is not None else None,
        "avg_sales_per_day": round(avg_sales_per_day, 2),
    }


def _print_summary(label: str, stats: dict) -> None:
    cpa_str = f"${stats['overall_cpa']:.2f}" if stats["overall_cpa"] is not None else "N/A"
    print(
        f"{label}: spend ${stats['total_spend']:.2f}, sales {stats['total_sales']}, "
        f"CPA {cpa_str}, avg sales/day {stats['avg_sales_per_day']:.2f}"
    )


def run_campaign(days: int = TOTAL_DAYS, seed: int = 42, outfile: str = "campaign_log_v2.json") -> list:
    """Run the campaign day by day and write history to outfile for the dashboard."""
    random.seed(seed)
    history: list = []
    prev = {c: DAILY_BUDGET / len(CHANNEL_NAMES) for c in CHANNEL_NAMES}

    for day in range(1, days + 1):
        report = build_report(history, day, DAILY_BUDGET)
        decision = validate_decision(ask_agent(report, day), prev)
        results = simulate(decision["allocations"], day)

        history.append({
            "day": day,
            "allocations": decision["allocations"],
            "results": results,
            "reasoning": decision["reasoning"],
        })
        prev = decision["allocations"]

        total_sales = sum(r["conversions"] for r in results.values())
        total_spend = sum(r["spend"] for r in results.values())
        blended_cpa = f"${total_spend / total_sales:.2f}" if total_sales > 0 else "N/A"
        print(f"Day {day:2d}: {total_sales} sales, blended CPA {blended_cpa}")
        print(f"    {decision['reasoning']}")

    with open(outfile, "w") as f:
        json.dump(history, f, indent=2)

    pre_shock = [h for h in history if h["day"] <= 19]
    post_shock = [h for h in history if h["day"] >= 20]

    print()
    print("=== FINAL SUMMARY ===")
    _print_summary("Overall            ", _summarize(history))
    _print_summary("Pre-shock  (1-19)  ", _summarize(pre_shock))
    _print_summary("Post-shock (20-45) ", _summarize(post_shock))

    return history


if __name__ == "__main__":
    run_campaign()
