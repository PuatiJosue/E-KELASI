"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T, useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MobileMenuButton } from "@/components/Shell";
import { LogoutButton } from "@/components/LogoutButton";
import type { MySchool, SchoolRequestCounts } from "@/lib/school-db";

const LABELS: Record<string, { fr: string; en: string }> = {
  overview: { fr: "Vue d'ensemble",     en: "Overview" },
  teachers: { fr: "Professeurs",        en: "Teachers" },
  students: { fr: "Annuaire des classes", en: "Class directory" },
  classes:  { fr: "Rapport global de l'école", en: "School report" },
  reports:  { fr: "Bulletins",          en: "Report cards" },
  branding: { fr: "Branding école",     en: "School branding" },
  settings: { fr: "Paramètres",         en: "Settings" },
};

// Intervalle de rafraîchissement automatique des données (server components).
const AUTO_REFRESH_MS = 60_000;

export function SchoolTopbar({ school, pending }: { school: MySchool | null; pending?: SchoolRequestCounts }) {
  const lang = useLang();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const key = pathname.split("/").filter(Boolean)[1] ?? "overview";
  const label = LABELS[key] ?? LABELS.overview;

  const [refreshing, startTransition] = useTransition();
  const [auto, setAuto] = useState(true);

  const refresh = () => startTransition(() => router.refresh());

  // Centre de notifications (demandes en attente).
  const total = pending?.total ?? 0;
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!notifOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [notifOpen]);
  const notifItems = [
    { href: "/school/requests", count: pending?.requests ?? 0, fr: "Demandes d'ajout", en: "Add requests" },
    { href: "/school/inscriptions", count: pending?.inscriptions ?? 0, fr: "Inscriptions", en: "Admissions" },
    { href: "/school/reenrollments", count: pending?.reenrollments ?? 0, fr: "Réinscriptions", en: "Re-enrollments" },
  ];

  // Actualisation automatique : recharge les données du serveur sans perdre
  // l'état de la page (désactivable via le bouton).
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => router.refresh(), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [auto, router]);

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
        <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 700 }}>{school?.name ?? "École"}</span>
        <Icon name="chevR" size={13} color="var(--ink-4)" />
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-3)" }}>
          <T fr={label.fr} en={label.en} />
        </span>
      </div>

      {/* Recherche (présentation) — le conteneur sert aussi d'espaceur. */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
        <label className="ek-search ek-hide-mobile" style={{ width: "100%", maxWidth: 460 }}>
          <Icon name="search" size={16} color="var(--ink-3)" />
          <input placeholder="Rechercher un élève, une classe, une note…" aria-label="Rechercher" />
          <kbd
            style={{
              fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)",
              border: "1px solid var(--border)", borderRadius: 6, padding: "1px 6px", background: "var(--surface-2)",
            }}
          >
            ⌘K
          </kbd>
        </label>
      </div>

      {/* Rafraîchir maintenant + bascule auto-actualisation */}
      <button
        type="button"
        onClick={refresh}
        title={auto ? "Actualiser maintenant (auto activé)" : "Actualiser maintenant"}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          height: 34, padding: "0 10px", borderRadius: 9,
          border: "1px solid var(--border)", background: "var(--surface)",
          color: auto ? "var(--brand-600)" : "var(--ink-2)", cursor: "pointer",
          fontSize: 12, fontWeight: 600,
        }}
      >
        <Icon name="refresh" size={15} style={refreshing ? { animation: "ek-spin 0.8s linear infinite" } : undefined} />
        <span className="ek-hide-mobile"><T fr="Actualiser" en="Refresh" /></span>
      </button>
      <button
        type="button"
        onClick={() => setAuto((a) => !a)}
        title={auto ? "Désactiver l'actualisation automatique" : "Activer l'actualisation automatique"}
        style={{
          width: 34, height: 34, borderRadius: 9,
          border: `1px solid ${auto ? "var(--brand)" : "var(--border)"}`,
          background: auto ? "var(--brand-soft)" : "var(--surface)",
          color: auto ? "var(--brand-600)" : "var(--ink-3)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}
      >
        <Icon name="clock" size={15} />
      </button>

      <LanguageToggle current={lang} />

      {/* Centre de notifications : demandes en attente */}
      <div ref={notifRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setNotifOpen((o) => !o)}
          title={total > 0 ? `${total} demande(s) en attente` : "Notifications"}
          style={{
            position: "relative",
            width: 34,
            height: 34,
            borderRadius: 9,
            border: `1px solid ${total > 0 ? "var(--brand)" : "var(--border)"}`,
            background: total > 0 ? "var(--brand-soft)" : "var(--surface)",
            color: total > 0 ? "var(--brand-600)" : "var(--ink-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Icon name="bell" size={16} />
          {total > 0 && (
            <span
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                minWidth: 17,
                height: 17,
                padding: "0 4px",
                borderRadius: 9,
                background: "var(--danger)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid var(--surface)",
                lineHeight: 1,
              }}
            >
              {total > 99 ? "99+" : total}
            </span>
          )}
        </button>

        {notifOpen && (
          <div
            style={{
              position: "absolute",
              top: 42,
              right: 0,
              width: 268,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
              padding: 6,
              zIndex: 50,
            }}
          >
            <div style={{ padding: "8px 10px 6px", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <T fr="Demandes en attente" en="Pending requests" />
            </div>
            {total === 0 ? (
              <div style={{ padding: "12px 10px", fontSize: 12.5, color: "var(--ink-3)" }}>
                <T fr="Aucune nouvelle demande." en="No new request." />
              </div>
            ) : (
              notifItems.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setNotifOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 10px",
                    borderRadius: 8,
                    color: it.count > 0 ? "var(--ink)" : "var(--ink-3)",
                    fontSize: 13,
                    fontWeight: it.count > 0 ? 600 : 500,
                  }}
                >
                  <span style={{ flex: 1 }}><T fr={it.fr} en={it.en} /></span>
                  {it.count > 0 && (
                    <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, background: "var(--danger)", color: "#fff", fontSize: 10.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                      {it.count > 99 ? "99+" : it.count}
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>
        )}
      </div>
      <span className="ek-hide-mobile" style={{ display: "flex" }}>
        <LogoutButton label="Déconnexion" />
      </span>
    </div>
  );
}
