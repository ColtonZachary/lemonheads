"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
  type RefObject,
} from "react";

import { getDetailerAvailability } from "@/lib/booking-availability";
import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import {
  dateInputFromParts,
  dateLabelFromParts,
  getCentralTodayDateInput,
  isDateLabelSelectable,
  isSameDayCutoffActive,
  isTimeSlotSelectable,
  isTodayDateLabel,
  validateBookingSchedule,
} from "@/lib/bookings/scheduling-limits";
import {
  resolveServiceAreaSlugsForLocation,
  type SchedulingRulesSnapshot,
} from "@/lib/bookings/scheduling-rules";
import type { ServiceAreaCoverageRule } from "@/lib/bookings/service-area-coverage";
import type { DetailerAvailabilitySnapshot } from "@/lib/bookings/detailer-availability";
import { applyPromoForBooking } from "@/app/actions/promo";
import { submitBooking } from "@/lib/submit-booking";
import {
  BookingCardCapture,
  isStripeCardCaptureAvailable,
  type BookingCardCaptureApi,
} from "@/components/book/booking-card-capture";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FormRow,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/field";
import { Icon, type IconName } from "@/components/ui/icons";
import { assetPath } from "@/lib/asset-path";
import type { DetailerCardInfo } from "@/lib/bookings/bookable-detailers";
import { TEAM, type VehicleKey } from "@/lib/data";
import {
  packageIconForKey,
  packagesByKey,
  type PublicCatalog,
  type SitePackage,
} from "@/lib/catalog/public-catalog";
import { cn, formatCurrency } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────
   TYPES + STATE
─────────────────────────────────────────────────────────────────────*/

type Step = 1 | 2 | 3 | 4;

interface BookingState {
  packageKey: string;
  vehicleKey: VehicleKey | "";
  addons: Set<string>;
  plasticCondition: "Yes" | "No";
  earlyContact: "Yes" | "No";

  date: string;
  time: string;

  detailer: string;

  firstName: string;
  lastName: string;
  phone: string;
  email: string;

  locationType: string;
  address: string;
  city: string;
  zip: string;
  vehicleInfo: string;
  notes: string;

  /** Optional: customer saves a card via Stripe for post-service payment */
  saveCardOnFile: boolean;

  promoCodeInput: string;
  appliedPromo: { code: string; discountCents: number } | null;
  promoMessage: string | null;
}

