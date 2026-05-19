export type BookingSetupIntentResult =
  | { ok: true; clientSecret: string }
  | { ok: false; error: string };

export async function createBookingSetupIntent(): Promise<BookingSetupIntentResult> {
  return {
    ok: false,
    error: "Card save is available when booking runs on our full app host.",
  };
}
