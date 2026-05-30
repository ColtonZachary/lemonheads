"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/site-field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (!cancelled) {
          setHasSession(!!data.session);
          setChecking(false);
        }
      } catch {
        if (!cancelled) {
          setHasSession(false);
          setChecking(false);
        }
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      router.push("/hub");
      router.refresh();
    } catch {
      setError("Could not save password. Try the invite link again or ask an admin.");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <AuthShell>
        <p className="font-mono text-xs text-text/40">Checking your invite…</p>
      </AuthShell>
    );
  }

  if (!hasSession) {
    return (
      <AuthShell>
        <h1 className="font-display text-3xl tracking-[0.06em] text-y">
          INVITE LINK
        </h1>
        <p className="mt-3 font-mono text-xs leading-relaxed text-text/50">
          This link is invalid or expired. Ask an admin to send a new invite from
          Hub access, then open the new email and use{" "}
          <strong className="text-text/70">Accept invitation</strong> again.
        </p>
        <p className="mt-4 font-mono text-xs text-text/40">
          If you already set a password,{" "}
          <Link href="/login" className="text-y/80 hover:text-y">
            sign in here
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="font-display text-4xl tracking-[0.06em] text-y">
        SET PASSWORD
      </h1>
      <p className="mt-2 font-mono text-[11px] tracking-[0.08em] text-text/40">
        Create a password for Managers Hub sign-in
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error ? (
          <p className="font-mono text-xs text-red-400/90">{error}</p>
        ) : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Saving…" : "Save password & open hub"}
        </Button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100svh] items-center justify-center px-[5%] py-20">
      <div className="w-full max-w-[400px] rounded-md border border-y/20 bg-card p-8">
        {children}
      </div>
    </div>
  );
}
