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
      {currentUrl ? (
        <div className="mt-2 mb-3 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUrl}
            alt=""
            className="size-20 rounded-full border-2 border-y/25 object-cover object-top"
          />
          <span className="text-xs text-text/45">
            Choose a new file below to replace this photo.
          </span>
        </div>
      ) : null}
      <input
        type="file"
        name="photo"
        accept="image/jpeg,image/png,image/webp,image/gif"
        required={!optional && !currentUrl}
        className="mt-1 block w-full cursor-pointer font-mono text-xs text-text/50 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-y/15 file:px-3 file:py-1.5 file:text-[10px] file:uppercase file:tracking-[0.08em] file:text-y"
      />
      <p className="mt-1.5 font-mono text-[9px] leading-relaxed text-text/35">
        Used on Meet the Team and the booking detailer picker. Square photos look
        best. JPEG, PNG, or WebP · max 10 MB.
      </p>
    </label>
  );
}
