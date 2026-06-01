"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { archiveYearAction } from "./actions";

export function YearArchiveForm({
  defaultCutoff,
  activeGrades,
  activeHomework,
}: {
  defaultCutoff: string;     // YYYY-MM-DD
  activeGrades: number;
  activeHomework: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [cutoff, setCutoff] = useState(defaultCutoff);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onArchive = () => {
    setError(null);
    setSuccess(null);
    if (confirm !== "ARCHIVER") {
      setError('Tape "ARCHIVER" en majuscules pour confirmer.');
      return;
    }
    startTransition(async () => {
      const res = await archiveYearAction({ cutoff, confirm });
      if (res.ok) {
        setSuccess(`✓ Archivé : ${res.gradesArchived} note${res.gradesArchived > 1 ? "s" : ""} et ${res.homeworkArchived} devoir${res.homeworkArchived > 1 ? "s" : ""}. Les compteurs des parents redémarrent à zéro.`);
        setConfirm("");
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ek-card ek-kpi-grid" style={{ padding: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)", overflow: "hidden" }}>
        <div style={{ padding: 18, background: "var(--surface)" }}>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>NOTES ACTIVES</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", marginTop: 6 }}>
            {activeGrades.toLocaleString("fr-FR")}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4 }}>visibles par les parents aujourd&apos;hui</div>
        </div>
        <div style={{ padding: 18, background: "var(--surface)" }}>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>DEVOIRS ACTIFS</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", marginTop: 6 }}>
            {activeHomework.toLocaleString("fr-FR")}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4 }}>visibles par les parents aujourd&apos;hui</div>
        </div>
      </div>

      <div className="ek-card" style={{ padding: 20, borderLeft: "3px solid var(--warning)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Icon name="zap" size={18} style={{ color: "var(--warning)" }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Archivage de fin d&apos;année</div>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55, marginBottom: 14 }}>
          Marque comme archivées toutes les notes et tous les devoirs <strong>antérieurs à la date choisie</strong>.
          Les parents et profs ne les verront plus, leurs compteurs redémarrent à zéro.
          <br />
          <strong>Réversible</strong> : les données ne sont pas effacées, seulement masquées. Tu peux les ressortir en SQL si besoin.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Date de coupure (tout ce qui est AVANT sera archivé)
            </span>
            <input
              type="date"
              value={cutoff}
              onChange={(e) => setCutoff(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border-strong)",
                background: "var(--surface)",
                fontSize: 14,
                color: "var(--ink)",
                fontFamily: "inherit",
                maxWidth: 260,
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Tape <span style={{ color: "var(--danger)", fontFamily: "var(--font-mono)" }}>ARCHIVER</span> pour confirmer
            </span>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="ARCHIVER"
              autoComplete="off"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border-strong)",
                background: "var(--surface)",
                fontSize: 14,
                color: "var(--ink)",
                fontFamily: "var(--font-mono)",
                maxWidth: 260,
              }}
            />
          </label>

          <button
            onClick={onArchive}
            disabled={pending}
            className="ek-btn"
            style={{
              alignSelf: "flex-start",
              background: "var(--warning)",
              color: "var(--on-brand)",
              height: 40,
              fontSize: 13,
              opacity: pending ? 0.5 : 1,
            }}
          >
            <Icon name="zap" size={14} stroke={2.5} />
            {pending ? "Archivage…" : "Archiver"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(192,58,43,0.10)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600 }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "var(--accent-50)", color: "var(--accent)", fontSize: 12.5, fontWeight: 600 }}>
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
