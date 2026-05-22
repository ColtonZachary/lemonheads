import type { SitePackage } from "@/lib/catalog/public-catalog";

const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

export function StaffPackageBlocksField({
  packages,
  blockedKeys,
}: {
  packages: SitePackage[];
  blockedKeys: string[];
}) {
  if (!packages.length) return null;

  return (
    <fieldset className="mt-4 border-t border-white/10 pt-4">
      <legend className={labelClass}>
        Block packages (public booking only)
      </legend>
      <p className="mt-1 font-mono text-[9px] leading-relaxed text-text/35">
        Customers cannot choose this detailer for checked services. Managers can
        still assign them in the hub calendar.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {packages.map((pkg) => (
          <label
            key={pkg.key}
            className="flex cursor-pointer items-start gap-2 rounded border border-white/10 px-3 py-2 text-sm hover:border-white/20"
          >
            <input
              type="checkbox"
              name="blocked_package_keys"
              value={pkg.key}
              defaultChecked={blockedKeys.includes(pkg.key)}
              className="mt-0.5 size-4"
            />
            <span>
              {pkg.name}
              <span className="ml-1 font-mono text-[10px] text-text/40">
                {pkg.key}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
