"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import type { PlatformVideo } from "@/lib/platform-db";
import { addPlatformVideo, deletePlatformVideo } from "./actions";

const input: React.CSSProperties = {
  height: 38, padding: "0 11px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--ink)", fontSize: 13, outline: "none", width: "100%",
};

export function VideosManager({ videos }: { videos: PlatformVideo[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    setErr(null);
    start(async () => {
      const res = await addPlatformVideo({ title, url, subject });
      if (!res.ok) { setErr(res.message); return; }
      setTitle(""); setUrl(""); setSubject("");
      router.refresh();
    });
  };

  const remove = (id: string) => start(async () => { await deletePlatformVideo(id); router.refresh(); });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="ek-card" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>
          <T fr="Ajouter une vidéo (toutes les écoles)" en="Add a video (all schools)" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" style={input} />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Lien (YouTube, Vimeo, https://…)" style={input} />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Matière / thème (facultatif)" style={input} />
        </div>
        {err && <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--danger)", fontWeight: 600 }}>{err}</div>}
        <button onClick={submit} disabled={pending} className="ek-btn ek-btn-primary" style={{ marginTop: 12, height: 38, fontSize: 13, opacity: pending ? 0.6 : 1 }}>
          <Icon name="plus" size={14} stroke={2.5} /> <T fr="Publier" en="Publish" />
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="ek-card" style={{ padding: 28, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          <T fr="Aucune vidéo plateforme. Ajoutez la première ci-dessus." en="No platform video yet. Add the first one above." />
        </div>
      ) : (
        <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          {videos.map((v, i) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
              <span className="ek-tint violet" style={{ width: 38, height: 38 }}><Icon name="bookOpen" size={17} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{v.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{v.subject || "Toutes les écoles"}</div>
                <a href={v.url} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: "var(--brand)", fontWeight: 600 }}>
                  <T fr="Ouvrir le lien" en="Open link" /> →
                </a>
              </div>
              <button onClick={() => remove(v.id)} disabled={pending} title="Supprimer" style={{ border: "none", background: "transparent", color: "var(--ink-4)", cursor: "pointer", padding: 4 }}>
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
