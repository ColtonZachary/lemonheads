import { fetchPublicCatalog } from "@/lib/catalog/public-catalog";
import { createPublicReadClient } from "@/lib/supabase/public-read";

export async function GET() {
  const client = createPublicReadClient();
  if (!client) {
    return Response.json({ error: "Catalog is not configured" }, { status: 503 });
  }

  try {
    const catalog = await fetchPublicCatalog(client, { includeLocations: true });
    return Response.json({ catalog });
  } catch (err) {
    console.error("[mobile customer catalog]", err);
    return Response.json({ error: "Could not load catalog" }, { status: 500 });
  }
}
