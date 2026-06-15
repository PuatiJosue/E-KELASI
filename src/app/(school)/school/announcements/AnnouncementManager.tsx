"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { createAnnouncement, deleteAnnouncement } from "./actions";
import type { Announcement } from "@/lib/announce-db";

function fmtDate(d: string) {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function AnnouncementManager({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const publish = () => {
    setError(null);
    if (!title.trim() || !body.trim()) { setError("Titre et message requis."); return; }
    startTransition(async () => {
      const r = await createAnnouncement({ title, body, eventDate: eventDate || undefined });
      if (r.ok) { setTitle(""); setBody(""); setEventDate(""); router.refresh(); }
      else setError(r.message);
    });
  };

  const remove = (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    startTransition(async () => {
      const r = await deleteAnnouncement(id);
      if (r.ok) router.refresh();
      else alert(r.message);
    });
  };

  return (
    <>
      {/* Nouvelle annonce */}
      <div className="ek-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
          <T fr="Nouvelle annonce" en="New announcement" />
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre (ex. Réunion des parents)"
          style={inp}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Message envoyé aux parents…"
          style={{ ...inp, resize: "vertical" as const }}
        />
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>
              <T fr="Date de l'événement (optionnel)" en="Event date (optional)" />
            </div>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} style={{ ...inp, width: 170 }} />
          </div>
          <button onClick={publish} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 13, marginLeft: "auto", opacity: pending ? 0.6 : 1 }}>
            <Icon name="bell" size={14} />
            {pending ? "Publication…" : <T fr="Publier aux parents" en="Publish to parents" />}
          </button>
        </div>
        {error && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>{error}</div>}
        <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
          <T fr="Tous les parents de l'école recevront une notification dans l'application." en="All school parents will get a notification in the app." />
        </div>
      </div>

      {/* Historique */}
      {announcements.length === 0 ? (
        <div className="ek-card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          <T fr="Aucune annonce publiée." en="No announcement yet." />
        </div>
      ) : (
        announcements.map((a) => (
          <div key={a.id} className="ek-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--brand-soft)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="bell" size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{a.title}</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 3, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{a.body}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>
                {a.eventDate ? `📅 ${fmtDate(a.eventDate)} · ` : ""}Publiée le {fmtDate(a.createdAt)}
              </div>
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
