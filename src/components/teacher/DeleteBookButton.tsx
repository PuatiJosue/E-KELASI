"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { deleteBookAction } from "@/app/(teacher)/teacher/library/actions";

export function DeleteBookButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm(`Supprimer "${title}" de la bibliothèque ?`)) return;
    startTransition(async () => {
      const res = await deleteBookAction(id);
      if (res.ok) router.refresh();
      else alert(res.message);
    });
  };

  return (
    <button
      onClick={onClick}
      disabled={pending}
      style={{
        padding: 4,
        color: "var(--ink-3)",
        opacity: pending ? 0.4 : 1,
      }}
      title="Supprimer"
    >
      <Icon name="trash" size={14} />
    </button>
  );
}
