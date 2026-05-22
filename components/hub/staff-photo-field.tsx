const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

export function StaffPhotoField({
  currentUrl,
  optional = true,
}: {
  currentUrl?: string | null;
  /** When false, photo is required on create. */
  optional?: boolean;
}) {
  return (
    <label className="block sm:col-span-2">
      <span className={labelClass}>
        Headshot{optional ? " (optional)" : " *"}
      </span>
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt=""
            className="size-12 shrink-0 rounded-full border border-y/25 object-cover object-top"
          />
        ) : null}
        <input
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required={!optional && !currentUrl}
          className="min-w-0 flex-1 cursor-pointer font-mono text-[10px] text-text/50 file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-y/15 file:px-2 file:py-1 file:text-[9px] file:uppercase file:text-y"
        />
      </div>
      <p className="mt-1 font-mono text-[9px] text-text/35">
        Team page & booking picker · square · 10 MB max
      </p>
    </label>
  );
}
