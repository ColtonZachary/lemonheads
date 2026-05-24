"use client";

import { useActionState } from "react";

import {
  sendRewardsMagicLink,
  type LoyaltyCustomerActionState,
} from "@/app/actions/loyalty-customer";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const EMPTY: LoyaltyCustomerActionState = { ok: false, message: "" };

export function RewardsSignIn({ defaultEmail }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState(sendRewardsMagicLink, EMPTY);

  return (
    <div className="rounded-md border border-y/20 bg-card p-6">
      <h2 className="font-display text-2xl tracking-[0.04em] text-y">Sign in (optional)</h2>
      <p className="mt-2 text-sm text-text/50">
        Use the same email you use when booking. We&apos;ll send a one-time link — no password
        needed. Booking does not require an account.
      </p>
      <form action={action} className="mt-5 space-y-4">
        <div>
          <Label htmlFor="rewards-email">Email</Label>
          <Input
            id="rewards-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={defaultEmail ?? ""}
            placeholder="you@example.com"
            className="mt-1"
          />
        </div>
        {state.message ? (
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
        ) : null}
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Sending link…" : "Email me a sign-in link"}
        </Button>
      </form>
    </div>
  );
}
