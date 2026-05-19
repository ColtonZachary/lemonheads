import { TEAM, type TeamMember } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicMediaUrl } from "@/lib/supabase/storage";

export type GalleryItem = {
  src: string;
  alt: string;
  span: string;
};

type SiteImageRow = {
  storage_path: string;
  alt_text: string;
  layout_class: string | null;
  member_slug: string | null;
};

/** Homepage gallery tiles (local /public/gallery). Used when Supabase has no gallery rows. */
export const FALLBACK_GALLERY: GalleryItem[] = [
  {
    src: "/gallery/gallery-4.webp",
    alt: "Showroom finish on a silver vehicle under studio lighting",
    span: "lg:col-span-7 lg:row-span-1 lg:h-[380px] h-[260px]",
  },
  {
    src: "/gallery/gallery-6.webp",
    alt: "Machine polishing black paint to a mirror finish",
    span: "lg:col-span-5 lg:row-span-1 lg:h-[380px] h-[260px]",
  },
  {
    src: "/gallery/gallery-2.webp",
    alt: "Headlight restoration with microfiber detailing",
    span: "lg:col-span-4 lg:h-[260px] h-[200px]",
  },
  {
    src: "/gallery/gallery-3.webp",
    alt: "Interior door panel deep clean with professional brushes",
    span: "lg:col-span-4 lg:h-[260px] h-[200px]",
  },
  {
    src: "/gallery/gallery-1.webp",
    alt: "Infotainment screen and dash interior detailing",
    span: "lg:col-span-4 lg:h-[260px] h-[200px]",
  },
];

const DEFAULT_GALLERY_SPAN = "lg:col-span-4 lg:h-[260px] h-[200px]";

/** Hero bike lives on the homepage only — never in the work gallery. */
function isGalleryBikePath(storagePath: string): boolean {
  return /(^|\/)bike\.(webp|jpg|jpeg|png)$/i.test(storagePath);
}

export function memberSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") {
    return FALLBACK_GALLERY;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return FALLBACK_GALLERY;

  const { data, error } = await supabase
    .from("site_images")
    .select("storage_path, alt_text, layout_class")
    .eq("category", "gallery")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.warn("[media] gallery fetch failed:", error.message);
    return FALLBACK_GALLERY;
  }

  const rows = (data as SiteImageRow[]).filter(
    (row) => !isGalleryBikePath(row.storage_path),
  );

  if (!rows.length) return FALLBACK_GALLERY;

  return rows.map((row) => ({
    src: getPublicMediaUrl(row.storage_path),
    alt: row.alt_text,
    span: row.layout_class ?? DEFAULT_GALLERY_SPAN,
  }));
}

async function fetchTeamPhotoUrls(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return map;

  const { data, error } = await supabase
    .from("site_images")
    .select("storage_path, member_slug")
    .eq("category", "team")
    .eq("published", true);

  if (error) {
    console.warn("[media] team photos fetch failed:", error.message);
    return map;
  }

  for (const row of (data ?? []) as SiteImageRow[]) {
    if (row.member_slug) {
      map.set(row.member_slug, getPublicMediaUrl(row.storage_path));
    }
  }
  return map;
}

/** TEAM from `lib/data.ts` with optional Supabase headshots by member slug. */
export async function getTeamMembers(): Promise<TeamMember[]> {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") {
    return TEAM.map((member) => ({ ...member }));
  }

  const photos = await fetchTeamPhotoUrls();
  return TEAM.map((member) => {
    const slug = memberSlug(member.name);
    const photo = photos.get(slug) ?? member.photo;
    return photo ? { ...member, photo } : member;
  });
}
