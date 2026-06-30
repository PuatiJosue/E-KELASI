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
  const max = Math.max(...values) * 1.1 || 1; // évite la division par zéro si tout est à 0
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
              ${Math.round(t / 1000)}k
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

export function PerfChart({
  points,
  h = 220,
}: {
  points: Array<{ label: string; avg: number | null; attendancePct: number | null }>;
  h?: number;
}) {
  const w = 560;
  const pad = { l: 30, r: 14, t: 14, b: 26 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const n = points.length;
  const X = (i: number) => pad.l + (n <= 1 ? cw / 2 : (i / (n - 1)) * cw);
  const Y = (v: number) => pad.t + (1 - v / 100) * ch; // v ∈ [0,100]

  const series = (vals: Array<number | null>) =>
    vals
      .map((v, i) => (v == null ? null : ([X(i), Y(v)] as [number, number])))
      .filter((p): p is [number, number] => p != null);

  const avgPts = series(points.map((p) => (p.avg == null ? null : (p.avg / 20) * 100)));
  const attPts = series(points.map((p) => (p.attendancePct == null ? null : p.attendancePct)));
  const line = (pts: [number, number][]) => pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", width: "100%", maxWidth: w, height: "auto" }}>
      <defs>
        <linearGradient id="perf-att" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => {
        const y = Y(t);
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--border)" strokeDasharray={i === 0 ? "0" : "3 4"} />
            <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="10" fill="var(--ink-3)">{t}</text>
          </g>
        );
      })}
      {points.map((p, i) => (
        <text key={i} x={X(i)} y={h - 8} textAnchor="middle" fontSize="10" fill="var(--ink-3)">{p.label}</text>
      ))}
      {attPts.length >= 2 && (
        <path d={`${line(attPts)} L${attPts[attPts.length - 1][0]},${pad.t + ch} L${attPts[0][0]},${pad.t + ch} Z`} fill="url(#perf-att)" />
      )}
      {attPts.length >= 2 && <path d={line(attPts)} fill="none" stroke="#14B8A6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
      {avgPts.length >= 2 && <path d={line(avgPts)} fill="none" stroke="#4F66E8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
      {attPts.map((p, i) => <circle key={`a${i}`} cx={p[0]} cy={p[1]} r="3" fill="#14B8A6" />)}
      {avgPts.map((p, i) => <circle key={`m${i}`} cx={p[0]} cy={p[1]} r="3" fill="#4F66E8" />)}
    </svg>
  );
}

export function Bars({
  data,
  max = 20,
  h = 200,
}: {
  data: Array<{ label: string; value: number }>;
  max?: number;
  h?: number;
}) {
  const ticks = [0, max * 0.25, max * 0.5, max * 0.75, max];
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: h, position: "relative", paddingLeft: 26 }}>
        {/* lignes de repère + graduations Y */}
        {ticks.map((t, i) => {
          const bottom = (t / max) * (h - 24) + 20;
          return (
            <div key={i} style={{ position: "absolute", left: 0, right: 0, bottom, borderTop: "1px dashed var(--border)" }}>
              <span style={{ position: "absolute", left: -2, top: -8, fontSize: 10, color: "var(--ink-3)" }}>{Math.round(t)}</span>
            </div>
          );
        })}
        {data.map((d, i) => {
          const pct = Math.max(0, Math.min(1, d.value / max));
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", zIndex: 1, gap: 6 }}>
              <div
                title={`${d.label} · ${d.value.toFixed(1)}/${max}`}
                style={{
                  width: "100%",
                  maxWidth: 46,
                  height: `${pct * (h - 24)}px`,
                  minHeight: 4,
                  borderRadius: "8px 8px 4px 4px",
                  background: "linear-gradient(180deg, #8B5CF6 0%, #5468F0 100%)",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, paddingLeft: 26, marginTop: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
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
  const total = segments.reduce((a, s) => a + s.value, 0) || 1; // évite NaN si aucun segment
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
