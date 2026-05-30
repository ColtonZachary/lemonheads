import { SitePageViewBeacon } from "@/components/analytics/site-page-view-beacon";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SitePageViewBeacon />
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
