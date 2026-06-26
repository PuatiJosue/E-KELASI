"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { redeemSchoolCodeAction } from "@/app/(admin)/schools/actions";

export function SchoolSignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    startTransition(async () => {
      const res = await redeemSchoolCodeAction({ code, email, password });
      if (res.ok) {
        router.push("/login?signup=ok");
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Code d&apos;accès</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          placeholder="XK3F-7P9M"
          autoCapitalize="characters"
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid var(--border-strong)",
            background: "var(--surface)",
            fontSize: 16,
            color: "var(--ink)",
            fontFamily: "var(--font-mono)",
            letterSpacing: 2,
            textAlign: "center",
            textTransform: "uppercase",
          }}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Email</span>
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="direction@ecole.cd"
          style={inputStyle}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Mot de passe</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Confirmation</span>
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="ek-btn ek-btn-primary"
        style={{ marginTop: 6, opacity: pending ? 0.6 : 1 }}
      >
        {pending ? "Création…" : "Créer le compte de l'école"}
      </button>

      {error && (
        <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: "rgba(192,58,43,0.10)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600, textAlign: "center" }}>
          {error}
        </div>
      )}
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 14,
};
