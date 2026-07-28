import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Fail-closed: en production, on refuse de servir des routes protégées si Supabase
  // n'est pas configuré (sinon toute l'app deviendrait accessible sans auth).
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (process.env.NODE_ENV === "production") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    // Dev/démo : on laisse passer pour pouvoir naviguer sans base.
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute =
    path.startsWith("/overview") ||
    path.startsWith("/schools") ||
    path.startsWith("/billing") ||
    path.startsWith("/payments") ||
    path.startsWith("/support") ||
    path.startsWith("/security") ||
    path.startsWith("/team") ||
    path.startsWith("/plans") ||
    path.startsWith("/year-archive") ||
    path.startsWith("/settings");
  // Attention : matcher "/teacher/" (avec slash) et pas "/teacher" tout court,
  // sinon "/teacher-signup" (page publique d'inscription prof) serait pris pour
  // une route protégée et renverrait vers /login.
  const isTeacherRoute = path === "/teacher" || path.startsWith("/teacher/");
  const isSchoolRoute = path === "/school" || path.startsWith("/school/");
  // Même précaution que pour /teacher : ne pas capturer "/surveillant-signup".
  const isSurveillantRoute = path === "/surveillant" || path.startsWith("/surveillant/");

  // Gate : ces routes demandent une session.
  if ((isAdminRoute || isTeacherRoute || isSchoolRoute || isSurveillantRoute) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Cross-role : empêche un user d'accéder à un espace qui n'est pas le sien.
  if (user && (isAdminRoute || isTeacherRoute || isSchoolRoute || isSurveillantRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = profile?.role;

    const homeByRole: Record<string, string> = {
      super_admin: "/overview",
      teacher: "/teacher/dashboard",
      school_admin: "/school/overview",
      surveillant: "/surveillant/presences",
    };

    const allowed =
      (isAdminRoute && role === "super_admin") ||
      (isTeacherRoute && (role === "teacher" || role === "super_admin")) ||
      (isSchoolRoute && (role === "school_admin" || role === "super_admin")) ||
      (isSurveillantRoute && (role === "surveillant" || role === "super_admin"));

    // Non autorisé : on redirige vers son espace s'il a un rôle, sinon vers
    // /login (comptes parents/sans rôle ne doivent jamais voir la console).
    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = role ? (homeByRole[role] ?? "/login") : "/login";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
