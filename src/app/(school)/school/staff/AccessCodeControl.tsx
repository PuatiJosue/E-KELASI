"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { generateCodeForStaffAction, revokeStaffCodeAction } from "@/app/(school)/school/teachers/actions";
import { linkBtn } from "./staff-ui";

export function AccessCodeControl({
  staffId, category, linked, pending, onChanged,
}: {
  staffId: string;
  category: string;
  linked: boolean;
  pending: boolean;
  onChanged: () => void;
}) {
  const isSurveillant = category === "surveillant";
  const signupPath = isSurveillant ? "/surveillant-signup" : "/teacher-signup";
  const who = isSurveillant ? "au surveillant" : "au prof";
  const [busy, startTransition] = useTransition();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (linked) {
    return (
      <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
        <Icon name="check" size={13} /> Compte actif
      </div>
    );
  }

  const generate = () => {
    setError(null);
    startTransition(async () => {
      const r = await generateCodeForStaffAction(staffId);
      if (r.ok) { setCode(r.code); onChanged(); }
      else setError(r.message);
    });
  };
  const revoke = () => {
    setError(null);
    startTransition(async () => {
      const r = await revokeStaffCodeAction(staffId);
      if (r.ok) { setCode(null); onChanged(); }
      else setError(r.message);
    });
  };
  const copy = async () => {
    if (!code) return;
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
      {code ? (
        <div style={{ padding: "8px 10px", borderRadius: 9, background: "var(--brand-soft)", border: "1px dashed var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <code style={{ fontFamily: "var(--font-mono)", fontSize: 15, letterSpacing: 1.5, color: "var(--brand-600)", fontWeight: 700 }}>{code}</code>
          <button type="button" onClick={copy} style={linkBtn}>{copied ? "✓ Copié" : "Copier"}</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={generate} disabled={busy} style={linkBtn}>
            {busy ? "…" : pending ? "Régénérer le code" : "Générer un code d'accès"}
          </button>
          {pending && (
            <button type="button" onClick={revoke} disabled={busy} style={{ ...linkBtn, color: "var(--danger)" }}>Révoquer</button>
          )}
        </div>
      )}
      {pending && !code && (
        <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>Un code est en attente (affiché une seule fois à la génération).</div>
      )}
      {code && (
        <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
          À remettre {who}, à utiliser sur <strong>{signupPath}</strong>. Affiché une seule fois.
        </div>
      )}
      {error && <div style={{ fontSize: 11, color: "var(--danger)", fontWeight: 600 }}>{error}</div>}
    </div>
  );
}

