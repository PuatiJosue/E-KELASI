"use client";

import { createContext, useContext, type ReactNode } from "react";

export type Lang = "fr" | "en";

const LangCtx = createContext<Lang>("fr");

export function LangProvider({ value, children }: { value: Lang; children: ReactNode }) {
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang(): Lang {
  return useContext(LangCtx);
}

export function T({ fr, en }: { fr: ReactNode; en: ReactNode }) {
  const lang = useLang();
  return <>{lang === "en" ? en : fr}</>;
}
