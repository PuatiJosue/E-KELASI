"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T, useLang } from "@/lib/i18n";
import type { SchoolEvent } from "@/lib/agenda-db";
import { createSchoolEvent, deleteSchoolEvent } from "@/app/(school)/school/overview/agenda-actions";

const DOTS = ["#4F66E8", "#8B5CF6", "#16A34A", "#D97706", "#14B8A6"];

export function AgendaCard({ events }: { events: SchoolEvent[] }) {
  const en = useLang() === "en";
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [when, setWhen] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    setErr(null);
    start(async () => {
      const res = await createSchoolEvent({ title, location, startsAt: when });
      if (!res.ok) { setErr(res.message); return; }
      setTitle(""); setLocation(""); setWhen(""); setOpen(false);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    start(async () => {
      await deleteSchoolEvent(id);
      router.refresh();
    });
  };

  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}><T fr="Aujourd'hui" en="Today" /></div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}><T fr="Agenda de la direction" en="Management agenda" /></div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          title={en ? "Add an event" : "Ajouter un événement"}
          style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--border)", background: open ? "var(--brand-soft)" : "var(--surface)", color: open ? "var(--brand-600)" : "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <Icon name={open ? "close" : "plus"} size={15} stroke={2.4} />
        </button>
      </div>

      {open && (
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--divider)", display: "flex", flexDirection: "column", gap: 8, background: "var(--surface-2)" }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre (ex. Conseil de classe)"
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lieu" style={{ ...inputStyle, flex: 1 }} />
          </div>
          {err && <div style={{ fontSize: 11.5, color: "var(--danger)" }}>{err}</div>}
          <button type="button" onClick={submit} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 34, fontSize: 12.5, opacity: pending ? 0.6 : 1 }}>
            <T fr="Ajouter à l'agenda" en="Add to agenda" />
          </button>
        </div>
      )}

      {events.length === 0 ? (
        <div style={{ padding: 28, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>
          <T fr="Aucun événement à venir." en="No upcoming event." />
        </div>
      ) : (
        events.map((e, i) => (
          <div key={e.id} style={{ display: "flex", gap: 12, padding: "13px 20px", borderTop: i > 0 ? "1px solid var(--divider)" : "none", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 3 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: DOTS[i % DOTS.length] }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                {e.time}{!e.isToday && <span style={{ marginLeft: 6, color: "var(--ink-4)" }}>· {e.dayLabel}</span>}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", marginTop: 1 }}>{e.title}</div>
              {e.location && <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>{e.location}</div>}
            </div>
            <button
              type="button"
              onClick={() => remove(e.id)}
              disabled={pending}
              title="Supprimer"
              style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "transparent", color: "var(--ink-4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 36,
  padding: "0 11px",
  borderRadius: 9,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 13,
  fontFamily: "var(--font-body)",
  outline: "none",
  width: "100%",
};
