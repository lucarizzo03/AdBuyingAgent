# Ad-Buying Agent

![Dashboard demo](dashboard.gif)

LIVE DASHBAORD: ad-buying-agent.vercel.app 

An LLM agent manages a simulated $500/day ad budget across 4 channels for a
45-day campaign, benchmarked against a static even-split baseline and an
earlier agent version.

## Architecture

```
  history[] ──▶ build_report(history, day, budget)
                        │
                        ▼
                    "DAY N of 45..." text briefing
                    (7-day avgs, trend labels, yesterday's numbers —
                     never channels.py's hidden params)
                        │
                        ▼
                    ask_agent(report, day)  ──▶  Claude API (system prompt:
                        │                         rules + ±30%/day cap)
                        ▼
                    raw response text
                        │
                        ▼
                    _extract_json(text)   [tolerant parser: strips markdown
                        │                  fences, prose preamble; on failure
                        │                  logs to parse_failures.txt, retries
                        │                  once, then gives up]
                        ▼
                    validate_decision(decision, previous_allocations)
                        - clamp each channel to ±30% of yesterday
                        - rescale total back to exactly $500
                        - fallback: "hold steady" if unparseable
                        │
                        ▼
                    simulate(allocations, day)   ◀── channels.py
                        - applies hidden cpc / conv_rate / saturation / noise    (hidden ground truth:
                        - day ≥ 20: meta's conv_rate is secretly halved           cpc, conv_rate,
                        │                                                        saturation curve, noise —
                        ▼                                                        agent never sees this)
                    {allocations, results, reasoning} ──▶ history.append(...)
                        │                                  ──▶ campaign_log_v2.json
                        └──────────────▶ loop to next day (repeat, day 1 → 45)
```

**The daily loop** (`run_campaign` in `agent.py`):

1. **`build_report(history, day, budget)`** — turns raw simulation history
   into the text briefing the agent reads: 7-day rolling averages per channel,
   a trend label (`IMPROVING` / `STABLE` / `WORSENING`), and yesterday's raw
   numbers. It only ever surfaces `simulate()`'s outputs (spend, clicks,
   conversions, CPA) — never `channels.py`'s hidden parameters.
2. **`ask_agent(report, day)`** — sends the report to Claude with a system
   prompt describing the rules (budget, ±30%/day change cap, watch for
   saturation, keep reasoning to 2–3 sentences), retries once on failure, and
   parses the response with a tolerant regex-based extractor that survives
   markdown fences and stray prose (`_extract_json`).
3. **`validate_decision(decision, previous_allocations)`** — the safety net.
   Clamps each channel's proposed spend to ±30% of the prior day, rescales
   the total back to exactly $500, and falls back to "hold steady" if the
   response didn't parse or is malformed.
4. **`simulate(allocations, day)`** — the environment. Applies each channel's
   hidden cost-per-click, conversion rate, saturation curve (spend past
   threshold converts at 40% efficiency), and daily noise. From day 20 on,
   meta's conversion rate is secretly halved — an unannounced shock the
   agent has to detect from trend data alone.
5. Each day's `{allocations, results, reasoning}` is appended to `history`
   and written to a `campaign_log_*.json` file, which the dashboard reads
   directly.

## Files

| File | Role |
|---|---|
| `agent.py` | The agent loop: report builder, Claude call + validation, daily loop |
| `simulate.py` | The environment — turns allocations into clicks/conversions/CPA |
| `channels.py` | Ground-truth channel parameters, hidden from the agent |
| `baseline.py` | Static even-split comparison (no decisions, no LLM) |
| `*_log.json` | Output of a campaign run — read by the dashboard |
| `parse_failures.txt` | Raw unparseable model responses, appended on failure |
| `dashboard/` | The results dashboard (Vite + React + Recharts) |

## Running a campaign

```bash
pip install anthropic python-dotenv
echo "ANTHROPIC_API_KEY=sk-..." > .env
python agent.py          # writes campaign_log_v2.json
python baseline.py       # writes baseline_log.json
```

Then copy the output files into `dashboard/public/` (matching the names
`baseline_log.json`, `campaign_log_v1.json`, `campaign_log_v2.json`) and
refresh the dashboard — every number on the page is derived from these files
at load time, no rebuild needed.
