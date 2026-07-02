"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { CourseVideo, SchoolParent } from "@/lib/content-db";
import { addCourseVideo, deleteCourseVideo } from "./actions";

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 Mo

const input: React.CSSProperties = {
  height: 38, padding: "0 11px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--ink)", fontSize: 13, outline: "none", width: "100%",
};

export function VideosManager({ videos, classNames, parents }: { videos: CourseVideo[]; classNames: string[]; parents: SchoolParent[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [target, setTarget] = useState<"all" | "parents">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);

  const filteredParents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parents;
    return parents.filter((p) => p.name.toLowerCase().includes(q) || p.students.toLowerCase().includes(q));
  }, [parents, search]);

  const toggle = (id: string) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const reset = () => {
    setTitle(""); setUrl(""); setSubject(""); setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
    setTarget("all"); setSelected(new Set()); setSearch("");
  };

  const submit = () => {
    setErr(null);
    if (!title.trim()) { setErr("Titre requis."); return; }
    if (target === "parents" && selected.size === 0) { setErr("Sélectionnez au moins un parent."); return; }

    start(async () => {
      let finalUrl = url.trim();
      const file = fileRef.current?.files?.[0];
      if (file) {
        if (file.size > MAX_VIDEO_BYTES) { setErr("La vidéo dépasse 50 Mo. Utilisez un lien (YouTube…) pour les fichiers plus lourds."); return; }
        setUploading(true);
        try {
          const supabase = createClient();
          const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
          const path = `${crypto.randomUUID()}.${ext}`;
          const { error } = await supabase.storage.from("course-videos").upload(path, file, { upsert: false, contentType: file.type || undefined });
          if (error) { setUploading(false); setErr("Échec de l'envoi de la vidéo."); return; }
          finalUrl = supabase.storage.from("course-videos").getPublicUrl(path).data.publicUrl;
        } catch { setUploading(false); setErr("Échec de l'envoi."); return; }
        setUploading(false);
      }
      if (!finalUrl) { setErr("Ajoutez un lien ou un fichier vidéo."); return; }

      const res = await addCourseVideo({
        title, url: finalUrl, className, subject,
        recipientIds: target === "parents" ? [...selected] : undefined,
      });
      if (!res.ok) { setErr(res.message); return; }
      reset();
      router.refresh();
    });
  };

  const remove = (id: string) => start(async () => { await deleteCourseVideo(id); router.refresh(); });
  const busy = pending || uploading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="ek-card" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>
          <T fr="Ajouter une vidéo" en="Add a video" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (ex. Cours de fractions)" style={input} />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Lien (YouTube, Vimeo, https://…)" style={input} disabled={!!fileName} />

          {/* Ou fichier vidéo depuis l'appareil */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <label className="ek-btn ek-btn-outline" style={{ height: 36, fontSize: 12.5, cursor: "pointer" }}>
              <Icon name="upload" size={14} /> <T fr="Choisir un fichier vidéo" en="Choose a video file" />
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                style={{ display: "none" }}
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
            {fileName && (
              <span style={{ fontSize: 12, color: "var(--ink-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                {fileName}
                <button onClick={() => { setFileName(null); if (fileRef.current) fileRef.current.value = ""; }} style={{ border: "none", background: "transparent", color: "var(--ink-4)", cursor: "pointer", padding: 0 }}>
                  <Icon name="close" size={13} />
                </button>
              </span>
            )}
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}><T fr="Fichier ≤ 50 Mo — au-delà, utilisez un lien." en="File ≤ 50 MB — beyond that, use a link." /></span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input list="ek-vid-classes" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Classe (facultatif = toutes)" style={input} />
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Matière (facultatif)" style={input} />
          </div>
          <datalist id="ek-vid-classes">{classNames.map((c) => <option key={c} value={c} />)}</datalist>

          {/* Destinataires */}
          <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 12, marginTop: 2 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
              <T fr="Destinataires" en="Recipients" />
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: target === "parents" ? 10 : 0 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-2)", cursor: "pointer" }}>
                <input type="radio" checked={target === "all"} onChange={() => setTarget("all")} />
                <T fr="Toute la classe / l'école" en="Whole class / school" />
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-2)", cursor: "pointer" }}>
                <input type="radio" checked={target === "parents"} onChange={() => setTarget("parents")} />
                <T fr="Parents précis" en="Specific parents" />
                {target === "parents" && selected.size > 0 && <span style={{ color: "var(--brand-600)", fontWeight: 700 }}>({selected.size})</span>}
              </label>
            </div>

            {target === "parents" && (
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un parent ou un élève…" style={{ ...input, height: 36, border: "none", borderBottom: "1px solid var(--divider)", borderRadius: 0 }} />
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {parents.length === 0 ? (
                    <div style={{ padding: 14, fontSize: 12.5, color: "var(--ink-3)" }}><T fr="Aucun parent inscrit pour l'instant." en="No parent yet." /></div>
                  ) : filteredParents.length === 0 ? (
                    <div style={{ padding: 14, fontSize: 12.5, color: "var(--ink-3)" }}><T fr="Aucun résultat." en="No match." /></div>
                  ) : (
                    filteredParents.map((p, i) => (
                      <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer", borderTop: i > 0 ? "1px solid var(--divider)" : "none", background: selected.has(p.id) ? "var(--brand-soft)" : "transparent" }}>
                        <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{p.name}</div>
                          {p.students && <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.students}</div>}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {err && <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--danger)", fontWeight: 600 }}>{err}</div>}
        <button onClick={submit} disabled={busy} className="ek-btn ek-btn-primary" style={{ marginTop: 12, height: 38, fontSize: 13, opacity: busy ? 0.6 : 1 }}>
          <Icon name="plus" size={14} stroke={2.5} /> {uploading ? <T fr="Envoi…" en="Uploading…" /> : <T fr="Ajouter" en="Add" />}
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="ek-card" style={{ padding: 28, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          <T fr="Aucune vidéo. Ajoutez la première ci-dessus." en="No video yet. Add the first one above." />
        </div>
      ) : (
        <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          {videos.map((v, i) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
              <span className="ek-tint rose" style={{ width: 38, height: 38 }}><Icon name="bookOpen" size={17} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{v.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                  {[v.className || "Toutes les classes", v.subject].filter(Boolean).join(" · ")}
                </div>
                <a href={v.url} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: "var(--brand)", fontWeight: 600 }}>
                  <T fr="Ouvrir la vidéo" en="Open video" /> →
                </a>
              </div>
              <button onClick={() => remove(v.id)} disabled={busy} title="Supprimer" style={{ border: "none", background: "transparent", color: "var(--ink-4)", cursor: "pointer", padding: 4 }}>
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
