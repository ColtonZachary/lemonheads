import { Icon } from "@/components/ui/icons";
import { Section, SectionLabel, SectionTitle } from "@/components/ui/section";
import { LOCATIONS } from "@/lib/data";

export function Locations() {
  return (
    <Section id="locations" className="bg-dk">
      <SectionLabel>Where We Serve</SectionLabel>
      <SectionTitle>OUR LOCATIONS</SectionTitle>

      <div className="mt-14 grid gap-px bg-border-faint sm:grid-cols-2 lg:grid-cols-4">
        {LOCATIONS.map((loc) => (
          <a
            key={loc.city}
            href={loc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block overflow-hidden bg-dk px-6 py-8 text-center transition-colors hover:bg-card2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-y after:transition-transform hover:after:scale-x-100"
          >
            <Icon
              name="building"
              className="mx-auto mb-4 h-8 w-8 text-y opacity-70"
            />
            <div className="mb-1 font-display text-xl tracking-[0.06em] text-text">
              {loc.city}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
              {loc.state}
            </div>
          </a>
        ))}
      </div>
    </Section>
  );
}
