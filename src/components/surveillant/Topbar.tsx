"use client";

import { Icon } from "@/components/Icon";
import { T, useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MobileMenuButton } from "@/components/Shell";

export function SurveillantTopbar({ schoolName }: { schoolName?: string | null }) {
  const lang = useLang();

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
      <div className="ek-hide-mobile" style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 700 }}>
          {schoolName || <T fr="Surveillance" en="Supervision" />}
        </span>
        <Icon name="chevR" size={13} color="var(--ink-4)" />
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-3)" }}>
          <T fr="Présences des élèves" en="Student attendance" />
        </span>
      </div>

      <div style={{ flex: 1 }} />
      <LanguageToggle current={lang} />
    </div>
  );
}
