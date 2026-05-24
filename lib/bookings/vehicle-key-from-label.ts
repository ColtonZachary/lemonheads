import type { VehicleKey } from "@/lib/data";

const LABEL_TO_KEY: Record<string, VehicleKey> = {
  "2-door coupe": "coupe",
  "4-door sedan": "sedan",
  "2-row suv": "suv2",
  "3-row suv": "suv3",
  truck: "truck",
  van: "van",
};

export function vehicleKeyFromTypeLabel(label: string): VehicleKey | null {
  return LABEL_TO_KEY[label.trim().toLowerCase()] ?? null;
}
