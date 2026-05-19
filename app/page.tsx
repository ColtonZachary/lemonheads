import { AddOns } from "@/components/home/addons";
import { ContactCards } from "@/components/home/contact-cards";
import { Gallery } from "@/components/home/gallery";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { Locations } from "@/components/home/locations";
import { Packages } from "@/components/home/packages";
import { Reviews } from "@/components/home/reviews";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Locations />
      <Packages />
      <AddOns />
      <Gallery />
      <Reviews />
      <ContactCards />
    </>
  );
}
