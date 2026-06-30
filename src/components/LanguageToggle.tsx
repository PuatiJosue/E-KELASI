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
    <div className="ek-seg" style={{ opacity: pending ? 0.6 : 1 }}>
      {(["fr", "en"] as const).map((l) => {
        const on = current === l;
        return (
          <button key={l} className={on ? "on" : ""} onClick={() => set(l)}>
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
