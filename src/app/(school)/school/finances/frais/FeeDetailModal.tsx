"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { SexBadge } from "@/components/SexBadge";
import { Modal, Chip, Toolbar, SearchInput, STUDENT_STATUS, COLORS, selStyle, iconBtn, type SchoolBranding } from "../finance-ui";
import { money } from "../finance-export";
import { loadFeeDetail } from "../actions-v2";
import { exportFeeStudentsCsv, exportFeeStudentsPdf } from "./exports";
import { PaymentModal } from "./PaymentModal";
import { OverrideModal } from "./OverrideModal";
import { StudentHistoryModal } from "./StudentHistoryModal";
import type { Fee, FeeDetail, FeeStudentRow } from "@/lib/finance/fees";

// ── Modale détail d’un frais (situation par élève + paiements) ───────
export function FeeDetailModal({ fee: initFee, school, year, onClose }: { fee: Fee; school: SchoolBranding; year: string; onClose: () => void }) {
  const [detail, setDetail] = useState<FeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusF, setStatusF] = useState("");
  const [payFor, setPayFor] = useState<FeeStudentRow | null>(null);
  const [ovrFor, setOvrFor] = useState<FeeStudentRow | null>(null);
  const [histFor, setHistFor] = useState<FeeStudentRow | null>(null);

  const reload = () => { setLoading(true); loadFeeDetail(initFee.id).then((d) => { setDetail(d); setLoading(false); }); };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [initFee.id]);

  const fee = detail?.fee ?? initFee;
  const c = fee.currency;
  const q = query.trim().toLowerCase();
  const students = (detail?.students ?? []).filter((s) => {
    if (statusF && s.status !== statusF) return false;
    if (q && !s.fullName.toLowerCase().includes(q) && !s.matricule.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <Modal title={`${fee.label}${fee.classDisplay ? ` · ${fee.classDisplay}` : ""}`} onClose={onClose} wide maximizable>
      {(maximized) => (
      <>
      {/* Résumé */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 1, background: "var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <MiniStat label="Total / élève" value={money(fee.totalAmount, c)} color="var(--ink)" />
        <MiniStat label="Attendu" value={money(fee.expected, c)} color="var(--ink)" />
        <MiniStat label="Encaissé" value={money(fee.collected, c)} color={COLORS.collected} />
        <MiniStat label="Restant" value={money(fee.remaining, c)} color={COLORS.remaining} />
        <MiniStat label="Recouvrement" value={`${fee.recoveryPct.toFixed(0)} %`} color={COLORS.brand} />
        {fee.dueDate && <MiniStat label="Échéance" value={new Date(fee.dueDate).toLocaleDateString("fr-FR")} color={COLORS.remaining} />}
      </div>

      <Toolbar>
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un élève…" />
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ ...selStyle, height: 38 }}>
          <option value="">Tous statuts</option>
          <option value="paye">Payé</option>
          <option value="partiel">Partiellement payé</option>
          <option value="impaye">Impayé</option>
        </select>
      </Toolbar>

      {loading && !detail ? (
        <div style={{ padding: 20, color: "var(--ink-3)", fontSize: 13 }}>Chargement…</div>
      ) : (
        <div className="ek-tablewrap" style={maximized ? { flex: 1, minHeight: 0, overflowY: "auto" } : { maxHeight: "42vh", overflowY: "auto" }}>
          <div style={{ minWidth: 620 }}>
            <div style={{ display: "grid", gridTemplateColumns: DET_GRID, padding: "8px 4px", fontSize: 10, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid var(--divider)", position: "sticky", top: 0, background: "var(--surface)" }}>
              <div>Élève</div><div style={{ textAlign: "right" }}>Attendu</div><div style={{ textAlign: "right" }}>Payé</div><div style={{ textAlign: "right" }}>Reste</div><div>Statut</div><div style={{ textAlign: "center" }}>Actions</div>
            </div>
            {students.length === 0 ? (
              <div style={{ padding: 16, color: "var(--ink-3)", fontSize: 12.5 }}>Aucun élève.</div>
            ) : students.map((s) => (
              <div key={s.studentId} style={{ display: "grid", gridTemplateColumns: DET_GRID, padding: "9px 4px", alignItems: "center", fontSize: 12, borderBottom: "1px solid var(--divider)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                  <Avatar name={s.fullName} url={s.avatarUrl} size={26} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.fullName}</span>
                      <SexBadge sex={s.sex} size={13} />
                    </div>
                    {s.overrideAmount != null && <div style={{ fontSize: 10, color: COLORS.accent }}>ajusté</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontWeight: 600 }}>{money(s.expected, c)}</div>
                <div style={{ textAlign: "right", color: COLORS.collected, fontWeight: 600 }}>{money(s.paid, c)}</div>
                <div style={{ textAlign: "right", color: s.remaining > 0 ? COLORS.remaining : "var(--ink-3)", fontWeight: 600 }}>{money(s.remaining, c)}</div>
                <div><Chip {...STUDENT_STATUS[s.status]} /></div>
                <div style={{ display: "flex", justifyContent: "center", gap: 2 }}>
                  <button onClick={() => setPayFor(s)} title="Encaisser" style={iconBtn}><Icon name="plus" size={14} stroke={2.5} /></button>
                  <button onClick={() => setHistFor(s)} title="Historique / factures" style={iconBtn}><Icon name="clock" size={14} /></button>
                  <button onClick={() => setOvrFor(s)} title="Ajuster / exonérer" style={iconBtn}><Icon name="edit" size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={() => exportFeeStudentsPdf(fee, students, school, year)} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12 }}><Icon name="file" size={13} /> PDF</button>
        <button onClick={() => exportFeeStudentsCsv(fee, students)} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12 }}><Icon name="download" size={13} /> Excel</button>
        <button onClick={onClose} className="ek-btn ek-btn-primary" style={{ height: 34, fontSize: 12 }}>Fermer</button>
      </div>

      {payFor && <PaymentModal fee={fee} student={payFor} school={school} year={year} onClose={() => setPayFor(null)} onDone={() => { setPayFor(null); reload(); }} />}
      {ovrFor && <OverrideModal fee={fee} student={ovrFor} onClose={() => setOvrFor(null)} onDone={() => { setOvrFor(null); reload(); }} />}
      {histFor && <StudentHistoryModal fee={fee} student={histFor} school={school} year={year} onClose={() => setHistFor(null)} onChanged={reload} />}
      </>
      )}
    </Modal>
  );
}

const DET_GRID = "1.8fr 1fr 1fr 1fr 1.2fr 1fr";

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: "10px 12px", background: "var(--surface)" }}>
      <div style={{ fontSize: 9.5, color: "var(--ink-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color, marginTop: 3, fontFamily: "var(--font-display)" }}>{value}</div>
    </div>
  );
}

