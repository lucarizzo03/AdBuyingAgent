# Ad-Buying Agent — Dashboard

A single-page dashboard comparing an LLM ad-buying agent against a static baseline
and an earlier agent version, over a 45-day simulated campaign.

## Running locally

```bash
npm install
npm run dev
```

## Data

The dashboard reads three JSON files from `public/`:

- `baseline_log.json` — static even-split spend, every day, no decisions.
- `campaign_log_v1.json` — first agent version.
- `campaign_log_v2.json` — current agent version (saturation-aware prompt + tolerant parser).

Each file is an array of 45 entries shaped like:

```json
{
  "day": 1,
  "allocations": { "search": 125, "meta": 125, "tiktok": 125, "display": 125 },
  "results": {
    "search": { "spend": 125, "clicks": 51, "conversions": 4, "cpa": 31.25 }
  },
  "reasoning": "..."
}
```

Rerun a campaign (see the parent project's `agent.py` / `baseline.py`) and overwrite
the matching file in `public/` — every number on the page is derived from these
files at load time, so a refresh is all that's needed. No rebuild required.

## Deploying to Vercel

This is a stock Vite + React app. Point Vercel at this directory; it auto-detects
the Vite preset (`npm run build`, output `dist/`). No extra config needed.

## How the sim works

Four channels — `search`, `meta`, `tiktok`, `display` — each have hidden, fixed
parameters the agent never sees: a cost-per-click, a conversion rate, a
saturation threshold, and daily noise. `$500/day` is split across them.

- **Saturation**: spend past a channel's threshold only converts to "working"
  spend at 40% efficiency — scaling a saturated channel further burns budget for
  little return.
- **The day-20 shock**: starting day 20, meta's conversion rate is secretly
  halved (an unannounced algorithm change). Nothing in the data tells the agent
  this directly — it has to infer it from a worsening CPA trend.
- **The agent's loop**: each morning it reads a report (7-day channel averages,
  trend labels, yesterday's numbers — never the hidden parameters above),
  proposes a new allocation, and must justify it in 2–3 sentences. A validator
  clamps each channel's move to ±30% of the previous day and rescales the total
  back to $500 before the day is simulated.
- **v1 vs v2**: v1's prompt had no saturation guidance and a stricter response
  parser (5 parse failures over the campaign, each falling back to "hold
  steady"). v2 added one line about diminishing returns and a more tolerant
  parser — 0 parse failures, and it detects and reacts to the meta shock within
  days instead of not at all.
