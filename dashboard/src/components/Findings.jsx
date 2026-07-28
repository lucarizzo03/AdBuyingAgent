import { useMemo } from "react";
import { computeFindings, fmtDollar, fmtInt, fmtPct } from "../lib/stats";

export default function Findings({ logs }) {
  const f = useMemo(() => computeFindings(logs), [logs]);

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-title">Findings</div>
        </div>
      </div>
      <ol
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <li style={{ display: "flex", gap: 10 }}>
          <span className="mono" style={{ color: "var(--ink-faint)" }}>1.</span>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-secondary)" }}>
            Shock detection worked — the v2 agent cut meta spend {fmtPct(f.metaCutPct)} (from{" "}
            {fmtDollar(f.metaAtShock)}/day to {fmtDollar(f.metaFourDaysLater)}/day) within 4 days of
            the day-{f.shockStart} hidden conversion-rate crash, while the static baseline kept
            feeding it {fmtDollar(f.baselineMetaPerDay)}/day for {f.postShockDays} more days.
          </p>
        </li>
        <li style={{ display: "flex", gap: 10 }}>
          <span className="mono" style={{ color: "var(--ink-faint)" }}>2.</span>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-secondary)" }}>
            v1's failure: it never suspected its own spend increases were causing search's CPA to
            drift, from {fmtDollar(f.v1SearchDay1Cpa, { decimals: 2 })} on day 1 to a peak of{" "}
            {fmtDollar(f.v1SearchPeakCpa, { decimals: 2 })} — it kept scaling the channel anyway.
          </p>
        </li>
        <li style={{ display: "flex", gap: 10 }}>
          <span className="mono" style={{ color: "var(--ink-faint)" }}>3.</span>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-secondary)" }}>
            The fix: one saturation hint added to the system prompt, plus a more tolerant response
            parser, took parse failures from {fmtInt(f.v1ParseFailures)} to {fmtInt(f.v2ParseFailures)}{" "}
            and total sales from {fmtInt(f.v1Sales)} to {fmtInt(f.v2Sales)}.
          </p>
        </li>
      </ol>
    </section>
  );
}
