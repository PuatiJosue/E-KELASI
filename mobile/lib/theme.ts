// E-KELASI mobile theme. Mirrors web tokens.css.
// Use via useTheme() (returns light/dark based on system pref).

import { useColorScheme } from "react-native";
import { useThemePref } from "./themePref";

const LIGHT = {
  brand: "#1E2F6D",
  brand600: "#172452",
  brand700: "#101A3C",
  brand100: "#D6DCEF",
  brand50: "#EEF1F9",
  brandSoft: "rgba(30,47,109,0.10)",

  gold: "#F5B301",
  gold600: "#D99A00",
  goldSoft: "rgba(245,179,1,0.14)",

  accent: "#1D6650",
  accent100: "#D6EAE0",
  accent50: "#ECF6F1",

  success: "#2D8659",
  warning: "#C28728",
  danger: "#C03A2B",
  info: "#3A6DBC",

  bg: "#FAF6EE",
  surface: "#FFFFFF",
  surface2: "#F4EFE3",
  surface3: "#ECE5D2",
  ink: "#1A1410",
  ink2: "#4A3F35",
  ink3: "#8A7C6E",
  ink4: "#B5A99A",
  border: "#ECE3D2",
  borderStrong: "#D9CCB4",
  divider: "rgba(74,63,53,0.08)",

  onBrand: "#FFFFFF",
};

const DARK: typeof LIGHT = {
  brand: "#7B91DE",
  brand600: "#6076C9",
  brand700: "#455CAE",
  brand100: "#1E2A4A",
  brand50: "#161E33",
  brandSoft: "rgba(123,145,222,0.14)",

  gold: "#F5C040",
  gold600: "#E0A91E",
  goldSoft: "rgba(245,192,64,0.16)",

  accent: "#4FA286",
  accent100: "#1F3A30",
  accent50: "#15241D",

  success: "#2D8659",
  warning: "#C28728",
  danger: "#C03A2B",
  info: "#3A6DBC",

  bg: "#14110D",
  surface: "#1E1A14",
  surface2: "#28221B",
  surface3: "#322A20",
  ink: "#F5EFE3",
  ink2: "#C7B9A8",
  ink3: "#897C6C",
  ink4: "#5C5043",
  border: "#2F2A20",
  borderStrong: "#3F382C",
  divider: "rgba(245,239,227,0.07)",

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
