import { HubSection } from "@/components/hub/hub-page";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import type { BookingJobPhotoView } from "@/lib/hub/booking-job-photos";

const PHASE_LABELS = { before: "Before", after: "After" } as const;

function PhotoGrid({ photos, label }: { photos: BookingJobPhotoView[]; label: string }) {
  if (!photos.length) {
    return (
      <Empty className="min-h-0 border border-dashed border-border py-4">
        <EmptyHeader>
          <EmptyTitle className="font-mono text-[10px] uppercase tracking-wide">
            {label}
          </EmptyTitle>
          <EmptyDescription className="text-xs">
            No photos uploaded yet
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div>
      <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-md border border-border transition-opacity hover:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={`${label} job photo`}
              className="size-20 object-cover sm:size-24"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

export function BookingJobPhotosSection({
  photos,
}: {
  photos: BookingJobPhotoView[];
  detailPhase?: string | null;
  status?: string;
}) {
  const before = photos.filter((p) => p.phase === "before");
  const after = photos.filter((p) => p.phase === "after");

  return (
    <HubSection
      compact
      title="Detailer photos"
      description="Before required to finish · after before checklist"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <PhotoGrid photos={before} label={PHASE_LABELS.before} />
        <PhotoGrid photos={after} label={PHASE_LABELS.after} />
      </div>
    </HubSection>
  );
}
