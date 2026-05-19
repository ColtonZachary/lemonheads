"use server";

import Stripe from "stripe";

export type BookingSetupIntentResult =
  | { ok: true; clientSecret: string }
  | { ok: false; error: string };

/**
 * Creates a SetupIntent so the customer can save a card for future / post-service payment.
 * Requires STRIPE_SECRET_KEY — skip Stripe setup until you are ready; the UI stays hidden
 * without NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
 */
export async function createBookingSetupIntent(): Promise<BookingSetupIntentResult> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return { ok: false, error: "Stripe is not configured on the server." };
  }

  const stripe = new Stripe(secret);

  try {
    const intent = await stripe.setupIntents.create({
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: { flow: "booking" },
    });

    if (!intent.client_secret) {
      return { ok: false, error: "Could not start card setup." };
    }

    return { ok: true, clientSecret: intent.client_secret };
  } catch (e) {
    console.error("[stripe-setup]", e);
    return { ok: false, error: "Could not reach the payment processor." };
  }
}