const VEHICLE_TOP: { key: VehicleKey | "suv"; label: string; icon: IconName }[] = [
  { key: "coupe", label: "2-Door Coupe", icon: "coupe" },
  { key: "sedan", label: "4-Door Sedan", icon: "sedan" },
  { key: "suv", label: "SUV", icon: "suv" },
  { key: "truck", label: "Truck", icon: "truck" },
  { key: "van", label: "Van", icon: "van" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function emptyState(
  initial?: Partial<Pick<BookingState, "packageKey" | "vehicleKey">>,
): BookingState {
  return {
    packageKey: initial?.packageKey ?? "",
    vehicleKey: initial?.vehicleKey ?? "",
    addons: new Set(),
    plasticCondition: "No",
    earlyContact: "Yes",
    date: "",
    time: "",
    detailer: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    locationType: "",
    address: "",
    city: "",
    zip: "",
    vehicleInfo: "",
    notes: "",
    saveCardOnFile: false,
    promoCodeInput: "",
    appliedPromo: null,
    promoMessage: null,
  };
}

/* ─────────────────────────────────────────────────────────────────────
   ROOT COMPONENT
─────────────────────────────────────────────────────────────────────*/

export function BookingFlow({
  detailers: detailersProp,
  catalog,
  schedulingRules,
  coverageRules,
}: {
  detailers?: DetailerCardInfo[];
  catalog: PublicCatalog;
  schedulingRules: SchedulingRulesSnapshot;
  coverageRules: ServiceAreaCoverageRule[];
}) {
  const { packages, addons, locationTypes } = catalog;
  const packageByKey = useMemo(() => packagesByKey(packages), [packages]);
  const bookableDetailers =
    detailersProp?.length
      ? detailersProp
      : TEAM.filter((m) => m.isDetailer).map((m) => ({
          name: m.name,
          photo: m.photo ? assetPath(m.photo) : undefined,
        }));
  const searchParams = useSearchParams();
  const router = useRouter();

  const presetPkg = searchParams?.get("service");
  const presetVeh = searchParams?.get("vehicle") as VehicleKey | null;

  const [state, setState] = useState<BookingState>(() =>
    emptyState({
      packageKey: presetPkg && packageByKey[presetPkg] ? presetPkg : "",
      vehicleKey: presetVeh ?? "",
    }),
  );
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    bookingId: string;
    assignedDetailer?: string;
  } | null>(null);
  const [availability, setAvailability] =
    useState<DetailerAvailabilitySnapshot | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const paymentRef = useRef<BookingCardCaptureApi | null>(null);

  const update = <K extends keyof BookingState>(
    key: K,
    value: BookingState[K],
  ) => setState((s) => ({ ...s, [key]: value }));

  const toggleAddon = (name: string) =>
    setState((s) => {
      const next = new Set(s.addons);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { ...s, addons: next };
    });

  const pkg =
    state.packageKey && packageByKey[state.packageKey]
      ? packageByKey[state.packageKey]
      : null;
  const pkgPrice =
    pkg && state.vehicleKey ? pkg.prices[state.vehicleKey] : null;
  const addonTotal = useMemo(
    () =>
      Array.from(state.addons).reduce((sum, name) => {
        const a = addons.find((x) => x.name === name);
        return sum + (a?.price ?? 0);
      }, 0),
    [state.addons, addons],
  );
  const subtotal = pkgPrice !== null ? pkgPrice + addonTotal : null;
  const discountDollars = (state.appliedPromo?.discountCents ?? 0) / 100;
  const total =
    subtotal !== null ? Math.max(0, subtotal - discountDollars) : null;

  const addonKey = Array.from(state.addons).sort().join("|");

  const serviceAreaSlugs = useMemo(
    () =>
      resolveServiceAreaSlugsForLocation(
        state.zip,
        state.city,
        coverageRules,
      ),
    [state.zip, state.city, coverageRules],
  );

  useEffect(() => {
    setState((s) => {
      if (!s.appliedPromo && !s.promoMessage) return s;
      return { ...s, appliedPromo: null, promoMessage: null };
    });
  }, [state.packageKey, state.vehicleKey, addonKey]);

  useEffect(() => {
    if (!state.date || !pkg) {
      setAvailability(null);
      return;
    }

    let cancelled = false;
    setAvailabilityLoading(true);
    void getDetailerAvailability(state.date, pkg.durationHours)
      .then((snapshot) => {
      if (cancelled) return;
      setAvailability(snapshot);
      setState((s) => {
        let next = s;
        if (s.time && snapshot.fullyBookedSlots.includes(s.time)) {
          next = { ...next, time: "" };
        }
        if (
          s.detailer &&
          s.time &&
          snapshot.busySlotsByDetailer[s.detailer]?.includes(s.time)
        ) {
          next = { ...next, detailer: "" };
        }
        return next;
      });
    })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [state.date, pkg?.durationHours]);

  const tryAdvance = (target: Step) => {
    setError(null);
    if (target === 2) {
      if (!state.packageKey)
        return setError("Please select a service before continuing.");
      if (!state.vehicleKey)
        return setError("Please select a vehicle type before continuing.");
    }
    if (target === 3) {
      if (!state.date || !state.time)
        return setError("Please pick a date and time before continuing.");
      const scheduleError = validateBookingSchedule(
        state.date,
        state.time,
        schedulingRules,
        serviceAreaSlugs,
      );
      if (scheduleError) return setError(scheduleError);
      if (availability?.fullyBookedSlots.includes(state.time)) {
        return setError(
          "That time is fully booked. Please pick another time slot.",
        );
      }
    }
    if (target === 4) {
      if (!state.firstName || !state.lastName)
        return setError("Please enter your name.");
      if (!state.phone) return setError("Please enter a phone number.");
      if (!state.email) return setError("Please enter an email address.");
      if (!state.locationType)
        return setError("Please pick a service location type.");
      if (state.date && state.time) {
        const slugs = resolveServiceAreaSlugsForLocation(
          state.zip,
          state.city,
          coverageRules,
        );
        const scheduleError = validateBookingSchedule(
          state.date,
          state.time,
          schedulingRules,
          slugs,
        );
        if (scheduleError) return setError(scheduleError);
      }
      if (availability?.fullyBookedSlots.includes(state.time)) {
        return setError(
          "That time is fully booked. Please pick another time slot.",
        );
      }
      if (
        state.detailer &&
        availability?.busySlotsByDetailer[state.detailer]?.includes(state.time)
      ) {
        return setError(
          `${state.detailer} is not available at that time. Pick another time or detailer.`,
        );
      }
    }
    setStep(target);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      let cardOnFile = false;

      if (state.saveCardOnFile) {
        const stripeResult = await paymentRef.current?.confirmIfNeeded();
        if (stripeResult?.error) {
          setError(stripeResult.error);
          return;
        }
        if (!stripeResult?.paymentMethodId) {
          setError(
            "Please finish entering your card, or turn off saving a card.",
          );
          return;
        }
        cardOnFile = true;
      }

      const result = await submitBooking({
        customerName: `${state.firstName} ${state.lastName}`.trim(),
        email: state.email,
        phone: state.phone,
        service: pkg?.name ?? "",
        serviceKey: state.packageKey,
        durationHours: pkg?.durationHours ?? 2,
        vehicle: vehicleLabel(state.vehicleKey),
        vehicleInfo: state.vehicleInfo,
        date: state.date,
        time: state.time,
        location: state.locationType,
        address: state.address,
        city: state.city,
        zip: state.zip,
        requestedDetailer: state.detailer,
        addons: Array.from(state.addons),
        vehicleKey: state.vehicleKey,
        promoCode: state.appliedPromo?.code ?? "",
        estimatedTotal: total !== null ? formatCurrency(total) : "TBD",
        plasticCondition: state.plasticCondition,
        earlyContact: state.earlyContact,
        notes: state.notes,
        cardOnFile,
      });
      if (result.status === "success") {
        setConfirmation({
          bookingId: result.bookingId,
          assignedDetailer: result.assignedDetailer,
        });
      } else if (result.status === "error") {
        setError(result.message);
      }
    });
  };

  // Strip query params after first read so refresh isn't sticky
  useEffect(() => {
    if (presetPkg || presetVeh) {
      router.replace("/book", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (confirmation) {
    return (
      <ConfirmScreen
        state={state}
        pkg={pkg}
        total={total}
        bookingId={confirmation.bookingId}
        assignedDetailer={confirmation.assignedDetailer}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        step === 4 && "gap-6 sm:gap-8",
      )}
    >
      <Stepper step={step} />

      {step === 1 && (
        <Step1
          state={state}
          update={update}
          toggleAddon={toggleAddon}
          packages={packages}
          addons={addons}
          onApplyPromo={(result) => {
            if (result.ok) {
              setState((s) => ({
                ...s,
                appliedPromo: {
                  code: result.code,
                  discountCents: result.discountCents,
                },
                promoMessage: `${result.code} applied — you save ${formatCurrency(result.discountCents / 100)}.`,
              }));
              setError(null);
            } else {
              setState((s) => ({
                ...s,
                appliedPromo: null,
                promoMessage: result.message,
              }));
            }
          }}
        />
      )}

      {step === 2 && (
        <Step2
          state={state}
          schedulingRules={schedulingRules}
          availability={availability}
          availabilityLoading={availabilityLoading}
          onPickDate={(d) => {
            update("date", d);
            if (
              state.time &&
              !isTimeSlotSelectable(d, state.time, schedulingRules)
            ) {
              update("time", "");
            }
          }}
          onPickTime={(t) => update("time", t)}
        />
      )}

      {step >= 3 && step <= 4 && (
        <>
          <div className={cn(step !== 3 && "hidden")}>
            <Step3
              state={state}
              update={update}
              paymentRef={paymentRef}
              availability={availability}
              detailers={bookableDetailers}
              locationTypes={locationTypes}
            />
          </div>
          <div className={cn(step !== 4 && "hidden")}>
            <Step4
              state={state}
              pkg={pkg}
              pkgPrice={pkgPrice}
              addonTotal={addonTotal}
              subtotal={subtotal}
              total={total}
            />
          </div>
        </>
      )}

      {error && (
        <p className="rounded-[4px] border border-red-500/30 bg-red-500/10 px-4 py-3 font-mono text-xs tracking-[0.05em] text-red-300">
          ⚠ {error}
        </p>
      )}

      <FormNav
        step={step}
        isPending={isPending}
        onBack={() => setStep((s) => Math.max(1, s - 1) as Step)}
        onNext={() => tryAdvance(((step + 1) as Step))}
        onSubmit={submit}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   STEPPER
─────────────────────────────────────────────────────────────────────*/

function Stepper({ step }: { step: Step }) {
  const steps: { num: Step; label: string }[] = [
    { num: 1, label: "Service" },
    { num: 2, label: "Schedule" },
    { num: 3, label: "Details" },
    { num: 4, label: "Confirm" },
  ];
  return (
    <div className="mb-12 flex flex-wrap items-center justify-center gap-2">
      {steps.map((s, idx) => {
        const active = s.num === step;
        const done = s.num < step;
        return (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] transition-colors",
                active && "text-y",
                done && "text-y/60",
                !active && !done && "text-muted/60",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[10px] font-bold transition-all",
                  active && "border-y bg-y text-black",
                  done && "border-y/50 bg-y/10 text-y",
                  !active && !done && "border-muted/30",
                )}
              >
                {s.num}
              </span>
              <span>{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <span
                className={cn(
                  "mx-1 h-px w-7 transition-colors",
                  s.num < step ? "bg-y/30" : "bg-white/10",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   STEP 1 — Service + Vehicle + Add-Ons + Prefs
─────────────────────────────────────────────────────────────────────*/

function Step1({
  state,
  update,
  toggleAddon,
  packages,
  addons,
  onApplyPromo,
}: {
  state: BookingState;
  update: <K extends keyof BookingState>(k: K, v: BookingState[K]) => void;
  toggleAddon: (name: string) => void;
  packages: SitePackage[];
  addons: PublicCatalog["addons"];
  onApplyPromo: (
    result:
      | {
          ok: true;
          code: string;
          discountCents: number;
        }
      | { ok: false; message: string },
  ) => void;
}) {
  const [promoPending, startPromoTransition] = useTransition();
  const canApplyPromo = Boolean(state.packageKey && state.vehicleKey);

  const handleApplyPromo = () => {
    if (!canApplyPromo) return;
    startPromoTransition(async () => {
      const result = await applyPromoForBooking({
        code: state.promoCodeInput,
        packageKey: state.packageKey,
        vehicleKey: state.vehicleKey as VehicleKey,
        addonNames: Array.from(state.addons),
      });
      onApplyPromo(result);
    });
  };
  const [suvOpen, setSuvOpen] = useState(
    state.vehicleKey === "suv2" || state.vehicleKey === "suv3",
  );
  return (
    <>
      <FormSection title="Choose Your Service">
        <div className="grid gap-[3px] bg-border-faint sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => update("packageKey", p.key)}
              className={cn(
                "relative cursor-pointer bg-card p-5 text-left transition-colors hover:bg-card2",
                state.packageKey === p.key && "bg-y/[0.06]",
                state.packageKey === p.key &&
                  "after:absolute after:inset-x-0 after:top-0 after:h-0.5 after:bg-y",
              )}
            >
              <span
                className={cn(
                  "absolute right-3.5 top-3.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white/15 text-transparent transition-all",
                  state.packageKey === p.key &&
                    "border-y bg-y font-black text-black",
                )}
                style={{ width: 18, height: 18 }}
              >
                {state.packageKey === p.key && (
                  <Icon name="check" className="h-2.5 w-2.5" />
                )}
              </span>
              <Icon
                name={packageIconForKey(p.key)}
                className="mb-3 h-7 w-7 text-y opacity-70"
              />
              <div className="font-display text-lg tracking-[0.05em]">
                {p.name}
              </div>
              <div className="font-mono text-[10px] tracking-[0.08em] text-muted">
                ~{p.durationHours} hrs
              </div>
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection title="Vehicle Type">
        <div className="grid gap-[3px] bg-border-faint sm:grid-cols-3 lg:grid-cols-5">
          {VEHICLE_TOP.map((v) => {
            const isSelected =
              v.key === "suv"
                ? state.vehicleKey === "suv2" ||
                  state.vehicleKey === "suv3" ||
                  suvOpen
                : state.vehicleKey === v.key;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  if (v.key === "suv") {
                    setSuvOpen(true);
                  } else {
                    update("vehicleKey", v.key as VehicleKey);
                    setSuvOpen(false);
                  }
                }}
                className={cn(
                  "relative cursor-pointer bg-card px-3.5 py-4 text-center transition-colors hover:bg-card2",
                  isSelected && "bg-y/[0.06]",
                  isSelected &&
                    "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-y",
                )}
              >
                <Icon name={v.icon} className="mx-auto mb-2 h-8 w-8 text-y opacity-70" />
                <div className="font-mono text-[11px] font-bold tracking-[0.08em]">
                  {v.label}
                </div>
                {v.key === "suv" && (
                  <div className="mt-1 font-mono text-[8.5px] tracking-[0.1em] text-y/60">
                    {suvOpen ? "PICK A ROW BELOW" : "TAP TO SELECT ROWS ▾"}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {suvOpen && (
          <div className="mt-3">
            <p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
              How many rows of seats?
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(["suv2", "suv3"] as const).map((k) => {
                const selected = state.vehicleKey === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => update("vehicleKey", k)}
                    className={cn(
                      "relative cursor-pointer bg-card px-4 py-4 text-center transition-colors hover:bg-card2",
                      selected && "bg-y/[0.06]",
                      selected &&
                        "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-y",
                    )}
                  >
                    <Icon
                      name="suv"
                      className="mx-auto mb-2 h-8 w-8 text-y opacity-70"
                    />
                    <div className="font-mono text-[11px] font-bold tracking-[0.08em]">
                      {k === "suv2" ? "2-Row SUV" : "3-Row SUV"}
                    </div>
                    <div className="mt-1 font-mono text-[9px] tracking-[0.05em] text-text/35">
                      {k === "suv2"
                        ? "e.g. RAV4, CR-V, Equinox"
                        : "e.g. Tahoe, Suburban, Expedition"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </FormSection>

      <FormSection
        title={
          <>
            Add-Ons{" "}
            <span className="ml-2 font-mono text-[13px] font-normal normal-case tracking-[0.05em] text-muted">
              — Optional
            </span>
          </>
        }
      >
        <p className="mb-6 font-mono text-xs tracking-[0.06em] text-text/35">
          Tap any to add to your booking
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {addons.map((a) => {
            const selected = state.addons.has(a.name);
            return (
              <button
                key={a.name}
                type="button"
                onClick={() => toggleAddon(a.name)}
                className={cn(
                  "relative cursor-pointer rounded-md border bg-card px-4 py-3.5 text-left transition-colors",
                  selected
                    ? "border-y bg-y/[0.08]"
                    : "border-border-faint hover:border-y/20 hover:bg-card2",
                )}
              >
                <span
                  className={cn(
                    "absolute right-2.5 top-2.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border transition-all",
                    selected
                      ? "border-y bg-y text-black"
                      : "border-white/15 text-transparent",
                  )}
                >
                  {selected && <Icon name="check" className="h-2.5 w-2.5" />}
                </span>
                <div className="pr-5 text-xs font-bold leading-tight">
                  {a.name}
                </div>
                <div className="mt-1.5 font-display text-xl leading-none tracking-[0.04em] text-y">
                  +${a.price}
                  {a.priceSuffix && (
                    <span className="ml-1 text-[9px] opacity-60">
                      {a.priceSuffix}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {state.addons.size > 0 && (
          <div className="mt-5 flex items-center justify-between rounded border border-y/20 bg-y/[0.06] px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
              Add-ons total
            </span>
            <span className="font-display text-2xl tracking-[0.04em] text-y">
              {formatCurrency(
                Array.from(state.addons).reduce((s, n) => {
                  const a = addons.find((x) => x.name === n);
                  return s + (a?.price ?? 0);
                }, 0),
              )}
            </span>
          </div>
        )}
      </FormSection>

      <FormSection title="Promo Code">
        <p className="mb-4 font-mono text-xs tracking-[0.06em] text-text/35">
          Have a code? Enter it below and tap Apply. Select your service and vehicle
          first.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text/40">
              Code
            </span>
            <input
              type="text"
              value={state.promoCodeInput}
              onChange={(e) =>
                update("promoCodeInput", e.target.value.toUpperCase())
              }
              placeholder="SUMMER25"
              className="mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm uppercase tracking-[0.08em]"
              autoComplete="off"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={!canApplyPromo || promoPending || !state.promoCodeInput.trim()}
            className="h-auto min-h-0 shrink-0 px-5 py-2"
            onClick={handleApplyPromo}
          >
            {promoPending ? "Checking…" : "Apply"}
          </Button>
        </div>
        {!canApplyPromo && (
          <p className="mt-2 font-mono text-[10px] text-text/35">
            Select a service and vehicle type to apply a code.
          </p>
        )}
        {state.promoMessage && (
          <p
            className={cn(
              "mt-3 rounded-md border px-4 py-3 font-mono text-xs",
              state.appliedPromo
                ? "border-y/30 bg-y/10 text-y"
                : "border-red-500/30 bg-red-500/10 text-red-200",
            )}
          >
            {state.promoMessage}
          </p>
        )}
      </FormSection>

      <FormSection title="A Few Quick Questions">
        <p className="mb-7 font-mono text-xs tracking-[0.06em] text-text/35">
          Helps us tailor the detail to your preferences
        </p>

        <PrefQuestion
          prompt="Would you like your plastic to be conditioned? Some customers prefer the matte, clean look over the shiny look. Select Yes for shiny."
          value={state.plasticCondition}
          onChange={(v) => update("plasticCondition", v)}
        />

        <div className="h-6" />

        <PrefQuestion
          prompt="Sometimes our detailers run ahead of schedule. Is it okay if they contact you for an earlier start time?"
          value={state.earlyContact}
          onChange={(v) => update("earlyContact", v)}
        />
      </FormSection>
    </>
  );
}

function PrefQuestion({
  prompt,
  value,
  onChange,
}: {
  prompt: string;
  value: "Yes" | "No";
  onChange: (v: "Yes" | "No") => void;
}) {
  return (
    <div>
      <p className="mb-3.5 text-sm leading-[1.7] text-text/75">{prompt}</p>
      <div className="flex gap-2">
        {(["No", "Yes"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "cursor-pointer rounded-[3px] border bg-white/[0.04] px-7 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] transition-all",
              value === opt
                ? "border-y bg-y/10 text-y"
                : "border-white/10 text-text/50 hover:border-y/35 hover:text-y",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   STEP 2 — Calendar + Time picker
─────────────────────────────────────────────────────────────────────*/

function formatCutoffHour(hour: number): string {
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

function Step2({
  state,
  schedulingRules,
  availability,
  availabilityLoading,
  onPickDate,
  onPickTime,
}: {
  state: BookingState;
  schedulingRules: SchedulingRulesSnapshot;
  availability: DetailerAvailabilitySnapshot | null;
  availabilityLoading: boolean;
  onPickDate: (d: string) => void;
  onPickTime: (t: string) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });

  const todayKey = getCentralTodayDateInput();

  const days = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1).getDay();
    const total = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: { day: number | null; iso: string | null; disabled: boolean; isToday: boolean }[] = [];
    for (let i = 0; i < first; i++)
      cells.push({ day: null, iso: null, disabled: true, isToday: false });
    for (let d = 1; d <= total; d++) {
      const dateLabel = dateLabelFromParts(cursor.y, cursor.m, d);
      const dateInput = dateInputFromParts(cursor.y, cursor.m, d);
      cells.push({
        day: d,
        iso: dateLabel,
        disabled: !isDateLabelSelectable(dateLabel, schedulingRules),
        isToday: dateInput === todayKey,
      });
    }
    return cells;
  }, [cursor, todayKey, schedulingRules]);

  const blockAllSlots = useMemo(() => {
    if (!state.date) return false;
    return (
      isTodayDateLabel(state.date) && isSameDayCutoffActive(schedulingRules)
    );
  }, [state.date, schedulingRules]);

  const cutoffLabel = formatCutoffHour(schedulingRules.sameDayCutoffHour);

  return (
    <>
      <FormSection title="Pick a Date">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setCursor((c) =>
                c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 },
              )
            }
            className="cursor-pointer rounded-[4px] border border-border-faint bg-white/[0.04] px-4 py-2 font-mono text-[11px] tracking-[0.1em] text-text/60 transition-all hover:border-y/20 hover:bg-y/[0.08] hover:text-y"
          >
            ← Prev
          </button>
          <div className="font-display text-2xl tracking-[0.06em]">
            {MONTHS[cursor.m]} {cursor.y}
          </div>
          <button
            type="button"
            onClick={() =>
              setCursor((c) =>
                c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 },
              )
            }
            className="cursor-pointer rounded-[4px] border border-border-faint bg-white/[0.04] px-4 py-2 font-mono text-[11px] tracking-[0.1em] text-text/60 transition-all hover:border-y/20 hover:bg-y/[0.08] hover:text-y"
          >
            Next →
          </button>
        </div>

        <div className="mb-1.5 grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="p-1 text-center font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-muted/50"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((cell, i) => {
            if (cell.day === null) return <div key={i} />;
            const selected = state.date === cell.iso;
            return (
              <button
                key={i}
                type="button"
                disabled={cell.disabled}
                onClick={() => cell.iso && onPickDate(cell.iso)}
                className={cn(
                  "flex h-11 items-center justify-center rounded-[3px] border border-transparent text-sm font-semibold transition-all",
                  cell.disabled
                    ? "cursor-not-allowed text-white/15"
                    : "cursor-pointer text-text/70 hover:border-y/30 hover:bg-y/[0.04] hover:text-y",
                  cell.isToday && !selected && "border-y/20 text-y",
                  selected && "border-y bg-y font-bold text-black",
                )}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </FormSection>

      {state.date && (
        <FormSection title={`Pick a Time — ${state.date}`}>
          {blockAllSlots ? (
            <p className="py-4 font-mono text-xs tracking-[0.08em] text-y/60">
              Same-day bookings are unavailable after {cutoffLabel} Central.
              Please pick a future date.
            </p>
          ) : availabilityLoading ? (
            <p className="py-4 font-mono text-xs tracking-[0.08em] text-text/40">
              Checking availability…
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
              {BOOKING_TIME_SLOTS.map((t) => {
                const selected = state.time === t;
                const fullyBooked =
                  availability?.fullyBookedSlots.includes(t) ?? false;
                const slotUnavailable = !isTimeSlotSelectable(
                  state.date,
                  t,
                  schedulingRules,
                );
                const disabled = fullyBooked || slotUnavailable;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={disabled}
                    onClick={() => onPickTime(t)}
                    className={cn(
                      "rounded-[4px] border bg-white/[0.03] px-2.5 py-3 text-center font-mono text-xs font-semibold transition-all",
                      disabled
                        ? "cursor-not-allowed border-white/5 text-white/20 line-through"
                        : "cursor-pointer border-border-faint text-text/60 hover:border-y/30 hover:bg-y/[0.04] hover:text-y",
                      selected &&
                        !disabled &&
                        "border-y bg-y font-bold text-black",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}
        </FormSection>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   STEP 3 — Detailer + Contact + Location
─────────────────────────────────────────────────────────────────────*/

function Step3({
  state,
  update,
  paymentRef,
  availability,
  detailers,
  locationTypes,
}: {
  state: BookingState;
  update: <K extends keyof BookingState>(k: K, v: BookingState[K]) => void;
  paymentRef: RefObject<BookingCardCaptureApi | null>;
  availability: DetailerAvailabilitySnapshot | null;
  detailers: DetailerCardInfo[];
  locationTypes: string[];
}) {
  const autoAssignUnavailable =
    Boolean(state.time) &&
    Boolean(availability?.fullyBookedSlots.includes(state.time));

  return (
    <>
      <FormSection
        title={
          <>
            Choose Your Detailer{" "}
            <span className="ml-2 font-mono text-[13px] font-normal normal-case tracking-[0.05em] text-muted">
              — Optional
            </span>
          </>
        }
      >
        <p className="mb-6 font-mono text-xs tracking-[0.06em] text-text/35">
          No preference? We&rsquo;ll assign the best available.
        </p>
        <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          <DetailerCard
            name=""
            label="Auto-Assign"
            sub={
              autoAssignUnavailable ? "Fully booked at this time" : "Best available"
            }
            selected={state.detailer === ""}
            disabled={autoAssignUnavailable}
            onClick={() => update("detailer", "")}
          />
          {detailers.map((d) => {
            const busy =
              Boolean(state.time) &&
              Boolean(
                availability?.busySlotsByDetailer[d.name]?.includes(state.time),
              );
            const photoSrc =
              d.photo &&
              (d.photo.startsWith("http") ? d.photo : assetPath(d.photo));
            return (
              <DetailerCard
                key={d.name}
                name={d.name}
                photo={photoSrc}
                selected={state.detailer === d.name}
                disabled={busy}
                sub={busy ? "Booked at this time" : undefined}
                onClick={() => update("detailer", d.name)}
              />
            );
          })}
        </div>
      </FormSection>

      <FormSection title="Your Information">
        <FormRow className="mb-3.5">
          <FieldGroup>
            <Label htmlFor="fn">First Name</Label>
            <Input
              id="fn"
              placeholder="Jordan"
              value={state.firstName}
              onChange={(e) => update("firstName", e.target.value)}
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="ln">Last Name</Label>
            <Input
              id="ln"
              placeholder="Smith"
              value={state.lastName}
              onChange={(e) => update("lastName", e.target.value)}
            />
          </FieldGroup>
        </FormRow>
        <FormRow>
          <FieldGroup>
            <Label htmlFor="ph">Phone</Label>
            <Input
              id="ph"
              type="tel"
              placeholder="(405) 555-0100"
              value={state.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="em">Email</Label>
            <Input
              id="em"
              type="email"
              placeholder="you@email.com"
              value={state.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </FieldGroup>
        </FormRow>
      </FormSection>

      <FormSection title="Service Location">
        <FormRow cols={1} className="mb-3.5">
          <FieldGroup>
            <Label htmlFor="lt">Location Type</Label>
            <Select
              id="lt"
              value={state.locationType}
              onChange={(e) => update("locationType", e.target.value)}
            >
              <option value="">Select location type…</option>
              {locationTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </FieldGroup>
        </FormRow>
        <FormRow cols={1} className="mb-3.5">
          <FieldGroup>
            <Label htmlFor="ad">Street Address</Label>
            <Input
              id="ad"
              placeholder="123 Main St"
              value={state.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </FieldGroup>
        </FormRow>
        <FormRow className="mb-3.5">
          <FieldGroup>
            <Label htmlFor="ct">City</Label>
            <Input
              id="ct"
              placeholder="Edmond"
              value={state.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="zp">ZIP Code</Label>
            <Input
              id="zp"
              placeholder="73013"
              value={state.zip}
              onChange={(e) => update("zip", e.target.value)}
            />
            {state.locationType &&
              state.locationType !== "Drop off at your Edmond location" && (
                <p className="mt-1.5 font-mono text-[9px] leading-relaxed text-text/35">
                  We service metro areas around OKC, Tulsa, and Enid. ZIP prefixes
                  like 731 or 741 cover whole regions — not every code listed.
                </p>
              )}
          </FieldGroup>
        </FormRow>
        <FormRow cols={1} className="mb-3.5">
          <FieldGroup>
            <Label htmlFor="vi">Year, Make &amp; Model</Label>
            <Input
              id="vi"
              placeholder="e.g. 2021 Toyota Camry"
              value={state.vehicleInfo}
              onChange={(e) => update("vehicleInfo", e.target.value)}
            />
          </FieldGroup>
        </FormRow>
        <FormRow cols={1}>
          <FieldGroup>
            <Label htmlFor="nt">Special Requests</Label>
            <Textarea
              id="nt"
              placeholder="Any specific areas to focus on, access instructions, etc."
              value={state.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </FieldGroup>
        </FormRow>
      </FormSection>

      {isStripeCardCaptureAvailable() && (
        <FormSection
          title={
            <>
              Payment method{" "}
              <span className="ml-2 font-mono text-[13px] font-normal normal-case tracking-[0.05em] text-muted">
                — Optional
              </span>
            </>
          }
        >
          <BookingCardCapture
            ref={paymentRef}
            saveCardOnFile={state.saveCardOnFile}
            onSaveCardOnFileChange={(v) => update("saveCardOnFile", v)}
            email={state.email}
          />
        </FormSection>
      )}
    </>
  );
}

function DetailerCard({
  name,
  label,
  sub,
  photo,
  selected,
  disabled = false,
  onClick,
}: {
  name: string;
  label?: string;
  sub?: string;
  photo?: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const noPref = name === "";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2.5 rounded-lg border bg-card px-4 pb-4 pt-5 text-center transition-colors",
        disabled
          ? "cursor-not-allowed border-white/5 opacity-45"
          : "cursor-pointer",
        !disabled &&
          (selected
            ? "border-y bg-y/[0.08]"
            : "border-border-faint hover:border-y/20 hover:bg-card2"),
      )}
    >
      <span
        className={cn(
          "absolute right-2.5 top-2.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border transition-all",
          selected ? "border-y bg-y text-black" : "border-white/15 text-transparent",
        )}
      >
        {selected && <Icon name="check" className="h-2.5 w-2.5" />}
      </span>
      <div
        className={cn(
          "relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 bg-y/[0.05] transition-colors",
          selected ? "border-y/55" : "border-y/20",
          noPref && "border-dashed border-white/10",
        )}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Icon name="user" className="h-7 w-7 text-y/30" />
        )}
      </div>
      <div
        className={cn(
          "font-display text-[18px] leading-none tracking-[0.06em]",
          noPref && "font-mono text-sm tracking-[0.04em] text-text/40",
        )}
      >
        {(label ?? name).toUpperCase()}
      </div>
      {sub && (
        <div className="mt-0.5 font-mono text-[9px] tracking-[0.06em] text-text/30">
          {sub}
        </div>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   STEP 4 — Summary + Payment notice
─────────────────────────────────────────────────────────────────────*/

function Step4({
  state,
  pkg,
  pkgPrice,
  addonTotal,
  subtotal,
  total,
}: {
  state: BookingState;
  pkg: SitePackage | null;
  pkgPrice: number | null;
  addonTotal: number;
  subtotal: number | null;
  total: number | null;
}) {
  const discountDollars = (state.appliedPromo?.discountCents ?? 0) / 100;
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <FormSection title="Booking Summary" className="mb-0" size="large">
        <dl className="rounded-md border border-y/15 bg-y/[0.04] p-6 sm:p-8">
          <SummaryRow large label="Service" value={pkg?.name ?? "Not selected"} />
          <SummaryRow
            large
            label="Vehicle"
            value={`${vehicleLabel(state.vehicleKey)}${
              state.vehicleInfo ? ` — ${state.vehicleInfo}` : ""
            }`}
          />
          <SummaryRow
            large
            label="Date & Time"
            value={`${state.date}${state.time ? ` at ${state.time}` : ""}`}
          />
          <SummaryRow
            large
            label="Location"
            value={`${state.locationType}${
              state.address ? ` · ${state.address}, ${state.city}` : ""
            }`}
          />
          <SummaryRow
            large
            label="Name"
            value={`${state.firstName} ${state.lastName}`}
          />
          <SummaryRow
            large
            label="Contact"
            value={
              state.phone || state.email ? (
                <span className="inline-flex flex-col items-end gap-1">
                  {state.phone ? <span>{state.phone}</span> : null}
                  {state.email ? (
                    <span className="break-all font-normal text-text/80">
                      {state.email}
                    </span>
                  ) : null}
                </span>
              ) : (
                "—"
              )
            }
          />
          <SummaryRow
            large
            label="Detailer"
            value={state.detailer || "No preference"}
          />
          {state.addons.size > 0 && (
            <SummaryRow
              large
              label="Add-Ons"
              value={Array.from(state.addons).join(", ")}
            />
          )}
          {state.appliedPromo && (
            <SummaryRow large label="Promo" value={state.appliedPromo.code} />
          )}
          <SummaryRow large label="Plastic Conditioning" value={state.plasticCondition} />
          <SummaryRow large label="OK for Early Contact" value={state.earlyContact} />
          {state.saveCardOnFile && (
            <SummaryRow
              large
              label="Card on file"
              value="Saved securely with Stripe when you confirm"
            />
          )}
        </dl>

        <div className="mt-6 overflow-hidden rounded-md border border-y/20">
          <div className="border-b border-y/10 bg-y/[0.04] px-5 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted sm:px-6">
            Price Breakdown
          </div>
          <div className="flex flex-col gap-3 px-5 py-5 sm:gap-4 sm:px-6 sm:py-6">
            <BreakdownRow
              large
              label="Package"
              value={pkgPrice !== null ? formatCurrency(pkgPrice) : "—"}
            />
            {addonTotal > 0 && (
              <BreakdownRow large label="Add-Ons" value={`+${formatCurrency(addonTotal)}`} />
            )}
            {subtotal !== null && discountDollars > 0 && (
              <>
                <BreakdownRow large label="Subtotal" value={formatCurrency(subtotal)} />
                <BreakdownRow
                  large
                  label={`Promo (${state.appliedPromo?.code})`}
                  value={`−${formatCurrency(discountDollars)}`}
                />
              </>
            )}
            <div className="h-px bg-white/[0.06]" />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-y sm:text-sm">
                Estimated Total
              </span>
              <span className="font-display text-[44px] leading-none tracking-[0.03em] text-y sm:text-[52px]">
                {total !== null ? formatCurrency(total) : "—"}
              </span>
            </div>
            <p className="font-mono text-xs leading-relaxed tracking-[0.04em] text-text/45 sm:text-sm">
              No charge today. Final total may vary based on vehicle condition
              and selected add-ons.
            </p>
          </div>
        </div>
      </FormSection>

      <FormSection title="Payment & Next Steps" className="mb-0" size="large">
        <div className="flex items-center gap-3 font-mono text-sm tracking-[0.05em] text-text/60">
          <Icon name="shield" className="h-5 w-5 shrink-0 text-y/70" />
          {state.saveCardOnFile
            ? "Card saved on file — pay after service as usual"
            : "We collect payment after service"}
        </div>

        <div className="my-6 flex flex-col gap-4 sm:my-8 sm:gap-5">
          <Step4Bullet num="1" label="Submit this booking request" />
          <Step4Bullet num="2" label="A Lemonhead's team member confirms by phone or text" />
          <Step4Bullet num="3" label="We arrive at your address and start the detail" />
          <Step4Bullet num="4" label="Pay through the app or a secure digital invoice" />
        </div>

        <div className="rounded-md border border-red-500/25 bg-red-500/[0.05] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Icon
              name="alert"
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400"
            />
            <p className="text-sm leading-relaxed text-red-300/90 sm:text-base sm:leading-relaxed">
              A 10% gratuity is added to invoices left unpaid after 48 hours.
              Submitting this request reserves the slot pending confirmation.
            </p>
          </div>
        </div>
      </FormSection>
    </div>
  );
}

function Step4Bullet({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-y/30 bg-y/10 font-mono text-sm font-bold text-y">
        {num}
      </span>
      <span className="pt-1 text-base leading-relaxed text-text/80 sm:text-lg">
        {label}
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  large,
}: {
  label: string;
  value: ReactNode;
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-b border-white/5 py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        large && "gap-2 py-4 sm:py-5",
      )}
    >
      <dt
        className={cn(
          "shrink-0 font-mono uppercase tracking-[0.1em] text-white/80",
          large ? "text-xs sm:text-sm" : "pt-0.5 text-[10px]",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 font-semibold leading-snug break-words text-text/90",
          large
            ? "text-base sm:text-right sm:text-lg"
            : "flex-1 text-right text-[13px]",
        )}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  large,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-4",
        large ? "text-base sm:text-lg" : "text-[13px]",
      )}
    >
      <span
        className={cn(
          "font-mono tracking-[0.04em] text-text/50",
          large ? "text-sm sm:text-base" : "text-[11px]",
        )}
      >
        {label}
      </span>
      <span className="font-semibold text-text/90">{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CONFIRMATION SCREEN
─────────────────────────────────────────────────────────────────────*/

function ConfirmScreen({
  state,
  pkg,
  total,
  bookingId,
  assignedDetailer,
}: {
  state: BookingState;
  pkg: SitePackage | null;
  total: number | null;
  bookingId: string;
  assignedDetailer?: string;
}) {
  return (
    <div className="py-20 text-center">
      <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full border-2 border-y/30 bg-y/[0.06] text-y">
        <Icon name="check" className="h-7 w-7" />
      </div>
      <h2 className="font-display text-[56px] tracking-[0.04em] text-y">
        YOU&rsquo;RE BOOKED!
      </h2>
      <p className="mt-3 font-mono text-[13px] tracking-[0.05em] text-text/40">
        Confirmation sent to {state.email}.<br />
        Reference <span className="text-y">{bookingId}</span>
      </p>

      <div className="mx-auto mt-9 max-w-[420px] rounded-md border border-border-faint bg-card p-6 text-left">
        <ConfirmRow label="Service" value={pkg?.name ?? ""} />
        <ConfirmRow
          label="Date"
          value={`${state.date}${state.time ? ` · ${state.time}` : ""}`}
        />
        <ConfirmRow
          label="Vehicle"
          value={`${vehicleLabel(state.vehicleKey)} — ${state.vehicleInfo || "—"}`}
        />
        <ConfirmRow
          label="Detailer"
          value={
            assignedDetailer ??
            state.detailer ??
            "Assigned at confirmation"
          }
        />
        <ConfirmRow
          label="Location"
          value={`${state.address}, ${state.city}`}
        />
        {total !== null && (
          <div className="mt-2 flex items-center justify-between border-t border-y/20 pt-3.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-y">
              Estimated Total
            </span>
            <span className="font-display text-[28px] tracking-[0.03em] text-y">
              {formatCurrency(total)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-10">
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] py-2 text-[13px] last:border-b-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   FORM CHROME
─────────────────────────────────────────────────────────────────────*/

function FormSection({
  title,
  className,
  children,
  size = "default",
}: {
  title: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  size?: "default" | "large";
}) {
  const isLarge = size === "large";
  return (
    <section
      className={cn(
        "relative mb-4 overflow-hidden rounded-lg border border-border-faint bg-card",
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-y before:to-transparent",
        isLarge ? "p-8 sm:p-10 lg:p-12" : "p-8 sm:p-10",
        className,
      )}
    >
      <h2
        className={cn(
          "font-display tracking-[0.06em] text-y",
          isLarge
            ? "mb-8 text-3xl sm:mb-10 sm:text-4xl"
            : "mb-6 text-2xl",
        )}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function FormNav({
  step,
  isPending,
  onBack,
  onNext,
  onSubmit,
}: {
  step: Step;
  isPending: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="mt-2 flex items-center justify-between gap-3">
      {step > 1 ? (
        <Button variant="outline" type="button" onClick={onBack}>
          <Icon name="arrowLeft" className="h-3.5 w-3.5" /> Back
        </Button>
      ) : (
        <span />
      )}
      <span
        className={cn(
          "font-mono uppercase tracking-[0.15em] text-muted",
          step === 4 ? "text-xs sm:text-sm" : "text-[9px]",
        )}
      >
        Step {step} of 4
      </span>
      {step < 4 ? (
        <Button type="button" onClick={onNext}>
          Next <Icon name="arrowRight" className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          size="lg"
          className="min-h-12 px-8 text-base sm:min-h-14 sm:px-10 sm:text-lg"
        >
          {isPending ? "Sending…" : "Confirm Booking"}
          {!isPending && <Icon name="arrowRight" className="h-3.5 w-3.5" />}
        </Button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   helpers
─────────────────────────────────────────────────────────────────────*/

function vehicleLabel(key: BookingState["vehicleKey"]) {
  switch (key) {
    case "coupe":
      return "2-Door Coupe";
    case "sedan":
      return "4-Door Sedan";
    case "suv2":
      return "2-Row SUV";
    case "suv3":
      return "3-Row SUV";
    case "truck":
      return "Truck";
    case "van":
      return "Van";
    default:
      return "";
  }
}
