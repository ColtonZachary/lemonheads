import type { SupabaseClient } from "@supabase/supabase-js";

import {
  customerProfileHref,
  normalizePhoneDigits,
  phoneFlexibleIlikePattern,
} from "@/lib/hub/customer-search";
import { formatCentralDate } from "@/lib/hub/format";

export type HubSearchResultKind =
  | "page"
  | "booking"
  | "customer"
  | "staff"
  | "promo"
  | "package"
  | "addon";

export type HubSearchResult = {
  id: string;
  kind: HubSearchResultKind;
  title: string;
  subtitle: string;
  href: string;
};

type HubPageEntry = {
  href: string;
  label: string;
  keywords: string[];
  managerOnly?: boolean;
};

const DETAILER_PAGES: HubPageEntry[] = [
  { href: "/hub/calendar", label: "My schedule", keywords: ["calendar", "jobs", "week"] },
  { href: "/hub/pay", label: "My pay", keywords: ["payroll", "earnings", "wages"] },
  {
    href: "/hub/settings/appearance",
    label: "Hub colors",
    keywords: ["theme", "appearance", "colors"],
  },
];

const MANAGER_PAGES: HubPageEntry[] = [
  { href: "/hub", label: "Dashboard", keywords: ["home", "overview", "stats"] },
  { href: "/hub/calendar", label: "Calendar", keywords: ["schedule", "bookings", "week"] },
  { href: "/hub/blocks", label: "Schedule blocks", keywords: ["pto", "time off", "blocks"] },
  { href: "/hub/customers", label: "Customers", keywords: ["clients", "lookup", "email", "phone"] },
  { href: "/hub/staff", label: "Staff", keywords: ["team", "detailers", "roster"] },
  { href: "/hub/catalog", label: "Catalog", keywords: ["packages", "add-ons", "pricing"] },
  {
    href: "/hub/catalog/packages",
    label: "Catalog packages",
    keywords: ["services", "pricing", "packages"],
  },
  {
    href: "/hub/catalog/addons",
    label: "Catalog add-ons",
    keywords: ["extras", "upsells", "addons"],
  },
  {
    href: "/hub/catalog/locations",
    label: "Catalog locations",
    keywords: ["service areas", "cities", "locations"],
  },
  { href: "/hub/promos", label: "Promo codes", keywords: ["discount", "coupon", "code"] },
  {
    href: "/hub/website-feedback",
    label: "Site feedback",
    keywords: ["feedback", "website", "visitor"],
  },
  { href: "/hub/reports", label: "Reports", keywords: ["analytics", "revenue", "pay"] },
  { href: "/hub/settings", label: "Settings", keywords: ["config", "rules", "preferences"] },
  {
    href: "/hub/settings/rules",
    label: "Rules & blackouts",
    keywords: ["blackout", "cutoff", "closed"],
  },
  {
    href: "/hub/settings/coverage",
    label: "Service areas",
    keywords: ["zip", "coverage", "cities"],
  },
  {
    href: "/hub/settings/pay-rates",
    label: "Pay rates",
    keywords: ["detailer pay", "rates", "wages"],
  },
  {
    href: "/hub/settings/loyalty",
    label: "Loyalty",
    keywords: ["points", "rewards", "redemptions"],
  },
  {
    href: "/hub/settings/checklist",
    label: "Detail checklist",
    keywords: ["checklist", "mobile app", "workflow"],
  },
  {
    href: "/hub/settings/appearance",
    label: "Hub colors",
    keywords: ["theme", "appearance", "colors"],
  },
  {
    href: "/hub/managers",
    label: "Hub access",
    keywords: ["users", "managers", "invite", "admin"],
    managerOnly: true,
  },
];

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

