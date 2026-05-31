import { VEHICLE_OPTIONS, type VehicleKey } from "@/lib/data";

const VALID_VEHICLE_KEYS = new Set<string>(VEHICLE_OPTIONS.map((v) => v.key));

export function isValidVehicleKey(key: string): key is VehicleKey {
  return VALID_VEHICLE_KEYS.has(key);
}

export function vehicleLabelForKey(key: string): string {
  return VEHICLE_OPTIONS.find((v) => v.key === key)?.label ?? key;
}

export const CUSTOMER_VEHICLE_SELECT =
  "id, customer_id, vehicle_key, vehicle_info, nickname, is_default, created_at, updated_at";

export type CustomerVehicleRow = {
  id: string;
  customer_id: string;
  vehicle_key: string;
  vehicle_info: string;
  nickname: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export function serializeCustomerVehicle(row: CustomerVehicleRow) {
  return {
    id: row.id,
    vehicleKey: row.vehicle_key,
    vehicleLabel: vehicleLabelForKey(row.vehicle_key),
    vehicleInfo: row.vehicle_info,
    nickname: row.nickname ?? "",
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CustomerVehiclePayload = {
  vehicleKey?: string;
  vehicleInfo?: string;
  nickname?: string;
  isDefault?: boolean;
};

export function parseCustomerVehiclePayload(body: unknown): CustomerVehiclePayload | string {
  if (!body || typeof body !== "object") {
    return "Invalid request body";
  }

  const raw = body as Record<string, unknown>;
  const payload: CustomerVehiclePayload = {};

  if ("vehicleKey" in raw) {
    if (typeof raw.vehicleKey !== "string" || !isValidVehicleKey(raw.vehicleKey)) {
      return "Invalid vehicle type";
    }
    payload.vehicleKey = raw.vehicleKey;
  }

  if ("vehicleInfo" in raw) {
    if (typeof raw.vehicleInfo !== "string") {
      return "Invalid vehicle details";
    }
    payload.vehicleInfo = raw.vehicleInfo.trim();
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

export function validateCreatePayload(payload: CustomerVehiclePayload): string | null {
  if (!payload.vehicleKey) {
    return "Select a vehicle type";
  }
  if (payload.vehicleInfo === undefined || payload.vehicleInfo.length < 2) {
    return "Enter your vehicle year, make, model, and color";
  }
  return null;
}
