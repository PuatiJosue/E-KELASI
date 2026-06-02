"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/i18n";
import { updateProfileAction } from "@/lib/profile-actions";

export function ProfileEditForm({ initialName, initialEmail }: { initialName: string; initialEmail: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setMsg(null);
    startTransition(async () => {
      const r = await updateProfileAction(form);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
        <T fr="Mon compte" en="My account" />
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}><T fr="Nom complet" en="Full name" /></span>
        <input name="full_name" defaultValue={initialName} required style={inputStyle} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Email</span>
        <input name="email" type="email" defaultValue={initialEmail} required style={inputStyle} />
        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
          <T
            fr="Changer l'email modifie aussi ton identifiant de connexion."
            en="Changing the email also changes your login."
          />
        </span>
      </label>

      {msg && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 9,
            fontSize: 12,
            fontWeight: 600,
            background: msg.ok ? "var(--accent-100)" : "rgba(192,58,43,0.1)",
            color: msg.ok ? "var(--accent)" : "var(--danger)",
          }}
        >
          {msg.text}
        </div>
      )}

      <div>
        <button type="submit" disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 36, fontSize: 13 }}>
          {pending ? <T fr="Enregistrement…" en="Saving…" /> : <T fr="Enregistrer" en="Save" />}
        </button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  fontSize: 13.5,
  color: "var(--ink)",
  fontFamily: "inherit",
};
