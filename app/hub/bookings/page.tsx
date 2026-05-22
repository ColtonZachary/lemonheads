import { redirect } from "next/navigation";

import { requireHubAccess } from "@/lib/auth/require-hub";

/** Bookings list moved to Calendar; keep route for old links. */
export default async function HubBookingsPage() {
  await requireHubAccess({ managerOnly: true });
  redirect("/hub/calendar");
}
