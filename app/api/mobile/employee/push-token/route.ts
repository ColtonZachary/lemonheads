import { isEmployeeApiError, requireEmployeeApi } from "@/lib/mobile/require-employee-api";
import { getEmployeeMutationClient } from "@/lib/mobile/employee-mutation-client";

function isValidExpoPushToken(token: string): boolean {
  return token.startsWith("ExponentPushToken[") && token.endsWith("]");
}

export async function POST(request: Request) {
  const ctx = await requireEmployeeApi(request);
  if (isEmployeeApiError(ctx)) return ctx;

  let body: { token?: string; platform?: string; deviceLabel?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  if (!isValidExpoPushToken(token)) {
    return Response.json({ error: "Invalid Expo push token" }, { status: 400 });
  }

  const platform = body.platform?.trim();
  const allowedPlatforms = new Set(["ios", "android", "web"]);
  const normalizedPlatform =
    platform && allowedPlatforms.has(platform) ? platform : null;

  const admin = getEmployeeMutationClient();
  if (!admin) {
    return Response.json({ error: "Server storage is not configured" }, { status: 503 });
  }

  const { error } = await admin.from("employee_push_tokens").upsert(
    {
      profile_id: ctx.userId,
      expo_push_token: token,
      platform: normalizedPlatform,
      device_label: body.deviceLabel?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id,expo_push_token" },
  );

  if (error) {
    console.error("[mobile push-token register]", error.message);
    return Response.json({ error: "Could not save push token" }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const ctx = await requireEmployeeApi(request);
  if (isEmployeeApiError(ctx)) return ctx;

  let token: string | null = null;
  try {
    const body = (await request.json()) as { token?: string };
    token = body.token?.trim() ?? null;
  } catch {
    token = null;
  }

  const admin = getEmployeeMutationClient();
  if (!admin) {
    return Response.json({ error: "Server storage is not configured" }, { status: 503 });
  }

  let query = admin
    .from("employee_push_tokens")
    .delete()
    .eq("profile_id", ctx.userId);

  if (token) {
    query = query.eq("expo_push_token", token);
  }

  const { error } = await query;
  if (error) {
    console.error("[mobile push-token delete]", error.message);
    return Response.json({ error: "Could not remove push token" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
