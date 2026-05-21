import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Section, SectionLabel, SectionTitle } from "@/components/ui/section";
import type { AddOn } from "@/lib/data";

export function AddOns({ addons }: { addons: AddOn[] }) {
  return (
    <Section id="addons" className="bg-dk">
      <SectionLabel>Enhance Your Detail</SectionLabel>
      <SectionTitle>ADD-ONS</SectionTitle>

      <div className="mt-12 grid gap-px bg-border-faint sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {addons.map((addon) => (
          <article
            key={addon.name}
            className="group relative overflow-hidden bg-dk px-6 py-7 transition-colors hover:bg-card2 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:origin-left before:scale-x-0 before:bg-gradient-to-r before:from-y before:to-transparent before:transition-transform before:duration-500 hover:before:scale-x-100"
          >
            <Icon
              name={addon.icon}
              className="mb-4 h-9 w-9 text-y opacity-65"
            />
            <div className="mb-1 font-display text-[22px] tracking-[0.04em]">
              {addon.name}
            </div>
            <div className="mb-2.5 font-display text-[30px] leading-none tracking-[0.02em] text-y">
              ${addon.price}
              {addon.priceSuffix && (
                <span className="ml-1 font-mono text-[11px] tracking-[0.05em] text-text/60">
                  {addon.priceSuffix}
                </span>
              )}
            </div>
            <p className="text-xs leading-[1.7] text-text/40">{addon.description}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 border-t border-border-faint pt-8 text-center">
        <p className="mb-5 font-mono text-[11px] tracking-[0.1em] text-muted">
          Tap any add-on during booking to include it
        </p>
        <Button asChild>
          <Link href="/book">
            Book & Add On <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
