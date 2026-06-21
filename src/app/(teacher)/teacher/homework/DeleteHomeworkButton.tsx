"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { useLang } from "@/lib/i18n";
import { deleteHomeworkAction } from "./actions";

// Bouton de suppression d'un devoir (visible seulement si l'échéance est passée).
// Après suppression, le devoir disparaît aussi côté parent.
export function DeleteHomeworkButton({ homeworkId }: { homeworkId: string }) {
  const lang = useLang();
  const tr = (fr: string, en: string) => (lang === "en" ? en : fr);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const onDelete = () => {
    if (pending) return;
    const ok = window.confirm(
      tr(
        "Supprimer ce devoir ? Il sera aussi retiré côté parents.",
        "Delete this homework? It will also be removed for parents."
      )
    );
    if (!ok) return;
    setErr(null);
    startTransition(async () => {
      const res = await deleteHomeworkAction(homeworkId);
      if (!res.ok) setErr(res.message);
    });
  };

  return (
    <button
      onClick={onDelete}
      disabled={pending}
      title={err ?? tr("Supprimer le devoir", "Delete homework")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 28,
        padding: "0 10px",
        borderRadius: 7,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--danger)",
        fontSize: 11.5,
        fontWeight: 600,
        cursor: pending ? "default" : "pointer",
        opacity: pending ? 0.5 : 1,
      }}
    >
      <Icon name="trash" size={13} />
      {tr("Supprimer", "Delete")}
    </button>
  );
}
