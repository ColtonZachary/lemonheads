import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { resolvePostAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { getAppBaseUrl } from "@/lib/app-url";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

function redirectToAuthFinish(origin: string, searchParams: URLSearchParams): NextResponse {
  const target = new URL("/auth/finish", origin);
  searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  return NextResponse.redirect(target);
}

/**
 * Handles invite / recovery links using token_hash (configure Supabase email template).
 * Also supports ?code= from PKCE when Supabase redirects with an authorization code.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");

  const origin = getAppBaseUrl() || new URL(request.url).origin;

  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseRouteHandlerClient(cookieStore);

    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (error) {
        console.error("[auth/confirm] verifyOtp:", error.message);
        return NextResponse.redirect(`${origin}/login?error=invite`);
      }
      const destination = await resolvePostAuthRedirect(supabase, requestedNext);
      return NextResponse.redirect(`${origin}${destination}`);
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[auth/confirm] exchangeCode:", error.message);
        return NextResponse.redirect(`${origin}/login?error=auth`);
      }
      const destination = await resolvePostAuthRedirect(supabase, requestedNext);
      return NextResponse.redirect(`${origin}${destination}`);
    }
  } catch (err) {
    console.error("[auth/confirm]", err);
  }

  // Magic links may put tokens in the URL hash — finish in the browser.
  return redirectToAuthFinish(origin, searchParams);
}
