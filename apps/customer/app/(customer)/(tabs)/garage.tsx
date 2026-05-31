import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CustomerAddresses } from "@/components/CustomerAddresses";
import { CustomerGarage } from "@/components/CustomerGarage";
import { ScreenScroll, Text } from "@lemonheads/mobile-ui";

import { apiGetPublic } from "@/lib/api";
import type { BookingConfigResponse } from "@/lib/types";

export default function GarageScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [config, setConfig] = useState<BookingConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiGetPublic<BookingConfigResponse>("/api/mobile/customer/booking/config");
        if (!cancelled) {
          setConfig(res);
        }
      } catch {
        if (!cancelled) {
          setConfig(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScreenScroll
      ref={scrollRef}
      keyboardAvoiding
      keyboardVerticalOffset={insets.top}
      contentContainerClassName="px-4 pb-32"
      contentContainerStyle={{ paddingTop: insets.top + 12 }}
    >
      <Text className="mb-1 text-2xl font-bold text-primary">Garage</Text>
      <Text variant="muted" className="mb-6 leading-5">
        Save your vehicles and addresses here to book faster next time.
      </Text>

      {loading ? (
        <View className="py-8">
          <ActivityIndicator color="#f0c93a" />
        </View>
      ) : (
        <>
          <Text className="mb-4 text-lg font-bold text-primary">Vehicles</Text>
          <CustomerGarage
          vehicleOptions={config?.vehicles ?? []}
          onFormOpen={() => {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
          }}
        />

          <View className="mt-10 border-t border-border pt-8">
            <Text className="mb-4 text-lg font-bold text-primary">Addresses</Text>
            <CustomerAddresses
              locationTypes={config?.catalog.locationTypes ?? []}
              onFormOpen={() => {
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
              }}
            />
          </View>
        </>
      )}
    </ScreenScroll>
  );
}
