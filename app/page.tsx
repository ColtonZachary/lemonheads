import { AddOns } from "@/components/home/addons";
import { ContactCards } from "@/components/home/contact-cards";
import { Gallery } from "@/components/home/gallery";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { Locations } from "@/components/home/locations";
import { Packages } from "@/components/home/packages";
import { Reviews } from "@/components/home/reviews";
import { fetchPublicCatalog } from "@/lib/catalog/public-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const catalog = await fetchPublicCatalog(supabase);

  return (
    <>
      <Hero />
      <HowItWorks />
      <Locations />
      <Packages packages={catalog.packages} />
      <AddOns addons={catalog.addons} />
      <Gallery />
      <Reviews />
      <ContactCards />
    </>
  );
}
