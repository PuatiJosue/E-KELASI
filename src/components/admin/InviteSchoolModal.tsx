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
  const [invite, setInvite] = useState<{ code: string; school: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await inviteSchoolAction(form);
      if (result.ok && result.invite) {
        setInvite(result.invite);
        router.refresh();
      } else if (result.ok) {
        onClose();
      } else {
        setError(result.message);
      }
    });
  };

  const copyMessage = () => {
    if (!invite) return;
    const msg =
      `Bonjour, voici l'accès à E-KLASS pour ${invite.school} :\n` +
      `1. Allez sur https://e-kelasi.vercel.app/school-signup\n` +
      `2. Saisissez votre code d'accès : ${invite.code}\n` +
      `3. Créez votre email et votre mot de passe de connexion.`;
    navigator.clipboard?.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        {invite ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: "10px 12px", borderRadius: 9, background: "var(--accent-100)", color: "var(--accent)", fontSize: 12, fontWeight: 600 }}>
              <T fr="École créée ✅ — code d'accès généré" en="School created ✅ — access code generated" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 14, borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface-2)" }}>
              <CredRow label={<T fr="École" en="School" />} value={invite.school} />
              <CredRow label={<T fr="Page" en="Page" />} value="e-kelasi.vercel.app/school-signup" />
              <CredRow label={<T fr="Code d'accès" en="Access code" />} value={invite.code} mono />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.4 }}>
              <T
                fr="Transmets ce code à la direction (WhatsApp, SMS…). Elle crée elle-même son email et son mot de passe sur la page d'inscription. Le code ne sera plus réaffiché."
                en="Share this code with the school (WhatsApp, SMS…). They set their own email and password on the signup page. The code won't be shown again."
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={copyMessage} className="ek-btn ek-btn-primary" style={{ flex: 1 }}>
                {copied ? <T fr="Copié !" en="Copied!" /> : <T fr="Copier le message" en="Copy message" />}
              </button>
              <button type="button" onClick={onClose} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>
                <T fr="Terminé" en="Done" />
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label={<T fr="Nom de l'école" en="School name" />} name="name" required placeholder="Lycée Jean-Mermoz" />
          <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
            <Field label={<T fr="Ville" en="City" />} name="city" required placeholder="Kinshasa" />
            <Field label={<T fr="Pays (ISO)" en="Country (ISO)" />} name="country_code" required placeholder="CD" maxLength={2} />
          </div>
          <Field label={<T fr="Nom du directeur" en="Headmaster name" />} name="director_name" required placeholder="M. Kabongo" />
          <Field
            label={<T fr="Email de l'école" en="School email" />}
            name="email"
            type="email"
            placeholder="contact@ecole.cd"
          />
          <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label={<T fr="Téléphone" en="Phone" />} name="phone" placeholder="+243 …" />
            <Field label={<T fr="Adresse" en="Address" />} name="address" placeholder="Avenue, n°…" />
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>
              <T fr="Informations complémentaires" en="Additional notes" />
            </span>
            <textarea
              name="notes"
              rows={3}
              placeholder="Numéro d'agrément, contact secondaire, remarques…"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border-strong)",
                background: "var(--surface)",
                fontSize: 13,
                color: "var(--ink)",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>
              <T fr="Documents (optionnel)" en="Documents (optional)" />
            </span>
            <input
              name="documents"
              type="file"
              multiple
              accept=".pdf,image/*,.doc,.docx,.xls,.xlsx"
              style={{ fontSize: 12.5, color: "var(--ink-2)" }}
            />
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
              <T fr="PDF, images ou documents Office — 8 Mo max par fichier." en="PDF, images or Office docs — 8 MB max per file." />
            </span>
          </label>

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
        )}
      </div>
    </div>
  );
}

function CredRow({ label, value, mono }: { label: React.ReactNode; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, fontSize: 12.5 }}>
      <span style={{ color: "var(--ink-3)", minWidth: 92 }}>{label}</span>
      <span
        style={{
          color: "var(--ink)",
          fontWeight: 600,
          fontFamily: mono ? "ui-monospace, monospace" : "inherit",
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
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
