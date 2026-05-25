import { createContext, useContext, type ReactNode } from "react";
import { Text, type TextProps } from "react-native";

export type Lang = "fr" | "en";
const LangCtx = createContext<Lang>("fr");

export function LangProvider({ value, children }: { value: Lang; children: ReactNode }) {
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

/** Pick the right localized string. */
export function useT() {
  const lang = useLang();
  return ({ fr, en }: { fr: string; en: string }) => (lang === "en" ? en : fr);
}

/** Inline localized text. Use inside a parent <Text> only if you don't pass props. */
export function T({ fr, en, ...rest }: { fr: string; en: string } & TextProps) {
  const lang = useLang();
  return <Text {...rest}>{lang === "en" ? en : fr}</Text>;
}

/** When you need the raw string (not wrapped in <Text>), e.g. for icon names. */
export function tStr(lang: Lang, fr: string, en: string) {
  return lang === "en" ? en : fr;
}
