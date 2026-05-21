import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAppBaseUrl } from "@/lib/app-url";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/hub";
  const safeNext = next.startsWith("/") ? next : "/hub";

  const origin = getAppBaseUrl() || new URL(request.url).origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseRouteHandlerClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    console.error("[auth/callback]", error.message);
  } catch (err) {
    console.error("[auth/callback]", err);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
