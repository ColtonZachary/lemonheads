import { HubFormField } from "@/components/hub/hub-form";

export function StaffPhotoField({
  currentUrl,
  optional = true,
}: {
  currentUrl?: string | null;
  /** When false, photo is required on create. */
  optional?: boolean;
}) {
  return (
    <HubFormField
      label={`Headshot${optional ? " (optional)" : ""}`}
      htmlFor="staff-photo"
      className="sm:col-span-2"
      required={!optional}
    >
      <div className="flex flex-wrap items-center gap-3">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt=""
            className="size-12 shrink-0 rounded-full border border-primary/25 object-cover object-top"
          />
        ) : null}
        <input
          id="staff-photo"
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required={!optional && !currentUrl}
          className="min-w-0 flex-1 cursor-pointer font-mono text-[10px] text-muted-foreground file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-[9px] file:uppercase file:text-primary"
        />
      </div>
      <p className="mt-1 font-mono text-[9px] text-muted-foreground">
        Team page & booking picker · square · 10 MB max
      </p>
    </HubFormField>
  );
}
