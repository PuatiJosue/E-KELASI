"use client";

import { COLORS } from "../finance-ui";
import { money } from "../finance-export";

// ── Graphique d’évolution (recettes/dépenses en barres, solde en ligne) ─
export function EvolutionChart({ data, currency }: { data: { label: string; recettes: number; depenses: number; solde: number }[]; currency: string }) {
  const W = 300, H = 130, pad = 4, base = H - 16;
  const maxBar = Math.max(1, ...data.map((d) => Math.max(d.recettes, d.depenses)));
  const soldes = data.map((d) => d.solde);
  const minS = Math.min(0, ...soldes), maxS = Math.max(1, ...soldes);
  const n = data.length || 1;
  const slot = (W - pad * 2) / n;
  const yBar = (v: number) => base - (v / maxBar) * (base - 8);
  const ySolde = (v: number) => 8 + (1 - (v - minS) / (maxS - minS || 1)) * (base - 8);
  const soldePts = data.map((d, i) => `${pad + slot * i + slot / 2},${ySolde(d.solde)}`).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 12, fontSize: 11, flexWrap: "wrap" }}>
        <Lg color={COLORS.collected} label="Recettes" /><Lg color={COLORS.remaining} label="Dépenses" /><Lg color={COLORS.brand} label="Solde" />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Évolution de la trésorerie">
        <line x1={pad} y1={base} x2={W - pad} y2={base} stroke="var(--divider)" strokeWidth={1} />
        {data.map((d, i) => {
          const x = pad + slot * i;
          const bw = Math.min(14, slot / 3);
          return (
            <g key={i}>
              <rect x={x + slot / 2 - bw - 1} y={yBar(d.recettes)} width={bw} height={base - yBar(d.recettes)} rx={2} fill={COLORS.collected} />
              <rect x={x + slot / 2 + 1} y={yBar(d.depenses)} width={bw} height={base - yBar(d.depenses)} rx={2} fill={COLORS.remaining} />
              <text x={x + slot / 2} y={H - 3} textAnchor="middle" fontSize={8} fill="var(--ink-3)">{d.label}</text>
            </g>
          );
        })}
        <polyline points={soldePts} fill="none" stroke={COLORS.brand} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => <circle key={i} cx={pad + slot * i + slot / 2} cy={ySolde(d.solde)} r={2.5} fill={COLORS.brand} />)}
      </svg>
      <div style={{ fontSize: 10.5, color: "var(--ink-3)", textAlign: "right" }}>Solde actuel : {money(data[data.length - 1]?.solde ?? 0, currency)}</div>
    </div>
  );
}
function Lg({ color, label }: { color: string; label: string }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--ink-2)" }}><span style={{ width: 9, height: 9, borderRadius: 3, background: color }} /> {label}</span>;
}

