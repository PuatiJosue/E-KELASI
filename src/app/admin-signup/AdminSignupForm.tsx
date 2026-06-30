"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuthField, AuthCodeField, AuthLabel, AuthError } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { redeemAdminCodeAction } from "@/app/(admin)/team/actions";

export function AdminSignupForm() {
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
      const res = await redeemAdminCodeAction({ code, email, password });
      if (res.ok) {
        router.push("/login?signup=ok");
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <AuthCodeField
        label="Code d'accès"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        required
        placeholder="XK3F-7P9M"
        autoCapitalize="characters"
      />

      <AuthField label="Email" icon="user" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="membre@ekelasi.app" autoComplete="email" />

      <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <AuthLabel>Mot de passe</AuthLabel>
        <PasswordInput name="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <AuthLabel>Confirmation</AuthLabel>
        <PasswordInput name="confirm" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </label>

      <button type="submit" disabled={pending} className="ek-btn ek-btn-primary" style={{ marginTop: 6, height: 54, fontSize: 16, opacity: pending ? 0.6 : 1 }}>
        {pending ? "Création…" : "Créer mon compte"}
      </button>

      {error && <AuthError>{error}</AuthError>}
    </form>
  );
}
