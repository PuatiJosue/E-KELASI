"use client";

import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T, useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import type { MySchool } from "@/lib/school-db";

const LABELS: Record<string, { fr: string; en: string }> = {
  overview: { fr: "Vue d'ensemble",     en: "Overview" },
  teachers: { fr: "Professeurs",        en: "Teachers" },
  students: { fr: "Élèves",             en: "Students" },
  reports:  { fr: "Bulletins",          en: "Report cards" },
  branding: { fr: "Branding école",     en: "School branding" },
  settings: { fr: "Paramètres",         en: "Settings" },
};

export function SchoolTopbar({ school }: { school: MySchool | null }) {
  const lang = useLang();
  const pathname = usePathname() ?? "";
  const key = pathname.split("/").filter(Boolean)[1] ?? "overview";
  const label = LABELS[key] ?? LABELS.overview;

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
      <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>
        {school?.name ?? "École"} <span style={{ color: "var(--ink-4)" }}>/</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
        <T fr={label.fr} en={label.en} />
      </div>
      <div style={{ flex: 1 }} />
      <LanguageToggle current={lang} />
      <button
        type="button"
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
          cursor: "pointer",
        }}
      >
        <Icon name="bell" size={16} />
      </button>
    </div>
  );
}
