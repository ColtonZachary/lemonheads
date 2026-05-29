import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/** Email links often land on Site URL (/) with ?code= — forward to auth handlers. */
function redirectAuthLanding(request: NextRequest): NextResponse | null {
  const url = request.nextUrl;
  if (url.pathname.startsWith("/auth/")) return null;

  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (code || token_hash) {
    const target = new URL("/auth/finish", url.origin);
    url.searchParams.forEach((value, key) => {
      target.searchParams.set(key, value);
    });
    if (!target.searchParams.get("next")) {
      if (type === "invite" || type === "recovery") {
        target.searchParams.set("next", "/auth/set-password");
      } else {
        target.searchParams.set("next", "/rewards");
      }
    }
    return NextResponse.redirect(target);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const authRedirect = redirectAuthLanding(request);
  if (authRedirect) return authRedirect;

  // Home is public — skip auth refresh (saves a Supabase round trip on every visit).
  if (request.nextUrl.pathname === "/") {
    return NextResponse.next({ request });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/hub/:path*",
    "/login",
    "/rewards",
    "/book",
    "/auth/:path*",
  ],
};
