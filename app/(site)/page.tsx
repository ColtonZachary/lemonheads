import { Suspense } from "react";

import { ContactCards } from "@/components/home/contact-cards";
import { Gallery } from "@/components/home/gallery";
import { Hero } from "@/components/home/hero";
import { HomeCatalogSections } from "@/components/home/home-catalog-sections";
import { HowItWorks } from "@/components/home/how-it-works";
import { Locations } from "@/components/home/locations";
import { Reviews } from "@/components/home/reviews";
import { Section, SectionLabel, SectionTitle } from "@/components/ui/section";

/** ISR — catalog/gallery load from cached Supabase reads in Suspense boundaries. */
export const revalidate = 300;

function CatalogFallback() {
  return (
    <Section id="packages" className="bg-bk">
      <SectionLabel>What We Offer</SectionLabel>
      <SectionTitle>DETAIL PACKAGES</SectionTitle>
      <p className="mt-8 font-mono text-xs tracking-[0.12em] text-text/40">
        Loading packages…
      </p>
    </Section>
  );
}

function GalleryFallback() {
  return (
    <Section id="gallery" className="bg-dk py-20">
      <SectionLabel>Our Work</SectionLabel>
      <SectionTitle>
        DETAILS THAT
        <br />
        SPEAK FOR THEMSELVES
      </SectionTitle>
      <p className="mt-8 font-mono text-xs tracking-[0.12em] text-text/40">
        Loading gallery…
      </p>
    </Section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Locations />
      <Suspense fallback={<CatalogFallback />}>
        <HomeCatalogSections />
      </Suspense>
      <Suspense fallback={<GalleryFallback />}>
        <Gallery />
      </Suspense>
      <Reviews />
      <ContactCards />
    </>
  );
}
