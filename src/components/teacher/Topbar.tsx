"use client";

import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T, useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MobileMenuButton } from "@/components/Shell";
import { SearchBox } from "@/components/SearchBox";
import { searchTeacher } from "@/app/(teacher)/teacher/search-actions";

const LABELS: Record<string, { fr: string; en: string }> = {
  dashboard: { fr: "Tableau de bord", en: "Dashboard" },
  classes:   { fr: "Mes classes",     en: "My classes" },
  grades:    { fr: "Saisie notes", en: "Enter grades" },
  history:   { fr: "Historique des notes", en: "Grade history" },
  journal:   { fr: "Journal de bord", en: "Class logbook" },
  homework:  { fr: "Devoirs",         en: "Homework" },
  library:   { fr: "Bibliothèque",    en: "Library" },
  profile:   { fr: "Mon profil",      en: "My profile" },
  settings:  { fr: "Paramètres",      en: "Settings" },
};

export function TeacherTopbar() {
  const lang = useLang();
  const pathname = usePathname() ?? "";
  const parts = pathname.split("/").filter(Boolean); // ['teacher', 'grades', ...]
  const key = parts[1] ?? "dashboard";
  const label = LABELS[key] ?? LABELS.dashboard;

  return (
    <div
      style={{
        height: 60,
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
      <div className="ek-hide-mobile" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 700 }}><T fr="Enseignement" en="Teaching" /></span>
        <Icon name="chevR" size={13} color="var(--ink-4)" />
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-3)" }}>
          <T fr={label.fr} en={label.en} />
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
        <div className="ek-hide-mobile" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <SearchBox action={searchTeacher} placeholder="Rechercher une classe, un élève…" />
        </div>
      </div>

      <LanguageToggle current={lang} />
    </div>
  );
}
