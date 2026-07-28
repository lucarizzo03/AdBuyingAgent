import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Customized,
} from "recharts";
import { mergeSeries, buildSeries, trailingAverage, SHOCK_DAY, SHOCK_LABEL, fmtDollar } from "../lib/stats";
import { getAnimationDuration } from "../lib/motion";
import MultiLineTooltip from "./MultiLineTooltip";
import EndLabelsLayer from "./EndLabelsLayer";

const fmtCpa = (v) => fmtDollar(v, { decimals: 2 });
const ANIM = getAnimationDuration();

export default function CpaChart({ logs }) {
  const [smoothed, setSmoothed] = useState(true);

  const series = useMemo(() => {
    const key = smoothed ? "blendedCpaSmoothed" : "blendedCpa";
    const withAvg = (log) => trailingAverage(buildSeries(log), "blendedCpa", 7);
    return mergeSeries(
      {
        baseline: withAvg(logs.baseline),
        v1: withAvg(logs.v1),
        v2: withAvg(logs.v2),
      },
      key
    );
  }, [logs, smoothed]);

  const last = series[series.length - 1];

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-title">Daily blended CPA</div>
          <p className="section-sub">Cost per sale, blended across all channels.</p>
        </div>
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 5, overflow: "hidden" }}>
          {[
            { key: false, label: "Daily" },
            { key: true, label: "7-day avg" },
          ].map((opt) => (
            <button
              key={String(opt.key)}
              onClick={() => setSmoothed(opt.key)}
              style={{
                border: "none",
                background: smoothed === opt.key ? "var(--ink)" : "transparent",
                color: smoothed === opt.key ? "#fff" : "var(--ink-muted)",
                fontSize: 11.5,
                padding: "5px 11px",
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: "20px 8px 12px 8px" }}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={series} margin={{ top: 8, right: 84, left: 4, bottom: 0 }}>
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
            <Tooltip content={<MultiLineTooltip fmt={fmtCpa} />} />
            <ReferenceLine
              x={SHOCK_DAY}
              stroke="var(--ink-faint)"
              strokeDasharray="3 3"
              label={{
                value: SHOCK_LABEL,
                position: "insideTopLeft",
                fontSize: 10.5,
                fill: "var(--ink-muted)",
                offset: 8,
              }}
            />
            <Line type="monotone" dataKey="baseline" stroke="var(--baseline)" strokeWidth={1.75} dot={false} animationDuration={ANIM} />
            <Line type="monotone" dataKey="v1" stroke="var(--v1)" strokeWidth={1.75} dot={false} animationDuration={ANIM} />
            <Line type="monotone" dataKey="v2" stroke="var(--accent)" strokeWidth={2.5} dot={false} animationDuration={ANIM} />
            <Customized
              component={EndLabelsLayer}
              endFmt={fmtCpa}
              endPoints={[
                { key: "baseline", day: last.day, value: last.baseline, label: "Baseline", color: "var(--baseline)" },
                { key: "v1", day: last.day, value: last.v1, label: "Agent v1", color: "var(--v1)" },
                { key: "v2", day: last.day, value: last.v2, label: "Agent v2", color: "var(--accent)" },
              ]}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
