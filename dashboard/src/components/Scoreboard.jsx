import { scoreboardStats, summarize, fmtDollar, fmtInt, fmtPct } from "../lib/stats";

const ROWS = [
  { key: "totalSales", label: "Total sales", fmt: (v) => fmtInt(v) },
  { key: "overallCpa", label: "Overall CPA", fmt: (v) => fmtDollar(v, { decimals: 2 }) },
  { key: "postShockCpa", label: "Post-shock CPA (d20–45)", fmt: (v) => fmtDollar(v, { decimals: 2 }) },
  { key: "parseRate", label: "Decision parse rate", fmt: (v) => (v == null ? "—" : fmtPct(v * 100)) },
];

function signedPct(n) {
  if (n == null || Number.isNaN(n)) return "—";
  const rounded = Math.round(n);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function Column({ title, stats, accent, delta }) {
  return (
    <div
      style={{
        flex: "1 1 0",
        padding: "16px 18px",
        borderLeft: accent ? undefined : "1px solid var(--border)",
        background: accent ? "var(--accent-tint)" : "transparent",
        borderRadius: accent ? 6 : 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: accent ? "var(--accent)" : "var(--ink-muted)",
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {delta && (
        <div
          className="mono"
          style={{
            fontSize: 11.5,
            color: "var(--accent)",
            marginTop: -8,
            marginBottom: 12,
          }}
        >
          {delta}
        </div>
      )}
      {ROWS.map((row) => (
        <div
          key={row.key}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
            padding: "6px 0",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{row.label}</span>
          <span
            className="mono"
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: accent ? "var(--accent)" : "var(--ink)",
            }}
          >
            {row.fmt(stats[row.key])}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Scoreboard({ baseline, v1, v2 }) {
  const baselineStats = scoreboardStats(baseline, { hasParseRate: false });
  const v1Stats = scoreboardStats(v1, { hasParseRate: true });
  const v2Stats = scoreboardStats(v2, { hasParseRate: true });
  const totalBudget = summarize(baseline).spend;
  const shockDay = 20;

  const salesDeltaPct = ((v2Stats.totalSales - baselineStats.totalSales) / baselineStats.totalSales) * 100;
  const cpaDeltaPct = ((v2Stats.overallCpa - baselineStats.overallCpa) / baselineStats.overallCpa) * 100;
  const v2Delta = `${signedPct(salesDeltaPct)} sales · ${signedPct(cpaDeltaPct)} CPA vs baseline`;

  return (
    <section className="section">
      <div
        className="card"
        style={{
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        <Column title="Baseline" stats={baselineStats} />
        <Column title="Agent v1" stats={v1Stats} />
        <Column title="Agent v2" stats={v2Stats} accent delta={v2Delta} />
      </div>
      <p
        style={{
          fontSize: 12.5,
          color: "var(--ink-muted)",
          marginTop: 10,
          marginBottom: 0,
        }}
      >
        Same {fmtDollar(totalBudget)}. Same market. Same day-{shockDay} shock. Only the decisions differ.
      </p>
    </section>
  );
}
