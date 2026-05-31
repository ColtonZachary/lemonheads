import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/lib/auth-context";
import {
  registerForPushNotificationsAsync,
  syncPushTokenWithServer,
} from "@/lib/push-notifications";

type PushRegistrationState = {
  status: "idle" | "pending" | "ready" | "failed";
  message: string | null;
  retry: () => void;
};

const PushRegistrationContext = createContext<PushRegistrationState | null>(null);

export function PushRegistrationProvider({ children }: { children: ReactNode }) {
  const { session, employee } = useAuth();
  const [status, setStatus] = useState<PushRegistrationState["status"]>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const register = useCallback(async () => {
    if (!session?.access_token || !employee) return;

    setStatus("pending");
    setMessage(null);

    const result = await registerForPushNotificationsAsync();
    if (!result.ok) {
      setStatus("failed");
      setMessage(result.reason);
      return;
    }

    try {
      await syncPushTokenWithServer(session.access_token, result.token);
      setStatus("ready");
      setMessage(null);
    } catch (err) {
      setStatus("failed");
      setMessage(
        err instanceof Error
          ? err.message
          : "Could not save push token to the server.",
      );
    }
  }, [employee, session?.access_token]);

  useEffect(() => {
    void register();
  }, [register]);

  const value = useMemo(
    () => ({ status, message, retry: () => void register() }),
    [message, register, status],
  );

  return (
    <PushRegistrationContext.Provider value={value}>
      {children}
    </PushRegistrationContext.Provider>
  );
}

export function usePushRegistration(): PushRegistrationState {
  const ctx = useContext(PushRegistrationContext);
  if (!ctx) {
    throw new Error("usePushRegistration must be used within PushRegistrationProvider");
  }
  return ctx;
}
