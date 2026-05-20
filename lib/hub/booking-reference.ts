/** Public booking reference (same format as website flow). */
export function generateBookingReferenceId(): string {
  return `LH-${Date.now().toString(36).toUpperCase()}`;
}
