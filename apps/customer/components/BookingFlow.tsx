import { useNavigation, useRouter } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  ScreenCenter,
  Text,
} from "@lemonheads/mobile-ui";

import { BookingDatePicker } from "@/components/BookingDatePicker";
import { useAuth } from "@/lib/auth-context";
import { apiGetPublic, apiGet, apiPostPublic, apiPost } from "@/lib/api";
import type {
  BookingAvailabilityResponse,
  BookingConfigResponse,
  BookingDatesResponse,
  BookingPreviewResponse,
  BookingSubmitResponse,
  CatalogPackage,
  CustomerVehicle,
  CustomerVehiclesResponse,
  CustomerAddress,
  CustomerAddressesResponse,
  CheckoutRewardOption,
  LoyaltyApplyResponse,
  RewardsCheckoutResponse,
  CustomerMeResponse,
} from "@/lib/types";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEPS: { num: Step; label: string }[] = [
  { num: 1, label: "Service" },
  { num: 2, label: "Add-ons" },
  { num: 3, label: "Location" },
  { num: 4, label: "Schedule" },
  { num: 5, label: "Your info" },
  { num: 6, label: "Confirm" },
];

type Props = {
  initialPackageKey?: string;
};

function isDetailerBusyAtTime(
  availability: BookingAvailabilityResponse | null,
  detailer: string,
  slot: string,
) {
  return Boolean(
    detailer &&
      slot &&
      availability?.busySlotsByDetailer[detailer]?.includes(slot),
  );
}

function isSlotFullyBooked(
  availability: BookingAvailabilityResponse | null,
  slot: string,
) {
  return Boolean(slot && availability?.fullyBookedSlots.includes(slot));
}

function validateScheduleSelection(
  availability: BookingAvailabilityResponse | null,
  dateLabel: string,
  time: string,
  requestedDetailer: string,
): string | null {
  if (!dateLabel) return "Pick a date.";
  if (!time) return "Pick a time.";
  if (isSlotFullyBooked(availability, time)) {
    return "That time is fully booked. Pick another slot.";
  }
  if (isDetailerBusyAtTime(availability, requestedDetailer, time)) {
    return `${requestedDetailer} is not available at that time. Pick another detailer or use auto-assign.`;
  }
  return null;
}

