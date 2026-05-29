import { LangProvider } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { Shell } from "@/components/Shell";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { AdminTopbar } from "@/components/admin/Topbar";
import { TweaksPanel } from "@/components/admin/TweaksPanel";
import { CommandPalette } from "@/components/admin/CommandPalette";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();

  return (
    <LangProvider value={lang}>
      <Shell sidebar={<AdminSidebar />} topbar={<AdminTopbar />} sidebarWidth={232}>
        {children}
      </Shell>
      <TweaksPanel />
      <CommandPalette />
    </LangProvider>
  );
}
