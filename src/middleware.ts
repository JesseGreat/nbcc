import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminHost, isPassthroughPath } from "@/lib/hosts";
import { isAdminRole } from "@/lib/roles";

/**
 * 1. Refreshes the Supabase session cookie on every request.
 * 2. Admin subdomain: rewrites `admin.<domain>/x` → `/admin/x`; only admin roles get through.
 * 3. Main domain: `/admin/*` redirects to the admin subdomain; `/member/*` requires a MEMBER session.
 *
 * Roles here come from the JWT `app_metadata.role` (kept in sync by the server).
 * Every page and server action re-checks the role against the database, so this is
 * a first gate, not the only one.
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const adminHost = isAdminHost(host);
  const { pathname, search } = request.nextUrl;

  // Main domain must never serve the admin area.
  if (!adminHost && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const target = new URL(stripAdminPrefix(pathname) + search, adminBaseUrl(request));
    return NextResponse.redirect(target);
  }

  // On the admin host, canonical URLs have no /admin prefix.
  if (adminHost && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const url = request.nextUrl.clone();
    url.pathname = stripAdminPrefix(pathname);
    return NextResponse.redirect(url);
  }

  const rewriteToAdmin = adminHost && !isPassthroughPath(pathname);
  const rewriteUrl = rewriteToAdmin ? adminRewriteUrl(request) : null;

  let response = rewriteUrl ? NextResponse.rewrite(rewriteUrl) : NextResponse.next({ request });

  // Without Supabase configured (e.g. first run), skip auth so public pages still render.
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
          response = rewriteUrl ? NextResponse.rewrite(rewriteUrl, { request }) : NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Do not put code between createServerClient and getUser (session refresh relies on it).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = (user?.app_metadata?.role as string | undefined) ?? null;

  if (rewriteToAdmin) {
    if (!user) return redirectWithCookies(request, response, "/login", pathname);
    if (!isAdminRole(role)) return redirectWithCookies(request, response, "/login?error=not_admin");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (pathname === "/member" || pathname.startsWith("/member/")) {
    // Keep the query (e.g. Paystack ?reference=) so the user lands back where they were.
    if (!user) return redirectWithCookies(request, response, "/login", pathname + search);
    if (isAdminRole(role)) {
      // Staff accounts live on the admin subdomain.
      return NextResponse.redirect(new URL("/", adminBaseUrl(request)));
    }
  }

  if (adminHost) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

function stripAdminPrefix(pathname: string): string {
  const stripped = pathname.replace(/^\/admin/, "");
  return stripped === "" ? "/" : stripped;
}

function adminRewriteUrl(request: NextRequest): URL {
  const url = request.nextUrl.clone();
  url.pathname = request.nextUrl.pathname === "/" ? "/admin" : `/admin${request.nextUrl.pathname}`;
  return url;
}

function adminBaseUrl(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_ADMIN_URL) return process.env.NEXT_PUBLIC_ADMIN_URL;
  const url = request.nextUrl.clone();
  url.host = `admin.${request.headers.get("host") ?? url.host}`;
  url.pathname = "/";
  url.search = "";
  return url.origin;
}

function redirectWithCookies(request: NextRequest, from: NextResponse, path: string, next?: string) {
  const url = request.nextUrl.clone();
  const [pathname, query] = path.split("?");
  url.pathname = pathname;
  url.search = query ? `?${query}` : "";
  if (next && next !== "/") url.searchParams.set("next", next);
  const res = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
