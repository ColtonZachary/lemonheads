import { Linking, Platform } from "react-native";

import type { EmployeeJob, EmployeeJobDetail } from "@/lib/types";

type AddressFields = {
  address_line?: string;
  addressLine?: string;
  city: string;
  zip: string;
};

export function formatAddress(fields: AddressFields): string {
  const line = fields.address_line ?? fields.addressLine ?? "";
  const parts = [line, fields.city, fields.zip].filter(Boolean);
  return parts.join(", ");
}

export function jobToAddress(job: EmployeeJob | EmployeeJobDetail): AddressFields {
  if ("addressLine" in job) {
    return { addressLine: job.addressLine, city: job.city, zip: job.zip };
  }
  return {
    address_line: job.address_line,
    city: job.city,
    zip: job.zip,
  };
}

export function formatJobAddress(job: EmployeeJob | EmployeeJobDetail): string {
  return formatAddress(jobToAddress(job));
}

/** Open the job address in Google Maps (Android) or Apple Maps (iOS). */
export async function openJobInMaps(job: EmployeeJob | EmployeeJobDetail): Promise<void> {
  const query = encodeURIComponent(formatJobAddress(job));
  if (!query) {
    throw new Error("No address on this booking");
  }

  const url =
    Platform.OS === "ios"
      ? `https://maps.apple.com/?q=${query}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;

  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error("Could not open maps on this device");
  }
  await Linking.openURL(url);
}

export async function openPhone(phone: string): Promise<void> {
  const digits = phone.replace(/\D/g, "");
  if (!digits) throw new Error("No phone number");
  const url = `tel:${digits}`;
  await Linking.openURL(url);
}
