import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // No-op if Supabase isn't configured (demo mode).
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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
    path.startsWith("/settings");
  const isTeacherRoute = path.startsWith("/teacher");

  // Gate : ces routes demandent une session.
  if ((isAdminRoute || isTeacherRoute) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Cross-role : prof qui essaye /admin → renvoyé sur /teacher, et inversement.
  if (user && (isAdminRoute || isTeacherRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = profile?.role;

    if (isAdminRoute && role && role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "teacher" ? "/teacher/dashboard" : "/login";
      return NextResponse.redirect(url);
    }
    if (isTeacherRoute && role && role !== "teacher" && role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
