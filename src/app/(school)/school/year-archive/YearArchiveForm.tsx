"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { archiveSchoolYearAction } from "./actions";

export function YearArchiveForm({
  activeGrades,
  activeHomework,
}: {
  activeGrades: number;
  activeHomework: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onArchive = () => {
    setError(null);
    setSuccess(null);
    if (confirm.trim().toUpperCase() !== "ARCHIVER") {
      setError('Tape "ARCHIVER" en majuscules pour confirmer.');
      return;
    }
    startTransition(async () => {
      const res = await archiveSchoolYearAction({ confirm });
      if (res.ok) {
        setSuccess(
          `✓ Nouvelle année démarrée. Archivé : ${res.gradesArchived} note${res.gradesArchived > 1 ? "s" : ""} et ${res.homeworkArchived} devoir${res.homeworkArchived > 1 ? "s" : ""}. L'historique reste consultable ; l'année repart à zéro.`
        );
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
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>NOTES DE L&apos;ANNÉE</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", marginTop: 6 }}>
            {activeGrades.toLocaleString("fr-FR")}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4 }}>seront archivées</div>
        </div>
        <div style={{ padding: 18, background: "var(--surface)" }}>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>DEVOIRS DE L&apos;ANNÉE</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", marginTop: 6 }}>
            {activeHomework.toLocaleString("fr-FR")}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4 }}>seront archivés</div>
        </div>
      </div>

      <div className="ek-card" style={{ padding: 20, borderLeft: "3px solid var(--brand-600)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Icon name="refresh" size={18} style={{ color: "var(--brand-600)" }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Commencer une nouvelle année</div>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55, marginBottom: 10 }}>
          Les <strong>notes</strong> et <strong>devoirs</strong> de l&apos;année sont <strong>archivés</strong>
          {" "}(conservés et consultables dans l&apos;historique). Tout le reste de l&apos;année scolaire est
          {" "}<strong>remis à zéro</strong> pour repartir d&apos;une page blanche.
        </p>
        <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          <div><strong style={{ color: "var(--danger)" }}>Remis à zéro :</strong> présences, bulletins, finances (frais, paiements, caisse), emploi du temps, journal de classe, messagerie, notifications, demandes d&apos;inscription et de réinscription, annonces et activités de l&apos;école.</div>
          <div><strong style={{ color: "var(--accent)" }}>Conservés :</strong> vidéos de cours, élèves (à faire passer avant), personnel, matières et bibliothèque.</div>
          <div style={{ color: "var(--ink-3)" }}>Cette remise à zéro est <strong>définitive</strong> (hors notes/devoirs archivés).</div>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.55, marginBottom: 14 }}>
          Pensez d&apos;abord à faire passer vos élèves dans la classe supérieure depuis{" "}
          <Link href="/school/promotion" style={{ color: "var(--brand-600)", fontWeight: 600 }}>Passage de classe</Link>.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
            className="ek-btn ek-btn-primary"
            style={{ alignSelf: "flex-start", height: 40, fontSize: 13, opacity: pending ? 0.5 : 1 }}
          >
            <Icon name="refresh" size={14} stroke={2.5} />
            {pending ? "Archivage…" : "Commencer une nouvelle année"}
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
