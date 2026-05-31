import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { apiPost } from "@/lib/api";

export type PushRegistrationResult =
  | { ok: true; token: string }
  | { ok: false; reason: string };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function resolveExpoProjectId(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  if (fromEnv) return fromEnv;

  const fromConfig =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (
    typeof fromConfig === "string" &&
    fromConfig.trim() &&
    !fromConfig.includes("YOUR_")
  ) {
    return fromConfig.trim();
  }

  return null;
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return {
      ok: false,
      reason:
        "Push notifications require a physical phone. They do not work in the iOS Simulator.",
    };
  }

  if (isExpoGo()) {
    return {
      ok: false,
      reason:
        "Expo Go cannot receive push notifications (removed in SDK 53+). Install a development build instead: cd apps/mobile && npx eas login && npx eas init && npm run ios:device",
    };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("job-assignments", {
      name: "Job assignments",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return {
      ok: false,
      reason:
        "Notification permission denied. Enable notifications for Lemonheads Employee in Settings.",
    };
  }

  const projectId = resolveExpoProjectId();
  if (!projectId) {
    return {
      ok: false,
      reason:
        "Missing Expo project ID. Run: cd apps/mobile && npx eas login && npx eas init — then rebuild the dev app (npm run ios:device).",
    };
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token.data.startsWith("ExponentPushToken[")) {
      return { ok: false, reason: "Expo returned an invalid push token." };
    }
    return { ok: true, token: token.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      reason: `Could not get push token: ${message}`,
    };
  }
}

export async function syncPushTokenWithServer(
  accessToken: string,
  token: string,
): Promise<void> {
  await apiPost("/api/mobile/employee/push-token", accessToken, {
    token,
    platform: Platform.OS,
    deviceLabel: Device.modelName ?? undefined,
  });
}

export async function unregisterPushToken(
  accessToken: string,
  token?: string | null,
): Promise<void> {
  const url = `${process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "")}/api/mobile/employee/push-token`;
  await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(token ? { token } : {}),
  }).catch(() => {});
}

export function extractBookingIdFromNotification(
  data: Record<string, unknown> | undefined,
): string | null {
  const bookingId = data?.bookingId;
  return typeof bookingId === "string" && bookingId.length > 0 ? bookingId : null;
}
