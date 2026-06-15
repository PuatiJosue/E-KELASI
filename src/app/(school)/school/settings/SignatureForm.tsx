"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveSignatureAction } from "./actions";

export function SignatureForm({ initialName, initialSignatureUrl }: { initialName: string; initialSignatureUrl: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(initialName);
  const [preview, setPreview] = useState<string | null>(initialSignatureUrl);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    setMsg(null);
    let signatureUrl: string | undefined;
    const file = fileRef.current?.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const supabase = createClient();
        const ext = (file.name.split(".").pop() || "png").toLowerCase();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("signatures").upload(path, file, { upsert: false });
        if (error) { setUploading(false); setMsg({ ok: false, text: "Échec de l'envoi de la signature." }); return; }
        signatureUrl = supabase.storage.from("signatures").getPublicUrl(path).data.publicUrl;
      } catch { setUploading(false); setMsg({ ok: false, text: "Échec de l'envoi." }); return; }
      setUploading(false);
    }

    startTransition(async () => {
      const r = await saveSignatureAction({ directorName: name, signatureUrl });
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) { if (signatureUrl) setPreview(signatureUrl); router.refresh(); }
    });
  };

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>Signature électronique</div>
      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, marginBottom: 12 }}>
        Apparaît sur les bulletins officiels signés envoyés aux parents.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>Nom du responsable / direction</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. M. Jean Kabongo, Directeur" style={inp} />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>Image de la signature (PNG/JPG)</div>
          {preview && (
            <img src={preview} alt="Signature" style={{ height: 56, objectFit: "contain", background: "#fff", borderRadius: 8, border: "1px solid var(--border)", padding: 4, marginBottom: 6, display: "block" }} />
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} style={{ fontSize: 12, color: "var(--ink-2)" }} />
        </div>

        {msg && (
          <div style={{ padding: 10, borderRadius: 8, background: msg.ok ? "rgba(29,102,80,0.10)" : "rgba(192,58,43,0.10)", color: msg.ok ? "#1D6650" : "var(--danger)", fontSize: 12.5, fontWeight: 600 }}>{msg.text}</div>
        )}

        <button onClick={save} disabled={pending || uploading} className="ek-btn ek-btn-primary" style={{ height: 36, fontSize: 13, alignSelf: "flex-start", opacity: pending || uploading ? 0.6 : 1 }}>
          {uploading ? "Envoi…" : pending ? "Enregistrement…" : "Enregistrer la signature"}
        </button>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", maxWidth: 360, padding: "9px 10px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", fontSize: 13, color: "var(--ink)",
};
