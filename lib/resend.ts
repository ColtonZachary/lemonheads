import { Resend } from "resend";

import { SITE } from "@/lib/site";

/**
 * Singleton Resend client. Returns null when no API key is configured so
 * local dev / preview builds don't crash — instead the action falls back
 * to console.log so the team can see what would have been sent.
 */
let cached: Resend | null = null;
let warned = false;

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (!warned) {
      console.warn(
        "[resend] RESEND_API_KEY not set — emails will be logged to stdout instead of sent.",
      );
      warned = true;
    }
    return null;
  }
  if (!cached) {
    cached = new Resend(key);
  }
  return cached;
}

/**
 * `from` address Resend will use. Until a domain is verified in Resend,
 * you can leave this as `onboarding@resend.dev` which works out of the box.
 * Override per environment with RESEND_FROM_EMAIL.
 */
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? `${SITE.name} <onboarding@resend.dev>`;

/** Where booking + contact submissions are delivered. */
export const TO_EMAIL = process.env.RESEND_TO_EMAIL ?? SITE.email.bookings;
