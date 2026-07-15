"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { setSchoolArchivedAction } from "@/app/(admin)/schools/actions";

export function SchoolArchiveButton({
  schoolId,
  schoolName,
  archived,
  students,
}: {
  schoolId: string;
  schoolName: string;
  archived: boolean;
  students: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = () => {
    setError(null);
    start(async () => {
      const r = await setSchoolArchivedAction(schoolId, !archived);
      if (!r.ok) { setError(r.message); return; }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={() => { setError(null); setOpen(true); }}
        className={archived ? "ek-btn ek-btn-primary" : "ek-btn ek-btn-outline"}
        style={{ height: 32, fontSize: 12 }}
      >
        <Icon name={archived ? "refresh" : "eyeOff"} size={13} />
        {archived
          ? <T fr="Réactiver l'école" en="Restore school" />
          : <T fr="Archiver l'école" en="Archive school" />}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,16,10,0.45)", display: "grid", placeItems: "center", zIndex: 100, padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="ek-card"
            style={{ width: "100%", maxWidth: 440, padding: 24, maxHeight: "90vh", overflowY: "auto" }}
          >
            <h2 style={{ fontSize: 17, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>
              {archived
                ? <T fr="Réactiver cette école ?" en="Restore this school?" />
                : <T fr="Archiver cette école ?" en="Archive this school?" />}
            </h2>

            <p style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
              <strong>{schoolName}</strong>
              {archived ? (
                <T fr=" repassera en statut « Active » et réapparaîtra dans la liste des écoles." en=" will return to “Active” and reappear in the schools list." />
              ) : (
                <T fr=" passera en statut « Partie » et sortira de la liste des écoles. Aucune donnée n'est supprimée et l'opération se défait à tout moment." en=" will be set to “Churned” and leave the schools list. No data is deleted and this can be undone at any time." />
              )}
            </p>

            {!archived && students > 0 && (
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 9, background: "rgba(192,58,43,0.1)", color: "var(--danger)", fontSize: 12, fontWeight: 600, lineHeight: 1.45 }}>
                <T
                  fr={`Cette école compte ${students} élève(s). Leurs comptes et données restent intacts, et la direction pourra toujours se connecter.`}
                  en={`This school has ${students} student(s). Their accounts and data stay intact, and staff can still sign in.`}
                />
              </div>
            )}

            {error && (
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 9, background: "rgba(192,58,43,0.1)", color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="button" onClick={() => setOpen(false)} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>
                <T fr="Annuler" en="Cancel" />
              </button>
              <button type="button" onClick={run} disabled={pending} className="ek-btn ek-btn-primary" style={{ flex: 1 }}>
                {pending
                  ? <T fr="En cours…" en="Working…" />
                  : archived
                    ? <T fr="Réactiver" en="Restore" />
                    : <T fr="Archiver" en="Archive" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
