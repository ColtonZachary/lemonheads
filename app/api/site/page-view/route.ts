import { createClient } from "@supabase/supabase-js";

import { normalizeSitePagePath } from "@/lib/analytics/site-page-views";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return Response.json({ ok: true, skipped: true });
  }

  let body: { path?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const pagePath = normalizeSitePagePath(body.path ?? "");
  if (!pagePath) {
    return Response.json({ ok: false, error: "invalid_path" }, { status: 400 });
  }

  const supabase = createClient(getSupabaseUrl()!, getSupabaseAnonKey()!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("site_page_views").insert({
    page_path: pagePath,
  });

  if (error) {
    console.error("[site-page-view]", error.message);
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true });
}
