"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { createPlatformAnnouncement, deletePlatformAnnouncement } from "./actions";
import type { PlatformAnnouncement } from "@/lib/platform-db";

const AUD = [
  { key: "all", label: "Parents + Écoles" },
  { key: "parents", label: "Parents seulement" },
  { key: "schools", label: "Écoles seulement" },
] as const;
const audLabel = (a: string) => AUD.find((x) => x.key === a)?.label ?? a;

function fmtDate(d: string) {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function BroadcastManager({ announcements }: { announcements: PlatformAnnouncement[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "parents" | "schools">("all");
  const [error, setError] = useState<string | null>(null);

  const publish = () => {
    setError(null);
    if (!title.trim() || !body.trim()) { setError("Titre et message requis."); return; }
    startTransition(async () => {
      const r = await createPlatformAnnouncement({ title, body, audience });
      if (r.ok) { setTitle(""); setBody(""); router.refresh(); }
      else setError(r.message);
    });
  };

  const remove = (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    startTransition(async () => {
      const r = await deletePlatformAnnouncement(id);
      if (r.ok) router.refresh(); else alert(r.message);
    });
  };

  return (
    <>
      <div className="ek-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>Nouvelle diffusion</div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 6 }}>Destinataires</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {AUD.map((a) => {
              const on = audience === a.key;
              return (
                <button key={a.key} onClick={() => setAudience(a.key)} style={{ padding: "7px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: on ? "var(--brand)" : "var(--surface)", color: on ? "#fff" : "var(--ink-2)", border: `1px solid ${on ? "var(--brand)" : "var(--border)"}` }}>
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (ex. Nouvelle version de l'application)" style={inp} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Message…" style={{ ...inp, resize: "vertical" as const }} />
        {error && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>{error}</div>}
        <button onClick={publish} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 13, alignSelf: "flex-start", opacity: pending ? 0.6 : 1 }}>
          <Icon name="bell" size={14} /> {pending ? "Diffusion…" : "Diffuser"}
        </button>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
          Les parents reçoivent une notification dans l&apos;app ; les écoles voient une bannière dans leur console.
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="ek-card" style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>Aucune diffusion.</div>
      ) : (
        announcements.map((a) => (
          <div key={a.id} className="ek-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{a.title}</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 3, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{a.body}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>{audLabel(a.audience)} · {fmtDate(a.createdAt)}</div>
            </div>
            <button onClick={() => remove(a.id)} disabled={pending} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", display: "flex", padding: 4 }}>
              <Icon name="trash" size={15} />
            </button>
          </div>
        ))
      )}
    </>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", fontSize: 13.5, color: "var(--ink)",
};
