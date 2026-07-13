"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { createAnnouncement, deleteAnnouncement } from "./actions";
import type { Announcement } from "@/lib/announce-db";

function fmtDate(d: string) {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 Mo

// Lit un fichier en base64 (sans le préfixe data:).
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export type AnnounceClass = { className: string; option: string | null; display: string };

export function AnnouncementManager({ announcements, classes = [] }: { announcements: Announcement[]; classes?: AnnounceClass[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [target, setTarget] = useState(""); // "" = toutes les classes, sinon classKey
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const targetClass = classes.find((c) => `${c.className}||${c.option ?? ""}` === target) ?? null;

  const pickFile = (f: File | null) => {
    setError(null);
    if (f && f.size > MAX_FILE_BYTES) { setError("Le document dépasse 8 Mo."); return; }
    setFile(f);
  };

  const publish = () => {
    setError(null);
    if (!title.trim() || !body.trim()) { setError("Titre et message requis."); return; }
    startTransition(async () => {
      const filePayload = file
        ? { name: file.name, type: file.type, dataBase64: await fileToBase64(file) }
        : undefined;
      const r = await createAnnouncement({
        title, body, eventDate: eventDate || undefined, file: filePayload,
        targetClassName: targetClass?.className, targetOption: targetClass?.option ?? null,
      });
      if (r.ok) {
        setTitle(""); setBody(""); setEventDate(""); setTarget(""); setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } else setError(r.message);
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
          {classes.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>
                <T fr="Destinataires" en="Recipients" />
              </div>
              <select value={target} onChange={(e) => setTarget(e.target.value)} style={{ ...inp, width: 210 }}>
                <option value="">🏫 Toutes les classes</option>
                {classes.map((c) => (
                  <option key={`${c.className}||${c.option ?? ""}`} value={`${c.className}||${c.option ?? ""}`}>{c.display}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>
              <T fr="Date de l'événement (optionnel)" en="Event date (optional)" />
            </div>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} style={{ ...inp, width: 170 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>
              <T fr="Pièce jointe (optionnel)" en="Attachment (optional)" />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,image/*,application/pdf"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              style={{ fontSize: 12, color: "var(--ink-2)" }}
            />
            {file && (
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 3 }}>
                📎 {file.name}
                <button onClick={() => pickFile(null)} style={{ marginLeft: 8, background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 11 }}>
                  <T fr="retirer" en="remove" />
                </button>
              </div>
            )}
          </div>
          <button onClick={publish} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 13, marginLeft: "auto", opacity: pending ? 0.6 : 1 }}>
            <Icon name="bell" size={14} />
            {pending ? "Publication…" : <T fr="Publier aux parents" en="Publish to parents" />}
          </button>
        </div>
        {error && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>{error}</div>}
        <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
          {targetClass
            ? `Seuls les parents de la classe « ${targetClass.display} » recevront une notification dans l'application.`
            : <T fr="Tous les parents de l'école recevront une notification dans l'application." en="All school parents will get a notification in the app." />}
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
              {a.attachmentUrl && (
                <a
                  href={a.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, fontWeight: 600, color: "var(--brand-600)" }}
                >
                  <Icon name="download" size={13} />
                  {a.attachmentName || <T fr="Document joint" en="Attachment" />}
                </a>
              )}
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