/** Quote ilike patterns for PostgREST `.or()` filter strings. */
function orIlikePattern(pattern: string): string {
  const escaped = pattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function orIlike(column: string, pattern: string): string {
  return `${column}.ilike.${orIlikePattern(pattern)}`;
}

function joinOrFilters(filters: string[]): string {
  return filters.join(",");
}

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function pageHaystack(page: HubPageEntry): string {
  return [page.label, ...page.keywords].join(" ").toLowerCase();
}

function matchesPage(page: HubPageEntry, query: string): boolean {
  const haystack = pageHaystack(page);
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every((token) => haystack.includes(token));
}

export function searchHubPages(
  query: string,
  options: { isManager: boolean; isAdmin: boolean },
): HubSearchResult[] {
  const normalized = normalizeQuery(query);
  if (normalized.length < 1) return [];

  const pages = options.isManager
    ? MANAGER_PAGES.filter((page) => !page.managerOnly || options.isAdmin)
    : DETAILER_PAGES;

  return pages
    .filter((page) => matchesPage(page, normalized))
    .slice(0, 6)
    .map((page) => ({
      id: `page:${page.href}`,
      kind: "page" as const,
      title: page.label,
      subtitle: "Go to page",
      href: page.href,
    }));
}

async function searchBookings(
  client: SupabaseClient,
  query: string,
): Promise<HubSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const pattern = `%${escapeIlike(trimmed)}%`;
  const digits = normalizePhoneDigits(trimmed);
  const looksLikeReference = /^LH-/i.test(trimmed);

  let request = client
    .from("bookings")
    .select("id, reference_id, customer_name, service_name, starts_at, status")
    .is("deleted_at", null)
    .order("starts_at", { ascending: false })
    .limit(8);

  if (looksLikeReference) {
    request = request.ilike("reference_id", pattern);
  } else if (trimmed.includes("@")) {
    request = request.or(
      joinOrFilters([
        orIlike("email", pattern),
        orIlike("customer_name", pattern),
        orIlike("reference_id", pattern),
      ]),
    );
  } else if (digits.length >= 4 && digits.length >= trimmed.replace(/\D/g, "").length) {
    const phonePat = phoneFlexibleIlikePattern(digits);
    if (phonePat) {
      request = request.or(
        joinOrFilters([
          orIlike("phone", phonePat),
          orIlike("customer_name", pattern),
          orIlike("reference_id", pattern),
          orIlike("email", pattern),
        ]),
      );
    } else {
      request = request.or(
        joinOrFilters([
          orIlike("customer_name", pattern),
          orIlike("reference_id", pattern),
          orIlike("email", pattern),
        ]),
      );
    }
  } else {
    request = request.or(
      joinOrFilters([
        orIlike("customer_name", pattern),
        orIlike("reference_id", pattern),
        orIlike("email", pattern),
        orIlike("service_name", pattern),
      ]),
    );
  }

  const { data, error } = await request;
  if (error) {
    console.error("[hub-search] bookings:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: `booking:${row.id}`,
    kind: "booking" as const,
    title: `${row.reference_id} · ${row.customer_name}`,
    subtitle: `${row.service_name} · ${formatCentralDate(row.starts_at as string)} · ${row.status}`,
    href: `/hub/bookings/${row.id}`,
  }));
}

async function searchCustomers(
  client: SupabaseClient,
  query: string,
): Promise<HubSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const pattern = `%${escapeIlike(trimmed)}%`;
  const digits = normalizePhoneDigits(trimmed);
  const isEmail = trimmed.includes("@");

  let request = client
    .from("customers")
    .select("id, display_name, email, phone, booking_count")
    .order("last_booking_at", { ascending: false, nullsFirst: false })
    .limit(6);

  if (isEmail) {
    request = request.or(
      joinOrFilters([orIlike("email", pattern), orIlike("display_name", pattern)]),
    );
  } else if (digits.length >= 4 && digits.length >= trimmed.replace(/\D/g, "").length) {
    const phonePat = phoneFlexibleIlikePattern(digits);
    if (phonePat) {
      request = request.or(
        joinOrFilters([
          orIlike("phone", phonePat),
          orIlike("display_name", pattern),
          orIlike("email", pattern),
        ]),
      );
    } else {
      request = request.or(
        joinOrFilters([
          orIlike("display_name", pattern),
          orIlike("email", pattern),
          orIlike("phone", pattern),
        ]),
      );
    }
  } else {
    request = request.or(
      joinOrFilters([
        orIlike("display_name", pattern),
        orIlike("email", pattern),
        orIlike("phone", pattern),
      ]),
    );
  }

  const { data, error } = await request;
  if (error) {
    console.error("[hub-search] customers:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const email = String(row.email ?? "").trim();
    const phone = String(row.phone ?? "").trim();
    const phoneDigits = normalizePhoneDigits(phone);
    const href =
      email || phoneDigits
        ? customerProfileHref({
            email: email.toLowerCase(),
            displayName: String(row.display_name ?? "Customer"),
            phone,
            phoneDigits,
            bookingCount: Number(row.booking_count ?? 0),
            firstBookingAt: null,
            lastBookingAt: null,
            totalSpentCents: 0,
            bookings: [],
          })
        : "/hub/customers";

    return {
      id: `customer:${row.id}`,
      kind: "customer" as const,
      title: String(row.display_name ?? "Customer"),
      subtitle: [email, phone].filter(Boolean).join(" · ") || "Customer profile",
      href,
    };
  });
}

