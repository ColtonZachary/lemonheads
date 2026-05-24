"use client";

import { useActionState } from "react";

import {
  sendRewardsMagicLink,
  signInRewardsWithPassword,
  type LoyaltyCustomerActionState,
} from "@/app/actions/loyalty-customer";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const EMPTY: LoyaltyCustomerActionState = { ok: false, message: "" };

function StatusMessage({ state }: { state: LoyaltyCustomerActionState }) {
  if (!state.message) return null;
  return (
    <p
      className={cn(
        "rounded border px-3 py-2 font-mono text-xs",
        state.ok
          ? "border-y/25 bg-y/10 text-y/90"
          : "border-red-500/30 bg-red-500/10 text-red-200",
      )}
    >
      {state.message}
    </p>
  );
}

export function RewardsSignIn({ defaultEmail }: { defaultEmail?: string }) {
  const [magicState, magicAction, magicPending] = useActionState(sendRewardsMagicLink, EMPTY);
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInRewardsWithPassword,
    EMPTY,
  );

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-y/20 bg-card p-6">
        <h2 className="font-display text-2xl tracking-[0.04em] text-y">Sign in with password</h2>
        <p className="mt-2 text-sm text-text/50">
          Use the email and password for your rewards account. Same email you use when booking.
        </p>
        <form action={passwordAction} className="mt-5 space-y-4">
          <div>
            <Label htmlFor="rewards-password-email">Email</Label>
            <Input
              id="rewards-password-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={defaultEmail ?? ""}
              placeholder="you@example.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="rewards-password">Password</Label>
            <Input
              id="rewards-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1"
            />
          </div>
          <StatusMessage state={passwordState} />
          <Button type="submit" disabled={passwordPending} className="w-full sm:w-auto">
            {passwordPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>

      <div className="rounded-md border border-white/10 bg-card/50 p-6">
        <h2 className="font-display text-xl tracking-[0.04em] text-y/90">Or email a sign-in link</h2>
        <p className="mt-2 text-sm text-text/50">
          One-time link, no password. If you already requested one, check spam before sending again.
        </p>
        <form action={magicAction} className="mt-5 space-y-4">
          <div>
            <Label htmlFor="rewards-magic-email">Email</Label>
            <Input
              id="rewards-magic-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={defaultEmail ?? ""}
              placeholder="you@example.com"
              className="mt-1"
            />
          </div>
          <StatusMessage state={magicState} />
          <Button type="submit" variant="outline" disabled={magicPending} className="w-full sm:w-auto">
            {magicPending ? "Sending link…" : "Email me a sign-in link"}
          </Button>
        </form>
      </div>
    </div>
  );
}
