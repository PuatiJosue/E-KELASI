"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/i18n";
import { markParentPaid } from "./actions";

export function MarkPaidButton({ parentId, paid }: { parentId: string; paid: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (paid) {
    return (
      <span className="ek-chip success">
        <T fr="Payé ce mois" en="Paid this month" />
      </span>
    );
  }

  const mark = () => {
    startTransition(async () => {
      const r = await markParentPaid(parentId);
      if (r.ok) router.refresh();
      else alert(r.message);
    });
  };

  return (
    <button onClick={mark} disabled={pending} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}>
      {pending ? "…" : <T fr="Marquer payé" en="Mark paid" />}
    </button>
  );
}
