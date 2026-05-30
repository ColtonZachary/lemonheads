"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Section, SectionLabel, SectionTitle } from "@/components/ui/section";
import { VEHICLE_OPTIONS, type VehicleKey } from "@/lib/data";
import type { SitePackage } from "@/lib/catalog/public-catalog";
import { cn, formatCurrency } from "@/lib/utils";

const TOP_LEVEL: { key: VehicleKey | "suv"; label: string }[] = [
  { key: "coupe", label: "2-Door Coupe" },
  { key: "sedan", label: "4-Door Sedan" },
  { key: "suv", label: "SUV" },
  { key: "truck", label: "Truck" },
  { key: "van", label: "Van" },
];

export function Packages({ packages }: { packages: SitePackage[] }) {
  const [vehicle, setVehicle] = useState<VehicleKey>("coupe");
  const [suvOpen, setSuvOpen] = useState(false);

  const isSuv = vehicle === "suv2" || vehicle === "suv3";

  return (
    <Section id="packages" className="bg-bk">
      <SectionLabel>What We Offer</SectionLabel>
      <SectionTitle>DETAIL PACKAGES</SectionTitle>

      {/* Vehicle selector */}
      <div className="mt-12 mb-12">
        <p className="mb-4 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.25em] text-muted">
          Select your vehicle for pricing
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {TOP_LEVEL.map((opt) => {
            const isActive =
              opt.key === "suv"
                ? isSuv || suvOpen
                : vehicle === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  if (opt.key === "suv") {
                    setSuvOpen((v) => !v);
                  } else {
                    setVehicle(opt.key as VehicleKey);
                    setSuvOpen(false);
                  }
                }}
                className={cn(
                  "cursor-pointer rounded-[3px] border px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] transition-all",
                  isActive
                    ? "border-y bg-y/10 text-y"
                    : "border-white/10 text-text/45 hover:border-y/40 hover:text-y",
                )}
              >
                {opt.label}
                {opt.key === "suv" ? (suvOpen ? " ▴" : " ▾") : ""}
              </button>
            );
          })}
        </div>

        {suvOpen && (
          <div className="mt-2 flex justify-center gap-2">
            {(["suv2", "suv3"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setVehicle(k)}
                className={cn(
                  "cursor-pointer rounded-[3px] border px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition-all",
                  vehicle === k
                    ? "border-y bg-y/[0.18] text-y shadow-[0_0_0_1px_var(--color-y)]"
                    : "border-y/25 bg-y/[0.06] text-y hover:bg-y/[0.14]",
                )}
              >
                {k === "suv2" ? "2-Row SUV" : "3-Row SUV"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Package cards */}
      <div className="grid grid-cols-1 gap-px md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {packages.map((pkg) => (
          <article
            key={pkg.key}
            className={cn(
              "relative overflow-hidden border border-border-faint bg-bk p-8 transition-colors hover:bg-card2",
              pkg.featured && "border-transparent bg-card",
            )}
          >
            {pkg.featured && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-y/[0.06] to-transparent"
              />
            )}
            <div className="relative">
              {pkg.featured && (
                <span className="mb-5 inline-block rounded-[2px] bg-y px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-black">
                  Most Popular
                </span>
              )}
              <div className="mb-2 font-display text-[32px] tracking-[0.04em]">
                {pkg.name}
              </div>
              <div className="mb-1 font-display text-[38px] leading-none tracking-[0.02em] text-y transition-opacity">
                {formatCurrency(pkg.prices[vehicle])}
              </div>
              <div className="mb-5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted">
                Starting price
              </div>
              <p className="mb-7 text-xs leading-[1.7] text-text/45">
                {pkg.description}
              </p>
              <ul className="mb-8 list-none">
                {pkg.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 border-b border-white/5 py-2.5 text-xs text-text/70"
                  >
                    <span
                      aria-hidden
                      className="h-1 w-1 flex-shrink-0 rounded-full bg-y opacity-80"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={`/book?service=${pkg.key}&vehicle=${vehicle}`}
                className={cn(
                  "block rounded-[2px] border border-white/10 bg-transparent py-3 text-center font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text/40 transition-all hover:border-y hover:bg-y hover:text-black",
                  pkg.featured && "border-y bg-y text-black",
                )}
              >
                Book This
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 border-t border-border-faint pt-8 text-center">
        <Button asChild>
          <Link href="/book">
            View All Packages & Book{" "}
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Used to align vehicle key with VEHICLE_OPTIONS list */}
      <span className="sr-only">{VEHICLE_OPTIONS.length} vehicle options</span>
    </Section>
  );
}
