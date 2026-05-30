"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";

import {
  sendCheckoutMagicLink,
  signInForCheckout,
} from "@/app/actions/loyalty-checkout";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/site-field";
import { cn } from "@/lib/utils";

export function CheckoutRewardsSignIn({
  defaultEmail,
  onSignedIn,
  notice,
}: {
  defaultEmail?: string;
  onSignedIn: () => void;
  notice?: string | null;
}) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [password, setPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordOk, setPasswordOk] = useState(false);
  const [magicMessage, setMagicMessage] = useState<string | null>(null);
  const [magicOk, setMagicOk] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [passwordPending, startPasswordTransition] = useTransition();
  const [magicPending, startMagicTransition] = useTransition();

  useEffect(() => {
    if (defaultEmail?.trim()) {
      setEmail(defaultEmail.trim());
    }
  }, [defaultEmail]);

  const handlePasswordSignIn = (event: FormEvent) => {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordOk(false);
    startPasswordTransition(async () => {
      const result = await signInForCheckout({ email, password });
      if (result.ok) {
        setPasswordOk(true);
        setPasswordMessage("Signed in — loading your rewards…");
        onSignedIn();
      } else {
        setPasswordMessage(result.message);
      }
    });
  };

  const handleMagicLink = (event: FormEvent) => {
    event.preventDefault();
    setMagicMessage(null);
    setMagicOk(false);
    startMagicTransition(async () => {
      const result = await sendCheckoutMagicLink({ email });
      if (result.ok) {
        setMagicOk(true);
        setMagicMessage(
          result.message ??
            "Check your email for a sign-in link, then return to this page.",
        );
      } else {
        setMagicMessage(result.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      {notice ? (
        <p className="rounded-md border border-y/25 bg-y/[0.06] px-4 py-3 font-mono text-xs text-y/90">
          {notice}
        </p>
      ) : (
        <p className="font-mono text-xs leading-relaxed text-text/45">
          Sign in to see your points and apply a reward on this booking. Use the
          same email as your past appointments.
        </p>
      )}

      <form
        onSubmit={handlePasswordSignIn}
        className="rounded-md border border-border-faint bg-card/80 p-4 sm:p-5"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="checkout-rewards-email">Email</Label>
            <Input
              id="checkout-rewards-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="checkout-rewards-password">Password</Label>
            <Input
              id="checkout-rewards-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          {passwordMessage ? (
            <p
              className={cn(
                "rounded border px-3 py-2 font-mono text-xs",
                passwordOk
                  ? "border-y/25 bg-y/10 text-y/90"
                  : "border-red-500/30 bg-red-500/10 text-red-200",
              )}
            >
              {passwordMessage}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={passwordPending}
            className="w-full sm:w-auto"
          >
            {passwordPending ? "Signing in…" : "Sign in & view rewards"}
          </Button>
        </div>
      </form>

      <div>
        <button
          type="button"
          onClick={() => setShowMagicLink((open) => !open)}
          className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.12em] text-y/70 hover:text-y"
        >
          {showMagicLink ? "Hide email sign-in link" : "Prefer a one-time email link?"}
        </button>
        {showMagicLink ? (
          <form
            onSubmit={handleMagicLink}
            className="mt-3 rounded-md border border-white/10 bg-card/50 p-4"
          >
            <p className="mb-3 font-mono text-[10px] leading-relaxed text-text/45">
              We&apos;ll email a link. After you sign in, come back to checkout
              step 4 to apply rewards.
            </p>
            {magicMessage ? (
              <p
                className={cn(
                  "mb-3 rounded border px-3 py-2 font-mono text-xs",
                  magicOk
                    ? "border-y/25 bg-y/10 text-y/90"
                    : "border-red-500/30 bg-red-500/10 text-red-200",
                )}
              >
                {magicMessage}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="outline"
              disabled={magicPending || !email.trim()}
              className="w-full sm:w-auto"
            >
              {magicPending ? "Sending…" : "Email sign-in link"}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
