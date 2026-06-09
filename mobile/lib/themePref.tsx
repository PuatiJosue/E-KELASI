// Préférence d'apparence (auto / clair / sombre), persistée dans SecureStore.
// useTheme() (lib/theme) consulte ce contexte pour décider du thème effectif.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";

export type ThemeMode = "auto" | "light" | "dark";

const KEY = "ekelasi.themeMode";

type Ctx = { mode: ThemeMode; setMode: (m: ThemeMode) => void };
const ThemePrefContext = createContext<Ctx>({ mode: "auto", setMode: () => {} });

export function useThemePref() {
  return useContext(ThemePrefContext);
}

export function ThemePrefProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("auto");

  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then((v) => {
        if (v === "light" || v === "dark" || v === "auto") setModeState(v);
      })
      .catch(() => {});
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    SecureStore.setItemAsync(KEY, m).catch(() => {});
  };

  return <ThemePrefContext.Provider value={{ mode, setMode }}>{children}</ThemePrefContext.Provider>;
}
