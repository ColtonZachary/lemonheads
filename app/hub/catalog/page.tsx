import Link from "next/link";

import { requireHubAccess } from "@/lib/auth/require-hub";

const catalogLinks = [
  {
    href: "/hub/catalog/packages",
    title: "Packages",
    description: "Service packages, features, duration, and per-vehicle pricing",
  },
  {
    href: "/hub/catalog/addons",
    title: "Add-ons",
    description: "Optional extras shown on booking and pricing pages",
  },
  {
    href: "/hub/catalog/locations",
    title: "Location types",
    description: "Where we can perform the service (driveway, garage, etc.)",
  },
] as const;

export default async function HubCatalogPage() {
  await requireHubAccess({ managerOnly: true });

  return (
    <div>
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">CATALOG</h1>
      <p className="mt-2 max-w-2xl text-sm text-text/45">
        Packages, add-ons, and location types used on the website and in hub bookings.
        Active items appear on the homepage and <code className="text-y/60">/book</code> after
        you deploy (or refresh locally).
      </p>

      <ul className="mt-10 max-w-xl space-y-4">
        {catalogLinks.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-md border border-white/10 px-5 py-4 transition-colors hover:border-y/25 hover:bg-white/[0.02]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm uppercase tracking-[0.1em] text-y/90">
                  {item.title}
                </span>
                <span className="font-mono text-[9px] text-y/50">Open →</span>
              </div>
              <p className="mt-2 text-sm text-text/50">{item.description}</p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 font-mono text-[10px] text-text/35">
        Empty tables? Run <code className="text-y/60">npm run hub:seed</code> once from the
        project root.
      </p>
    </div>
  );
}
