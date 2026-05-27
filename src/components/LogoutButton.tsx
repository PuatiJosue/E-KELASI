"use client";

import { useTransition } from "react";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { signOutAction } from "@/app/login/signout";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm("Se déconnecter ?")) return;
    startTransition(() => signOutAction());
  };

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
