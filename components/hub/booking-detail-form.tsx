"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  cancelHubBooking,
  deleteHubBookingForm,
  updateHubBooking,
  type HubBookingActionState,
} from "@/app/actions/hub-bookings";
import { BookingLoyaltyRewardRemove } from "@/components/hub/booking-loyalty-reward-remove";
import { BookingPriceDisplay } from "@/components/hub/booking-price-display";
import {
  BookingUpdatePreservedFields,
  type BookingEditSection,
} from "@/components/hub/booking-update-preserved-fields";
import {
  HubFieldRow,
  HubFormField,
  HubInput,
  HubNativeSelect,
  HubTextarea,
} from "@/components/hub/hub-form";
import { HubDatePicker } from "@/components/hub/hub-date-picker";
import { HubTimeSelect } from "@/components/hub/hub-time-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { BOOKING_LOCATION_TYPES } from "@/lib/bookings/constants";
import { vehicleKeyFromTypeLabel } from "@/lib/bookings/vehicle-key-from-label";
import { ADDONS, PACKAGES, VEHICLE_OPTIONS } from "@/lib/data";
import { formatCentralDateTime } from "@/lib/hub/format";
import { centralScheduleLabels } from "@/lib/hub/schedule-labels";
import { cn } from "@/lib/utils";

const EMPTY: HubBookingActionState = { ok: false, message: "" };

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type HubBookingDetail = {
  id: string;
  reference_id: string;
  customer_name: string;
  email: string;
  phone: string;
  location_type: string;
  address_line: string;
  city: string;
  zip: string;
  service_name: string;
  service_key: string | null;
  vehicle_type: string;
  vehicle_info: string;
  addons: string[];
  plastic_shine: boolean;
  customer_notes: string;
  status: string;
  starts_at: string;
  ends_at: string;
  detailer_name: string | null;
  detailer_auto_assigned: boolean;
  price_display: string;
  price_cents: number | null;
  price_override_cents: number | null;
  estimated_price_cents: number | null;
  discount_cents: number | null;
  final_price_cents: number | null;
  promo_code_id: string | null;
  loyalty_redemption_id: string | null;
  loyalty_redemptions:
    | {
        id: string;
        status: string;
        points_spent: number;
        loyalty_reward_goals: { title: string } | { title: string }[] | null;
      }
    | {
        id: string;
        status: string;
        points_spent: number;
        loyalty_reward_goals: { title: string } | { title: string }[] | null;
      }[]
    | null;
  promo_codes: { code: string } | { code: string }[] | null;
  manager_notes: string;
  cancellation_reason: string;
  cancelled_at: string | null;
  deleted_at: string | null;
  billed_at: string | null;
  detail_phase?: string | null;
  detail_en_route_at?: string | null;
  detail_arrived_at?: string | null;
  detail_finished_at?: string | null;
  detail_checklist_completed_at?: string | null;
};

function resolvePackageKey(booking: HubBookingDetail): string {
  if (booking.service_key) return booking.service_key;
  const pkg = PACKAGES.find((p) => p.name === booking.service_name);
  return pkg?.key ?? "";
}

function ActionBanner({ state }: { state: HubBookingActionState }) {
  if (!state.message) return null;
  return (
    <Alert variant={state.ok ? "default" : "destructive"}>
      <AlertDescription className="font-mono text-xs">{state.message}</AlertDescription>
    </Alert>
  );
}

