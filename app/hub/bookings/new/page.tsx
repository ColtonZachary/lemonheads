import { redirect } from "next/navigation";

import { requireHubAccess } from "@/lib/auth/require-hub";

/** New bookings are created from the calendar panel; keep route for old links. */
export default async function HubBookingNewPage() {
  await requireHubAccess({ managerOnly: true });
  redirect("/hub/calendar");
}
