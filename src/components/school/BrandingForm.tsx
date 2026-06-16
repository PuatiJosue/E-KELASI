"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/i18n";
import { Icon } from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import type { MySchool } from "@/lib/school-db";
import { updateBrandingAction } from "@/app/(school)/school/branding/actions";

const COLORS = ["#1E2F6D", "#1D6650", "#3A6DBC", "#9747BB", "#B8475B", "#C28728"];

export function BrandingForm({ school }: { school: MySchool }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(school.name);
  const [brandColor, setBrandColor] = useState(school.brandColor ?? "#1E2F6D");
  const [logoUrl, setLogoUrl] = useState(school.logoUrl ?? "");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${school.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("school-logos").upload(path, file, { upsert: false });
      if (error) {
        setMsg({ kind: "err", text: "Échec du téléversement du logo." });
      } else {
        const url = supabase.storage.from("school-logos").getPublicUrl(path).data.publicUrl;
        setLogoUrl(url);
        setMsg({ kind: "ok", text: "Logo chargé — cliquez sur Enregistrer pour valider." });
      }
    } catch {
      setMsg({ kind: "err", text: "Échec du téléversement." });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = () => {
    setMsg(null);
    startTransition(async () => {
      const res = await updateBrandingAction({ name, brandColor, logoUrl: logoUrl || null });
      if (res.ok) {
        setMsg({ kind: "ok", text: "Branding mis à jour." });
        router.refresh();
      } else {
        setMsg({ kind: "err", text: res.message });
      }
    });
  };

  return (
    <>
      <div className="ek-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* Preview */}
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo"
              style={{ width: 80, height: 80, borderRadius: 14, objectFit: "cover", background: "var(--surface-2)", border: "1px solid var(--border)" }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 14,
                background: brandColor,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
              }}
            >
              {name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("")}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{name}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
              {school.city}, {school.countryCode} · {school.plan === "pro" ? "Pro" : "Standard"}
            </div>
          </div>
        </div>
      </div>

      <div className="ek-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <Row label={<T fr="Nom de l'école" en="School name" />}>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </Row>

        <Row label={<T fr="Couleur principale" en="Primary color" />}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBrandColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: c,
                  border: brandColor === c ? "3px solid var(--ink)" : "3px solid transparent",
                  cursor: "pointer",
                }}
              />
            ))}
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              style={{ width: 40, height: 40, padding: 0, border: "1px solid var(--border-strong)", borderRadius: 8, cursor: "pointer" }}
            />
            <code style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{brandColor}</code>
          </div>
        </Row>

        <Row label={<T fr="Logo de l'école" en="School logo" />}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="ek-btn ek-btn-outline"
              style={{ height: 38, fontSize: 13, opacity: uploading ? 0.6 : 1 }}
            >
              <Icon name="upload" size={14} />
              {uploading ? "Téléversement…" : logoUrl ? "Changer le logo" : "Téléverser depuis l'appareil"}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl("")}
                className="ek-btn ek-btn-outline"
                style={{ height: 38, fontSize: 13, color: "var(--danger)" }}
              >
                <Icon name="trash" size={13} /> Retirer
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickLogo} style={{ display: "none" }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
            <T fr="PNG, JPG ou SVG depuis votre téléphone ou ordinateur (max 2 Mo)." en="PNG, JPG or SVG from your phone or computer (max 2 MB)." />
          </div>
        </Row>

        {msg && (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background: msg.kind === "ok" ? "var(--accent-100)" : "rgba(192,58,43,0.10)",
              color: msg.kind === "ok" ? "var(--accent)" : "var(--danger)",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {msg.kind === "ok" ? "✓" : "⚠"} {msg.text}
          </div>
        )}

        <div style={{ marginTop: 6 }}>
          <button onClick={save} disabled={pending} className="ek-btn ek-btn-primary" style={{ opacity: pending ? 0.6 : 1 }}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 13,
  width: "100%",
};
