"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { signOutAction } from "@/app/login/signout";

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  group: "Pages" | "Actions";
  run: () => void;
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setActive(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const close = () => setOpen(false);

  const commands: Cmd[] = useMemo(
    () => [
      { id: "go-overview", label: "Vue d'ensemble",        hint: "Dashboard", icon: "pieChart",   group: "Pages",   run: () => router.push("/overview") },
      { id: "go-schools",  label: "Écoles partenaires",    hint: "Schools",   icon: "school",     group: "Pages",   run: () => router.push("/schools") },
      { id: "go-billing",  label: "Abonnements & paiements", hint: "Billing", icon: "creditcard", group: "Pages",   run: () => router.push("/billing") },
      { id: "go-payments", label: "Mobile Money",            hint: "Payments", icon: "dollar",   group: "Pages",   run: () => router.push("/payments") },
      { id: "go-support",  label: "Support & tickets",     hint: "Support",   icon: "chat",       group: "Pages",   run: () => router.push("/support") },
      { id: "go-security", label: "Sécurité & journaux",   hint: "Security",  icon: "shield",     group: "Pages",   run: () => router.push("/security") },
      { id: "go-team",     label: "Équipe E-KELASI",       hint: "Team",      icon: "users",      group: "Pages",   run: () => router.push("/team") },
      { id: "go-settings", label: "Paramètres",            hint: "Settings",  icon: "settings",   group: "Pages",   run: () => router.push("/settings") },
      { id: "act-invite",  label: "Inviter une école",     hint: "Action",    icon: "plus",       group: "Actions", run: () => router.push("/schools") },
      { id: "act-sync",    label: "Synchroniser Stripe",   hint: "Action",    icon: "refresh",    group: "Actions", run: () => router.push("/billing") },
      { id: "act-export",  label: "Exporter les logs",     hint: "Action",    icon: "download",   group: "Actions", run: () => router.push("/security") },
      { id: "act-logout",  label: "Se déconnecter",        hint: "Action",    icon: "lock",       group: "Actions", run: () => { signOutAction(); } },
    ],
    [router]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) =>
      (c.label + " " + (c.hint ?? "") + " " + c.group).toLowerCase().includes(q)
    );
  }, [query, commands]);

  useEffect(() => {
    if (active >= filtered.length) setActive(0);
  }, [filtered, active]);

  if (!open) return null;

  const groups = filtered.reduce<Record<string, Cmd[]>>((acc, c) => {
    (acc[c.group] ||= []).push(c);
    return acc;
  }, {});

  const run = (c: Cmd) => {
    c.run();
    close();
  };

  let flatIdx = -1;

  return (
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,16,10,0.45)",
        display: "grid",
        placeItems: "start center",
        paddingTop: "12vh",
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ek-card"
        style={{ width: "100%", maxWidth: 560, padding: 0, overflow: "hidden" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 16px",
            borderBottom: "1px solid var(--divider)",
          }}
        >
          <Icon name="search" size={16} style={{ color: "var(--ink-3)" }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, filtered.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === "Enter" && filtered[active]) {
                e.preventDefault();
                run(filtered[active]);
              }
            }}
            placeholder="Aller à… ou exécuter une action"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "var(--ink)",
              fontFamily: "inherit",
            }}
          />
          <span
            style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 4,
              background: "var(--surface-2)",
              color: "var(--ink-3)",
              fontWeight: 600,
            }}
          >
            ESC
          </span>
        </div>

        <div className="ek-scroll" style={{ maxHeight: 380, overflowY: "auto", padding: 6 }}>
          {filtered.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 12.5,
              }}
            >
              Aucun résultat.
            </div>
          )}
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 6 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--ink-3)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "6px 10px",
                }}
              >
                {group}
              </div>
              {items.map((c) => {
                flatIdx++;
                const on = flatIdx === active;
                return (
                  <button
                    key={c.id}
                    onMouseEnter={() => setActive(flatIdx)}
                    onClick={() => run(c)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: on ? "var(--brand-soft)" : "transparent",
                      color: on ? "var(--brand-600)" : "var(--ink)",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <Icon name={c.icon} size={15} />
                    <span style={{ flex: 1 }}>{c.label}</span>
                    {c.hint && (
                      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{c.hint}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div
          style={{
            padding: "8px 14px",
            borderTop: "1px solid var(--divider)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 10.5,
            color: "var(--ink-3)",
            fontWeight: 600,
          }}
        >
          <span>↑↓ Naviguer</span>
          <span>↵ Sélectionner</span>
          <span>⌘K Ouvrir/fermer</span>
        </div>
      </div>
    </div>
  );
}
