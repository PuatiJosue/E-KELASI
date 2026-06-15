import Link from "next/link";
import { PageHeader } from "@/components/KPI";
import { ProfileAvatarUploader } from "@/components/ProfileAvatarUploader";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { SchoolContactForm } from "./SchoolContactForm";
import { SignatureForm } from "./SignatureForm";
import { T } from "@/lib/i18n";
import { getMySchool } from "@/lib/school-db";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

async function getMyProfile() {
  if (!isLiveMode()) return { name: "Direction", email: "direction@ekelasi.demo", avatarUrl: null };
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("full_name, email, avatar_url").eq("id", user.id).maybeSingle();
  if (!data) return null;
  return { name: data.full_name, email: data.email, avatarUrl: data.avatar_url };
}

export default async function SchoolSettings() {
  const [school, me] = await Promise.all([getMySchool(), getMyProfile()]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <PageHeader title={{ fr: "Paramètres", en: "Settings" }} />

      <div className="ek-card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
        <ProfileAvatarUploader currentUrl={me?.avatarUrl ?? null} name={me?.name ?? "?"} size={72} />
        <div style={{ flex: 1 }}>
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
      </div>

      <div className="ek-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
          <T fr="Aide & support" en="Help & support" />
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 8, lineHeight: 1.6 }}>
          <T fr="Un problème ou une question ? Écrivez-nous :" en="A problem or question? Email us:" />{" "}
          <a href="mailto:juniorkhonde11@gmail.com" style={{ color: "var(--brand)", fontWeight: 600 }}>
            juniorkhonde11@gmail.com
          </a>
        </div>
      </div>

      <div className="ek-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
          <T fr="École" en="School" />
        </div>
        <Row label="Nom" value={school?.name ?? "—"} />
        <Row label="Ville" value={`${school?.city ?? "—"}, ${school?.countryCode ?? ""}`} />
        <Row label="Statut" value={school?.status ?? "—"} last />
      </div>

      <div className="ek-card" style={{ padding: 20 }}>
        <SchoolContactForm
          initial={{
            commune: school?.commune ?? "",
            quartier: school?.quartier ?? "",
            address: school?.address ?? "",
            phone: school?.phone ?? "",
          }}
        />
      </div>

      <div className="ek-card" style={{ padding: 20 }}>
        <SignatureForm initialName={school?.directorName ?? ""} initialSignatureUrl={school?.signatureUrl ?? null} />
      </div>

      <div className="ek-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
          <T fr="Année scolaire" en="School year" />
        </div>
        <Row
          label="Année en cours"
          value={school?.currentYear ?? "—"}
          last
          action={
            <Link href="/school/reenrollments" className="ek-btn ek-btn-outline" style={{ height: 28, fontSize: 11 }}>
              <T fr="Gérer" en="Manage" />
            </Link>
          }
        />
      </div>
    </div>
  );
}

function Row({ label, value, last, action }: { label: string; value: React.ReactNode; last?: boolean; action?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: last ? "none" : "1px solid var(--divider)",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{label}</div>
        <div style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 600, marginTop: 2 }}>{value}</div>
      </div>
      {action}
    </div>
  );
}
