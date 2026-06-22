"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { deletePlatformBook } from "@/app/(admin)/library/actions";

export function DeletePlatformBook({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    if (!confirm(`Supprimer « ${title} » de la bibliothèque ?`)) return;
    startTransition(async () => {
      const res = await deletePlatformBook(id);
      if (res.ok) router.refresh();
      else alert(res.message);
    });
  };

  return (
    <button
      onClick={onDelete}
      disabled={pending}
      title="Supprimer"
      style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer", padding: 4, opacity: pending ? 0.5 : 1 }}
    >
      <Icon name="trash" size={14} />
    </button>
  );
}
