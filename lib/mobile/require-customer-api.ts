import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getProfile } from "@/lib/auth/profile";
import { linkCustomerAuthUser } from "@/lib/loyalty/link-customer";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export type CustomerRecord = {
  id: string;
  display_name: string;
  email: string;
  phone: string;
  points_balance: number;
};

export type CustomerApiContext = {
  supabase: SupabaseClient;
  userId: string;
  customer: CustomerRecord;
};

function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

/** Authenticated customer session for mobile customer API routes. */
export async function requireCustomerApi(
  request: Request,
): Promise<CustomerApiContext | Response> {
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

  await linkCustomerAuthUser(supabase);

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, display_name, email, phone, points_balance")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (customerError) {
    console.error("[mobile customer me]", customerError.message);
    return Response.json({ error: "Could not load customer profile" }, { status: 500 });
  }

  if (customer) {
    return {
      supabase,
      userId: user.id,
      customer: customer as CustomerRecord,
    };
  }

  const profile = await getProfile(supabase, user.id);
  if (profile) {
    return Response.json(
      {
        error:
          "This login is for staff (hub/employee app). Sign in with the email from your booking for rewards and bookings.",
      },
      { status: 403 },
    );
  }

  return Response.json(
    {
      error:
        "No customer account for this email yet. Book on the website first, then sign in with the same email.",
    },
    { status: 403 },
  );
}

export function isCustomerApiError(
  result: CustomerApiContext | Response,
): result is Response {
  return result instanceof Response;
}
