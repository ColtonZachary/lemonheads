"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/site-field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center px-[5%] py-20">
      <div className="w-full max-w-[400px] rounded-md border border-y/20 bg-card p-8 text-center font-mono text-xs text-text/40">
        Loading…
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams?.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    errorParam === "profile"
      ? "Your account is not set up in the hub. Ask an admin to add your profile."
      : errorParam === "invite"
        ? "Invite link expired or invalid. Ask an admin to send a new invite."
        : errorParam === "config"
          ? "Supabase is not configured."
          : errorParam
            ? "Sign-in failed. Try again."
            : null,
  );
  const [loading, setLoading] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/hub");
    router.refresh();
  };

  return (
    <div className="flex min-h-[100svh] items-center justify-center px-[5%] py-20">
      <div className="w-full max-w-[400px] rounded-md border border-y/20 bg-card p-8">
        <h1 className="font-display text-4xl tracking-[0.06em] text-y">
          STAFF LOGIN
        </h1>
        <p className="mt-2 font-mono text-[11px] tracking-[0.06em] text-text/40">
          Managers Hub & detailer schedule
        </p>

        <form onSubmit={signIn} className="mt-8 flex flex-col gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="font-mono text-xs text-red-400/90">{error}</p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center font-mono text-[10px] text-text/35">
          <Link href="/" className="text-y/70 hover:text-y">
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
