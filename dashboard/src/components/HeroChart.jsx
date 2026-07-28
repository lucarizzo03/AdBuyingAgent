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
import { mergeSeries, buildSeries, SHOCK_DAY, SHOCK_LABEL, fmtInt } from "../lib/stats";
import { getAnimationDuration } from "../lib/motion";
import MultiLineTooltip from "./MultiLineTooltip";
import EndLabelsLayer from "./EndLabelsLayer";

const ANIM = getAnimationDuration();

export default function HeroChart({ logs }) {
  const series = mergeSeries(
    {
      baseline: buildSeries(logs.baseline),
      v1: buildSeries(logs.v1),
      v2: buildSeries(logs.v2),
    },
    "cumConversions"
  );

  const last = series[series.length - 1];

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-title">Cumulative sales</div>
          <p className="section-sub">45-day total conversions, running sum.</p>
        </div>
      </div>
      <div className="card" style={{ padding: "20px 8px 12px 8px" }}>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={series} margin={{ top: 8, right: 84, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fontSize: 11, fill: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
              ticks={[1, 10, 20, 30, 40, 45]}
              label={{ value: "day", position: "insideBottomRight", offset: -2, fontSize: 11, fill: "var(--ink-faint)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
              width={34}
            />
            <Tooltip content={<MultiLineTooltip fmt={fmtInt} />} />
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
            <Line
              type="monotone"
              dataKey="baseline"
              stroke="var(--baseline)"
              strokeWidth={1.75}
              dot={false}
              isAnimationActive
              animationDuration={ANIM}
            />
            <Line
              type="monotone"
              dataKey="v1"
              stroke="var(--v1)"
              strokeWidth={1.75}
              dot={false}
              isAnimationActive
              animationDuration={ANIM}
            />
            <Line
              type="monotone"
              dataKey="v2"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive
              animationDuration={ANIM}
            />
            <Customized
              component={EndLabelsLayer}
              endFmt={fmtInt}
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
