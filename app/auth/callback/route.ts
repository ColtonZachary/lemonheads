import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { resolvePostAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { getAppBaseUrl } from "@/lib/app-url";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");

  const origin = getAppBaseUrl() || new URL(request.url).origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseRouteHandlerClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = await resolvePostAuthRedirect(supabase, requestedNext);
      return NextResponse.redirect(`${origin}${destination}`);
    }
    console.error("[auth/callback]", error.message);
  } catch (err) {
    console.error("[auth/callback]", err);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
