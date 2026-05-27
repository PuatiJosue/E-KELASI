"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { inviteTeacherAction } from "@/app/(school)/school/teachers/actions";

export function InviteTeacherButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await inviteTeacherAction({ email: email.trim(), fullName: fullName.trim() });
      if (res.ok) {
        setSuccess(res.message);
        setEmail("");
        setFullName("");
        router.refresh();
        setTimeout(() => setOpen(false), 1200);
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="ek-btn ek-btn-primary" style={{ height: 32, fontSize: 12 }}>
        <Icon name="plus" size={14} stroke={2.5} />
        <T fr="Inviter un prof" en="Invite teacher" />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,16,10,0.45)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 24,
          }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={onSubmit}
            className="ek-card"
            style={{ width: "100%", maxWidth: 460, padding: 24 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <h2 style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)" }}>
                <T fr="Inviter un professeur" en="Invite a teacher" />
              </h2>
              <button type="button" onClick={() => setOpen(false)} style={{ padding: 4, color: "var(--ink-3)" }}>
                <Icon name="close" size={18} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 18 }}>
              <T
                fr="Le prof recevra un email avec un lien de connexion."
                en="The teacher will receive an invitation email."
              />
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>
                  <T fr="Nom complet" en="Full name" />
                </span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="M. Ousmane Bâ"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>
                  <T fr="Email" en="Email" />
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  placeholder="prof@ecole.fr"
                  style={inputStyle}
                />
              </label>
            </div>

            {error && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(192,58,43,0.10)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "var(--accent-100)", color: "var(--accent)", fontSize: 12.5, fontWeight: 600 }}>
                {success}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button type="button" onClick={() => setOpen(false)} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>
                <T fr="Annuler" en="Cancel" />
              </button>
              <button type="submit" disabled={pending} className="ek-btn ek-btn-primary" style={{ flex: 1, opacity: pending ? 0.6 : 1 }}>
                {pending ? "Envoi…" : "Inviter"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 13,
};
