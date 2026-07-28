const SERIES = [
  { key: "baseline", label: "Baseline", color: "var(--baseline)" },
  { key: "v1", label: "Agent v1", color: "var(--v1)" },
  { key: "v2", label: "Agent v2", color: "var(--accent)" },
];

export default function MultiLineTooltip({ active, payload, label, fmt }) {
  if (!active || !payload || !payload.length) return null;
  const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]));

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: "8px 10px",
        fontSize: 11.5,
        boxShadow: "none",
        minWidth: 150,
      }}
    >
      <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 6 }}>
        Day {label}
      </div>
      {SERIES.map((s) => (
        <div
          key={s.key}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            padding: "1px 0",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-secondary)" }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: s.color,
                display: "inline-block",
              }}
            />
            {s.label}
          </span>
          <span className="mono" style={{ fontWeight: 600, color: "var(--ink)" }}>
            {fmt(byKey[s.key])}
          </span>
        </div>
      ))}
    </div>
  );
}
