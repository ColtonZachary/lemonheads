import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Text,
} from "@lemonheads/mobile-ui";

import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { CustomerBookingsResponse } from "@/lib/types";

function formatDate(dateInput: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateInput}T12:00:00`));
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function CustomerBookingsList() {
  const router = useRouter();
  const { session, customer, loading: authLoading } = useAuth();
  const [data, setData] = useState<CustomerBookingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.access_token || !customer) return;
    setError(null);
    setLoading(true);
    try {
      const res = await apiGet<CustomerBookingsResponse>(
        "/api/mobile/customer/bookings",
        session.access_token,
      );
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load bookings");
    } finally {
      setLoading(false);
    }
  }, [customer, session?.access_token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (authLoading) {
    return <ActivityIndicator color="#f0c93a" className="py-8" />;
  }

  if (!session || !customer) {
    return (
      <View className="rounded-xl border border-border bg-card p-5">
        <Text className="text-center text-base font-semibold text-foreground">
          See your appointments
        </Text>
        <Text variant="muted" className="mb-4 mt-2 text-center text-sm leading-5">
          Sign in with the email you used when booking to view upcoming and past details.
        </Text>
        <Button onPress={() => router.push("/login")}>Sign in</Button>
      </View>
    );
  }

  return (
    <View>
      {error ? (
        <Text variant="error" className="mb-3">
          {error}
        </Text>
      ) : null}

      {loading && !data ? (
        <ActivityIndicator color="#f0c93a" className="py-6" />
      ) : data?.bookings.length ? (
        data.bookings.map((booking) => (
          <Card key={booking.id} className="mb-3">
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-primary">{booking.referenceId}</Text>
                <Badge label={booking.status.replace(/_/g, " ")} variant="secondary" />
              </View>
              <CardTitle>{booking.serviceName}</CardTitle>
              <CardDescription>
                {formatDate(booking.appointmentDate)} · {formatTime(booking.startsAt)}
              </CardDescription>
              <Text variant="muted">{booking.priceDisplay}</Text>
              {booking.detailerName ? (
                <Text className="mt-2 text-sm text-foreground">
                  Detailer: {booking.detailerName}
                </Text>
              ) : null}
            </CardHeader>
          </Card>
        ))
      ) : (
        <Text variant="muted" className="py-4 text-center">
          No bookings yet for this account.
        </Text>
      )}
    </View>
  );
}

export function CustomerBookingsRefreshControl({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f0c93a" />;
}
