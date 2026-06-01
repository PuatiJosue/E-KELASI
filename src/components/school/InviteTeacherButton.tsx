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
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await inviteTeacherAction({ fullName: fullName.trim(), address: address.trim() });
      if (res.ok) {
        setCode(res.code);
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  const onClose = () => {
    setOpen(false);
    setCode(null);
    setFullName("");
    setAddress("");
    setError(null);
    setCopied(false);
  };

  const onCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="ek-btn ek-btn-primary" style={{ height: 32, fontSize: 12 }}>
        <Icon name="plus" size={14} stroke={2.5} />
        <T fr="Ajouter un prof" en="Add teacher" />
      </button>

      {open && (
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
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={onSubmit}
            className="ek-card"
            style={{ width: "100%", maxWidth: 460, padding: 24 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <h2 style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)" }}>
                <T fr="Code d'accès professeur" en="Teacher access code" />
              </h2>
              <button type="button" onClick={onClose} style={{ padding: 4, color: "var(--ink-3)" }}>
                <Icon name="close" size={18} />
              </button>
            </div>

            {!code ? (
              <>
                <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 18 }}>
                  <T
                    fr="Renseigne le nom du prof, on génère un code à lui remettre en main propre. Il s'en servira pour créer son compte."
                    en="Enter the teacher's name, we generate a code to hand to them. They'll use it to create their account."
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
                      <T fr="Adresse (optionnel)" en="Address (optional)" />
                    </span>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Quartier, ville…"
                      style={inputStyle}
                    />
                  </label>
                </div>

                {error && (
                  <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(192,58,43,0.10)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600 }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                  <button type="button" onClick={onClose} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>
                    <T fr="Annuler" en="Cancel" />
                  </button>
                  <button type="submit" disabled={pending} className="ek-btn ek-btn-primary" style={{ flex: 1, opacity: pending ? 0.6 : 1 }}>
                    {pending ? "Génération…" : "Générer le code"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 12.5, color: "var(--ink-2)", marginBottom: 18, lineHeight: 1.5 }}>
                  <T
                    fr="Voici le code à remettre au prof. Note-le ou copie-le maintenant — il s'inscrit ensuite sur la page « Prof — première connexion »."
                    en="Hand this code to the teacher. Note it or copy now — they then sign up on the « Teacher — first sign in » page."
                  />
                </p>

                <div
                  style={{
                    padding: "20px 18px",
                    borderRadius: 12,
                    background: "var(--brand-soft)",
                    border: "1px dashed var(--brand-600)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <code
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 22,
                      letterSpacing: 2,
                      color: "var(--brand-600)",
                      fontWeight: 700,
                    }}
                  >
                    {code}
                  </code>
                  <button type="button" onClick={onCopy} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12 }}>
                    {copied ? "✓ Copié" : "Copier"}
                  </button>
                </div>

                <div style={{ marginTop: 18, fontSize: 11.5, color: "var(--ink-3)" }}>
                  <strong>Important :</strong> ce code n&apos;est affiché qu&apos;une fois. Si tu le perds, supprime-le dans la
                  liste « Codes en attente » plus bas et regénère.
                </div>

                <div style={{ marginTop: 18 }}>
                  <button type="button" onClick={onClose} className="ek-btn ek-btn-primary" style={{ width: "100%" }}>
                    OK
                  </button>
                </div>
              </>
            )}
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
