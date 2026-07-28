import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { CHANNELS, CHANNEL_LABEL, CHANNEL_COLOR, channelSeries, fmtDollar } from "../lib/stats";
import { getAnimationDuration } from "../lib/motion";

const ANIM = getAnimationDuration();

function MiniTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const spend = payload.find((p) => p.dataKey === "spend")?.value;
  const cpa = payload.find((p) => p.dataKey === "cpa")?.value;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: "6px 8px",
        fontSize: 11,
      }}
    >
      <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 4 }}>Day {label}</div>
      <div className="mono">spend {fmtDollar(spend)}</div>
      <div className="mono">cpa {cpa != null ? fmtDollar(cpa, { decimals: 2 }) : "—"}</div>
    </div>
  );
}

function Mini({ channel, data }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 2, background: CHANNEL_COLOR[channel] }} />
        {CHANNEL_LABEL[channel]}
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <ComposedChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
          <XAxis dataKey="day" hide />
          <YAxis yAxisId="spend" hide domain={[0, "auto"]} />
          <YAxis yAxisId="cpa" hide domain={[0, "auto"]} />
          <Tooltip content={<MiniTooltip />} cursor={{ fill: "var(--accent-tint)" }} />
          <Bar
            yAxisId="spend"
            dataKey="spend"
            fill={CHANNEL_COLOR[channel]}
            fillOpacity={0.28}
            radius={[1, 1, 0, 0]}
            animationDuration={ANIM}
          />
          <Line
            yAxisId="cpa"
            type="monotone"
            dataKey="cpa"
            stroke={CHANNEL_COLOR[channel]}
            strokeWidth={1.75}
            dot={false}
            connectNulls
            animationDuration={ANIM}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ChannelMultiples({ log }) {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-title">Channel saturation</div>
          <p className="section-sub">Agent v2 — spend (bars) vs that channel's CPA (line). Rising bars, rising line: saturation.</p>
        </div>
      </div>
      <div className="channel-grid" style={{ display: "grid", gap: 14 }}>
        {CHANNELS.map((c) => (
          <div key={c} className="card" style={{ padding: "12px 10px" }}>
            <Mini channel={c} data={channelSeries(log, c)} />
          </div>
        ))}
      </div>
    </section>
  );
}
