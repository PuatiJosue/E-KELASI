"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/i18n";
import { updateSchoolContactAction } from "./actions";

type Initial = { commune: string; quartier: string; address: string; phone: string };

export function SchoolContactForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setMsg(null);
    startTransition(async () => {
      const r = await updateSchoolContactAction(form);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
        <T fr="Coordonnées & contact de l'école" en="School address & contact" />
      </div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
        <T
          fr="Le téléphone s'affiche aux parents dans « Contact École »."
          en="The phone shows to parents under “School contact”."
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field name="commune" label={<T fr="Commune" en="Commune" />} defaultValue={initial.commune} placeholder="Gombe" />
        <Field name="quartier" label={<T fr="Quartier" en="Neighborhood" />} defaultValue={initial.quartier} placeholder="Quartier…" />
      </div>
      <Field name="address" label={<T fr="Adresse" en="Address" />} defaultValue={initial.address} placeholder="N° / avenue…" />
      <Field name="phone" label={<T fr="Téléphone (Contact École)" en="Phone (School contact)" />} defaultValue={initial.phone} placeholder="+243 …" />

      {msg && (
        <div style={{ padding: "10px 12px", borderRadius: 9, fontSize: 12, fontWeight: 600, background: msg.ok ? "var(--accent-100)" : "rgba(192,58,43,0.1)", color: msg.ok ? "var(--accent)" : "var(--danger)" }}>
          {msg.text}
        </div>
      )}

      <div>
        <button type="submit" disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 34, fontSize: 13 }}>
          {pending ? <T fr="Enregistrement…" en="Saving…" /> : <T fr="Enregistrer" en="Save" />}
        </button>
      </div>
    </form>
  );
}

function Field({ name, label, defaultValue, placeholder }: { name: string; label: React.ReactNode; defaultValue: string; placeholder?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13.5, color: "var(--ink)", fontFamily: "inherit" }}
      />
    </label>
  );
}
