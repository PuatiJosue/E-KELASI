"use client";

import { useTransition } from "react";
import { Icon } from "@/components/Icon";
import { useLang } from "@/lib/i18n";
import { signOutAction } from "@/app/login/signout";

/** `withLabel` affiche le libellé à côté de l'icône ; il est traduit ici. */
export function LogoutButton({ withLabel, block }: { withLabel?: boolean; block?: boolean }) {
  const lang = useLang();
  const [pending, startTransition] = useTransition();
  const en = lang === "en";
  const label = en ? "Sign out" : "Déconnexion";
  const title = en ? "Sign out" : "Se déconnecter";

  const onClick = () => {
    if (!confirm(en ? "Sign out?" : "Se déconnecter ?")) return;
    startTransition(() => signOutAction());
  };

  if (withLabel) {
    return (
      <button
        onClick={onClick}
        disabled={pending}
        title={title}
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
      title={title}
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
