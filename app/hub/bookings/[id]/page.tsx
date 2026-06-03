import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingDetailAudit } from "@/components/hub/booking-detail-audit";
import { BookingDetailForm } from "@/components/hub/booking-detail-form";
import { BookingDetailProgress } from "@/components/hub/booking-detail-progress";
import { BookingJobPhotosSection } from "@/components/hub/booking-job-photos-section";
import { DetailJobProgressBadge } from "@/components/hub/detail-job-progress-badge";
import { fetchPublicCatalog } from "@/lib/catalog/public-catalog";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchBookableDetailerNames } from "@/lib/bookings/bookable-detailers";
import { listBookingJobPhotos } from "@/lib/hub/booking-job-photos";
import { fetchHubBookingDetail } from "@/lib/hub/fetch-booking-detail";
import { formatCentralDateTime } from "@/lib/hub/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function bookingStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default";
  if (status === "cancelled") return "destructive";
  if (status === "in_progress" || status === "confirmed") return "secondary";
  return "outline";
}

export default async function HubBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireHubAccess({ managerOnly: true });
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const booking = await fetchHubBookingDetail(supabase!, id);
  if (!booking) notFound();

  const [detailerNames, jobPhotos, paidInvoice, catalog] = await Promise.all([
    fetchBookableDetailerNames(supabase!),
    listBookingJobPhotos(supabase!, id),
    supabase!
      .from("invoices")
      .select("id")
      .eq("booking_id", id)
      .eq("status", "paid")
      .maybeSingle(),
    fetchPublicCatalog(supabase!),
  ]);

  const lineItemsLocked = Boolean(booking.billed_at) || Boolean(paidInvoice.data);

  const { data: audit } = await supabase!
    .from("booking_audit_log")
    .select("id, action, changes, created_at, profiles(full_name, email)")
    .eq("booking_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const subtitle = `${formatCentralDateTime(booking.starts_at)} Central`;
  const phase = booking.detail_phase as string | undefined;

  const auditRows = (audit ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    created_at: row.created_at,
    profiles: row.profiles as {
      full_name?: string | null;
      email?: string | null;
    } | null,
  }));

  return (
    <div className="pb-8">
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-8 md:px-8">
        <Link
          href="/hub/calendar"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
        >
          ← Calendar
        </Link>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl tracking-[0.04em] text-primary md:text-4xl">
              {booking.reference_id}
            </h1>
            <p
              className={cn(
                "mt-1 font-mono text-xs text-muted-foreground",
                booking.deleted_at && "text-destructive",
              )}
            >
              {subtitle}
              {booking.deleted_at ? " · deleted" : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge
              variant={bookingStatusBadgeVariant(booking.status)}
              className="font-mono text-[10px] uppercase"
            >
              {booking.status}
            </Badge>
            <DetailJobProgressBadge
              status={booking.status}
              detailPhase={phase}
            />
            {booking.billed_at ? (
              <Badge variant="outline" className="font-mono text-[10px] uppercase">
                Billed
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <BookingDetailProgress
          status={booking.status}
          detailPhase={phase}
          detailEnRouteAt={booking.detail_en_route_at}
          detailArrivedAt={booking.detail_arrived_at}
          detailFinishedAt={booking.detail_finished_at}
          detailChecklistCompletedAt={booking.detail_checklist_completed_at}
        />
        <BookingJobPhotosSection photos={jobPhotos} />
      </div>

      <div className="mt-4">
        <BookingDetailForm
          booking={booking}
          detailerNames={detailerNames}
          catalogAddons={catalog.addons}
          packageAddonBlocks={catalog.packageAddonBlocks}
          lineItemsLocked={lineItemsLocked}
        />
      </div>

      <div className="mt-6">
        <BookingDetailAudit rows={auditRows} />
      </div>
    </div>
  );
}
