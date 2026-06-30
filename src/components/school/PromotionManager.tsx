"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { classLabel, classKey, normOption } from "@/lib/classes";
import { nextClassFor, proposeDecision, PROMOTION_LEVELS, PROMOTION_OPTIONS } from "@/lib/promotion";
import { applyPromotion, undoLastPromotion, type PromotionAction, type PromotionDecision } from "@/app/(school)/school/promotion/actions";

type StudentLite = { id: string; name: string; className: string; option: string | null };
type Decision = { action: PromotionAction; targetClass: string; option: string | null };

const ACTIONS: { key: PromotionAction; fr: string; en: string; color: string }[] = [
  { key: "promote",  fr: "Passe",    en: "Promote",  color: "#4F66E8" },
  { key: "redouble", fr: "Redouble", en: "Repeat",   color: "#D97706" },
  { key: "graduate", fr: "Diplômé",  en: "Graduate", color: "#8B5CF6" },
  { key: "skip",     fr: "Exclure",  en: "Skip",     color: "#858BA0" },
];

const isHumanities = (cls: string) => /humanit/i.test(cls);

export function PromotionManager({
  students,
  defaultYear,
  schoolName,
  lastBatch,
}: {
  students: StudentLite[];
  defaultYear: string;
  schoolName: string;
  lastBatch?: { at: string; students: number; dateLabel: string } | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const undo = () => {
    if (!lastBatch) return;
    const ok = window.confirm(`Annuler le dernier passage (${lastBatch.students} élève(s) du ${lastBatch.dateLabel}) ?\n\nLes classes seront restaurées et les certificats générés seront supprimés.`);
    if (!ok) return;
    start(async () => {
      const res = await undoLastPromotion();
      if (!res.ok) { alert(res.message); return; }
      setDone(null);
      router.refresh();
    });
  };
  const [year, setYear] = useState(defaultYear);
  const [done, setDone] = useState<{ promoted: number; repeated: number; graduated: number } | null>(null);

  // Décision initiale par élève (proposition automatique).
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() => {
    const init: Record<string, Decision> = {};
    for (const s of students) {
      const p = proposeDecision(s.className);
      init[s.id] = {
        action: p.action,
        targetClass: p.targetClass,
        option: p.needsOption ? "" : normOption(s.option),
      };
    }
    return init;
  });

  // Regroupement par classe actuelle.
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; list: StudentLite[] }>();
    for (const s of students) {
      const k = classKey(s.className, s.option);
      if (!map.has(k)) map.set(k, { label: classLabel(s.className, s.option), list: [] });
      map.get(k)!.list.push(s);
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "fr", { numeric: true }));
  }, [students]);

  const setDec = (id: string, patch: Partial<Decision>) =>
    setDecisions((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const setGroupAction = (list: StudentLite[], action: PromotionAction) => {
    setDecisions((prev) => {
      const next = { ...prev };
      for (const s of list) {
        if (action === "promote") {
          const p = nextClassFor(s.className);
          const target = p.kind === "promote" ? p.nextClass : next[s.id].targetClass;
          next[s.id] = { action: "promote", targetClass: target, option: p.kind === "promote" && p.enteringHumanities ? (next[s.id].option || "") : normOption(s.option) };
        } else {
          next[s.id] = { ...next[s.id], action };
        }
      }
      return next;
    });
  };

  const counts = useMemo(() => {
    const c = { promote: 0, redouble: 0, graduate: 0, skip: 0 };
    for (const d of Object.values(decisions)) c[d.action] += 1;
    return c;
  }, [decisions]);

  // Élèves « Passe » vers les humanités sans option choisie → bloquant.
  const missingOption = useMemo(
    () => Object.values(decisions).filter((d) => d.action === "promote" && isHumanities(d.targetClass) && !d.option).length,
    [decisions]
  );

  const submit = () => {
    if (!year.trim()) { alert("Indiquez l'année scolaire cible."); return; }
    if (missingOption > 0) { alert(`${missingOption} élève(s) entrant en humanités sans option. Choisissez l'option avant de valider.`); return; }
    const total = counts.promote + counts.redouble + counts.graduate;
    if (total === 0) { alert("Aucun élève à traiter."); return; }
    const ok = window.confirm(
      `Appliquer pour l'année ${year} ?\n\n• ${counts.promote} passage(s)\n• ${counts.redouble} redoublant(s)\n• ${counts.graduate} diplômé(s)\n\nUn certificat signé est généré pour chaque passage et redoublant.`
    );
    if (!ok) return;

    const payload: PromotionDecision[] = students.map((s) => {
      const d = decisions[s.id];
      return {
        studentId: s.id,
        currentClass: s.className,
        currentOption: normOption(s.option),
        action: d.action,
        targetClass: d.targetClass,
        option: d.option,
      };
    });

    start(async () => {
      const res = await applyPromotion({ schoolYear: year.trim(), decisions: payload });
      if (!res.ok) { alert(res.message); return; }
      setDone({ promoted: res.promoted, repeated: res.repeated, graduated: res.graduated });
      router.refresh();
    });
  };

  if (students.length === 0) {
    return (
      <div className="ek-card" style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
        <T fr="Aucun élève actif à faire passer." en="No active student to promote." />
      </div>
    );
  }

  return (
    <>
      {/* Bandeau année + récap */}
      <div className="ek-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)" }}><T fr="Année cible" en="Target year" /></span>
          <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026-2027" style={inp} />
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12.5 }}>
          <Tag color="#4F66E8" label={`${counts.promote} passage${counts.promote > 1 ? "s" : ""}`} />
          <Tag color="#D97706" label={`${counts.redouble} redoublant${counts.redouble > 1 ? "s" : ""}`} />
          <Tag color="#8B5CF6" label={`${counts.graduate} diplômé${counts.graduate > 1 ? "s" : ""}`} />
          <Tag color="#858BA0" label={`${counts.skip} exclu${counts.skip > 1 ? "s" : ""}`} />
        </div>
      </div>

      {done && (
        <div className="ek-card" style={{ padding: 14, borderLeft: "3px solid var(--success)", display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "var(--ink)" }}>
          <span className="ek-tint green" style={{ width: 30, height: 30 }}><Icon name="check" size={16} stroke={2.5} /></span>
          <span><T fr={`Passage appliqué : ${done.promoted} passage(s), ${done.repeated} redoublant(s), ${done.graduated} diplômé(s).`} en={`Promotion applied: ${done.promoted} promoted, ${done.repeated} repeating, ${done.graduated} graduated.`} /></span>
        </div>
      )}

      {missingOption > 0 && (
        <div className="ek-card" style={{ padding: 12, borderLeft: "3px solid var(--warning)", fontSize: 12.5, color: "var(--ink-2)" }}>
          <T fr={`${missingOption} élève(s) entrant en humanités : choisissez l'option (Sciences, Pédagogie…) avant de valider.`} en={`${missingOption} student(s) entering secondary: pick an option before applying.`} />
        </div>
      )}

      {/* Groupes par classe */}
      {groups.map((g) => (
        <div key={g.label} className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{g.label}</div>
            <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{g.list.length} <T fr="élèves" en="students" /></span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button onClick={() => setGroupAction(g.list, "promote")} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}><T fr="Tout faire passer" en="Promote all" /></button>
              <button onClick={() => setGroupAction(g.list, "redouble")} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}><T fr="Tout redoubler" en="Repeat all" /></button>
            </div>
          </div>

          {g.list.map((s, i) => {
            const d = decisions[s.id];
            const showOption = d.action === "promote" && isHumanities(d.targetClass);
            return (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1.4fr auto 1.2fr", gap: 12, alignItems: "center", padding: "11px 18px", borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                </div>

                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {ACTIONS.map((a) => {
                    const on = d.action === a.key;
                    return (
                      <button
                        key={a.key}
                        onClick={() => setDec(s.id, { action: a.key })}
                        style={{
                          padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                          border: `1px solid ${on ? a.color : "var(--border)"}`,
                          background: on ? a.color : "var(--surface)",
                          color: on ? "#fff" : "var(--ink-3)",
                        }}
                      >
                        <T fr={a.fr} en={a.en} />
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  {d.action === "promote" ? (
                    <>
                      <Icon name="arrowR" size={14} color="var(--ink-3)" />
                      <select value={d.targetClass} onChange={(e) => setDec(s.id, { targetClass: e.target.value })} style={sel}>
                        {!d.targetClass && <option value=""></option>}
                        {PROMOTION_LEVELS.map((l) => <option key={l.key} value={l.label}>{l.label}</option>)}
                      </select>
                      {showOption && (
                        <select value={d.option ?? ""} onChange={(e) => setDec(s.id, { option: e.target.value })} style={{ ...sel, borderColor: d.option ? "var(--border-strong)" : "var(--warning)" }}>
                          <option value="">Option…</option>
                          {PROMOTION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {d.action === "redouble" && <T fr="reste dans la classe" en="stays in class" />}
                      {d.action === "graduate" && <T fr="sortant / diplômé" en="leaver / graduate" />}
                      {d.action === "skip" && <T fr="non traité" en="skipped" />}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Barre d'action */}
      <div className="ek-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", position: "sticky", bottom: 0 }}>
        <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
          {schoolName} · <T fr="année" en="year" /> {year}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {lastBatch && lastBatch.students > 0 && (
            <button onClick={undo} disabled={pending} className="ek-btn ek-btn-outline" style={{ height: 40, fontSize: 13, color: "var(--danger)", opacity: pending ? 0.6 : 1 }}>
              <Icon name="refresh" size={15} />
              <T fr={`Annuler le dernier passage (${lastBatch.students})`} en={`Undo last promotion (${lastBatch.students})`} />
            </button>
          )}
          <button onClick={submit} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 40, fontSize: 13.5, opacity: pending ? 0.6 : 1 }}>
            <Icon name="graduation" size={16} />
            {pending ? "…" : <T fr="Appliquer le passage" en="Apply promotion" />}
          </button>
        </div>
      </div>
    </>
  );
}

function Tag({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-2)" }}>
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

const inp: React.CSSProperties = {
  height: 36, padding: "0 11px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", fontSize: 13, color: "var(--ink)", width: 140, outline: "none",
};
const sel: React.CSSProperties = {
  height: 34, padding: "0 8px", borderRadius: 8, border: "1px solid var(--border-strong)",
  background: "var(--surface)", fontSize: 12.5, color: "var(--ink)", outline: "none", maxWidth: 200,
};
