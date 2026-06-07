"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/i18n";
import { setParentAccess } from "./actions";

export function ParentAccessButton({ parentId, blocked }: { parentId: string; blocked: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const r = await setParentAccess(parentId, !blocked);
      if (r.ok) router.refresh();
      else alert(r.message);
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={blocked ? "ek-btn ek-btn-primary" : "ek-btn ek-btn-outline"}
      style={{
        height: 30,
        fontSize: 12,
        ...(blocked ? {} : { color: "var(--danger)", borderColor: "var(--danger)" }),
      }}
    >
      {pending ? "…" : blocked ? <T fr="Débloquer" en="Unblock" /> : <T fr="Bloquer" en="Block" />}
    </button>
  );
}
