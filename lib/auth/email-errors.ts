/** Friendlier copy for Supabase Auth email errors. */
export function formatAuthEmailError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("email rate limit exceeded")) {
    return "Too many sign-in emails were sent recently (Supabase limit). Wait about an hour, check spam for an earlier link, or ask us to enable custom SMTP for higher limits.";
  }

  if (lower.includes("signup is disabled")) {
    return "Email sign-in is disabled in Supabase. Contact support.";
  }

  if (lower.includes("invalid email")) {
    return "That email address looks invalid.";
  }

  return message;
}
