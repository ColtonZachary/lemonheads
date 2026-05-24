"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function AuthFinishInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const next = searchParams.get("next") ?? "/rewards";
      const code = searchParams.get("code");
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      try {
        const supabase = createSupabaseBrowserClient();
        const hasHash = window.location.hash.includes("access_token");

        if (hasHash) {
          await new Promise<void>((resolve) => {
            const timeout = window.setTimeout(() => resolve(), 4000);
            const {
              data: { subscription },
            } = supabase.auth.onAuthStateChange((event, session) => {
              if (event === "SIGNED_IN" && session) {
                window.clearTimeout(timeout);
                subscription.unsubscribe();
                resolve();
              }
            });
          });
        }

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (!cancelled) setError(exchangeError.message);
            return;
          }
        } else if (token_hash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "email" | "invite" | "recovery" | "signup" | "magiclink",
          });
          if (verifyError) {
            if (!cancelled) setError(verifyError.message);
            return;
          }
        } else if (window.location.hash.includes("access_token")) {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();
          if (sessionError || !session) {
            if (!cancelled) {
              setError(sessionError?.message ?? "Sign-in link expired or invalid.");
            }
            return;
          }
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            if (!cancelled) router.replace(next);
            return;
          }
          if (!cancelled) setError("Sign-in link expired or invalid.");
          return;
        }

        if (!cancelled) {
          router.replace(next);
          router.refresh();
        }
      } catch {
        if (!cancelled) setError("Could not complete sign-in. Request a new link.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="rounded-md border border-red-500/30 bg-red-500/10 p-6">
        <p className="font-mono text-xs text-red-200">{error}</p>
        <p className="mt-3 text-sm text-text/50">
          <Link href="/rewards" className="text-y hover:underline">
            Back to rewards
          </Link>{" "}
          and request a new sign-in link.
        </p>
      </div>
    );
  }

  return <p className="font-mono text-xs text-text/45">Completing sign-in…</p>;
}

export default function AuthFinishPage() {
  return (
    <div className="flex min-h-[60svh] items-center justify-center px-[5%] py-20">
      <div className="w-full max-w-[400px] rounded-md border border-y/20 bg-card p-8 text-center">
        <Suspense fallback={<p className="font-mono text-xs text-text/45">Loading…</p>}>
          <AuthFinishInner />
        </Suspense>
      </div>
    </div>
  );
}
