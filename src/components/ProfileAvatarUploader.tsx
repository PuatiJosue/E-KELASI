"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/i18n";

// Uploader la photo de profil de l'utilisateur connecté.
// Marche pour TOUT utilisateur (prof, direction, super_admin, parent web).
// Côté DB : profiles.avatar_url est self-updatable via RLS, et le bucket
// user-avatars est scopé au folder = user_id (RLS storage).
export function ProfileAvatarUploader({
  currentUrl,
  name,
  size = 80,
}: {
  currentUrl: string | null;
  name: string;
  size?: number;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        setError("Non authentifié.");
        return;
      }

      const ext =
        file.type === "image/png" ? "png" :
        file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("user-avatars")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) {
        setError(upErr.message);
        return;
      }

      const { data: signed, error: sErr } = await supabase.storage
        .from("user-avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (sErr || !signed?.signedUrl) {
        setError(sErr?.message ?? "URL signée impossible.");
        return;
      }

      const { error: pErr } = await supabase
        .from("profiles")
        .update({ avatar_url: signed.signedUrl })
        .eq("id", user.id);
      if (pErr) {
        setError(pErr.message);
        return;
      }

      setOptimistic(signed.signedUrl);
      router.refresh();
    } finally {
      setUploading(false);
    }
  };

  const url = optimistic ?? currentUrl;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <Avatar name={name} url={url} size={size} />
        <label
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 30,
            height: 30,
            borderRadius: 15,
            background: "var(--brand)",
            color: "var(--on-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: uploading ? "wait" : "pointer",
            border: "2px solid var(--surface)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
          title="Changer la photo"
        >
          {uploading ? "…" : <Icon name="edit" size={14} stroke={2.4} />}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFile}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
      </div>
      <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
        <T fr="Photo optionnelle (≤ 2 Mo)" en="Optional photo (≤ 2 MB)" />
      </div>
      {error && (
        <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 2 }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
