"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { createBookingSetupIntent } from "@/lib/stripe-setup";
import { cn } from "@/lib/utils";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export type BookingCardCaptureApi = {
  confirmIfNeeded: () => Promise<{
    paymentMethodId?: string;
    error?: string;
  }>;
};

type InnerProps = {
  email: string;
  innerApiRef: React.MutableRefObject<BookingCardCaptureApi | null>;
};

function InnerPayment({ email, innerApiRef }: InnerProps) {
  const stripe = useStripe();
  const elements = useElements();

  useImperativeHandle(innerApiRef, () => ({
    confirmIfNeeded: async () => {
      if (!stripe || !elements) {
        return {
          error: "Payment form is still loading. Please wait a moment.",
        };
      }

      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
        confirmParams: {
          payment_method_data: {
            billing_details: {
              email: email.trim() || undefined,
            },
          },
        },
      });

      if (error) {
        return { error: error.message ?? "Card could not be saved." };
      }

      const pm = setupIntent?.payment_method;
      let paymentMethodId: string | undefined;
      if (typeof pm === "string") paymentMethodId = pm;
      else if (pm && typeof pm === "object" && "id" in pm)
        paymentMethodId = pm.id;

      if (!paymentMethodId) {
        return { error: "Could not verify card. Please try again." };
      }

      return { paymentMethodId };
    },
  }), [stripe, elements, email]);

  return (
    <PaymentElement
      options={{
        layout: { type: "tabs", defaultCollapsed: false },
      }}
    />
  );
}

type BookingCardCaptureProps = {
  saveCardOnFile: boolean;
  onSaveCardOnFileChange: (next: boolean) => void;
  email: string;
};

export const BookingCardCapture = forwardRef<
  BookingCardCaptureApi | null,
  BookingCardCaptureProps
>(function BookingCardCapture(
  { saveCardOnFile, onSaveCardOnFileChange, email },
  ref,
) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const innerApiRef = useRef<BookingCardCaptureApi | null>(null);
  const setupRequestId = useRef(0);

  useImperativeHandle(
    ref,
    () => ({
      confirmIfNeeded: async () => {
        if (!saveCardOnFile) return {};
        return (
          innerApiRef.current?.confirmIfNeeded() ?? {
            error: clientSecret
              ? "Payment form is not ready yet."
              : "Could not start card capture.",
          }
        );
      },
    }),
    [saveCardOnFile, clientSecret],
  );

  if (!stripePromise || !publishableKey) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-md border border-border-faint bg-white/[0.02] p-4 transition-colors",
          saveCardOnFile && "border-y/25 bg-y/[0.04]",
        )}
      >
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-y"
          checked={saveCardOnFile}
          onChange={(e) => {
            const checked = e.target.checked;
            if (!checked) {
              setupRequestId.current += 1;
              setClientSecret(null);
              setInitError(null);
              setLoading(false);
              onSaveCardOnFileChange(false);
              return;
            }
            onSaveCardOnFileChange(true);
            const requestId = ++setupRequestId.current;
            setLoading(true);
            setInitError(null);
            createBookingSetupIntent()
              .then((res) => {
                if (requestId !== setupRequestId.current) return;
                if (res.ok) setClientSecret(res.clientSecret);
                else setInitError(res.error);
              })
              .catch(() => {
                if (requestId !== setupRequestId.current) return;
                setInitError("Could not initialize secure checkout.");
              })
              .finally(() => {
                if (requestId !== setupRequestId.current) return;
                setLoading(false);
              });
          }}
        />
        <span className="text-left text-sm leading-[1.6] text-text/70">
          <span className="font-semibold text-text">
            Save a card securely for checkout
          </span>
          <span className="mt-1 block font-mono text-[10px] tracking-[0.06em] text-muted">
            Powered by Stripe. Your card is not charged until after your detail
            is complete. You can skip this and pay later instead.
          </span>
        </span>
      </label>

      {saveCardOnFile && (
        <div className="space-y-3">
          {loading && (
            <p className="font-mono text-[10px] tracking-[0.08em] text-y/70">
              Loading secure card form…
            </p>
          )}
          {initError && (
            <p className="rounded-[4px] border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-[11px] tracking-[0.04em] text-red-300">
              {initError}
            </p>
          )}
          {clientSecret && !initError && (
            <div className="rounded-md border border-y/15 bg-black/20 p-4">
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "night",
                    variables: {
                      colorPrimary: "#F0C93A",
                      colorBackground: "#0c0c0e",
                      colorText: "#edeae0",
                      borderRadius: "4px",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    },
                    rules: {
                      ".Tab": {
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "none",
                      },
                      ".Tab--selected": {
                        border: "1px solid rgba(240,201,58,0.45)",
                      },
                      ".Input": {
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "none",
                      },
                    },
                  },
                }}
              >
                <InnerPayment email={email} innerApiRef={innerApiRef} />
              </Elements>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export function isStripeCardCaptureAvailable(): boolean {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") return false;
  return Boolean(publishableKey);
}
