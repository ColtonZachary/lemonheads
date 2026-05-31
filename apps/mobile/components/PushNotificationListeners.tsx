import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { extractBookingIdFromNotification } from "@/lib/push-notifications";

export function PushNotificationListeners() {
  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const bookingId = extractBookingIdFromNotification(
          response.notification.request.content.data as Record<string, unknown>,
        );
        if (bookingId) {
          router.push(`/job/${bookingId}`);
        }
      },
    );

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const bookingId = extractBookingIdFromNotification(
        response.notification.request.content.data as Record<string, unknown>,
      );
      if (bookingId) {
        router.push(`/job/${bookingId}`);
      }
    });

    return () => {
      responseListener.current?.remove();
    };
  }, [router]);

  return null;
}
