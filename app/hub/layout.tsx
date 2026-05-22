import { HubNav } from "@/components/hub/hub-nav";
import { HubThemeShell } from "@/components/hub/hub-theme-shell";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchHubThemeForProfile } from "@/lib/hub/hub-theme-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Managers Hub",
};

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await requireHubAccess();
  const supabase = await createSupabaseServerClient();
  const { theme } = await fetchHubThemeForProfile(supabase!, access.profile.id);

  return (
    <HubThemeShell theme={theme}>
      <HubNav access={access} />
      <main className="flex-1 overflow-x-auto p-6 md:p-10">{children}</main>
    </HubThemeShell>
  );
}
