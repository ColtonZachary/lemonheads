import type { SitePackage } from "@/lib/catalog/public-catalog";
import { cn } from "@/lib/utils";

export function StaffPackageBlocksField({
  packages,
  blockedKeys,
  compact,
}: {
  packages: SitePackage[];
  blockedKeys: string[];
  compact?: boolean;
}) {
  if (!packages.length) return null;

  return (
    <details className={cn(compact ? "mt-2" : "mt-4 border-t border-white/10 pt-4")}>
      <summary className="cursor-pointer list-none font-mono text-[9px] uppercase tracking-[0.12em] text-text/45 hover:text-y [&::-webkit-details-marker]:hidden">
        Block packages (public booking)
        {blockedKeys.length > 0 ? (
          <span className="ml-2 text-y/70">{blockedKeys.length} blocked</span>
        ) : null}
      </summary>
      <p className="mt-2 text-[10px] leading-snug text-text/35">
        Customers cannot pick this detailer for checked services; hub booking is
        unaffected.
      </p>
      <div
        className={cn(
          "mt-2 grid gap-1.5",
          compact ? "grid-cols-2 sm:grid-cols-3" : "gap-2 sm:grid-cols-2",
        )}
      >
        {packages.map((pkg) => (
          <label
            key={pkg.key}
            className="flex cursor-pointer items-center gap-2 rounded border border-white/10 px-2 py-1.5 text-xs hover:border-white/20"
          >
            <input
              type="checkbox"
              name="blocked_package_keys"
              value={pkg.key}
              defaultChecked={blockedKeys.includes(pkg.key)}
              className="size-3.5 shrink-0"
            />
            <span className="truncate">{pkg.name}</span>
          </label>
        ))}
      </div>
    </details>
  );
}
