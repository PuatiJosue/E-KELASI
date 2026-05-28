import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Text, type TextProps } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Lang = "fr" | "en";

const STORAGE_KEY = "ek-lang";

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
};

const LangCtx = createContext<LangContextValue>({ lang: "fr", setLang: () => {} });

export function LangProvider({ value = "fr", children }: { value?: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(value);

  // Charge la préférence stockée au démarrage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "fr" || stored === "en") setLangState(stored);
      })
      .catch(() => {});
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  };

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export const useLang = (): Lang => useContext(LangCtx).lang;
export const useSetLang = () => useContext(LangCtx).setLang;

export function useT() {
  const lang = useLang();
  return ({ fr, en }: { fr: string; en: string }) => (lang === "en" ? en : fr);
}

export function T({ fr, en, ...rest }: { fr: string; en: string } & TextProps) {
  const lang = useLang();
  return <Text {...rest}>{lang === "en" ? en : fr}</Text>;
}
