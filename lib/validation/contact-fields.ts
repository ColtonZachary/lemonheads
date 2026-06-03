import { z } from "zod";

/** US phone: 10 digits, or 11 with leading 1. Returns E.164 or null. */
export function normalizeUsPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    return null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export function isValidUsPhone(raw: string): boolean {
  return normalizeUsPhone(raw) !== null;
}

export function isValidEmail(raw: string): boolean {
  const email = raw.trim().toLowerCase();
  if (!email) return false;
  return z.string().email().safeParse(email).success;
}

export function getEmailValidationError(raw: string): string | null {
  if (!raw.trim()) return "Please enter an email address.";
  if (!isValidEmail(raw)) return "Please enter a valid email address.";
  return null;
}

export function getPhoneValidationError(raw: string): string | null {
  if (!raw.trim()) return "Please enter a phone number.";
  if (!isValidUsPhone(raw)) {
    return "Please enter a valid 10-digit US phone number.";
  }
  return null;
}

export function getOptionalPhoneValidationError(raw: string): string | null {
  if (!raw.trim()) return null;
  if (!isValidUsPhone(raw)) {
    return "Please enter a valid 10-digit US phone number.";
  }
  return null;
}

export const emailFieldSchema = z
  .string()
  .trim()
  .min(1, "Please enter an email address.")
  .email("Please enter a valid email.")
  .transform((value) => value.toLowerCase());

export const phoneFieldSchema = z
  .string()
  .trim()
  .min(1, "Please enter a phone number.")
  .refine(
    isValidUsPhone,
    "Please enter a valid 10-digit US phone number.",
  );

export const optionalPhoneFieldSchema = z
  .string()
  .optional()
  .default("")
  .transform((value) => value.trim())
  .refine(
    (value) => value === "" || isValidUsPhone(value),
    "Please enter a valid 10-digit US phone number.",
  );
