import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getProfile, type Profile } from "@/lib/auth/profile";
import { fetchDetailerNameForProfile } from "@/lib/hub/week-calendar-data";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export type EmployeeApiContext = {
  supabase: SupabaseClient;
  profile: Profile;
  detailerName: string;
  userId: string;
};

function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

/** Authenticated detailer session for mobile employee API routes. */
export async function requireEmployeeApi(
  request: Request,
): Promise<EmployeeApiContext | Response> {
  const token = bearerToken(request);
  if (!token) {
    return Response.json({ error: "Missing authorization" }, { status: 401 });
  }

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    return Response.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const authClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user) {
    return Response.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const profile = await getProfile(supabase, user.id);
  if (!profile) {
    return Response.json(
      { error: "Hub profile not found. Ask a manager to invite you." },
      { status: 403 },
    );
  }

  if (profile.role !== "detailer") {
    return Response.json(
      { error: "This app is for detailers. Managers use the hub on the web." },
      { status: 403 },
    );
  }

  const detailerName = await fetchDetailerNameForProfile(supabase, user.id);
  if (!detailerName) {
    return Response.json(
      {
        error:
          "Your login is not linked to a staff member. Ask a manager to link your hub profile.",
      },
      { status: 403 },
    );
  }

  return { supabase, profile, detailerName, userId: user.id };
}

export function isEmployeeApiError(
  result: EmployeeApiContext | Response,
): result is Response {
  return result instanceof Response;
}
