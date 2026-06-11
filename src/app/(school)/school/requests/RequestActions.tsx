"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/i18n";
import { setStudentValidation } from "./actions";

export function RequestActions({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (approve: boolean) =>
    startTransition(async () => {
      const r = await setStudentValidation(studentId, approve);
      if (r.ok) router.refresh();
      else alert(r.message ?? "Erreur");
    });

  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
      <button onClick={() => run(true)} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 30, fontSize: 12 }}>
        {pending ? "…" : <T fr="Valider" en="Approve" />}
      </button>
      <button
        onClick={() => run(false)}
        disabled={pending}
        className="ek-btn ek-btn-outline"
        style={{ height: 30, fontSize: 12, color: "var(--danger)", borderColor: "var(--danger)" }}
      >
        <T fr="Refuser" en="Reject" />
      </button>
    </div>
  );
}
