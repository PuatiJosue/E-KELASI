"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/i18n";
import { setStudentValidation, attachToExisting } from "./actions";

export function RequestActions({
  studentId,
  duplicate,
}: {
  studentId: string;
  duplicate?: { id: string; label: string } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (approve: boolean) =>
    startTransition(async () => {
      const r = await setStudentValidation(studentId, approve);
      if (r.ok) router.refresh();
      else alert(r.message ?? "Erreur");
    });

  const attach = () =>
    startTransition(async () => {
      if (!duplicate) return;
      const r = await attachToExisting(studentId, duplicate.id);
      if (r.ok) router.refresh();
      else alert(r.message ?? "Erreur");
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      {duplicate && (
        <div style={{ fontSize: 11.5, color: "var(--warning)", fontWeight: 600, textAlign: "right", maxWidth: 280 }}>
          ⚠️ <T fr={`Déjà dans votre base (${duplicate.label}). « Valider » rattache au dossier existant.`} en={`Already in your database (${duplicate.label}). "Approve" attaches to the existing record.`} />
        </div>
      )}
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
        {/* Avec doublon → « Valider » = rattachement auto. Sinon → validation normale. */}
        <button onClick={() => (duplicate ? attach() : run(true))} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 30, fontSize: 12 }}>
          {pending ? "…" : <T fr="Valider" en="Approve" />}
        </button>
        {duplicate && (
          <button onClick={() => run(true)} disabled={pending} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }} title="Ce n'est pas le même enfant (homonyme) — créer une nouvelle fiche">
            {pending ? "…" : <T fr="Nouvel élève" en="New student" />}
          </button>
        )}
        <button
          onClick={() => run(false)}
          disabled={pending}
          className="ek-btn ek-btn-outline"
          style={{ height: 30, fontSize: 12, color: "var(--danger)", borderColor: "var(--danger)" }}
        >
          <T fr="Refuser" en="Reject" />
        </button>
      </div>
    </div>
  );
}
