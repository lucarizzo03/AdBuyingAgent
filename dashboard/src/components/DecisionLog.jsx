import { useMemo } from "react";
import { CHANNELS, CHANNEL_LABEL, CHANNEL_COLOR, decisionRows, fmtSignedDollar } from "../lib/stats";
import { NOTABLE_DAYS } from "../lib/notableDays";

function Chip({ channel, delta }) {
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 999,
        border: `1px solid color-mix(in srgb, ${CHANNEL_COLOR[channel]} 45%, var(--border))`,
        background: `color-mix(in srgb, ${CHANNEL_COLOR[channel]} 10%, transparent)`,
        color: "var(--ink)",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: CHANNEL_COLOR[channel] }} />
      {CHANNEL_LABEL[channel].toLowerCase()} {fmtSignedDollar(delta)}
    </span>
  );
}

function Row({ row }) {
  const notableLabel = NOTABLE_DAYS[row.day];
  const chips = CHANNELS.filter((c) => Math.abs(row.deltas[c]) >= 0.5);

  return (
    <div className={`decision-row${notableLabel ? " notable" : ""}`}>
      <div className="decision-row-head">
        <span className="mono decision-day">Day {String(row.day).padStart(2, "0")}</span>
        <div className="decision-chips">
          {chips.length > 0 ? (
            chips.map((c) => <Chip key={c} channel={c} delta={row.deltas[c]} />)
          ) : (
            <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>opening split — no prior day</span>
          )}
        </div>
      </div>
      {notableLabel && <div className="decision-notable-label">{notableLabel}</div>}
      <p className="decision-reasoning">{row.reasoning}</p>
    </div>
  );
}

export default function DecisionLog({ log }) {
  const rows = useMemo(() => decisionRows(log), [log]);

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-title">Decision log</div>
          <p className="section-sub">All 45 days of the v2 agent's decisions, verbatim.</p>
        </div>
      </div>
      <div className="decision-log">
        {rows.map((row) => (
          <Row key={row.day} row={row} />
        ))}
      </div>
    </section>
  );
}
