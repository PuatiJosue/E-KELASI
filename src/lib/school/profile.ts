// Identité de l'école de l'utilisateur connecté + compteurs de demandes.

import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { getUnreadMessageCount } from "@/lib/messages-db";

export type MySchool = {
  id: string;
  name: string;
  slug: string;
  city: string;
  countryCode: string;
  plan: "standard" | "pro";
  status: string;
  brandColor: string | null;
  logoUrl: string | null;
  commune: string | null;
  quartier: string | null;
  address: string | null;
  phone: string | null;
  directorName: string | null;
  signatureUrl: string | null;
  currentYear: string | null;
  email: string | null;
};

export async function getMySchool(): Promise<MySchool | null> {
  if (!isLiveMode()) {
    return {
      id: "demo",
      name: "Lycée Albert-Camus",
      slug: "lycee-albert-camus",
      city: "Dakar",
      countryCode: "SN",
      plan: "pro",
      status: "active",
      brandColor: null,
      logoUrl: null,
      commune: null,
      quartier: null,
      address: null,
      phone: null,
      directorName: null,
      signatureUrl: null,
      currentYear: null,
      email: null,
    };
  }
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: staff } = await supabase
      .from("school_staff")
      .select("schools(id, name, slug, city, country_code, plan, status, brand_color, logo_url, commune, quartier, address, phone, director_name, signature_url, current_year, email)")
      .eq("user_id", user.id)
      .eq("role", "school_admin")
      .limit(1)
      .maybeSingle();
    const s = (staff as any)?.schools;
    if (!s) return null;
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      city: s.city,
      countryCode: s.country_code,
      plan: s.plan,
      status: s.status,
      brandColor: s.brand_color,
      logoUrl: s.logo_url,
      commune: s.commune,
      quartier: s.quartier,
      address: s.address,
      phone: s.phone,
      directorName: s.director_name ?? null,
      signatureUrl: s.signature_url ?? null,
      currentYear: s.current_year ?? null,
      email: s.email ?? null,
    };
  } catch {
    return null;
  }
}

export type SchoolRequestCounts = { requests: number; messages: number; inscriptions: number; reenrollments: number; total: number };

export async function getSchoolRequestCounts(): Promise<SchoolRequestCounts> {
  const zero: SchoolRequestCounts = { requests: 0, messages: 0, inscriptions: 0, reenrollments: 0, total: 0 };
  if (!isLiveMode()) return zero;
  try {
    const school = await getMySchool();
    if (!school) return zero;
    const svc: any = serviceClient();
    const pending = (table: string) =>
      svc.from(table).select("id", { count: "exact", head: true }).eq("school_id", school.id).eq("status", "pending");
    const [{ count: requests }, { count: inscriptions }, { count: reenrollments }, messages] = await Promise.all([
      pending("students"),
      pending("inscriptions"),
      pending("reenrollments"),
      getUnreadMessageCount(),
    ]);
    const r = requests ?? 0, i = inscriptions ?? 0, re = reenrollments ?? 0;
    return { requests: r, messages, inscriptions: i, reenrollments: re, total: r + i + re };
  } catch {
    return zero;
  }
}
