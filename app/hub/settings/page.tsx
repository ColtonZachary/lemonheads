import Link from "next/link";

import { requireHubAccess } from "@/lib/auth/require-hub";

const settingsLinks = [
  {
    href: "/hub/settings/rules",
    title: "Rules",
    description: "Blackout dates and same-day booking cutoff (Central time)",
    done: true,
  },
  {
    href: "/hub/settings/coverage",
    title: "Service areas",
    description: "ZIP prefixes and city names we service for mobile bookings",
    done: true,
  },
  {
    href: "/hub/settings/appearance",
    title: "Hub colors",
    description: "Accent, backgrounds, text, and borders for your hub view",
    done: true,
  },
] as const;

export default async function HubSettingsPage() {
  await requireHubAccess({ managerOnly: true });

  return (
    <div>
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">SETTINGS</h1>
      <p className="mt-2 font-mono text-xs tracking-[0.08em] text-text/40">
        Configure scheduling one section at a time
      </p>

      <ul className="mt-10 max-w-xl space-y-4">
        {settingsLinks.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`block rounded-md border px-5 py-4 transition-colors ${
                item.done
                  ? "border-white/10 hover:border-y/25 hover:bg-white/[0.02]"
                  : "border-white/5 opacity-50 pointer-events-none"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm uppercase tracking-[0.1em] text-y/90">
                  {item.title}
                </span>
                {item.done ? (
                  <span className="font-mono text-[9px] text-y/50">Open →</span>
                ) : (
                  <span className="font-mono text-[9px] text-text/30">Coming next</span>
                )}
              </div>
              <p className="mt-2 text-sm text-text/50">{item.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
