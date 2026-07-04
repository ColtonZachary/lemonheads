import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CustomerBookingsList } from "@/components/CustomerBookingsList";
import { BrandLogo } from "@/components/BrandLogo";
import { Button, ScreenScroll, Text } from "@lemonheads/mobile-ui";

import { useAuth } from "@/lib/auth-context";

export default function BookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshCustomer } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [bookingsKey, setBookingsKey] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshCustomer();
      setBookingsKey((k) => k + 1);
    } finally {
      setRefreshing(false);
    }
  }, [refreshCustomer]);

  return (
    <ScreenScroll
      contentContainerClassName="px-4 pb-10"
      contentContainerStyle={{ paddingTop: insets.top + 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f0c93a" />
      }
    >
      <View className="items-center">
        <BrandLogo />
        <Button
          className="mt-10 w-full max-w-xs"
          onPress={() => router.push("/(customer)/book-flow")}
        >
          Start booking
        </Button>
      </View>

      <View className="mt-10 border-t border-border pt-8">
        <Text className="mb-4 text-lg font-bold text-primary">Your bookings</Text>
        <CustomerBookingsList key={bookingsKey} />
      </View>
    </ScreenScroll>
  );
}
