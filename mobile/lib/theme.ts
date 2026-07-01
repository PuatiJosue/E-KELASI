// E-KLASS mobile theme. Mirrors web tokens.css.
// Use via useTheme() (returns light/dark based on system pref).

import { useColorScheme } from "react-native";
import { useThemePref } from "./themePref";

const LIGHT = {
  brand: "#4F66E8",
  brand600: "#3F53D8",
  brand700: "#2E3FB8",
  brand100: "#DDE3FB",
  brand50: "#EEF1FE",
  brandSoft: "rgba(79,102,232,0.10)",

  violet: "#8B5CF6",
  violetSoft: "rgba(139,92,246,0.12)",

  gold: "#F5B301",
  gold600: "#D99A00",
  goldSoft: "rgba(245,179,1,0.14)",

  accent: "#16A34A",
  accent100: "#D8F0E1",
  accent50: "#ECF8F1",

  success: "#16A34A",
  warning: "#D97706",
  danger: "#E11D48",
  info: "#4F66E8",

  bg: "#F6F7FB",
  surface: "#FFFFFF",
  surface2: "#F1F3F9",
  surface3: "#E7EAF3",
  ink: "#181C2A",
  ink2: "#4B5167",
  ink3: "#858BA0",
  ink4: "#AEB3C6",
  border: "#E9EBF3",
  borderStrong: "#D7DAE8",
  divider: "rgba(24,28,42,0.07)",

  onBrand: "#FFFFFF",
};

const DARK: typeof LIGHT = {
  brand: "#8093F2",
  brand600: "#6C81EE",
  brand700: "#5468F0",
  brand100: "#232A4A",
  brand50: "#1A1F36",
  brandSoft: "rgba(128,147,242,0.16)",

  violet: "#A78BFA",
  violetSoft: "rgba(167,139,250,0.16)",

  gold: "#F5C040",
  gold600: "#E0A91E",
  goldSoft: "rgba(245,192,64,0.16)",

  accent: "#34D27F",
  accent100: "#173527",
  accent50: "#122019",

  success: "#34D27F",
  warning: "#F0A33A",
  danger: "#F4577B",
  info: "#8093F2",

  bg: "#0E1018",
  surface: "#181B26",
  surface2: "#20242F",
  surface3: "#2A2F3C",
  ink: "#ECEEF6",
  ink2: "#AEB4C7",
  ink3: "#79809A",
  ink4: "#565D75",
  border: "#2A2E3B",
  borderStrong: "#383D4D",
  divider: "rgba(236,238,246,0.08)",

  onBrand: "#FFFFFF",
};

export const radii = { sm: 8, md: 12, lg: 16, xl: 22 };

// Bricolage Grotesque + Plus Jakarta Sans are loaded via expo-font in
// app/_layout.tsx. System sans fallback while loading.
export const fonts = {
  display: "Bricolage_700Bold",
  displayMedium: "Bricolage_600SemiBold",
  body: "PlusJakarta_500Medium",
  bodyBold: "PlusJakarta_700Bold",
  mono: "JetBrainsMono_400Regular",
};

export type Theme = typeof LIGHT;

export function useTheme(): Theme {
  const sys = useColorScheme();
  const { mode } = useThemePref();
  const effective = mode === "auto" ? sys : mode;
  return effective === "dark" ? DARK : LIGHT;
}

export const themes = { light: LIGHT, dark: DARK };