function SummaryCard({
  title,
  onEdit,
  canEdit,
  children,
  className,
}: {
  title: string;
  onEdit: () => void;
  canEdit: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/80 bg-card/40", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
          {title}
        </CardTitle>
        {canEdit ? (
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-0.5 pt-0 text-sm">{children}</CardContent>
    </Card>
  );
}

function BookingEditDialog({
  open,
  onOpenChange,
  title,
  description,
  formAction,
  section,
  preservedProps,
  updatePending,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  formAction: (payload: FormData) => void;
  section: BookingEditSection;
  preservedProps: Omit<
    React.ComponentProps<typeof BookingUpdatePreservedFields>,
    "omit"
  >;
  updatePending: boolean;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(88vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3">
          <DialogTitle className="font-mono text-xs uppercase tracking-[0.14em]">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-xs">{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
          <DialogFooter className="shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updatePending}
            >
              Close
            </Button>
            <Button type="submit" disabled={updatePending}>
              {updatePending ? "Saving…" : "Save"}
            </Button>
            <BookingUpdatePreservedFields omit={section} {...preservedProps} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BookingDetailForm({
  booking,
  detailerNames,
  lineItemsLocked,
}: {
  booking: HubBookingDetail;
  detailerNames: string[];
  lineItemsLocked?: boolean;
}) {
  const router = useRouter();
  const labels = centralScheduleLabels(booking.starts_at);
  const [dateInput, setDateInput] = useState(labels.dateInput);
  const [editSection, setEditSection] = useState<BookingEditSection | "cancel" | "delete" | null>(
    null,
  );
  const packageKey = useMemo(() => resolvePackageKey(booking), [booking]);
  const vehicleKey = useMemo(
    () => vehicleKeyFromTypeLabel(booking.vehicle_type) ?? "",
    [booking.vehicle_type],
  );
  const promoCode = Array.isArray(booking.promo_codes)
    ? booking.promo_codes[0]?.code ?? ""
    : booking.promo_codes?.code ?? "";

  const overrideDollars =
    booking.price_override_cents != null
      ? String(booking.price_override_cents / 100)
      : "";

  const [updateState, updateAction, updatePending] = useActionState(
    updateHubBooking.bind(null, booking.id),
    EMPTY,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelHubBooking.bind(null, booking.id),
    EMPTY,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteHubBookingForm.bind(null, booking.id),
    EMPTY,
  );

  useEffect(() => {
    if (deleteState.ok) router.push("/hub/calendar");
  }, [deleteState.ok, router]);

  useEffect(() => {
    if (updateState.ok) {
      setEditSection(null);
      router.refresh();
    }
  }, [updateState.ok, router]);

  const isDeleted = Boolean(booking.deleted_at);
  const isCancelled = booking.status === "cancelled";
  const isBilled = Boolean(booking.billed_at);
  const locked = lineItemsLocked || isBilled;
  const canEdit = !isDeleted && !locked;

  const loyaltyRedemption = Array.isArray(booking.loyalty_redemptions)
    ? booking.loyalty_redemptions[0]
    : booking.loyalty_redemptions;
  const loyaltyGoal = loyaltyRedemption?.loyalty_reward_goals;
  const loyaltyTitle = Array.isArray(loyaltyGoal)
    ? loyaltyGoal[0]?.title
    : loyaltyGoal?.title;
  const hasActiveReward =
    Boolean(booking.loyalty_redemption_id) &&
    loyaltyRedemption?.status !== "cancelled";

  const preservedProps = {
    booking,
    packageKey,
    vehicleKey,
    dateInput,
    timeLabel: labels.timeLabel,
    overrideDollars,
    promoCode,
    isBilled,
  };

  const detailerLabel = booking.detailer_auto_assigned
    ? "Auto-assign"
    : booking.detailer_name ?? "—";

  if (isDeleted) {
    return (
      <Alert>
        <AlertDescription className="font-mono text-xs">
          This booking was deleted. Edits are disabled.
        </AlertDescription>
      </Alert>
    );
  }

  const editDialogProps = {
    formAction: updateAction,
    preservedProps,
    updatePending,
    onOpenChange: (o: boolean) => !o && setEditSection(null),
  };

  return (
    <div className="space-y-4">
      {locked ? (
        <Alert>
          <AlertTitle className="font-mono text-[10px] uppercase tracking-[0.12em]">
            Locked for billing
          </AlertTitle>
          <AlertDescription>
            Unmark billed on the calendar before editing line items.
          </AlertDescription>
        </Alert>
      ) : null}

      <ActionBanner state={updateState} />

      <div className="grid gap-3 md:grid-cols-2">
        <SummaryCard
          title="Customer"
          canEdit={canEdit}
          onEdit={() => setEditSection("customer")}
        >
          <p className="font-medium">{booking.customer_name}</p>
          <p className="font-mono text-xs text-muted-foreground">{booking.email}</p>
          <p className="font-mono text-xs text-muted-foreground">{booking.phone}</p>
        </SummaryCard>

        <SummaryCard
          title="Service"
          canEdit={canEdit}
          onEdit={() => setEditSection("service")}
        >
          <p>{booking.service_name}</p>
          <p className="text-muted-foreground">
            {booking.vehicle_type}
            {booking.vehicle_info ? ` · ${booking.vehicle_info}` : ""}
          </p>
          {booking.addons.length > 0 ? (
            <p className="font-mono text-[10px] text-muted-foreground">
              {booking.addons.join(", ")}
            </p>
          ) : null}
          {booking.plastic_shine ? (
            <p className="font-mono text-[10px] text-primary">Plastic shine</p>
          ) : null}
        </SummaryCard>

        <SummaryCard
          title="Location"
          canEdit={canEdit}
          onEdit={() => setEditSection("location")}
          className="md:col-span-2 lg:col-span-1"
        >
          <p>
            {booking.location_type}
            {booking.address_line ? ` — ${booking.address_line}` : ""}
          </p>
          <p className="text-muted-foreground">
            {[booking.city, booking.zip].filter(Boolean).join(", ") || "—"}
          </p>
          {booking.customer_notes ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Note: {booking.customer_notes}
            </p>
          ) : null}
        </SummaryCard>

        <SummaryCard
          title="Schedule"
          canEdit={canEdit}
          onEdit={() => setEditSection("schedule")}
        >
          <p className="font-mono text-xs">
            {formatCentralDateTime(booking.starts_at)} Central
          </p>
          <p className="text-muted-foreground">
            {detailerLabel} · {booking.status}
          </p>
        </SummaryCard>

        <SummaryCard
          title="Pricing"
          canEdit={canEdit}
          onEdit={() => setEditSection("pricing")}
        >
          <BookingPriceDisplay booking={booking} />
          {promoCode ? (
            <p className="font-mono text-[10px] text-muted-foreground">
              Promo: {promoCode}
            </p>
          ) : null}
          {isBilled ? (
            <p className="font-mono text-[10px] text-primary">Billed</p>
          ) : null}
          {hasActiveReward && loyaltyTitle ? (
            <p className="font-mono text-[10px] text-muted-foreground">
              Reward: {loyaltyTitle}
            </p>
          ) : null}
        </SummaryCard>

        <SummaryCard
          title="Manager notes"
          canEdit={canEdit}
          onEdit={() => setEditSection("notes")}
          className="md:col-span-2"
        >
          <p className="text-muted-foreground">
            {booking.manager_notes.trim() || "—"}
          </p>
        </SummaryCard>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/hub/calendar">Back to calendar</Link>
        </Button>
        {!isCancelled ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setEditSection("cancel")}
          >
            Cancel booking
          </Button>
        ) : null}
        {!locked ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditSection("delete")}
          >
            Delete
          </Button>
        ) : null}
      </div>

      {/* Customer */}
      <BookingEditDialog
        open={editSection === "customer"}
        section="customer"
        title="Edit customer"
        description="Contact info on this booking"
        {...editDialogProps}
      >
          <HubFieldRow>
            <HubFormField label="Name" htmlFor="dlg_customer_name" required>
              <HubInput
                id="dlg_customer_name"
                name="customer_name"
                required
                defaultValue={booking.customer_name}
              />
            </HubFormField>
            <HubFormField label="Phone" htmlFor="dlg_phone" required>
              <HubInput
                id="dlg_phone"
                name="phone"
                type="tel"
                required
                defaultValue={booking.phone}
              />
            </HubFormField>
            <HubFormField
              label="Email"
              htmlFor="dlg_email"
              required
              className="sm:col-span-2"
            >
              <HubInput
                id="dlg_email"
                name="email"
                type="email"
                required
                defaultValue={booking.email}
              />
            </HubFormField>
          </HubFieldRow>
      </BookingEditDialog>

      {/* Service */}
      <BookingEditDialog
        open={editSection === "service"}
        section="service"
        title="Edit service"
        description="Package, vehicle, and add-ons — price recalculates on save"
        {...editDialogProps}
      >
        <HubFieldRow>
          <HubFormField label="Package" htmlFor="dlg_package_key" required>
            <HubNativeSelect
              id="dlg_package_key"
              name="package_key"
              required
              defaultValue={packageKey || undefined}
            >
              <option value="" disabled>
                Select package…
              </option>
              {PACKAGES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </HubNativeSelect>
          </HubFormField>
          <HubFormField label="Vehicle" htmlFor="dlg_vehicle_key" required>
            <HubNativeSelect
              id="dlg_vehicle_key"
              name="vehicle_key"
              required
              defaultValue={vehicleKey || undefined}
            >
              <option value="" disabled>
                Select vehicle…
              </option>
              {VEHICLE_OPTIONS.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}
                </option>
              ))}
            </HubNativeSelect>
          </HubFormField>
          <HubFormField
            label="Vehicle notes"
            htmlFor="dlg_vehicle_info"
            className="sm:col-span-2"
          >
            <HubInput
              id="dlg_vehicle_info"
              name="vehicle_info"
              defaultValue={booking.vehicle_info}
            />
          </HubFormField>
        </HubFieldRow>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {ADDONS.map((a) => (
            <label
              key={a.name}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name="addons"
                value={a.name}
                defaultChecked={booking.addons.includes(a.name)}
                className="mt-0.5 size-4 accent-primary"
              />
              <span>
                {a.name}
                <span className="ml-1 font-mono text-[10px] text-primary">
                  +${a.price}
                </span>
              </span>
            </label>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="plastic_shine"
            value="Yes"
            defaultChecked={booking.plastic_shine}
            className="size-4 accent-primary"
          />
          Plastic shine
        </label>
      </BookingEditDialog>

      {/* Location */}
      <BookingEditDialog
        open={editSection === "location"}
        section="location"
        title="Edit location"
        {...editDialogProps}
      >
        <HubFieldRow>
          <HubFormField
            label="Location type"
            htmlFor="dlg_location"
            required
            className="sm:col-span-2"
          >
            <HubNativeSelect
              id="dlg_location"
              name="location"
              required
              defaultValue={booking.location_type || undefined}
            >
              <option value="" disabled>
                Select…
              </option>
              {BOOKING_LOCATION_TYPES.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </HubNativeSelect>
          </HubFormField>
          <HubFormField
            label="Street address"
            htmlFor="dlg_address"
            className="sm:col-span-2"
          >
            <HubInput
              id="dlg_address"
              name="address"
              defaultValue={booking.address_line}
            />
          </HubFormField>
          <HubFormField label="City" htmlFor="dlg_city">
            <HubInput id="dlg_city" name="city" defaultValue={booking.city} />
          </HubFormField>
          <HubFormField label="ZIP" htmlFor="dlg_zip">
            <HubInput id="dlg_zip" name="zip" defaultValue={booking.zip} maxLength={10} />
          </HubFormField>
          <HubFormField
            label="Customer notes"
            htmlFor="dlg_customer_notes"
            className="sm:col-span-2"
          >
            <HubTextarea
              id="dlg_customer_notes"
              name="customer_notes"
              rows={2}
              defaultValue={booking.customer_notes}
            />
          </HubFormField>
        </HubFieldRow>
      </BookingEditDialog>

      {/* Schedule */}
      <BookingEditDialog
        open={editSection === "schedule"}
        section="schedule"
        title="Edit schedule"
        description="Central time · detailer availability checked on save"
        {...editDialogProps}
      >
        <div className="space-y-4">
          <HubDatePicker
            name="appointment_date"
            label="Date"
            defaultValue={labels.dateInput}
            disablePast={false}
            stacked
            onDateChange={setDateInput}
          />
          <HubTimeSelect
            dateInput={dateInput}
            name="time"
            label="Time"
            defaultValue={labels.timeLabel}
          />
          <HubFieldRow>
            <HubFormField label="Detailer" htmlFor="dlg_detailer" required>
              <HubNativeSelect
                id="dlg_detailer"
                name="detailer"
                defaultValue={
                  booking.detailer_auto_assigned
                    ? "auto"
                    : (booking.detailer_name ?? "auto")
                }
              >
                <option value="auto">Auto-assign</option>
                {[...new Set([...detailerNames, ...(booking.detailer_name ? [booking.detailer_name] : [])])].map(
                  (name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ),
                )}
              </HubNativeSelect>
            </HubFormField>
            <HubFormField label="Status" htmlFor="dlg_status" required>
              <HubNativeSelect
                id="dlg_status"
                name="status"
                defaultValue={booking.status}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </HubNativeSelect>
            </HubFormField>
          </HubFieldRow>
        </div>
      </BookingEditDialog>

      {/* Pricing */}
      <BookingEditDialog
        open={editSection === "pricing"}
        section="pricing"
        title="Edit pricing"
        description="Recalculates from service unless you set an override"
        {...editDialogProps}
      >
        <div className="mb-4 rounded-md border border-border bg-muted/20 px-3 py-2">
          <BookingPriceDisplay booking={booking} />
        </div>
        <HubFieldRow>
          <HubFormField label="Promo code" htmlFor="dlg_promo_code">
            <HubInput
              id="dlg_promo_code"
              name="promo_code"
              defaultValue={promoCode}
              placeholder="Leave blank to clear"
              className="uppercase"
            />
          </HubFormField>
          <HubFormField label="Price override ($)" htmlFor="dlg_price_override">
            <HubInput
              id="dlg_price_override"
              name="price_override"
              defaultValue={overrideDollars}
              placeholder="Blank = calculated"
            />
          </HubFormField>
        </HubFieldRow>
        {hasActiveReward && loyaltyTitle ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/25 bg-primary/5 px-3 py-2">
            <p className="text-sm">{loyaltyTitle}</p>
            <BookingLoyaltyRewardRemove bookingId={booking.id} />
          </div>
        ) : null}
        <label className="mt-4 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="billed"
            defaultChecked={isBilled}
            className="size-4 accent-primary"
          />
          Customer billed (locks edits after save)
        </label>
      </BookingEditDialog>

      {/* Notes */}
      <BookingEditDialog
        open={editSection === "notes"}
        section="notes"
        title="Manager notes"
        {...editDialogProps}
      >
        <HubFormField label="Internal notes" htmlFor="dlg_manager_notes">
          <HubTextarea
            id="dlg_manager_notes"
            name="manager_notes"
            rows={4}
            defaultValue={booking.manager_notes}
          />
        </HubFormField>
      </BookingEditDialog>

      {/* Cancel */}
      <Dialog
        open={editSection === "cancel"}
        onOpenChange={(o) => !o && setEditSection(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-xs uppercase tracking-[0.14em]">
              Cancel booking
            </DialogTitle>
            <DialogDescription>
              This cannot be undone from the hub without rebooking.
            </DialogDescription>
          </DialogHeader>
          <form action={cancelAction}>
            <HubFormField label="Reason" htmlFor="dlg_cancel_reason" required>
              <HubInput
                id="dlg_cancel_reason"
                name="cancellation_reason"
                required
                placeholder="Customer requested reschedule"
              />
            </HubFormField>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditSection(null)}
              >
                Back
              </Button>
              <Button type="submit" variant="destructive" disabled={cancelPending}>
                {cancelPending ? "Cancelling…" : "Cancel booking"}
              </Button>
            </DialogFooter>
            <ActionBanner state={cancelState} />
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog
        open={editSection === "delete"}
        onOpenChange={(o) => !o && setEditSection(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-xs uppercase tracking-[0.14em]">
              Delete booking
            </DialogTitle>
            <DialogDescription>
              Soft-deletes this booking (hidden from calendar). Audit log is kept.
            </DialogDescription>
          </DialogHeader>
          <form action={deleteAction}>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditSection(null)}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={deletePending}
                onClick={(e) => {
                  if (
                    !confirm(
                      "Delete this booking? This cannot be undone from the hub.",
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                {deletePending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
            <ActionBanner state={deleteState} />
          </form>
        </DialogContent>
      </Dialog>

      {booking.cancellation_reason ? (
        <p className="font-mono text-xs text-muted-foreground">
          Cancellation reason: {booking.cancellation_reason}
        </p>
      ) : null}
    </div>
  );
}
