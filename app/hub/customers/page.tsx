import {
  CustomerMatchList,
  CustomerProfileView,
  CustomersSearchForm,
} from "@/components/hub/customers-hub-panel";
import { HubPageHeader } from "@/components/hub/hub-page";
import { requireHubAccess } from "@/lib/auth/require-hub";
import {
  fetchCustomerProfileByEmail,
  fetchCustomerProfileByPhone,
  searchCustomerProfiles,
} from "@/lib/hub/customer-search";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; email?: string; phone?: string }>;
}) {
  await requireHubAccess({ managerOnly: true });
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const q = sp.q?.trim() ?? "";
  const selectedEmail = sp.email?.trim() ?? "";
  const selectedPhone = sp.phone?.trim() ?? "";

  let profiles: Awaited<ReturnType<typeof searchCustomerProfiles>> = [];
  let activeProfile: Awaited<
    ReturnType<typeof fetchCustomerProfileByEmail>
  > = null;

  if (selectedEmail) {
    activeProfile = await fetchCustomerProfileByEmail(supabase!, selectedEmail);
  } else if (selectedPhone) {
    activeProfile = await fetchCustomerProfileByPhone(supabase!, selectedPhone);
  } else if (q.length >= 3) {
    profiles = await searchCustomerProfiles(supabase!, q);
    if (profiles.length === 1) {
      activeProfile = profiles[0]!;
      profiles = [];
    }
  }

  const showNoResults =
    (q.length >= 3 || selectedPhone.length >= 4) &&
    !activeProfile &&
    profiles.length === 0;
  const showHint = !q && !selectedEmail && !selectedPhone && !activeProfile;

  return (
    <div>
      <HubPageHeader
        title="Customers"
        description="Search booking history by email or phone · links open job detail"
      />

      <CustomersSearchForm defaultQuery={q || selectedPhone || undefined} />

      {showHint ? (
        <p className="mt-8 rounded-md border border-dashed border-border p-10 text-center font-mono text-xs text-muted-foreground">
          Enter a customer email or phone number to see jobs and totals.
        </p>
      ) : null}

      {showNoResults ? (
        <p className="mt-8 rounded-md border border-border p-10 text-center font-mono text-xs text-muted-foreground">
          No bookings found for &ldquo;{q}&rdquo;.
        </p>
      ) : null}

      {profiles.length > 1 ? (
        <CustomerMatchList profiles={profiles} searchQuery={q} />
      ) : null}

      {activeProfile ? (
        <CustomerProfileView profile={activeProfile} />
      ) : (selectedEmail || selectedPhone) && !activeProfile ? (
        <p className="mt-8 rounded-md border border-border p-10 text-center font-mono text-xs text-muted-foreground">
          No bookings found for {selectedEmail || selectedPhone}.
        </p>
      ) : null}
    </div>
  );
}