export function BookingFlow({ initialPackageKey }: Props) {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { customer, session } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const scrollRef = useRef<ScrollView>(null);
  const skipStepScrollRef = useRef(true);
  const [config, setConfig] = useState<BookingConfigResponse | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<BookingSubmitResponse | null>(null);

  const [packageKey, setPackageKey] = useState(initialPackageKey ?? "");
  const [vehicleKey, setVehicleKey] = useState("");
  const [addons, setAddons] = useState<string[]>([]);
  const [plasticCondition, setPlasticCondition] = useState<"Yes" | "No">("No");
  const [earlyContact, setEarlyContact] = useState<"Yes" | "No">("Yes");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [time, setTime] = useState("");
  const [requestedDetailer, setRequestedDetailer] = useState("");
  const [customerName, setCustomerName] = useState(customer?.fullName ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [notes, setNotes] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [appliedLoyalty, setAppliedLoyalty] = useState<{
    redemptionId: string;
    label: string;
    discountCents: number;
    autoAddedAddon?: string;
  } | null>(null);
  const [selectedRewardKey, setSelectedRewardKey] = useState("");
  const [rewardsContext, setRewardsContext] = useState<RewardsCheckoutResponse | null>(null);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loyaltyMessage, setLoyaltyMessage] = useState<string | null>(null);

  const [dates, setDates] = useState<BookingDatesResponse["dates"]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [availability, setAvailability] = useState<BookingAvailabilityResponse | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [pricing, setPricing] = useState<BookingPreviewResponse | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [savedVehicles, setSavedVehicles] = useState<CustomerVehicle[]>([]);
  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const appliedDefaultAddressRef = useRef(false);

  const currentStep = STEPS[step - 1];

  useEffect(() => {
    if (customer) {
      setCustomerName((prev) => prev || customer.fullName);
      setEmail((prev) => prev || customer.email);
      setPhone((prev) => prev || customer.phone);
    }
  }, [customer]);

  useEffect(() => {
    if (!session?.access_token || !customer) {
      setSavedVehicles([]);
      setSelectedGarageId(null);
      return;
    }

    let cancelled = false;
    apiGet<CustomerVehiclesResponse>("/api/mobile/customer/vehicles", session.access_token)
      .then((res) => {
        if (cancelled) return;
        setSavedVehicles(res.vehicles);
        const preferred =
          res.vehicles.find((vehicle) => vehicle.isDefault) ?? res.vehicles[0];
        if (preferred) {
          setVehicleKey((prev) => prev || preferred.vehicleKey);
          setVehicleInfo((prev) => prev || preferred.vehicleInfo);
          setSelectedGarageId((prev) => prev || preferred.id);
        }
      })
      .catch(() => {
        if (!cancelled) setSavedVehicles([]);
      });

    return () => {
      cancelled = true;
    };
  }, [customer, session?.access_token]);

  const selectGarageVehicle = useCallback((vehicle: CustomerVehicle) => {
    setSelectedGarageId(vehicle.id);
    setVehicleKey(vehicle.vehicleKey);
    setVehicleInfo(vehicle.vehicleInfo);
  }, []);

  useEffect(() => {
    if (!session?.access_token || !customer) {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      return;
    }

    let cancelled = false;
    apiGet<CustomerAddressesResponse>("/api/mobile/customer/addresses", session.access_token)
      .then((res) => {
        if (cancelled) return;
        setSavedAddresses(res.addresses);
        const preferred =
          res.addresses.find((saved) => saved.isDefault) ?? res.addresses[0];
        if (preferred && !appliedDefaultAddressRef.current) {
          appliedDefaultAddressRef.current = true;
          setSelectedAddressId(preferred.id);
          setLocation(preferred.locationType);
          setAddress(preferred.address);
          setCity(preferred.city);
          setZip(preferred.zip);
        }
      })
      .catch(() => {
        if (!cancelled) setSavedAddresses([]);
      });

    return () => {
      cancelled = true;
    };
  }, [customer, session?.access_token]);

  const selectSavedAddress = useCallback((saved: CustomerAddress) => {
    setSelectedAddressId(saved.id);
    setLocation(saved.locationType);
    setAddress(saved.address);
    setCity(saved.city);
    setZip(saved.zip);
  }, []);

  const clearSelectedAddress = useCallback(() => {
    setSelectedAddressId(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingConfig(true);
    apiGetPublic<BookingConfigResponse>("/api/mobile/customer/booking/config")
      .then((res) => {
        if (cancelled) return;
        setConfig(res);
        setLocation((prev) => prev || res.catalog.locationTypes[0] || "");
        setPackageKey((prev) => prev || initialPackageKey || res.catalog.packages[0]?.key || "");
        setVehicleKey((prev) => prev || res.vehicles[0]?.key || "");
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load booking options");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingConfig(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialPackageKey]);

  const selectedPackage = useMemo(
    () => config?.catalog.packages.find((p) => p.key === packageKey) ?? null,
    [config, packageKey],
  );

  const selectedVehicle = useMemo(
    () => config?.vehicles.find((v) => v.key === vehicleKey) ?? null,
    [config, vehicleKey],
  );

  const loadDates = useCallback(async () => {
    if (!location) return;
    setDatesLoading(true);
    try {
      const params = new URLSearchParams({ location, zip, city });
      const res = await apiGetPublic<BookingDatesResponse>(
        `/api/mobile/customer/booking/dates?${params}`,
      );
      setDates(res.dates);
      if (dateLabel && !res.dates.some((d) => d.label === dateLabel)) {
        setDateLabel("");
        setTime("");
        setRequestedDetailer("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dates");
    } finally {
      setDatesLoading(false);
    }
  }, [city, dateLabel, location, zip]);

  const loadAvailability = useCallback(async () => {
    if (!dateLabel || !selectedPackage) return;
    setAvailabilityLoading(true);
    try {
      const params = new URLSearchParams({
        dateLabel,
        durationHours: String(selectedPackage.durationHours),
        packageKey,
        location,
        zip,
        city,
      });
      const res = await apiGetPublic<BookingAvailabilityResponse>(
        `/api/mobile/customer/booking/availability?${params}`,
      );
      setAvailability(res);

      setTime((currentTime) => {
        const slotStillValid =
          currentTime &&
          !res.fullyBookedSlots.includes(currentTime) &&
          res.slotStates.find((s) => s.slot === currentTime)?.selectable;
        const nextTime = slotStillValid ? currentTime : "";
        setRequestedDetailer((currentDetailer) => {
          if (
            currentDetailer &&
            nextTime &&
            res.busySlotsByDetailer[currentDetailer]?.includes(nextTime)
          ) {
            return "";
          }
          if (currentDetailer && !nextTime) return "";
          return currentDetailer;
        });
        return nextTime;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load times");
    } finally {
      setAvailabilityLoading(false);
    }
  }, [city, dateLabel, location, packageKey, selectedPackage, zip]);

  const loadPricing = useCallback(async () => {
    if (!packageKey || !vehicleKey) return;
    setPricingLoading(true);
    try {
      const res = await apiPostPublic<BookingPreviewResponse>(
        "/api/mobile/customer/booking/preview",
        {
          packageKey,
          vehicleKey,
          addonNames: addons,
          promoCode: appliedPromo ?? undefined,
          loyaltyRedemptionId: appliedLoyalty?.redemptionId,
        },
      );
      setPricing(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pricing");
    } finally {
      setPricingLoading(false);
    }
  }, [addons, appliedLoyalty?.redemptionId, appliedPromo, packageKey, vehicleKey]);

  const loadRewards = useCallback(async () => {
    if (!session?.access_token || !customer || !packageKey || !vehicleKey) {
      setRewardsContext(null);
      return;
    }
    setRewardsLoading(true);
    try {
      const res = await apiPost<RewardsCheckoutResponse>(
        "/api/mobile/customer/booking/rewards",
        {
          packageKey,
          vehicleKey,
          addonNames: addons,
        },
        session.access_token,
      );
      setRewardsContext(res);
      setLoyaltyMessage(null);
    } catch (err) {
      setRewardsContext(null);
      setLoyaltyMessage(
        err instanceof Error ? err.message : "Could not load rewards",
      );
    } finally {
      setRewardsLoading(false);
    }
  }, [addons, customer, packageKey, session?.access_token, vehicleKey]);

  useEffect(() => {
    if (step === 4) void loadDates();
  }, [loadDates, step]);

  useEffect(() => {
    if (step === 4 && dateLabel) void loadAvailability();
  }, [dateLabel, loadAvailability, step]);

  useEffect(() => {
    if (step === 6) void loadPricing();
  }, [loadPricing, step]);

  useEffect(() => {
    if (step === 6) void loadRewards();
  }, [loadRewards, step]);

  const handleSetDate = (label: string) => {
    setDateLabel(label);
    setTime("");
    setRequestedDetailer("");
    setError(null);
  };

  const handleSetTime = (slot: string) => {
    setTime(slot);
    setRequestedDetailer((detailer) => {
      if (detailer && isDetailerBusyAtTime(availability, detailer, slot)) {
        setError(`${detailer} is booked at that time. Choose another detailer or auto-assign.`);
        return "";
      }
      setError(null);
      return detailer;
    });
  };

  const handleSetDetailer = (name: string) => {
    if (name && time && isDetailerBusyAtTime(availability, name, time)) {
      setError(`${name} is booked at that time. Pick another detailer or auto-assign.`);
      return;
    }
    setError(null);
    setRequestedDetailer(name);
  };

  const toggleAddon = (name: string) => {
    setAddons((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name],
    );
  };

  const applyPromo = async () => {
    if (!promoCode.trim() || !packageKey || !vehicleKey) return;
    setPromoLoading(true);
    setError(null);
    try {
      const res = await apiPostPublic<{
        code: string;
        totalCents: number;
        totalDisplay: string;
        loyaltyDiscountCents: number;
        discountCents: number;
        subtotalCents: number;
        promoDiscountCents: number;
      }>("/api/mobile/customer/booking/promo", {
        code: promoCode,
        packageKey,
        vehicleKey,
        addonNames: addons,
        loyaltyRedemptionId: appliedLoyalty?.redemptionId,
      });
      setAppliedPromo(res.code);
      setPromoCode(res.code);
      setPricing({
        subtotalCents: res.subtotalCents,
        promoDiscountCents: res.promoDiscountCents,
        loyaltyDiscountCents: res.loyaltyDiscountCents,
        discountCents: res.discountCents,
        totalCents: res.totalCents,
        promoCode: res.code,
        packageName: selectedPackage?.name ?? "",
        totalDisplay: res.totalDisplay,
      });
      if (appliedLoyalty) {
        setAppliedLoyalty((current) =>
          current ? { ...current, discountCents: res.loyaltyDiscountCents } : null,
        );
      }
    } catch (err) {
      setAppliedPromo(null);
      setError(err instanceof Error ? err.message : "Invalid promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const applyLoyalty = async () => {
    if (!session?.access_token || !packageKey || !vehicleKey || !selectedRewardKey) return;
    const option = rewardsContext?.options.find(
      (entry) => `${entry.kind}:${entry.id}` === selectedRewardKey,
    );
    if (!option || (!option.applicable && !option.addAddonAtCheckout)) return;

    let nextAddons = [...addons];
    let autoAddedAddon: string | undefined;
    if (
      option.addAddonAtCheckout &&
      option.rewardAddonName &&
      !nextAddons.includes(option.rewardAddonName)
    ) {
      nextAddons = [...nextAddons, option.rewardAddonName];
      autoAddedAddon = option.rewardAddonName;
    }

    setLoyaltyLoading(true);
    setError(null);
    try {
      const res = await apiPost<LoyaltyApplyResponse>(
        "/api/mobile/customer/booking/rewards/apply",
        {
          packageKey,
          vehicleKey,
          addonNames: nextAddons,
          pendingRedemptionId: option.kind === "pending" ? option.redemptionId : undefined,
          goalId: option.kind === "goal" ? option.goalId : undefined,
          promoCode: appliedPromo ?? undefined,
        },
        session.access_token,
      );
      if (autoAddedAddon) {
        setAddons(nextAddons);
      }
      setAppliedLoyalty({
        redemptionId: res.redemptionId,
        label: res.label,
        discountCents: res.discountCents,
        autoAddedAddon,
      });
      setLoyaltyMessage(`${res.label} applied — you save $${(res.discountCents / 100).toFixed(2)}.`);
      setPricing({
        subtotalCents: res.subtotalCents,
        promoDiscountCents: pricing?.promoDiscountCents ?? 0,
        loyaltyDiscountCents: res.discountCents,
        discountCents: (pricing?.promoDiscountCents ?? 0) + res.discountCents,
        totalCents: res.totalCents,
        promoCode: appliedPromo,
        packageName: selectedPackage?.name ?? "",
        totalDisplay: res.totalDisplay,
      });
    } catch (err) {
      setAppliedLoyalty(null);
      setError(err instanceof Error ? err.message : "Could not apply reward");
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const clearLoyalty = () => {
    if (appliedLoyalty?.autoAddedAddon) {
      setAddons((current) => current.filter((name) => name !== appliedLoyalty.autoAddedAddon));
    }
    setAppliedLoyalty(null);
    setSelectedRewardKey("");
    setLoyaltyMessage(null);
    void loadPricing();
    void loadRewards();
  };

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!packageKey) return "Select a service package.";
      if (!vehicleKey) return "Select a vehicle type.";
    }
    if (step === 3) {
      if (!location) return "Choose a location type.";
      if (!location.includes("Drop off")) {
        if (!address.trim()) return "Enter your address.";
        if (!city.trim()) return "Enter your city.";
        if (!zip.trim()) return "Enter your ZIP code.";
      }
    }
    if (step === 4) {
      return validateScheduleSelection(availability, dateLabel, time, requestedDetailer);
    }
    if (step === 5) {
      if (customerName.trim().length < 2) return "Enter your name.";
      if (!email.includes("@")) return "Enter a valid email.";
      if (phone.trim().length < 7) return "Enter your phone number.";
    }
    if (step === 6) {
      return validateScheduleSelection(availability, dateLabel, time, requestedDetailer);
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(6, s + 1) as Step);
  };

  const goBack = useCallback(() => {
    setError(null);
    if (step === 1) {
      router.back();
      return;
    }
    setStep((s) => Math.max(1, s - 1) as Step);
  }, [router, step]);

  useEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => (
        <Pressable
          onPress={goBack}
          hitSlop={12}
          className="ml-1 flex-row items-center gap-0.5 px-1 py-1"
        >
          <Ionicons name="chevron-back" size={22} color="#edeae0" />
          <Text className="text-base text-foreground">Back</Text>
        </Pressable>
      ),
    });
  }, [goBack, navigation]);

  useEffect(() => {
    if (skipStepScrollRef.current) {
      skipStepScrollRef.current = false;
      return;
    }
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [step]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (step > 1) {
        setError(null);
        setStep((s) => Math.max(1, s - 1) as Step);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  const submit = async () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    if (!selectedPackage || !selectedVehicle) {
      setError("Select a service and vehicle.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await apiPostPublic<BookingSubmitResponse>(
        "/api/mobile/customer/bookings",
        {
          customerName: customerName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          service: selectedPackage.name,
          serviceKey: packageKey,
          vehicleKey,
          vehicle: selectedVehicle.label,
          vehicleInfo: vehicleInfo.trim(),
          date: dateLabel,
          time,
          location,
          address: address.trim(),
          city: city.trim(),
          zip: zip.trim(),
          requestedDetailer: requestedDetailer.trim(),
          durationHours: selectedPackage.durationHours,
          addons,
          estimatedTotal: pricing?.totalDisplay ?? "TBD",
          plasticCondition,
          earlyContact,
          notes: notes.trim(),
          promoCode: appliedPromo ?? "",
          loyaltyRedemptionId: appliedLoyalty?.redemptionId ?? "",
          cardOnFile: false,
        },
      );
      setSuccess(res);
    } catch (submitErr) {
      setError(submitErr instanceof Error ? submitErr.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingConfig && !config) {
    return (
      <ScreenCenter>
        <ActivityIndicator color="#f0c93a" size="large" />
      </ScreenCenter>
    );
  }

  if (success) {
    return (
      <ScreenCenter className="px-6">
        <Text variant="title">You're booked!</Text>
        <Text className="mt-3 text-base text-foreground">Reference: {success.bookingId}</Text>
        {success.assignedDetailer ? (
          <Text className="mt-2 text-foreground">Detailer: {success.assignedDetailer}</Text>
        ) : null}
        <Text variant="muted" className="mt-4 text-center leading-5">
          Confirmation email sent to {email}. Questions? Call 833-536-6648.
        </Text>
        <Button className="mt-6 w-full" onPress={() => router.replace("/(customer)/(tabs)/book")}>
          View my bookings
        </Button>
        <Button
          variant="outline"
          className="mt-3 w-full"
          onPress={() => router.replace("/(customer)/(tabs)/book")}
        >
          Book another
        </Button>
      </ScreenCenter>
    );
  }

  const autoAssignUnavailable = Boolean(time && isSlotFullyBooked(availability, time));

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 44}
    >
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="px-4 pb-32 pt-2"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      >
        <BookingProgress step={step} label={currentStep.label} />

        {error ? (
          <View className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2">
            <Text variant="error">{error}</Text>
          </View>
        ) : null}

        {step === 1 ? (
          <StepService
            packages={config?.catalog.packages ?? []}
            vehicles={config?.vehicles ?? []}
            packageKey={packageKey}
            vehicleKey={vehicleKey}
            savedVehicles={savedVehicles}
            selectedGarageId={selectedGarageId}
            onSelectGarage={selectGarageVehicle}
            onPackage={setPackageKey}
            onVehicle={(key) => {
              setVehicleKey(key);
              setSelectedGarageId(null);
            }}
          />
        ) : null}

        {step === 2 ? (
          <StepAddons
            addons={config?.catalog.addons ?? []}
            selected={addons}
            onToggle={toggleAddon}
            plasticCondition={plasticCondition}
            onPlastic={setPlasticCondition}
            earlyContact={earlyContact}
            onEarlyContact={setEarlyContact}
          />
        ) : null}

        {step === 3 ? (
          <StepLocation
            locationTypes={config?.catalog.locationTypes ?? []}
            location={location}
            address={address}
            city={city}
            zip={zip}
            savedAddresses={savedAddresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={selectSavedAddress}
            onLocation={(value) => {
              setLocation(value);
              clearSelectedAddress();
            }}
            onAddress={(value) => {
              setAddress(value);
              clearSelectedAddress();
            }}
            onCity={(value) => {
              setCity(value);
              clearSelectedAddress();
            }}
            onZip={(value) => {
              setZip(value);
              clearSelectedAddress();
            }}
          />
        ) : null}

        {step === 4 ? (
          <StepSchedule
            dates={dates}
            datesLoading={datesLoading}
            dateLabel={dateLabel}
            onDate={handleSetDate}
            availability={availability}
            availabilityLoading={availabilityLoading}
            time={time}
            onTime={handleSetTime}
            detailers={config?.detailers ?? []}
            requestedDetailer={requestedDetailer}
            onDetailer={handleSetDetailer}
            autoAssignUnavailable={autoAssignUnavailable}
          />
        ) : null}

        {step === 5 ? (
          <StepContact
            customerName={customerName}
            email={email}
            phone={phone}
            vehicleInfo={vehicleInfo}
            notes={notes}
            onName={setCustomerName}
            onEmail={setEmail}
            onPhone={setPhone}
            onVehicleInfo={setVehicleInfo}
            onNotes={setNotes}
          />
        ) : null}

        {step === 6 ? (
          <StepConfirm
            packageName={selectedPackage?.name ?? ""}
            vehicleLabel={selectedVehicle?.label ?? ""}
            addons={addons}
            location={location}
            address={address}
            city={city}
            zip={zip}
            dateLabel={dateLabel}
            time={time}
            detailer={requestedDetailer || "Auto-assign"}
            customerName={customerName}
            email={email}
            phone={phone}
            pricing={pricing}
            pricingLoading={pricingLoading}
            promoCode={promoCode}
            onPromoCode={setPromoCode}
            onApplyPromo={applyPromo}
            promoLoading={promoLoading}
            appliedPromo={appliedPromo}
            customer={customer}
            session={session}
            rewardsContext={rewardsContext}
            rewardsLoading={rewardsLoading}
            loyaltyLoading={loyaltyLoading}
            loyaltyMessage={loyaltyMessage}
            appliedLoyalty={appliedLoyalty}
            selectedRewardKey={selectedRewardKey}
            onSelectReward={setSelectedRewardKey}
            onApplyLoyalty={applyLoyalty}
            onClearLoyalty={clearLoyalty}
            onSignIn={() => router.push("/login")}
          />
        ) : null}

        <View className="mt-8 flex-row gap-3">
          <Button variant="outline" className="flex-1" onPress={goBack} disabled={submitting}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 6 ? (
            <Button className="flex-1" onPress={goNext}>
              Continue
            </Button>
          ) : (
            <Button className="flex-1" loading={submitting} disabled={submitting} onPress={submit}>
              Book now
            </Button>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function BookingProgress({ step, label }: { step: Step; label: string }) {
  return (
    <View className="mb-6">
      <Text variant="subtitle" className="mb-1">
        Step {step} of {STEPS.length} · {label}
      </Text>
      <View className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <View
          className="h-full rounded-full bg-primary"
          style={{ width: `${(step / STEPS.length) * 100}%` }}
        />
      </View>
    </View>
  );
}

function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Text className={`mb-4 mt-1 text-base font-bold text-primary ${className ?? ""}`}>
      {children}
    </Text>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="mb-5">
      <Label className="mb-2">{label}</Label>
      {children}
    </View>
  );
}

function OptionRow({
  title,
  subtitle,
  selected,
  disabled,
  onPress,
}: {
  title: string;
  subtitle?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={`mb-2 rounded-xl border px-4 py-3 ${
        disabled
          ? "border-border/50 opacity-40"
          : selected
            ? "border-primary bg-primary/5"
            : "border-border bg-card"
      }`}
    >
      <Text className={`font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
        {title}
      </Text>
      {subtitle ? <Text variant="muted" className="mt-0.5 text-xs">{subtitle}</Text> : null}
    </Pressable>
  );
}

function StepService({
  packages,
  vehicles,
  packageKey,
  vehicleKey,
  savedVehicles,
  selectedGarageId,
  onSelectGarage,
  onPackage,
  onVehicle,
}: {
  packages: CatalogPackage[];
  vehicles: BookingConfigResponse["vehicles"];
  packageKey: string;
  vehicleKey: string;
  savedVehicles: CustomerVehicle[];
  selectedGarageId: string | null;
  onSelectGarage: (vehicle: CustomerVehicle) => void;
  onPackage: (key: string) => void;
  onVehicle: (key: string) => void;
}) {
  return (
    <View>
      {savedVehicles.length ? (
        <>
          <SectionTitle>From your garage</SectionTitle>
          {savedVehicles.map((vehicle) => {
            const title =
              vehicle.nickname.trim() || vehicle.vehicleInfo || vehicle.vehicleLabel;
            const subtitle = vehicle.nickname.trim()
              ? [vehicle.vehicleLabel, vehicle.vehicleInfo].filter(Boolean).join(" · ")
              : vehicle.vehicleInfo
                ? vehicle.vehicleLabel
                : undefined;
            return (
              <OptionRow
                key={vehicle.id}
                title={title}
                subtitle={subtitle}
                selected={selectedGarageId === vehicle.id}
                onPress={() => onSelectGarage(vehicle)}
              />
            );
          })}
        </>
      ) : null}

      <SectionTitle>Choose your package</SectionTitle>
      {packages.map((pkg) => {
        const price = pkg.prices[vehicleKey] ?? Object.values(pkg.prices)[0] ?? 0;
        const selected = packageKey === pkg.key;
        return (
          <Pressable key={pkg.key} onPress={() => onPackage(pkg.key)} className="mb-3">
            <Card className={selected ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle>{pkg.name}</CardTitle>
                <Text className="text-lg font-bold text-primary">From ${price}</Text>
                <CardDescription>{pkg.description}</CardDescription>
                <Text variant="muted" className="text-xs">{pkg.durationHours}h on-site</Text>
              </CardHeader>
            </Card>
          </Pressable>
        );
      })}

      <SectionTitle>Vehicle type</SectionTitle>
      {vehicles.map((v) => (
        <OptionRow
          key={v.key}
          title={v.label}
          subtitle={v.sub}
          selected={vehicleKey === v.key}
          onPress={() => onVehicle(v.key)}
        />
      ))}
    </View>
  );
}

function StepAddons({
  addons,
  selected,
  onToggle,
  plasticCondition,
  onPlastic,
  earlyContact,
  onEarlyContact,
}: {
  addons: { name: string; price: number; description: string }[];
  selected: string[];
  onToggle: (name: string) => void;
  plasticCondition: "Yes" | "No";
  onPlastic: (v: "Yes" | "No") => void;
  earlyContact: "Yes" | "No";
  onEarlyContact: (v: "Yes" | "No") => void;
}) {
  return (
    <View>
      <SectionTitle>Optional add-ons</SectionTitle>
      {addons.length === 0 ? (
        <Text variant="muted">No add-ons available right now.</Text>
      ) : (
        addons.map((addon) => {
          const checked = selected.includes(addon.name);
          return (
            <Pressable key={addon.name} onPress={() => onToggle(addon.name)} className="mb-3">
              <Card className={checked ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle>{addon.name}</CardTitle>
                  <Text className="font-bold text-primary">+${addon.price}</Text>
                  <CardDescription>{addon.description}</CardDescription>
                </CardHeader>
              </Card>
            </Pressable>
          );
        })
      )}

      <SectionTitle>Plastic trim shine?</SectionTitle>
      <YesNoRow value={plasticCondition} onChange={onPlastic} />

      <SectionTitle>OK to contact before appointment?</SectionTitle>
      <YesNoRow value={earlyContact} onChange={onEarlyContact} />
    </View>
  );
}

function YesNoRow({
  value,
  onChange,
}: {
  value: "Yes" | "No";
  onChange: (v: "Yes" | "No") => void;
}) {
  return (
    <View className="mb-4 flex-row gap-2">
      {(["Yes", "No"] as const).map((opt) => (
        <Pressable
          key={opt}
          onPress={() => onChange(opt)}
          className={`flex-1 items-center rounded-lg border py-3 ${
            value === opt ? "border-primary bg-primary/10" : "border-border bg-card"
          }`}
        >
          <Text className={value === opt ? "font-semibold text-primary" : "text-muted-foreground"}>
            {opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function StepLocation({
  locationTypes,
  location,
  address,
  city,
  zip,
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  onLocation,
  onAddress,
  onCity,
  onZip,
}: {
  locationTypes: string[];
  location: string;
  address: string;
  city: string;
  zip: string;
  savedAddresses: CustomerAddress[];
  selectedAddressId: string | null;
  onSelectAddress: (saved: CustomerAddress) => void;
  onLocation: (v: string) => void;
  onAddress: (v: string) => void;
  onCity: (v: string) => void;
  onZip: (v: string) => void;
}) {
  const isDropOff = location.includes("Drop off");
  const relevantSavedAddresses = savedAddresses.filter(
    (saved) => !saved.locationType.includes("Drop off"),
  );

  return (
    <View>
      <SectionTitle>Where should we detail?</SectionTitle>
      {locationTypes.map((type) => (
        <OptionRow
          key={type}
          title={type}
          selected={location === type}
          onPress={() => onLocation(type)}
        />
      ))}

      {!isDropOff && relevantSavedAddresses.length ? (
        <>
          <SectionTitle>Saved addresses</SectionTitle>
          {relevantSavedAddresses.map((saved) => {
            const title = saved.nickname.trim() || saved.formattedAddress;
            const subtitle = saved.nickname.trim()
              ? `${saved.locationType} · ${saved.formattedAddress}`
              : saved.locationType;
            return (
              <OptionRow
                key={saved.id}
                title={title}
                subtitle={subtitle}
                selected={selectedAddressId === saved.id}
                onPress={() => onSelectAddress(saved)}
              />
            );
          })}
        </>
      ) : null}

      {!isDropOff ? (
        <View className="mt-2 flex flex-col gap-3">
          <View>
            <Label>Street address</Label>
            <Input value={address} onChangeText={onAddress} placeholder="123 Main St" />
          </View>
          <View>
            <Label>City</Label>
            <Input value={city} onChangeText={onCity} placeholder="Edmond" />
          </View>
          <View>
            <Label>ZIP code</Label>
            <Input value={zip} onChangeText={onZip} keyboardType="number-pad" placeholder="73013" />
          </View>
        </View>
      ) : (
        <View className="mt-2">
          <Label>City (optional)</Label>
          <Input value={city} onChangeText={onCity} placeholder="Edmond" />
        </View>
      )}
    </View>
  );
}

function StepSchedule({
  dates,
  datesLoading,
  dateLabel,
  onDate,
  availability,
  availabilityLoading,
  time,
  onTime,
  detailers,
  requestedDetailer,
  onDetailer,
  autoAssignUnavailable,
}: {
  dates: { dateInput: string; label: string }[];
  datesLoading: boolean;
  dateLabel: string;
  onDate: (label: string) => void;
  availability: BookingAvailabilityResponse | null;
  availabilityLoading: boolean;
  time: string;
  onTime: (slot: string) => void;
  detailers: { name: string; photo?: string }[];
  requestedDetailer: string;
  onDetailer: (name: string) => void;
  autoAssignUnavailable: boolean;
}) {
  return (
    <View>
      <SectionTitle>Pick a date</SectionTitle>
      <BookingDatePicker
        dates={dates}
        loading={datesLoading}
        selectedLabel={dateLabel}
        onSelect={onDate}
      />

      {dateLabel ? (
        <>
          <SectionTitle>Pick a time</SectionTitle>
          {availabilityLoading ? (
            <ActivityIndicator color="#f0c93a" />
          ) : (
            <View className="mb-2 flex-row flex-wrap gap-2">
              {(availability?.slotStates ?? []).map(({ slot, selectable }) => {
                const fullyBooked = availability?.fullyBookedSlots.includes(slot);
                const disabled = !selectable || fullyBooked;
                const selected = time === slot;
                return (
                  <Pressable
                    key={slot}
                    disabled={disabled}
                    onPress={() => onTime(slot)}
                    className={`rounded-lg border px-3 py-2 ${
                      disabled
                        ? "border-border/40 opacity-35"
                        : selected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        selected ? "font-bold text-primary" : disabled ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {slot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      ) : null}

      {time ? (
        <>
          <SectionTitle>Preferred detailer</SectionTitle>
          <Text variant="muted" className="mb-3 text-sm leading-5">
            Optional — we&apos;ll assign the best available detailer if you skip this.
          </Text>
          <OptionRow
            title="Auto-assign"
            subtitle={autoAssignUnavailable ? "Fully booked at this time" : "Best available"}
            selected={!requestedDetailer}
            disabled={autoAssignUnavailable}
            onPress={() => onDetailer("")}
          />
          {detailers.map((d) => {
            const busy = isDetailerBusyAtTime(availability, d.name, time);
            return (
              <OptionRow
                key={d.name}
                title={d.name}
                subtitle={busy ? "Booked at this time" : undefined}
                selected={requestedDetailer === d.name}
                disabled={busy}
                onPress={() => onDetailer(d.name)}
              />
            );
          })}
        </>
      ) : null}
    </View>
  );
}

function StepContact({
  customerName,
  email,
  phone,
  vehicleInfo,
  notes,
  onName,
  onEmail,
  onPhone,
  onVehicleInfo,
  onNotes,
}: {
  customerName: string;
  email: string;
  phone: string;
  vehicleInfo: string;
  notes: string;
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  onPhone: (v: string) => void;
  onVehicleInfo: (v: string) => void;
  onNotes: (v: string) => void;
}) {
  return (
    <View>
      <SectionTitle>Contact details</SectionTitle>
      <FormField label="Full name">
        <Input value={customerName} onChangeText={onName} placeholder="Jane Doe" />
      </FormField>
      <FormField label="Email">
        <Input
          value={email}
          onChangeText={onEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@email.com"
        />
      </FormField>
      <FormField label="Phone">
        <Input value={phone} onChangeText={onPhone} keyboardType="phone-pad" placeholder="555-555-5555" />
      </FormField>
      <FormField label="Vehicle make / model / color (optional)">
        <Input value={vehicleInfo} onChangeText={onVehicleInfo} placeholder="2024 Toyota Camry · White" />
      </FormField>
      <FormField label="Notes (optional)">
        <Input
          value={notes}
          onChangeText={onNotes}
          multiline
          className="min-h-[96px] py-3"
          placeholder="Gate code, parking notes, etc."
        />
      </FormField>
    </View>
  );
}

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function StepConfirm({
  packageName,
  vehicleLabel,
  addons,
  location,
  address,
  city,
  zip,
  dateLabel,
  time,
  detailer,
  customerName,
  email,
  phone,
  pricing,
  pricingLoading,
  promoCode,
  onPromoCode,
  onApplyPromo,
  promoLoading,
  appliedPromo,
  customer,
  session,
  rewardsContext,
  rewardsLoading,
  loyaltyLoading,
  loyaltyMessage,
  appliedLoyalty,
  selectedRewardKey,
  onSelectReward,
  onApplyLoyalty,
  onClearLoyalty,
  onSignIn,
}: {
  packageName: string;
  vehicleLabel: string;
  addons: string[];
  location: string;
  address: string;
  city: string;
  zip: string;
  dateLabel: string;
  time: string;
  detailer: string;
  customerName: string;
  email: string;
  phone: string;
  pricing: BookingPreviewResponse | null;
  pricingLoading: boolean;
  promoCode: string;
  onPromoCode: (v: string) => void;
  onApplyPromo: () => void;
  promoLoading: boolean;
  appliedPromo: string | null;
  customer: CustomerMeResponse["customer"] | null;
  session: Session | null;
  rewardsContext: RewardsCheckoutResponse | null;
  rewardsLoading: boolean;
  loyaltyLoading: boolean;
  loyaltyMessage: string | null;
  appliedLoyalty: {
    redemptionId: string;
    label: string;
    discountCents: number;
    autoAddedAddon?: string;
  } | null;
  selectedRewardKey: string;
  onSelectReward: (key: string) => void;
  onApplyLoyalty: () => void;
  onClearLoyalty: () => void;
  onSignIn: () => void;
}) {
  const loyaltyDiscountCents = pricing?.loyaltyDiscountCents ?? appliedLoyalty?.discountCents ?? 0;
  const promoDiscountCents = pricing?.promoDiscountCents ?? 0;

  return (
    <View>
      <SectionTitle>Review your booking</SectionTitle>
      <Card className="mb-6">
        <CardHeader>
          <SummaryRow label="Service" value={packageName} />
          <SummaryRow label="Vehicle" value={vehicleLabel} />
          {addons.length ? <SummaryRow label="Add-ons" value={addons.join(", ")} /> : null}
          <SummaryRow label="When" value={`${dateLabel} · ${time}`} />
          <SummaryRow label="Where" value={location} />
          {!location.includes("Drop off") ? (
            <SummaryRow label="Address" value={`${address}, ${city} ${zip}`} />
          ) : null}
          <SummaryRow label="Detailer" value={detailer} />
          <SummaryRow label="Contact" value={`${customerName} · ${email}`} />
        </CardHeader>
      </Card>

      <SectionTitle>Rewards</SectionTitle>
      {appliedLoyalty ? (
        <View className="mb-6 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-sm font-bold text-primary">{appliedLoyalty.label}</Text>
              <Text variant="muted" className="mt-1 text-xs">
                Saves {formatCurrency(appliedLoyalty.discountCents / 100)}
              </Text>
            </View>
            <Button variant="outline" size="sm" onPress={onClearLoyalty}>
              Remove
            </Button>
          </View>
        </View>
      ) : !session || !customer ? (
        <View className="mb-6 rounded-lg border border-border px-4 py-4">
          <Text className="mb-1 text-sm font-semibold text-foreground">Sign in to redeem points</Text>
          <Text variant="muted" className="mb-4 text-sm leading-5">
            Use the same email as your past bookings to apply rewards at checkout.
          </Text>
          <Button variant="outline" onPress={onSignIn}>
            Sign in
          </Button>
        </View>
      ) : rewardsLoading ? (
        <View className="mb-6 py-2">
          <ActivityIndicator color="#f0c93a" />
          <Text variant="muted" className="mt-2 text-sm">
            Loading rewards…
          </Text>
        </View>
      ) : rewardsContext ? (
        <View className="mb-6">
          <Text variant="muted" className="mb-4 text-xs">
            Signed in as {rewardsContext.email} · {rewardsContext.pointsBalance.toLocaleString()} points
          </Text>
          {rewardsContext.options.length === 0 ? (
            <Text variant="muted" className="text-sm leading-5">
              No rewards available for this booking yet. Earn more points after your detail is billed.
            </Text>
          ) : (
            <View>
              {rewardsContext.options.map((option) => (
                <RewardOptionRow
                  key={`${option.kind}:${option.id}`}
                  option={option}
                  selected={selectedRewardKey === `${option.kind}:${option.id}`}
                  onSelect={() => onSelectReward(`${option.kind}:${option.id}`)}
                />
              ))}
              <Button
                variant="outline"
                className="mt-3"
                loading={loyaltyLoading}
                disabled={
                  loyaltyLoading ||
                  !selectedRewardKey ||
                  !rewardsContext.options.some((entry) => {
                    const key = `${entry.kind}:${entry.id}`;
                    return (
                      key === selectedRewardKey &&
                      (entry.applicable || entry.addAddonAtCheckout)
                    );
                  })
                }
                onPress={onApplyLoyalty}
              >
                Apply reward
              </Button>
            </View>
          )}
        </View>
      ) : null}
      {loyaltyMessage ? (
        <Text className="mb-4 text-sm text-primary">{loyaltyMessage}</Text>
      ) : null}

      <SectionTitle>Promo code</SectionTitle>
      <View className="mb-4 flex-row gap-2">
        <Input
          className="flex-1"
          placeholder="Enter code"
          value={promoCode}
          onChangeText={onPromoCode}
          autoCapitalize="characters"
        />
        <Button variant="outline" loading={promoLoading} disabled={promoLoading} onPress={onApplyPromo}>
          Apply
        </Button>
      </View>
      {appliedPromo ? (
        <Text className="mb-4 text-sm text-primary">Applied: {appliedPromo}</Text>
      ) : null}

      <SectionTitle>Estimated total</SectionTitle>
      {pricingLoading ? (
        <ActivityIndicator color="#f0c93a" />
      ) : (
        <View>
          {pricing && pricing.subtotalCents > 0 ? (
            <View className="mb-3 gap-1">
              <PriceRow label="Subtotal" value={formatCurrency(pricing.subtotalCents / 100)} />
              {promoDiscountCents > 0 ? (
                <PriceRow
                  label="Promo discount"
                  value={`-${formatCurrency(promoDiscountCents / 100)}`}
                  accent
                />
              ) : null}
              {loyaltyDiscountCents > 0 ? (
                <PriceRow
                  label="Rewards discount"
                  value={`-${formatCurrency(loyaltyDiscountCents / 100)}`}
                  accent
                />
              ) : null}
            </View>
          ) : null}
          <Text className="text-3xl font-bold text-primary">{pricing?.totalDisplay ?? "TBD"}</Text>
        </View>
      )}
      <Text variant="muted" className="mt-3 text-sm leading-5">
        Payment is collected after your detail — no card required in the app.
      </Text>
    </View>
  );
}

function RewardOptionRow({
  option,
  selected,
  onSelect,
}: {
  option: CheckoutRewardOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const selectable = option.applicable || option.addAddonAtCheckout;
  const detailSuffix =
    selectable && option.discountCents > 0 && !option.detail.includes("Save ")
      ? ` · Save ${formatCurrency(option.discountCents / 100)}`
      : !selectable && option.reason
        ? ` · ${option.reason}`
        : "";

  return (
    <Pressable
      disabled={!selectable}
      onPress={onSelect}
      className={`mb-2 flex-row gap-3 rounded-lg border px-4 py-3 ${
        selectable ? "" : "opacity-50"
      } ${selected ? "border-primary bg-primary/10" : "border-border bg-card"}`}
    >
      <View
        className={`mt-0.5 h-5 w-5 items-center justify-center rounded-full border ${
          selected ? "border-primary bg-primary" : "border-muted-foreground"
        }`}
      >
        {selected ? <View className="h-2 w-2 rounded-full bg-background" /> : null}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{option.label}</Text>
        <Text variant="muted" className="mt-0.5 text-xs leading-4">
          {option.detail}
          {detailSuffix}
        </Text>
        {option.kind === "goal" ? (
          <Text className="mt-1 text-[10px] uppercase tracking-wider text-primary/70">
            Redeems {option.pointsRequired} points at checkout
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function PriceRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View className="flex-row justify-between">
      <Text variant="muted" className="text-sm">
        {label}
      </Text>
      <Text className={`text-sm ${accent ? "text-primary" : "text-foreground"}`}>{value}</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-2 flex-row justify-between gap-3 border-b border-border pb-2">
      <Text variant="muted" className="flex-1 text-sm">{label}</Text>
      <Text className="flex-[1.5] text-right text-sm text-foreground">{value}</Text>
    </View>
  );
}
