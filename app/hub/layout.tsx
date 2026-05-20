import { HubNav } from "@/components/hub/hub-nav";
import { requireHubAccess } from "@/lib/auth/require-hub";

export const metadata = {
  title: "Managers Hub",
};

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await requireHubAccess();

  return (
    <div className="flex min-h-[100svh] bg-dk text-text">
      <HubNav access={access} />
      <main className="flex-1 overflow-x-auto p-6 md:p-10">{children}</main>
    </div>
  );
}
