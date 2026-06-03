import type { CatalogAddonRow } from "@/lib/hub/catalog-db";
import type { AddonCategory } from "@/lib/bookings/package-addon-blocks";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<AddonCategory, string> = {
  interior: "Interior add-ons",
  exterior: "Exterior add-ons",
  general: "Other add-ons",
};

const CATEGORY_ORDER: AddonCategory[] = ["interior", "exterior", "general"];

function groupAddonsByCategory(addons: CatalogAddonRow[]) {
  const groups = new Map<AddonCategory, CatalogAddonRow[]>();
  for (const category of CATEGORY_ORDER) {
    groups.set(category, []);
  }
  for (const addon of addons) {
    const category = addon.category ?? "general";
    const list = groups.get(category) ?? [];
    list.push(addon);
    groups.set(category, list);
  }
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    addons: groups.get(category) ?? [],
  })).filter((group) => group.addons.length > 0);
}

export function PackageAddonBlocksField({
  packageKey,
  addons,
  blockedNames,
}: {
  packageKey: string;
  addons: CatalogAddonRow[];
  blockedNames: string[];
}) {
  if (!addons.length) return null;

  const groups = groupAddonsByCategory(addons);

  return (
    <details className="mt-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2">
      <summary className="cursor-pointer list-none font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground [&::-webkit-details-marker]:hidden">
        Block add-ons for this package
        {blockedNames.length > 0 ? (
          <span className="ml-2 text-primary">{blockedNames.length} blocked</span>
        ) : null}
      </summary>
      <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
        Checked add-ons cannot be selected when booking this package on the website,
        customer app, or hub.
      </p>
      <div className="mt-3 space-y-3">
        {groups.map((group) => (
          <div key={group.category}>
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
              {group.label}
            </p>
            <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
              {group.addons.map((addon) => (
                <label
                  key={addon.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs hover:border-primary/25",
                    !addon.active && "opacity-60",
                  )}
                >
                  <input
                    type="checkbox"
                    name="blocked_addon_names"
                    value={addon.name}
                    defaultChecked={blockedNames.includes(addon.name)}
                    className="size-3.5 shrink-0"
                  />
                  <span className="truncate">{addon.name}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <input type="hidden" name="package_key_for_addon_blocks" value={packageKey} />
    </details>
  );
}
