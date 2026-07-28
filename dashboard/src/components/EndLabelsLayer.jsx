import EndLabel from "./EndLabel";

// Rendered via Recharts' <Customized>, which merges the chart's internal
// state (xAxisMap/yAxisMap scales) onto these props — giving us the real
// pixel scale so label collision-avoidance can work in pixel space instead
// of guessing from raw data values.
const MIN_GAP = 22;

export default function EndLabelsLayer({ xAxisMap, yAxisMap, endPoints, endFmt }) {
  if (!xAxisMap || !yAxisMap || !endPoints) return null;
  const xScale = xAxisMap[Object.keys(xAxisMap)[0]]?.scale;
  const yScale = yAxisMap[Object.keys(yAxisMap)[0]]?.scale;
  if (!xScale || !yScale) return null;

  const points = endPoints
    .filter((p) => p.value != null)
    .map((p) => ({ ...p, x: xScale(p.day), dotY: yScale(p.value), labelY: yScale(p.value) }))
    // Guards against ResponsiveContainer's transient zero-size measure pass.
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.dotY));

  // Declutter labels top-to-bottom so two series ending close together don't
  // overlap; the dot itself always stays at the true value.
  points.sort((a, b) => a.dotY - b.dotY);
  for (let i = 1; i < points.length; i++) {
    if (points[i].labelY - points[i - 1].labelY < MIN_GAP) {
      points[i].labelY = points[i - 1].labelY + MIN_GAP;
    }
  }

  return (
    <g>
      {points.map((p) => (
        <EndLabel
          key={p.key}
          x={p.x}
          dotY={p.dotY}
          labelY={p.labelY}
          text={p.label}
          value={endFmt(p.value)}
          color={p.color}
        />
      ))}
    </g>
  );
}
