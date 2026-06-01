import { LangProvider } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { Shell } from "@/components/Shell";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { AdminTopbar } from "@/components/admin/Topbar";
import { TweaksPanel } from "@/components/admin/TweaksPanel";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { createClient } from "@/lib/supabase/server";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  school_admin: "Direction",
  teacher: "Professeur",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();

  let userName = "—";
  let userRole = "Super Admin";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.full_name) userName = profile.full_name;
    if (profile?.role) userRole = ROLE_LABELS[profile.role] ?? profile.role;
  }

  return (
    <LangProvider value={lang}>
      <Shell sidebar={<AdminSidebar userName={userName} userRole={userRole} />} topbar={<AdminTopbar />} sidebarWidth={232}>
        {children}
      </Shell>
      <TweaksPanel />
      <CommandPalette />
    </LangProvider>
  );
}
