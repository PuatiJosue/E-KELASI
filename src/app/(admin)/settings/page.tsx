import { PageHeader } from "@/components/KPI";
import { ProfileAvatarUploader } from "@/components/ProfileAvatarUploader";
import { ProfileEditForm } from "./ProfileEditForm";
import { T } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  school_admin: "Direction",
  teacher: "Professeur",
};

async function getMyProfile() {
  if (!isLiveMode()) return { name: "Super Admin", email: "admin@ekelasi.demo", role: "super_admin", avatarUrl: null };
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;
  return { name: data.full_name, email: data.email, role: data.role, avatarUrl: data.avatar_url };
}

export default async function SettingsPage() {
  const me = await getMyProfile();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <PageHeader
        title={{ fr: "Paramètres", en: "Settings" }}
        sub={{ fr: "Ton profil et ton compte.", en: "Your profile and account." }}
      />

      <div className="ek-card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
        <ProfileAvatarUploader currentUrl={me?.avatarUrl ?? null} name={me?.name ?? "?"} size={72} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>
            <T fr="MON PROFIL" en="MY PROFILE" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)", marginTop: 4 }}>
            {me?.name ?? "—"}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>{me?.email ?? ""}</div>
        </div>
      </div>

      <div className="ek-card" style={{ padding: 20 }}>
        <ProfileEditForm initialName={me?.name ?? ""} initialEmail={me?.email ?? ""} />
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 12 }}>
          <T fr="Rôle" en="Role" /> : {ROLE_LABELS[me?.role ?? ""] ?? me?.role ?? "—"}
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5 }}>
        <T
          fr="Astuce : clique sur ta photo pour la changer. Pour modifier ton mot de passe, déconnecte-toi puis utilise « Mot de passe oublié »."
          en="Tip: click your photo to change it. To change your password, sign out and use “Forgot password”."
        />
      </div>
    </div>
  );
}
