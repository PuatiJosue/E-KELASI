"use client";

import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T, useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MobileMenuButton } from "@/components/Shell";

const LABELS: Record<string, { fr: string; en: string }> = {
  dashboard: { fr: "Tableau de bord", en: "Dashboard" },
  classes:   { fr: "Mes classes",     en: "My classes" },
  grades:    { fr: "Saisie des notes", en: "Enter grades" },
  history:   { fr: "Historique des notes", en: "Grade history" },
  journal:   { fr: "Journal de bord", en: "Class logbook" },
  homework:  { fr: "Devoirs",         en: "Homework" },
  library:   { fr: "Bibliothèque",    en: "Library" },
  messages:  { fr: "Messagerie",      en: "Inbox" },
  profile:   { fr: "Mon profil",      en: "My profile" },
  settings:  { fr: "Paramètres",      en: "Settings" },
};

export function TeacherTopbar() {
  const lang = useLang();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const parts = pathname.split("/").filter(Boolean); // ['teacher', 'grades', ...]
  const key = parts[1] ?? "dashboard";
  const label = LABELS[key] ?? LABELS.dashboard;

  return (
    <div
      style={{
        height: 56,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        flexShrink: 0,
      }}
    >
      <MobileMenuButton />
      <div className="ek-hide-mobile" style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>
        <T fr="Enseignement" en="Teaching" /> <span style={{ color: "var(--ink-4)" }}>/</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
        <T fr={label.fr} en={label.en} />
      </div>
      <div style={{ flex: 1 }} />
      <button
        type="button"
        onClick={() => router.push("/teacher/messages")}
        title="Messagerie"
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--ink-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          cursor: "pointer",
        }}
      >
        <Icon name="bell" size={16} />
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--brand)",
            border: "2px solid var(--surface)",
          }}
        />
      </button>
    </div>
  );
}
