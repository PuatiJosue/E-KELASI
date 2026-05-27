"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export function CoverPicker({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "url">(value ? "url" : "upload");

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > 5 * 1024 * 1024) {
      setError("Fichier trop gros (5 MB max).");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Non authentifié.");
        return;
      }
      const { data: staff } = await supabase
        .from("school_staff")
        .select("school_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (!staff) {
        setError("Aucune école associée.");
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `${staff.school_id}/${filename}`;

      const { error: upErr } = await supabase.storage
        .from("book-covers")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

      if (upErr) {
        // Cas Supabase local sans Storage : on tombe ici
        if (upErr.message.toLowerCase().includes("bucket") || upErr.message.toLowerCase().includes("not found")) {
          setError("Storage indisponible en local. Bascule en URL ou déploie sur Cloud.");
          setMode("url");
        } else {
          setError(upErr.message);
        }
        return;
      }

      const { data: publicUrl } = supabase.storage.from("book-covers").getPublicUrl(path);
      onChange(publicUrl.publicUrl);
    } catch (e: any) {
      setError(e?.message ?? "Erreur upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 8, background: "var(--surface-2)" }}>
        <button
          type="button"
          onClick={() => setMode("upload")}
          style={{
            flex: 1,
            padding: "6px 10px",
            borderRadius: 6,
            background: mode === "upload" ? "var(--surface)" : "transparent",
            color: mode === "upload" ? "var(--ink)" : "var(--ink-3)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          📤 Upload
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          style={{
            flex: 1,
            padding: "6px 10px",
            borderRadius: 6,
            background: mode === "url" ? "var(--surface)" : "transparent",
            color: mode === "url" ? "var(--ink)" : "var(--ink-3)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          🔗 URL
        </button>
      </div>

      {/* Preview existing */}
      {value && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, borderRadius: 10, background: "var(--surface-2)" }}>
          <div style={{ position: "relative", width: 50, height: 70, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Couverture actuelle</div>
            <div style={{ fontSize: 11, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {value}
            </div>
          </div>
          <button type="button" onClick={() => onChange(null)} style={{ color: "var(--ink-3)", padding: 4 }}>
            <Icon name="trash" size={14} />
          </button>
        </div>
      )}

      {/* Upload mode */}
      {mode === "upload" && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFile}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: "14px",
              borderRadius: 10,
              border: "1.5px dashed var(--border-strong)",
              background: "var(--surface)",
              color: "var(--ink-2)",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <Icon name="upload" size={16} />
            {uploading ? "Upload en cours…" : value ? "Remplacer la couverture" : "Choisir une image (JPG/PNG/WEBP, 5 MB max)"}
          </button>
        </>
      )}

      {/* URL mode */}
      {mode === "url" && (
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://…/cover.jpg"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--border-strong)",
            background: "var(--surface)",
            color: "var(--ink)",
            fontSize: 13,
            width: "100%",
          }}
        />
      )}

      {error && (
        <div style={{ padding: 8, borderRadius: 6, background: "rgba(192,58,43,0.08)", color: "var(--danger)", fontSize: 11.5, fontWeight: 600 }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
