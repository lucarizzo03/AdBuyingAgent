// Label rendered on the shaded band between two lines (via <Customized>,
// which merges xAxisMap/yAxisMap onto these props so we can convert data
// values to real pixel coordinates).
export default function GapLabel({ xAxisMap, yAxisMap, day, lowValue, highValue, text, color }) {
  if (!xAxisMap || !yAxisMap) return null;
  const xScale = xAxisMap[Object.keys(xAxisMap)[0]]?.scale;
  const yScale = yAxisMap[Object.keys(yAxisMap)[0]]?.scale;
  if (!xScale || !yScale) return null;

  const x = xScale(day);
  const y = (yScale(lowValue) + yScale(highValue)) / 2;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="middle"
      fontSize={11}
      fontWeight={600}
      fontFamily="var(--font-mono)"
      fill={color}
    >
      {text}
    </text>
  );
}
