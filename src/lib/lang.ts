import { cookies } from "next/headers";
import type { Lang } from "./i18n";

export const LANG_COOKIE = "ek-lang";

/** Lecture côté serveur de la langue choisie (défaut: fr). */
export function getLang(): Lang {
  const c = cookies().get(LANG_COOKIE)?.value;
  return c === "en" ? "en" : "fr";
}
