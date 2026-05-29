export function Sparkline({
  values,
  w = 80,
  h = 28,
  color = "var(--brand)",
}: {
  values: number[];
  w?: number;
  h?: number;
  color?: string;
}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastY = h - ((values[values.length - 1] - min) / range) * (h - 4) - 2;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={w} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

export function MRRChart({
  values,
  w = 520,
  h = 200,
  labels = ["Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc", "Jan", "Fév", "Mar", "Avr", "Mai"],
}: {
  values: number[];
  w?: number;
  h?: number;
  labels?: string[];
}) {
  const max = Math.max(...values) * 1.1;
  const pad = { l: 36, r: 16, t: 16, b: 28 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const pts = values.map((v, i) => {
    const x = pad.l + (i / (values.length - 1)) * cw;
    const y = pad.t + (1 - v / max) * ch;
    return [x, y] as const;
  });
  const line = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const last = pts[pts.length - 1];
  const area = `${line} L${last[0]},${pad.t + ch} L${pad.l},${pad.t + ch} Z`;
  const yTicks = [0, max * 0.25, max * 0.5, max * 0.75, max];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", width: "100%", maxWidth: w, height: "auto" }}>
      <defs>
        <linearGradient id="mrr-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => {
        const y = pad.t + (1 - t / max) * ch;
        return (
          <g key={i}>
            <line
              x1={pad.l}
              y1={y}
              x2={w - pad.r}
              y2={y}
              stroke="var(--border)"
              strokeDasharray={i === 0 ? "0" : "3 4"}
            />
            <text x={pad.l - 8} y={y + 3} textAnchor="end" fontSize="10" fill="var(--ink-3)">
              €{Math.round(t / 1000)}k
            </text>
          </g>
        );
      })}
      {pts.map((p, i) =>
        i % 2 === 0 ? (
          <text key={i} x={p[0]} y={h - 8} textAnchor="middle" fontSize="10" fill="var(--ink-3)">
            {labels[i]}
          </text>
        ) : null
      )}
      <path d={area} fill="url(#mrr-grad)" />
      <path d={line} fill="none" stroke="var(--brand)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <g>
        <circle cx={last[0]} cy={last[1]} r="6" fill="var(--brand)" opacity="0.18" />
        <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--brand)" />
      </g>
    </svg>
  );
}

export function Donut({
  segments,
  size = 120,
  stroke = 18,
}: {
  segments: Array<{ value: number; color: string }>;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let off = 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${c}`}
            strokeDashoffset={-off}
            strokeLinecap="butt"
          />
        );
        off += len;
        return el;
      })}
    </svg>
  );
}
