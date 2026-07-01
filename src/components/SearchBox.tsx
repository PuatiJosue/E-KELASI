"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

export type SearchResult = { id: string; label: string; sub?: string; kind?: string; href: string };

export function SearchBox({
  action,
  placeholder,
}: {
  action: (q: string) => Promise<SearchResult[]>;
  placeholder: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const runSearch = (val: string) => {
    setQ(val);
    if (timer.current) clearTimeout(timer.current);
    const query = val.trim();
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(() => {
      start(async () => {
        try {
          const r = await action(query);
          setResults(r);
          setOpen(true);
        } catch {
          setResults([]);
          setOpen(true);
        }
      });
    }, 250);
  };

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    setResults([]);
    router.push(href);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", maxWidth: 460 }}>
      <label className="ek-search" style={{ width: "100%" }}>
        <Icon name="search" size={16} color="var(--ink-3)" />
        <input
          value={q}
          onChange={(e) => runSearch(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          aria-label="Rechercher"
        />
        {q ? (
          <button
            type="button"
            onClick={() => { setQ(""); setResults([]); setOpen(false); }}
            aria-label="Effacer"
            style={{ border: "none", background: "transparent", color: "var(--ink-3)", cursor: "pointer", display: "flex", padding: 2 }}
          >
            <Icon name="close" size={14} />
          </button>
        ) : (
          <kbd style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", border: "1px solid var(--border)", borderRadius: 6, padding: "1px 6px", background: "var(--surface-2)" }}>⌘K</kbd>
        )}
      </label>

      {open && (
        <div
          style={{
            position: "absolute",
            top: 46,
            left: 0,
            right: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(24,28,42,0.14)",
            padding: 6,
            zIndex: 60,
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {pending && results.length === 0 ? (
            <div style={{ padding: "12px 10px", fontSize: 12.5, color: "var(--ink-3)" }}>Recherche…</div>
          ) : results.length === 0 ? (
            <div style={{ padding: "12px 10px", fontSize: 12.5, color: "var(--ink-3)" }}>Aucun résultat.</div>
          ) : (
            results.map((r) => (
              <button
                key={`${r.kind ?? ""}-${r.id}`}
                type="button"
                onClick={() => go(r.href)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  padding: "9px 10px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span className="ek-tint blue" style={{ width: 30, height: 30 }}>
                  <Icon name={r.kind === "class" ? "users" : r.kind === "note" ? "chart" : "graduation"} size={15} />
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                  {r.sub && <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)" }}>{r.sub}</span>}
                </span>
                <Icon name="chevR" size={14} color="var(--ink-4)" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
