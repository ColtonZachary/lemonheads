import { cn } from "@/lib/utils";

export type ServiceAreaOption = {
  slug: string;
  label: string;
};

export function StaffServiceAreasField({
  areas,
  allowedSlugs,
  compact,
}: {
  areas: ServiceAreaOption[];
  allowedSlugs: string[];
  compact?: boolean;
}) {
  if (!areas.length) return null;

  return (
    <details className={cn(compact ? "mt-2" : "mt-4 border-t border-white/10 pt-4")}>
      <summary className="cursor-pointer list-none font-mono text-[9px] uppercase tracking-[0.12em] text-text/45 hover:text-y [&::-webkit-details-marker]:hidden">
        Service areas
        {allowedSlugs.length > 0 ? (
          <span className="ml-2 text-y/70">
            {allowedSlugs.length} of {areas.length}
          </span>
        ) : (
          <span className="ml-2 text-text/35">all areas</span>
        )}
      </summary>
      <p className="mt-2 text-[10px] leading-snug text-text/35">
        When checked, this detailer can only be scheduled in those areas (public
        booking and hub). Leave all unchecked to allow every area.
      </p>
      <div
        className={cn(
          "mt-2 grid gap-1.5",
          compact ? "grid-cols-2 sm:grid-cols-3" : "gap-2 sm:grid-cols-2",
        )}
      >
        {areas.map((area) => (
          <label
            key={area.slug}
            className="flex cursor-pointer items-center gap-2 rounded border border-white/10 px-2 py-1.5 text-xs hover:border-white/20"
          >
            <input
              type="checkbox"
              name="allowed_service_area_slugs"
              value={area.slug}
              defaultChecked={allowedSlugs.includes(area.slug)}
              className="size-3.5 shrink-0"
            />
            <span className="truncate">{area.label}</span>
          </label>
        ))}
      </div>
    </details>
  );
}
