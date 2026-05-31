export const CUSTOMER_ADDRESS_SELECT =
  "id, customer_id, location_type, address, city, zip, nickname, is_default, created_at, updated_at";

export type CustomerAddressRow = {
  id: string;
  customer_id: string;
  location_type: string;
  address: string;
  city: string;
  zip: string;
  nickname: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export function isDropOffLocationType(locationType: string): boolean {
  return locationType.includes("Drop off");
}

export function formatCustomerAddressLine(entry: {
  address: string;
  city: string;
  zip: string;
}): string {
  const parts = [
    entry.address.trim(),
    [entry.city.trim(), entry.zip.trim()].filter(Boolean).join(" "),
  ].filter(Boolean);
  return parts.join(", ");
}

export function serializeCustomerAddress(row: CustomerAddressRow) {
  return {
    id: row.id,
    locationType: row.location_type,
    address: row.address,
    city: row.city,
    zip: row.zip,
    nickname: row.nickname ?? "",
    isDefault: row.is_default,
    formattedAddress: formatCustomerAddressLine(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CustomerAddressPayload = {
  locationType?: string;
  address?: string;
  city?: string;
  zip?: string;
  nickname?: string;
  isDefault?: boolean;
};

export function parseCustomerAddressPayload(body: unknown): CustomerAddressPayload | string {
  if (!body || typeof body !== "object") {
    return "Invalid request body";
  }

  const raw = body as Record<string, unknown>;
  const payload: CustomerAddressPayload = {};

  if ("locationType" in raw) {
    if (typeof raw.locationType !== "string" || !raw.locationType.trim()) {
      return "Invalid location type";
    }
    payload.locationType = raw.locationType.trim();
  }

  if ("address" in raw) {
    if (typeof raw.address !== "string") {
      return "Invalid street address";
    }
    payload.address = raw.address.trim();
  }

  if ("city" in raw) {
    if (typeof raw.city !== "string") {
      return "Invalid city";
    }
    payload.city = raw.city.trim();
  }

  if ("zip" in raw) {
    if (typeof raw.zip !== "string") {
      return "Invalid ZIP code";
    }
    payload.zip = raw.zip.trim();
  }

  if ("nickname" in raw) {
    if (raw.nickname !== null && typeof raw.nickname !== "string") {
      return "Invalid nickname";
    }
    payload.nickname = typeof raw.nickname === "string" ? raw.nickname.trim() : "";
  }

  if ("isDefault" in raw) {
    if (typeof raw.isDefault !== "boolean") {
      return "Invalid default flag";
    }
    payload.isDefault = raw.isDefault;
  }

  return payload;
}

export function validateCreateAddressPayload(payload: CustomerAddressPayload): string | null {
  if (!payload.locationType) {
    return "Select a location type";
  }
  if (isDropOffLocationType(payload.locationType)) {
    return "Drop-off locations cannot be saved as addresses";
  }
  if (!payload.address?.trim()) {
    return "Enter your street address";
  }
  if (!payload.city?.trim()) {
    return "Enter your city";
  }
  if (!payload.zip?.trim()) {
    return "Enter your ZIP code";
  }
  return null;
}

export function validateUpdateAddressPayload(payload: CustomerAddressPayload): string | null {
  if (payload.locationType && isDropOffLocationType(payload.locationType)) {
    return "Drop-off locations cannot be saved as addresses";
  }
  if (payload.address !== undefined && !payload.address.trim()) {
    return "Enter your street address";
  }
  if (payload.city !== undefined && !payload.city.trim()) {
    return "Enter your city";
  }
  if (payload.zip !== undefined && !payload.zip.trim()) {
    return "Enter your ZIP code";
  }
  return null;
}
