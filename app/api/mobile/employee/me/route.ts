import { isEmployeeApiError, requireEmployeeApi } from "@/lib/mobile/require-employee-api";

export async function GET(request: Request) {
  const ctx = await requireEmployeeApi(request);
  if (isEmployeeApiError(ctx)) return ctx;

  return Response.json({
    profile: {
      id: ctx.profile.id,
      full_name: ctx.profile.full_name,
      email: ctx.profile.email,
      role: ctx.profile.role,
    },
    detailerName: ctx.detailerName,
  });
}
