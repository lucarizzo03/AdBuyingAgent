// Shared direct-end-label renderer for the hero/CPA line charts — used in
// place of a legend box, per the "no chart junk" brief. The dot marks the
// true data point; the text block sits at `labelY`, which may be nudged
// away from `dotY` (by EndLabelsLayer) to avoid collisions when two series
// end close together. A short leader tick bridges the two when they diverge.
export default function EndLabel({ x, dotY, labelY, text, value, color }) {
  const needsLeader = Math.abs(labelY - dotY) > 3;
  return (
    <g>
      <circle cx={x} cy={dotY} r={2.5} fill={color} />
      {needsLeader && (
        <line x1={x + 3} y1={dotY} x2={x + 8} y2={labelY} stroke={color} strokeWidth={1} opacity={0.5} />
      )}
      <text
        x={x + 9}
        y={labelY}
        dy={-2}
        fontSize={11}
        fontWeight={600}
        fill={color}
        fontFamily="var(--font-sans)"
      >
        {text}
      </text>
      <text
        x={x + 9}
        y={labelY}
        dy={11}
        fontSize={11}
        fill={color}
        fontFamily="var(--font-mono)"
      >
        {value}
      </text>
    </g>
  );
}