async function searchStaff(
  client: SupabaseClient,
  query: string,
): Promise<HubSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const pattern = `%${escapeIlike(trimmed)}%`;
  const { data, error } = await client
    .from("staff_members")
    .select("id, display_name, role_label, active")
    .or(joinOrFilters([orIlike("display_name", pattern), orIlike("role_label", pattern)]))
    .order("sort_order")
    .limit(5);

  if (error) {
    console.error("[hub-search] staff:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: `staff:${row.id}`,
    kind: "staff" as const,
    title: row.display_name as string,
    subtitle: `${row.role_label}${row.active ? "" : " · inactive"}`,
    href: "/hub/staff",
  }));
}

async function searchPromos(
  client: SupabaseClient,
  query: string,
): Promise<HubSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const pattern = `%${escapeIlike(trimmed)}%`;
  const { data, error } = await client
    .from("promo_codes")
    .select("id, code, label, active")
    .or(joinOrFilters([orIlike("code", pattern), orIlike("label", pattern)]))
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[hub-search] promos:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: `promo:${row.id}`,
    kind: "promo" as const,
    title: row.code as string,
    subtitle: `${row.label}${row.active ? "" : " · inactive"}`,
    href: "/hub/promos",
  }));
}

async function searchCatalog(
  client: SupabaseClient,
  query: string,
): Promise<HubSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const pattern = `%${escapeIlike(trimmed)}%`;
  const [packagesRes, addonsRes] = await Promise.all([
    client
      .from("catalog_packages")
      .select("key, name, active")
      .or(joinOrFilters([orIlike("name", pattern), orIlike("key", pattern)]))
      .order("sort_order")
      .limit(4),
    client
      .from("catalog_addons")
      .select("id, name, active")
      .ilike("name", pattern)
      .order("sort_order")
      .limit(3),
  ]);

  if (packagesRes.error) {
    console.error("[hub-search] packages:", packagesRes.error.message);
  }
  if (addonsRes.error) {
    console.error("[hub-search] addons:", addonsRes.error.message);
  }

  const packageResults: HubSearchResult[] = (packagesRes.data ?? []).map((row) => ({
    id: `package:${row.key}`,
    kind: "package" as const,
    title: row.name as string,
    subtitle: `${row.key}${row.active ? "" : " · inactive"}`,
    href: "/hub/catalog/packages",
  }));

  const addonResults: HubSearchResult[] = (addonsRes.data ?? []).map((row) => ({
    id: `addon:${row.id}`,
    kind: "addon" as const,
    title: row.name as string,
    subtitle: row.active ? "Catalog add-on" : "Catalog add-on · inactive",
    href: "/hub/catalog/addons",
  }));

  return [...packageResults, ...addonResults];
}

function dedupeResults(results: HubSearchResult[]): HubSearchResult[] {
  const seen = new Set<string>();
  const out: HubSearchResult[] = [];
  for (const result of results) {
    const key = `${result.kind}:${result.href}:${result.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(result);
  }
  return out;
}

export async function searchHubGlobal(
  client: SupabaseClient,
  query: string,
  options: { isManager: boolean; isAdmin: boolean },
): Promise<HubSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  const pages = searchHubPages(trimmed, options);

  if (!options.isManager) {
    return pages.slice(0, 8);
  }

  const [bookings, customers, staff, promos, catalog] = await Promise.all([
    searchBookings(client, trimmed),
    searchCustomers(client, trimmed),
    searchStaff(client, trimmed),
    searchPromos(client, trimmed),
    searchCatalog(client, trimmed),
  ]);

  const merged = dedupeResults([
    ...pages,
    ...bookings,
    ...customers,
    ...staff,
    ...promos,
    ...catalog,
  ]);

  return merged.slice(0, 20);
}

export const HUB_SEARCH_KIND_LABELS: Record<HubSearchResultKind, string> = {
  page: "Page",
  booking: "Booking",
  customer: "Customer",
  staff: "Staff",
  promo: "Promo",
  package: "Package",
  addon: "Add-on",
};
