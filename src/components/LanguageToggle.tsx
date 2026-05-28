"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import { setLangAction } from "@/lib/lang-actions";

export function LanguageToggle({ current }: { current: Lang }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const set = (lang: Lang) => {
    if (lang === current) return;
    startTransition(async () => {
      await setLangAction(lang);
      router.refresh();
    });
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        padding: 2,
        borderRadius: 8,
        background: "var(--surface-2)",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {(["fr", "en"] as const).map((l) => {
        const on = current === l;
        return (
          <button
            key={l}
            onClick={() => set(l)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: on ? "var(--surface)" : "transparent",
              color: on ? "var(--ink)" : "var(--ink-3)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              cursor: "pointer",
              boxShadow: on ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
