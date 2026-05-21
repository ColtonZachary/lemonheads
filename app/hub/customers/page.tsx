import {
  CustomerMatchList,
  CustomerProfileView,
  CustomersSearchForm,
} from "@/components/hub/customers-hub-panel";
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
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">CUSTOMERS</h1>
      <p className="mt-2 font-mono text-xs tracking-[0.08em] text-text/40">
        Search booking history by email or phone · links open job detail
      </p>

      <CustomersSearchForm defaultQuery={q || selectedPhone || undefined} />

      {showHint ? (
        <p className="mt-8 rounded-md border border-dashed border-white/10 p-10 text-center font-mono text-xs text-text/40">
          Enter a customer email or phone number to see jobs and totals.
        </p>
      ) : null}

      {showNoResults ? (
        <p className="mt-8 rounded-md border border-white/10 p-10 text-center font-mono text-xs text-text/40">
          No bookings found for &ldquo;{q}&rdquo;.
        </p>
      ) : null}

      {profiles.length > 1 ? (
        <CustomerMatchList profiles={profiles} searchQuery={q} />
      ) : null}

      {activeProfile ? (
        <CustomerProfileView profile={activeProfile} />
      ) : (selectedEmail || selectedPhone) && !activeProfile ? (
        <p className="mt-8 rounded-md border border-white/10 p-10 text-center font-mono text-xs text-text/40">
          No bookings found for {selectedEmail || selectedPhone}.
        </p>
      ) : null}
    </div>
  );
}
