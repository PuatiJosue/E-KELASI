"use client";

import { useTransition } from "react";
import { Icon } from "@/components/Icon";
import { RecoveryBar, COLORS, iconBtn } from "../finance-ui";
import { money } from "../finance-export";
import { deleteFee, archiveFee } from "../actions/fees";
import type { Fee } from "@/lib/finance/fees";

// ── Ligne d’un frais ─────────────────────────────────────────────────
export function FeeRow({ fee, first, onOpen, onEdit, onChanged }: { fee: Fee; first: boolean; onOpen: () => void; onEdit: () => void; onChanged: () => void }) {
  const [pending, start] = useTransition();
  // Suppression possible même quand la rubrique porte des paiements : on efface
  // alors TOUT (paiements, tranches, montants ajustés) pour recommencer à zéro.
  // Double garde-fou : confirmation détaillée, puis saisie du mot SUPPRIMER.
  const del = () => {
    if (fee.hasPayments) {
      const warn =
        `Supprimer définitivement la rubrique « ${fee.label} » ?\n\n` +
        `Tous les paiements déjà encaissés (${money(fee.collected, fee.currency)}), les tranches et les montants ajustés par élève seront EFFACÉS et n'apparaîtront plus dans la trésorerie ni dans les rapports.\n\n` +
        `Cette action est irréversible. Pour seulement masquer la rubrique, utilisez l'archivage.`;
      if (!confirm(warn)) return;
      const typed = prompt(`Confirmez en tapant SUPPRIMER (rubrique « ${fee.label} »)`);
      if ((typed ?? "").trim().toUpperCase() !== "SUPPRIMER") return;
    } else if (!confirm(`Supprimer le frais « ${fee.label} » ?`)) return;
    start(async () => { const r = await deleteFee(fee.id, fee.hasPayments); if (!r.ok) alert(r.message); else onChanged(); });
  };
  const arch = () => start(async () => { const r = await archiveFee(fee.id, !fee.archived); if (!r.ok) alert(r.message); else onChanged(); });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: first ? "none" : "1px solid var(--divider)", opacity: fee.archived ? 0.55 : 1 }}>
      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={onOpen}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{fee.label}</span>
          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>· {fee.classDisplay ?? "École entière"}</span>
          {fee.installments.length > 0 && <span style={{ fontSize: 10.5, color: "var(--ink-3)" }}>· {fee.installments.length} tranche(s)</span>}
          {fee.dueDate && <span style={{ fontSize: 10.5, color: "var(--ink-3)", display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="clock" size={11} /> {new Date(fee.dueDate).toLocaleDateString("fr-FR")}</span>}
          {fee.archived && <span style={{ fontSize: 10.5, color: "var(--ink-3)" }}>· archivé</span>}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
          Total {money(fee.totalAmount, fee.currency)} · {fee.studentCount} élève(s) · Attendu {money(fee.expected, fee.currency)} · Encaissé <span style={{ color: COLORS.collected }}>{money(fee.collected, fee.currency)}</span> · Reste <span style={{ color: COLORS.remaining }}>{money(fee.remaining, fee.currency)}</span>
        </div>
        <div style={{ marginTop: 6, maxWidth: 260 }}><RecoveryBar pct={fee.recoveryPct} /></div>
      </div>
      <button onClick={onOpen} className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>Paiements</button>
      <button onClick={onEdit} title="Modifier" style={iconBtn}><Icon name="edit" size={15} /></button>
      <button onClick={arch} disabled={pending} title={fee.archived ? "Réactiver" : "Archiver"} style={iconBtn}><Icon name={fee.archived ? "refresh" : "eyeOff"} size={15} /></button>
      <button onClick={del} disabled={pending} title={fee.hasPayments ? "Supprimer la rubrique ET tous ses paiements (irréversible)" : "Supprimer"} style={{ ...iconBtn, color: fee.hasPayments ? "var(--danger)" : undefined }}><Icon name="trash" size={15} /></button>
    </div>
  );
}

