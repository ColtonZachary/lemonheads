import { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiGet } from "@/lib/api";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { CustomerMeResponse } from "@/lib/types";

type AuthState = {
  loading: boolean;
  session: Session | null;
  customer: CustomerMeResponse["customer"] | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<CustomerMeResponse["customer"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCustomer = useCallback(async (accessToken: string) => {
    const me = await apiGet<CustomerMeResponse>("/api/mobile/customer/me", accessToken);
    setCustomer(me.customer);
    setError(null);
  }, []);

  const refreshCustomer = useCallback(async () => {
    if (!session?.access_token) return;
    await loadCustomer(session.access_token);
  }, [loadCustomer, session?.access_token]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError(
        "Supabase env missing. In apps/customer/.env use EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
      );
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setCustomer(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    loadCustomer(session.access_token)
      .catch((err: unknown) => {
        if (!cancelled) {
          setCustomer(null);
          setError(err instanceof Error ? err.message : "Could not load customer profile");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadCustomer, session?.access_token]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setLoading(true);
      try {
        const supabase = getSupabase();
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) throw new Error(signInError.message);

        const nextSession = data.session;
        if (!nextSession?.access_token) {
          throw new Error("Sign in succeeded but no session was returned.");
        }
        setSession(nextSession);
        await loadCustomer(nextSession.access_token);
      } finally {
        setLoading(false);
      }
    },
    [loadCustomer],
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setCustomer(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      loading,
      session,
      customer,
      error,
      signIn,
      signOut,
      refreshCustomer,
    }),
    [loading, session, customer, error, signIn, signOut, refreshCustomer],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
