import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { getAppBaseUrl } from "@/lib/app-url";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

/**
 * Handles invite / recovery links using token_hash (configure Supabase email template).
 * Also supports ?code= from PKCE when Supabase redirects with an authorization code.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/auth/set-password";

  const origin = getAppBaseUrl() || new URL(request.url).origin;
  const safeNext = next.startsWith("/") ? next : "/auth/set-password";

  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseRouteHandlerClient(cookieStore);

    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (error) {
        console.error("[auth/confirm] verifyOtp:", error.message);
        return NextResponse.redirect(
          `${origin}/login?error=invite`,
        );
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[auth/confirm] exchangeCode:", error.message);
        return NextResponse.redirect(`${origin}/login?error=auth`);
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  } catch (err) {
    console.error("[auth/confirm]", err);
  }

  return NextResponse.redirect(`${origin}/login?error=invite`);
}
