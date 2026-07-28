import json
import random

from channels import CHANNELS
from simulate import simulate

CHANNEL_NAMES: tuple[str, ...] = tuple(CHANNELS.keys())
DAILY_BUDGET: float = 500.0

BASELINE_ALLOCATIONS = {c: DAILY_BUDGET / len(CHANNEL_NAMES) for c in CHANNEL_NAMES}
BASELINE_REASONING = "baseline - static even split"


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


def run_baseline(days: int = 45, seed: int = 42) -> list:
    """Run the static even-split baseline day by day and write baseline_log.json."""
    random.seed(seed)
    history: list = []

    for day in range(1, days + 1):
        allocations = dict(BASELINE_ALLOCATIONS)
        results = simulate(allocations, day)

        history.append({
            "day": day,
            "allocations": allocations,
            "results": results,
            "reasoning": BASELINE_REASONING,
        })

        total_sales = sum(r["conversions"] for r in results.values())
        total_spend = sum(r["spend"] for r in results.values())
        blended_cpa = f"${total_spend / total_sales:.2f}" if total_sales > 0 else "N/A"
        print(f"Day {day:2d}: {total_sales} sales, blended CPA {blended_cpa}")

    with open("baseline_log.json", "w") as f:
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
    run_baseline()
