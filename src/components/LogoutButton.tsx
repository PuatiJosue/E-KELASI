"use client";

import { useTransition } from "react";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { signOutAction } from "@/app/login/signout";

export function LogoutButton({ label, block }: { label?: string; block?: boolean }) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm("Se déconnecter ?")) return;
    startTransition(() => signOutAction());
  };

  if (label) {
    return (
      <button
        onClick={onClick}
        disabled={pending}
        title="Se déconnecter"
        style={{
          width: block ? "100%" : "auto",
          height: 36,
          padding: block ? 0 : "0 14px",
          borderRadius: 10,
          background: "rgba(225,29,72,0.08)",
          color: "var(--danger)",
          border: "1px solid rgba(225,29,72,0.20)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: "nowrap",
          opacity: pending ? 0.5 : 1,
        }}
      >
        <Icon name="logout" size={15} />
        {pending ? "…" : label}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      title="Se déconnecter"
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: "transparent",
        color: "var(--ink-3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        opacity: pending ? 0.4 : 1,
      }}
    >
      <Icon name="lock" size={14} />
    </button>
  );
}
