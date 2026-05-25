"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { inviteSchoolAction } from "@/app/(admin)/schools/actions";

export function InviteSchoolButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="ek-btn ek-btn-primary"
        style={{ height: 32, fontSize: 12 }}
        onClick={() => setOpen(true)}
      >
        <Icon name="plus" size={14} stroke={2.5} />
        <T fr="Inviter une école" en="Invite a school" />
      </button>
      {open && <InviteSchoolModal onClose={() => setOpen(false)} />}
    </>
  );
}

function InviteSchoolModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await inviteSchoolAction(form);
      if (result.ok) {
        setSuccess(result.message);
        router.refresh();
        setTimeout(onClose, 1200);
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <div
      onClick={onClose}
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
      <div
        onClick={(e) => e.stopPropagation()}
        className="ek-card"
        style={{ width: "100%", maxWidth: 480, padding: 24 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h2
            style={{
              fontSize: 18,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              color: "var(--ink)",
            }}
          >
            <T fr="Inviter une école" en="Invite a school" />
          </h2>
          <button onClick={onClose} style={{ padding: 4, color: "var(--ink-3)" }}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 18 }}>
          <T
            fr="Crée la fiche école et envoie un email d'onboarding au directeur."
            en="Creates the school record and emails the headmaster an onboarding link."
          />
        </p>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label={<T fr="Nom de l'école" en="School name" />} name="name" required placeholder="Lycée Jean-Mermoz" />
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
            <Field label={<T fr="Ville" en="City" />} name="city" required placeholder="Dakar" />
            <Field label={<T fr="Pays (ISO)" en="Country (ISO)" />} name="country_code" required placeholder="SN" maxLength={2} />
          </div>
          <Field
            label={<T fr="Email du directeur" en="Headmaster email" />}
            name="contact_email"
            type="email"
            required
            placeholder="direction@ecole.sn"
          />
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>
              <T fr="Plan initial" en="Initial plan" />
            </label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {(["standard", "pro"] as const).map((p, i) => (
                <label
                  key={p}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 9,
                    border: "1px solid var(--border-strong)",
                    background: "var(--surface)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <input type="radio" name="plan" value={p} defaultChecked={i === 0} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                    {p === "pro" ? "Pro" : "Standard"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 9,
                background: "rgba(192,58,43,0.1)",
                color: "var(--danger)",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 9,
                background: "var(--accent-100)",
                color: "var(--accent)",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {success}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button type="button" onClick={onClose} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>
              <T fr="Annuler" en="Cancel" />
            </button>
            <button type="submit" disabled={pending} className="ek-btn ek-btn-primary" style={{ flex: 1 }}>
              {pending ? (
                <T fr="Envoi…" en="Sending…" />
              ) : (
                <T fr="Envoyer l'invitation" en="Send invitation" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  maxLength,
}: {
  label: React.ReactNode;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid var(--border-strong)",
          background: "var(--surface)",
          fontSize: 13,
          color: "var(--ink)",
          fontFamily: "inherit",
        }}
      />
    </label>
  );
}
