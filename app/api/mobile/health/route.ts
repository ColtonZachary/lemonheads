/** No auth — use from phone Safari to verify the app can reach the dev server. */
export async function GET() {
  return Response.json({ ok: true, service: "mobile-detail-api" });
}
