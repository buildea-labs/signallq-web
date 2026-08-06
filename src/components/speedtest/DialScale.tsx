import { GAUGE_VIEWBOX_WIDTH, dialMajorTicks, dialMinorTicks } from "@/lib/gaugeMath";

/** Traços e rótulos da escala, na curva do arco (`Speedometer.dc.html`). */
export function DialScale({ scale, strokeWidth }: { scale: number; strokeWidth: number }) {
  return (
    <g>
      {dialMinorTicks(scale, strokeWidth).map((tick, index) => (
        <line
          key={`minor-${index}`}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke="var(--text-tertiary)"
          strokeWidth={1.2}
          opacity={0.28}
          strokeLinecap="round"
        />
      ))}
      {dialMajorTicks(scale, strokeWidth).map((tick) => (
        <g key={`major-${tick.label}`}>
          <line
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke="var(--text-tertiary)"
            strokeWidth={1.8}
            opacity={0.55}
            strokeLinecap="round"
          />
          <text
            x={tick.labelX}
            y={tick.labelY}
            fill="var(--text-tertiary)"
            fontSize={11}
            fontWeight={600}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {tick.label}
          </text>
        </g>
      ))}
    </g>
  );
}

/** Número, unidade e rótulo da métrica, dentro do arco. */
export function DialReading({
  value,
  unit,
  metricLabel,
}: {
  value: string | undefined;
  unit?: string;
  metricLabel?: string;
}) {
  return (
    <g textAnchor="middle">
      <text
        x={GAUGE_VIEWBOX_WIDTH / 2}
        y={158}
        fill="var(--text-primary)"
        fontSize={48}
        fontWeight={800}
        letterSpacing={-1}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </text>
      {unit && (
        <text x={GAUGE_VIEWBOX_WIDTH / 2} y={180} fill="var(--text-tertiary)" fontSize={13} fontWeight={600}>
          {unit}
        </text>
      )}
      {metricLabel && (
        <text
          x={GAUGE_VIEWBOX_WIDTH / 2}
          y={196}
          fill="var(--text-tertiary)"
          fontSize={11}
          fontWeight={600}
          letterSpacing={0.5}
        >
          {metricLabel.toUpperCase()}
        </text>
      )}
    </g>
  );
}
