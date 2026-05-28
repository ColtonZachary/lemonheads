import { DetailJobProgressBadge } from "@/components/hub/detail-job-progress-badge";
import type { BookingJobPhotoView } from "@/lib/hub/booking-job-photos";

const PHASE_LABELS = { before: "Before", after: "After" } as const;

function PhotoGrid({ photos, label }: { photos: BookingJobPhotoView[]; label: string }) {
  if (!photos.length) {
    return (
      <p className="font-mono text-xs text-text/40">
        No {label.toLowerCase()} photos yet.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-text/45">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-md border border-white/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={`${label} job photo`}
              className="h-24 w-24 object-cover transition-opacity hover:opacity-90"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

export function BookingJobPhotosSection({
  photos,
  detailPhase,
  status,
}: {
  photos: BookingJobPhotoView[];
  detailPhase?: string | null;
  status: string;
}) {
  const before = photos.filter((p) => p.phase === "before");
  const after = photos.filter((p) => p.phase === "after");

  return (
    <section className="rounded-md border border-white/10 bg-card2/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          Detailer photos
        </h2>
        <DetailJobProgressBadge status={status} detailPhase={detailPhase} size="sm" />
      </div>
      <p className="mt-2 text-xs text-text/45">
        Uploaded from the employee app. Before photos are required before marking finished;
        after photos before the checklist.
      </p>
      <div className="mt-4 space-y-4">
        <PhotoGrid photos={before} label={PHASE_LABELS.before} />
        <PhotoGrid photos={after} label={PHASE_LABELS.after} />
      </div>
    </section>
  );
}
