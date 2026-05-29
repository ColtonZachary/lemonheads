import Image from "next/image";

import { Section, SectionLabel, SectionTitle } from "@/components/ui/section";
import { getCachedGalleryItems } from "@/lib/media/cached-gallery";

export async function Gallery() {
  const items = await getCachedGalleryItems();

  return (
    <Section id="gallery" className="bg-dk py-20">
      <SectionLabel>Our Work</SectionLabel>
      <SectionTitle>
        DETAILS THAT
        <br />
        SPEAK FOR THEMSELVES
      </SectionTitle>

      <div className="mt-14 grid grid-cols-1 gap-[3px] sm:grid-cols-2 lg:grid-cols-12">
        {items.map((item, idx) => (
          <div
            key={`${item.src}-${idx}`}
            className={`group relative overflow-hidden ${item.span}`}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover saturate-[0.8] transition-all duration-700 group-hover:scale-[1.06] group-hover:saturate-100"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 bg-y/[0.06] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
