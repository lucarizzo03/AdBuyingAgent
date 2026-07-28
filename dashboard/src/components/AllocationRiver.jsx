import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { CHANNELS, CHANNEL_LABEL, CHANNEL_COLOR, fmtDollar } from "../lib/stats";
import { RIVER_MARKERS } from "../lib/notableDays";
import { getAnimationDuration } from "../lib/motion";

const ANIM = getAnimationDuration();

const VIEWS = [
  { key: "v2", label: "Agent v2" },
  { key: "v1", label: "Agent v1" },
  { key: "baseline", label: "Baseline" },
];

function riverData(log) {
  return log.map((entry) => ({ day: entry.day, ...entry.allocations }));
}

function RiverTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const rows = [...payload].reverse();
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: "8px 10px",
        fontSize: 11.5,
        minWidth: 150,
      }}
    >
      <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 6 }}>
        Day {label}
      </div>
      {rows.map((p) => (
        <div
          key={p.dataKey}
          style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "1px 0" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-secondary)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, display: "inline-block" }} />
            {CHANNEL_LABEL[p.dataKey]}
          </span>
          <span className="mono" style={{ fontWeight: 600 }}>{fmtDollar(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AllocationRiver({ logs }) {
  const [view, setView] = useState("v2");
  const data = useMemo(() => riverData(logs[view]), [logs, view]);

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-title">Allocation river</div>
          <p className="section-sub">Daily channel allocations — watch it steer.</p>
        </div>
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 5, overflow: "hidden" }}>
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              style={{
                border: "none",
                background: view === v.key ? "var(--ink)" : "transparent",
                color: view === v.key ? "#fff" : "var(--ink-muted)",
                fontSize: 11.5,
                padding: "5px 11px",
                cursor: "pointer",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        {CHANNELS.map((c) => (
          <span key={c} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--ink-muted)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: CHANNEL_COLOR[c] }} />
            {CHANNEL_LABEL[c]}
          </span>
        ))}
        {view === "baseline" && (
          <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>— four flat bands, always.</span>
        )}
      </div>

      <div className="card" style={{ padding: "20px 8px 12px 8px" }}>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 8, right: 14, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fontSize: 11, fill: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
              ticks={[1, 10, 20, 30, 40, 45]}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
              width={40}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<RiverTooltip />} />
            {view === "v2" &&
              RIVER_MARKERS.map((m) => (
                <ReferenceLine
                  key={m.day}
                  x={m.day}
                  stroke="var(--ink)"
                  strokeDasharray="2 3"
                  strokeOpacity={0.5}
                  label={{
                    value: m.label,
                    position: "insideTop",
                    fontSize: 10.5,
                    fill: "var(--ink)",
                    offset: 6,
                  }}
                />
              ))}
            {CHANNELS.map((c) => (
              <Area
                key={c}
                type="monotone"
                dataKey={c}
                stackId="a"
                stroke="#fff"
                strokeWidth={1}
                fill={CHANNEL_COLOR[c]}
                fillOpacity={0.88}
                animationDuration={ANIM}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
