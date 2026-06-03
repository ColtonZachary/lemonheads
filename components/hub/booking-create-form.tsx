"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  createHubBooking,
  type HubBookingActionState,
} from "@/app/actions/hub-bookings";
import {
  getEmailValidationError,
  getPhoneValidationError,
} from "@/lib/validation/contact-fields";
import { CustomerBookingLookup } from "@/components/hub/customer-booking-lookup";
import {
  HubFieldRow,
  HubFormField,
  HubFormSection,
  HubInput,
  HubNativeSelect,
  HubTextarea,
} from "@/components/hub/hub-form";
import { HubDatePicker } from "@/components/hub/hub-date-picker";
import { HubTimeSelect } from "@/components/hub/hub-time-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { HubAddonCheckboxes } from "@/components/hub/hub-addon-checkboxes";
import { cn } from "@/lib/utils";
import { BOOKING_LOCATION_TYPES } from "@/lib/bookings/constants";
import type { AddOn } from "@/lib/data";
import type { PackageAddonBlocksMap } from "@/lib/bookings/package-addon-blocks";
import { PACKAGES, VEHICLE_OPTIONS } from "@/lib/data";
import { EMPTY_BOOKING_CREATE_DRAFT } from "@/lib/hub/booking-create-draft";

const EMPTY: HubBookingActionState = { ok: false, message: "" };

const WIZARD_STEPS = [
  { id: "customer", title: "Customer" },
  { id: "service", title: "Service" },
  { id: "schedule", title: "Schedule" },
  { id: "location", title: "Location" },
  { id: "notes", title: "Notes" },
] as const;

function StepPanel({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn(!active && "hidden")} aria-hidden={!active}>
      {children}
    </div>
  );
}

function WizardProgress({ step, total }: { step: number; total: number }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div className="shrink-0 space-y-2 border-b border-border pb-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Step {step + 1} of {total}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
          {WIZARD_STEPS[step]?.title}
        </p>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted/40">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {WIZARD_STEPS.map((s, i) => (
          <span
            key={s.id}
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em]",
              i === step
                ? "bg-primary/15 text-primary"
                : i < step
                  ? "text-muted-foreground"
                  : "text-muted-foreground/40",
            )}
          >
            {s.title}
          </span>
        ))}
      </div>
    </div>
  );
}

function validateWizardStep(
  stepIndex: number,
  form: HTMLFormElement | null,
  customer: { name: string; phone: string; email: string },
): string | null {
  if (!form) return null;
  const fd = new FormData(form);

  switch (stepIndex) {
    case 0:
      if (!customer.name.trim()) return "Enter the customer name.";
      {
        const phoneErr = getPhoneValidationError(customer.phone);
        if (phoneErr) return phoneErr;
        const emailErr = getEmailValidationError(customer.email);
        if (emailErr) return emailErr;
      }
      return null;
    case 1:
      if (!String(fd.get("package_key") ?? "")) return "Select a package.";
      if (!String(fd.get("vehicle_key") ?? "")) return "Select a vehicle.";
      return null;
    case 2:
      if (!String(fd.get("appointment_date") ?? "")) return "Select an appointment date.";
      if (!String(fd.get("time") ?? "")) return "Select a time.";
      return null;
    case 3:
      if (!String(fd.get("location") ?? "")) return "Select a location type.";
      return null;
    case 4:
      return null;
    default:
      return null;
  }
}

function stepIndexForServerError(message: string): number {
  const m = message.toLowerCase();
  if (m.includes("email") || m.includes("phone") || m.includes("customer")) return 0;
  if (m.includes("package") || m.includes("vehicle") || m.includes("addon")) return 1;
  if (m.includes("date") || m.includes("time") || m.includes("detailer") || m.includes("schedule")) {
    return 2;
  }
  if (m.includes("location") || m.includes("address") || m.includes("city") || m.includes("zip")) {
    return 3;
  }
  return 0;
}

