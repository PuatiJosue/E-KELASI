"use server";

import { cookies } from "next/headers";
import { LANG_COOKIE } from "./lang";
import type { Lang } from "./i18n";

/** Change la langue (cookie 1 an). Le composant appelle router.refresh() ensuite. */
export async function setLangAction(lang: Lang) {
  cookies().set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
