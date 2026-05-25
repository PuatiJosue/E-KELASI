import Svg, { Polyline, Circle } from "react-native-svg";
import { useTheme } from "@/lib/theme";

export function Sparkline({
  values,
  w = 80,
  h = 28,
  color,
}: {
  values: number[];
  w?: number;
  h?: number;
  color?: string;
}) {
  const t = useTheme();
  const stroke = color ?? t.brand;
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
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Polyline points={pts} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={w} cy={lastY} r={2.5} fill={stroke} />
    </Svg>
  );
}

export function GradeRing({
  value,
  max = 20,
  size = 64,
  stroke = 6,
  color,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const t = useTheme();
  const ringColor = color ?? t.brand;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / max));
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.surface2} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={ringColor}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round"
      />
    </Svg>
  );
}
