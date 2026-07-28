// All numbers on the page are derived from the three JSON logs at load time —
// nothing here is a hardcoded campaign result, so a rerun of the sim (which
// overwrites the files in /public) stays correct after a refresh.

export const CHANNELS = ["search", "meta", "tiktok", "display"];

export const CHANNEL_LABEL = {
  search: "Search",
  meta: "Meta",
  tiktok: "TikTok",
  display: "Display",
};

export const CHANNEL_COLOR = {
  search: "var(--ch-search)",
  meta: "var(--ch-meta)",
  tiktok: "var(--ch-tiktok)",
  display: "var(--ch-display)",
};

export const SHOCK_DAY = 20;
export const SHOCK_LABEL = "meta conversion rate secretly halved";

const PARSE_FAILURE_REASONING = "parse error - held steady";

export async function loadLogs() {
  const [baseline, v1, v2] = await Promise.all(
    ["/baseline_log.json", "/campaign_log_v1.json", "/campaign_log_v2.json"].map((path) =>
      fetch(path).then((r) => {
        if (!r.ok) throw new Error(`failed to load ${path}: ${r.status}`);
        return r.json();
      })
    )
  );
  return { baseline, v1, v2 };
}

export function dayTotals(entry) {
  let spend = 0;
  let conversions = 0;
  let clicks = 0;
  for (const c of CHANNELS) {
    const r = entry.results[c];
    spend += r.spend;
    conversions += r.conversions;
    clicks += r.clicks;
  }
  return { spend, conversions, clicks };
}

/** Per-day + cumulative series for one log, keyed by day. */
export function buildSeries(log) {
  let cumSpend = 0;
  let cumConversions = 0;
  return log.map((entry) => {
    const { spend, conversions } = dayTotals(entry);
    cumSpend += spend;
    cumConversions += conversions;
    return {
      day: entry.day,
      spend,
      conversions,
      cumSpend,
      cumConversions,
      blendedCpa: conversions > 0 ? spend / conversions : null,
      cumCpa: cumConversions > 0 ? cumSpend / cumConversions : null,
    };
  });
}

/** Trailing N-day average of `key`, ignoring null values in the window. */
export function trailingAverage(series, key, window = 7) {
  return series.map((pt, i) => {
    const slice = series.slice(Math.max(0, i - window + 1), i + 1);
    const vals = slice.map((s) => s[key]).filter((v) => v != null);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    return { ...pt, [`${key}Smoothed`]: avg };
  });
}

export function parseFailures(log) {
  const failures = log.filter((h) => h.reasoning === PARSE_FAILURE_REASONING).length;
  return { failures, total: log.length, rate: (log.length - failures) / log.length };
}

export function summarize(entries) {
  let spend = 0;
  let sales = 0;
  for (const h of entries) {
    const t = dayTotals(h);
    spend += t.spend;
    sales += t.conversions;
  }
  return { spend, sales, cpa: sales > 0 ? spend / sales : null };
}

export function scoreboardStats(log, { hasParseRate }) {
  const overall = summarize(log);
  const postShock = summarize(log.filter((h) => h.day >= SHOCK_DAY));
  const pf = parseFailures(log);
  return {
    totalSales: overall.sales,
    overallCpa: overall.cpa,
    postShockCpa: postShock.cpa,
    parseRate: hasParseRate ? pf.rate : null,
    parseFailures: pf.failures,
  };
}

/** v2 decision-log rows with per-channel spend deltas vs the previous day. */
export function decisionRows(log) {
  const dayOneBudget = CHANNELS.reduce((s, c) => s + log[0].allocations[c], 0);
  const evenSplit = Object.fromEntries(CHANNELS.map((c) => [c, dayOneBudget / CHANNELS.length]));

  return log.map((entry, i) => {
    const prevAlloc = i === 0 ? evenSplit : log[i - 1].allocations;
    const deltas = Object.fromEntries(
      CHANNELS.map((c) => [c, entry.allocations[c] - prevAlloc[c]])
    );
    const totals = dayTotals(entry);
    return {
      ...entry,
      deltas,
      isFirstDay: i === 0,
      blendedCpa: totals.conversions > 0 ? totals.spend / totals.conversions : null,
    };
  });
}

/** Channel-level daily spend + cpa for the small multiples. */
export function channelSeries(log, channel) {
  return log.map((entry) => ({
    day: entry.day,
    spend: entry.results[channel].spend,
    cpa: entry.results[channel].cpa,
  }));
}

/**
 * Grounding numbers for the FINDINGS section — every figure here is computed
 * from the loaded logs, not hardcoded, so it stays honest after a rerun.
 */
export function computeFindings({ baseline, v1, v2 }) {
  const shockStart = SHOCK_DAY;
  const fourDaysLater = SHOCK_DAY + 4;
  const totalDays = v2[v2.length - 1].day;

  const metaAtShock = v2.find((h) => h.day === shockStart)?.allocations.meta ?? null;
  const metaFourDaysLater = v2.find((h) => h.day === fourDaysLater)?.allocations.meta ?? null;
  const metaCutPct =
    metaAtShock && metaFourDaysLater != null
      ? ((metaAtShock - metaFourDaysLater) / metaAtShock) * 100
      : null;

  const baselineMetaPerDay = baseline[0]?.allocations.meta ?? null;
  const postShockDays = totalDays - shockStart + 1;

  const v1SearchDay1Cpa = v1[0]?.results.search.cpa ?? null;
  const v1SearchPeakCpa = v1.reduce((max, h) => {
    const cpa = h.results.search.cpa;
    return cpa != null && cpa > max ? cpa : max;
  }, 0);

  const v1ParseFailures = parseFailures(v1);
  const v2ParseFailures = parseFailures(v2);
  const v1Sales = summarize(v1).sales;
  const v2Sales = summarize(v2).sales;

  return {
    shockStart,
    fourDaysLater,
    metaAtShock,
    metaFourDaysLater,
    metaCutPct,
    baselineMetaPerDay,
    postShockDays,
    v1SearchDay1Cpa,
    v1SearchPeakCpa,
    v1ParseFailures: v1ParseFailures.failures,
    v2ParseFailures: v2ParseFailures.failures,
    v1Sales,
    v2Sales,
  };
}

export function fmtDollar(n, { decimals = 0 } = {}) {
  if (n == null || Number.isNaN(n)) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function fmtSignedDollar(n) {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "±";
  return `${sign}$${Math.abs(n).toFixed(0)}`;
}

export function fmtPct(n, { decimals = 0 } = {}) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(decimals)}%`;
}

/**
 * Merge three per-log series (each an array of {day, [valueKey]: n}) into one
 * array of {day, baseline, v1, v2} for a single-XAxis multi-line chart.
 */
export function mergeSeries({ baseline, v1, v2 }, valueKey) {
  return baseline.map((b, i) => ({
    day: b.day,
    baseline: b[valueKey],
    v1: v1[i]?.[valueKey] ?? null,
    v2: v2[i]?.[valueKey] ?? null,
  }));
}

export function fmtInt(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US");
}