export function BookingCreateForm({
  detailerNames,
  catalogAddons,
  packageAddonBlocks,
  initialDraft,
  formSeed = "new",
  onSuccess,
  onCancel,
  compact,
}: {
  detailerNames: string[];
  catalogAddons: AddOn[];
  packageAddonBlocks: PackageAddonBlocksMap;
  initialDraft?: Partial<typeof EMPTY_BOOKING_CREATE_DRAFT>;
  formSeed?: string | number;
  onSuccess?: (bookingId: string) => void;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createHubBooking, EMPTY);
  const errorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  const baseDraft = useMemo(
    () => ({ ...EMPTY_BOOKING_CREATE_DRAFT, ...initialDraft }),
    [initialDraft],
  );
  const draft = state.draft ?? baseDraft;
  const [dateInput, setDateInput] = useState(draft.appointment_date);
  const [time, setTime] = useState(draft.time);
  const [customerName, setCustomerName] = useState(draft.customer_name);
  const [phone, setPhone] = useState(draft.phone);
  const [email, setEmail] = useState(draft.email);
  const [location, setLocation] = useState(draft.location);
  const [address, setAddress] = useState(draft.address);
  const [city, setCity] = useState(draft.city);
  const [zip, setZip] = useState(draft.zip);
  const [vehicleInfo, setVehicleInfo] = useState(draft.vehicle_info);
  const [packageKey, setPackageKey] = useState(draft.package_key);

  const formKey = useMemo(() => {
    if (state.draft) {
      return `restore-${state.draft.appointment_date}-${state.draft.time}-${state.draft.customer_name}-${state.draft.package_key}`;
    }
    return `seed-${formSeed}`;
  }, [state.draft, formSeed]);

  const lastWizardStep = WIZARD_STEPS.length - 1;
  const inputRequired = !compact;

  useEffect(() => {
    if (state.ok && state.bookingId) {
      if (onSuccess) {
        onSuccess(state.bookingId);
      } else {
        router.push(`/hub/bookings/${state.bookingId}`);
      }
    }
  }, [state.ok, state.bookingId, router, onSuccess]);

  useEffect(() => {
    setDateInput(draft.appointment_date);
    setTime(draft.time);
    setCustomerName(draft.customer_name);
    setPhone(draft.phone);
    setEmail(draft.email);
    setLocation(draft.location);
    setAddress(draft.address);
    setCity(draft.city);
    setZip(draft.zip);
    setVehicleInfo(draft.vehicle_info);
    setPackageKey(draft.package_key);
  }, [
    formSeed,
    draft.appointment_date,
    draft.time,
    draft.customer_name,
    draft.phone,
    draft.email,
    draft.location,
    draft.address,
    draft.city,
    draft.zip,
    draft.vehicle_info,
    draft.package_key,
  ]);

  useEffect(() => {
    setWizardStep(initialDraft?.appointment_date ? 2 : 0);
    setStepError(null);
  }, [formSeed]);

  useEffect(() => {
    if (!state.ok && state.draft) {
      setDateInput(state.draft.appointment_date);
      setTime(state.draft.time);
      setCustomerName(state.draft.customer_name);
      setPhone(state.draft.phone);
      setEmail(state.draft.email);
      setLocation(state.draft.location);
      setAddress(state.draft.address);
      setCity(state.draft.city);
      setZip(state.draft.zip);
      setVehicleInfo(state.draft.vehicle_info);
      if (compact && state.message) {
        setWizardStep(stepIndexForServerError(state.message));
      }
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state, compact]);

  const addonGridClass = compact
    ? "grid grid-cols-1 gap-2"
    : "grid gap-2 sm:grid-cols-2";

  const wrapStep = (index: number, content: ReactNode) =>
    compact ? <StepPanel active={wizardStep === index}>{content}</StepPanel> : content;

  const goNext = () => {
    const err = validateWizardStep(wizardStep, formRef.current, {
      name: customerName,
      phone,
      email,
    });
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setWizardStep((s) => Math.min(s + 1, lastWizardStep));
  };

  const goBack = () => {
    setStepError(null);
    setWizardStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!compact) return;
    for (let i = 0; i <= lastWizardStep; i++) {
      const err = validateWizardStep(i, formRef.current, {
        name: customerName,
        phone,
        email,
      });
      if (err) {
        e.preventDefault();
        setWizardStep(i);
        setStepError(err);
        return;
      }
    }
    setStepError(null);
  };

  const errorBanner = !state.ok && state.message && (
    <div ref={errorRef}>
    <Alert variant="destructive" className="mb-4">
      <AlertTitle className="font-mono text-[10px] uppercase tracking-[0.12em]">
        Could not create booking
      </AlertTitle>
      <AlertDescription className="font-mono text-sm">{state.message}</AlertDescription>
      <AlertDescription>
        {compact
          ? "Fix the highlighted step and try again."
          : "Your entries are kept below — fix the issue and submit again."}
      </AlertDescription>
    </Alert>
    </div>
  );

  const customerSection = (
    <HubFormSection title="Customer">
      <CustomerBookingLookup
        compact={compact}
        onSelect={(pick) => {
          setCustomerName(pick.displayName);
          setPhone(pick.phone);
          setEmail(pick.email);
          if (pick.location) setLocation(pick.location);
          if (pick.address) setAddress(pick.address);
          if (pick.city) setCity(pick.city);
          if (pick.zip) setZip(pick.zip);
          if (pick.vehicleInfo) setVehicleInfo(pick.vehicleInfo);
        }}
      />
      <HubFieldRow>
        <HubFormField label="Name" htmlFor="customer_name" required>
          <HubInput
            id="customer_name"
            name="customer_name"
            required={inputRequired}
            placeholder="Jane Smith"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </HubFormField>
        <HubFormField label="Phone" htmlFor="phone" required>
          <HubInput
            id="phone"
            name="phone"
            type="tel"
            required={inputRequired}
            placeholder="405-555-0100"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </HubFormField>
        <HubFormField
          label="Email"
          htmlFor="email"
          required
          className={compact ? undefined : "sm:col-span-2"}
        >
          <HubInput
            id="email"
            name="email"
            type="email"
            required={inputRequired}
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </HubFormField>
      </HubFieldRow>
    </HubFormSection>
  );

  const serviceSection = (
    <HubFormSection title="Service">
      <HubFieldRow>
        <HubFormField label="Package" htmlFor="package_key" required>
          <HubNativeSelect
            id="package_key"
            name="package_key"
            required={inputRequired}
            value={packageKey || ""}
            onChange={(e) => setPackageKey(e.target.value)}
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
        <HubFormField label="Vehicle" htmlFor="vehicle_key" required>
          <HubNativeSelect
            id="vehicle_key"
            name="vehicle_key"
            required={inputRequired}
            defaultValue={draft.vehicle_key || undefined}
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
          htmlFor="vehicle_info"
          className={compact ? undefined : "sm:col-span-2"}
        >
          <HubInput
            id="vehicle_info"
            name="vehicle_info"
            placeholder="Color, year, fleet unit #"
            value={vehicleInfo}
            onChange={(e) => setVehicleInfo(e.target.value)}
          />
        </HubFormField>
      </HubFieldRow>
      <HubAddonCheckboxes
        key={`addons-${packageKey}`}
        packageKey={packageKey}
        addons={catalogAddons}
        packageAddonBlocks={packageAddonBlocks}
        selectedNames={draft.addons}
        className={addonGridClass}
      />
    </HubFormSection>
  );

  const scheduleSection = (
    <HubFormSection title="Schedule (Central)">
      <div className={compact ? "flex flex-col gap-4" : undefined}>
        <HubDatePicker
          key={`date-${formKey}`}
          name="appointment_date"
          label="Date"
          disablePast
          stacked={compact}
          defaultValue={draft.appointment_date}
          onDateChange={setDateInput}
        />
        <HubTimeSelect
          key={`time-${formKey}`}
          dateInput={dateInput}
          name="time"
          label="Time"
          value={time}
          onValueChange={setTime}
        />
        <HubFieldRow>
          <HubFormField label="Detailer" htmlFor="detailer" required>
            <HubNativeSelect
              id="detailer"
              name="detailer"
              required={inputRequired}
              defaultValue={draft.detailer || "auto"}
            >
              <option value="auto">Auto-assign (next available)</option>
              {detailerNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </HubNativeSelect>
          </HubFormField>
          <HubFormField label="Status" htmlFor="status" required>
            <HubNativeSelect
              id="status"
              name="status"
              defaultValue={draft.status}
            >
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="in_progress">in_progress</option>
            </HubNativeSelect>
          </HubFormField>
        </HubFieldRow>
      </div>
    </HubFormSection>
  );

  const locationSection = (
    <HubFormSection title="Location">
      <HubFieldRow>
        <HubFormField
          label="Location type"
          htmlFor="location"
          required
          className={compact ? undefined : "sm:col-span-2"}
        >
          <HubNativeSelect
            id="location"
            name="location"
            required={inputRequired}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {BOOKING_LOCATION_TYPES.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
            {location &&
              !BOOKING_LOCATION_TYPES.includes(
                location as (typeof BOOKING_LOCATION_TYPES)[number],
              ) && <option value={location}>{location}</option>}
          </HubNativeSelect>
        </HubFormField>
        <HubFormField
          label="Street address"
          htmlFor="address"
          className={compact ? undefined : "sm:col-span-2"}
        >
          <HubInput
            id="address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </HubFormField>
        <HubFormField label="City" htmlFor="city">
          <HubInput
            id="city"
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </HubFormField>
        <HubFormField label="ZIP" htmlFor="zip">
          <HubInput
            id="zip"
            name="zip"
            maxLength={10}
            value={zip}
            onChange={(e) => setZip(e.target.value)}
          />
        </HubFormField>
      </HubFieldRow>
    </HubFormSection>
  );

  const notesSection = (
    <HubFormSection title="Notes">
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="plastic_shine"
          value="Yes"
          defaultChecked={draft.plastic_shine}
          className="size-4 shrink-0 rounded border border-input accent-primary"
        />
        Plastic shine (customer wants shiny plastic)
      </label>
      <HubFormField label="Customer notes" htmlFor="customer_notes">
        <HubTextarea
          id="customer_notes"
          name="customer_notes"
          rows={compact ? 3 : 2}
          defaultValue={draft.customer_notes}
        />
      </HubFormField>
      <HubFormField label="Manager notes (internal)" htmlFor="manager_notes">
        <HubTextarea
          id="manager_notes"
          name="manager_notes"
          rows={compact ? 3 : 2}
          defaultValue={draft.manager_notes}
        />
      </HubFormField>
    </HubFormSection>
  );

  const stepSections = compact ? (
    <div className="space-y-4">
      {wrapStep(0, customerSection)}
      {wrapStep(1, serviceSection)}
      {wrapStep(2, scheduleSection)}
      {wrapStep(3, locationSection)}
      {wrapStep(4, notesSection)}
    </div>
  ) : (
    <div className="space-y-10">
      {customerSection}
      {serviceSection}
      {scheduleSection}
      {locationSection}
      {notesSection}
    </div>
  );

  return (
    <form
      ref={formRef}
      key={formKey}
      action={action}
      onSubmit={handleSubmit}
      className={cn(
        "min-w-0 max-w-full",
        compact ? "flex min-h-0 flex-1 flex-col" : "space-y-10",
      )}
    >
      {compact ? (
        <>
          <WizardProgress step={wizardStep} total={WIZARD_STEPS.length} />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4">
            {errorBanner}
            {stepError && (
              <p
                className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 font-mono text-xs text-amber-100"
                role="status"
              >
                {stepError}
              </p>
            )}
            {stepSections}
          </div>
          <div className="shrink-0 space-y-2 border-t border-border bg-card px-0 pt-4">
            <div className="flex flex-wrap gap-2">
              {onCancel ? (
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href="/hub/calendar">Cancel</Link>
                </Button>
              )}
              {wizardStep > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={goBack}>
                  Back
                </Button>
              )}
              <div className="flex-1" />
              {wizardStep < lastWizardStep ? (
                <Button type="button" size="sm" onClick={goNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Creating…" : "Create booking"}
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {errorBanner}
          {stepSections}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create booking"}
            </Button>
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/hub/calendar">Cancel</Link>
              </Button>
            )}
          </div>
        </>
      )}
    </form>
  );
}
