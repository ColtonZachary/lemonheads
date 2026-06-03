import type { AddOn } from "@/lib/data";
import type { PackageAddonBlocksMap } from "@/lib/bookings/package-addon-blocks";
import {
  getBlockedAddonNamesForPackage,
  isAddonBlockedForPackage,
} from "@/lib/bookings/package-addon-blocks";
import { cn } from "@/lib/utils";

export function HubAddonCheckboxes({
  packageKey,
  addons,
  packageAddonBlocks,
  selectedNames,
  name = "addons",
  className,
}: {
  packageKey: string;
  addons: AddOn[];
  packageAddonBlocks: PackageAddonBlocksMap;
  selectedNames: string[];
  name?: string;
  className?: string;
}) {
  const blockedNames = getBlockedAddonNamesForPackage(
    packageAddonBlocks,
    packageKey,
  );
  const blockedSet = new Set(blockedNames);

  return (
    <div className={className}>
      {blockedNames.length > 0 ? (
        <p className="mb-2 font-mono text-[9px] leading-snug tracking-[0.06em] text-muted-foreground">
          Blocked add-ons for this package are disabled.
        </p>
      ) : null}
      {addons.map((addon) => {
        const blocked = blockedSet.has(addon.name);
        return (
          <label
            key={addon.name}
            className={cn(
              "flex items-start gap-3 rounded-md border border-border bg-card/30 px-3 py-2.5 text-sm",
              blocked
                ? "cursor-not-allowed opacity-45"
                : "cursor-pointer hover:border-primary/30",
            )}
          >
            <input
              type="checkbox"
              name={name}
              value={addon.name}
              defaultChecked={selectedNames.includes(addon.name)}
              disabled={blocked}
              className="mt-0.5 size-4 shrink-0 rounded border border-input accent-primary"
            />
            <span>
              {addon.name}
              {blocked ? (
                <span className="ml-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                  Not available
                </span>
              ) : null}
              <span className="ml-1 font-mono text-[10px] text-primary">
                +${addon.price}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function isHubAddonSelectionValid(
  packageKey: string,
  addonNames: string[],
  packageAddonBlocks: PackageAddonBlocksMap,
): boolean {
  return addonNames.every(
    (name) => !isAddonBlockedForPackage(packageAddonBlocks, packageKey, name),
  );
}
