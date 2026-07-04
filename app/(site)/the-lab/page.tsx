import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { SectionLabel } from "@/components/ui/section";
import { LAB_SERVICES } from "@/lib/data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "The LAB — Detail Shop",
  description:
    `The LAB is our headquarters shop. Ceramic coatings, vinyl wraps, paint correction, and paint protection film.`,
};

export default function TheLabPage() {
  return (
    <>
      <header className="px-[5%] pb-12 pt-20 text-center">
        <SectionLabel centered>Our Shop in Edmond</SectionLabel>
        <h1 className="mt-4 font-display text-[clamp(52px,8vw,96px)] leading-[0.95] tracking-[0.02em]">
          THE <span className="text-y">LAB</span>
        </h1>
        <p className="mt-3.5 font-mono text-[13px] tracking-[0.08em] text-text/40">
          {SITE.address.street} · {SITE.address.city}, {SITE.address.state}{" "}
          {SITE.address.zip} · {SITE.phone.afterHours.display}
        </p>
      </header>

      <div className="mx-auto max-w-[1100px] px-[5%] pb-24">
        {/* About + Hours */}
        <div className="mb-15 grid gap-px bg-border-faint sm:grid-cols-2">
          <div className="bg-card p-10">
            <SectionLabel>What Is The LAB</SectionLabel>
            <h2 className="mt-4 mb-4 font-display text-[36px] leading-none tracking-[0.04em]">
              OUR
              <br />
              HOME BASE
            </h2>
            <p className="text-[13px] leading-[1.9] text-text/50">
              The LAB is our headquarters — the shop behind the mobile
              operation. Drop your vehicle off and we&apos;ll handle the detail
              while you get on with your day. Same quality, stationary setting.
            </p>
          </div>
          <div className="bg-card p-10">
            <SectionLabel>Hours &amp; Location</SectionLabel>
            <div className="mt-5 flex flex-col gap-5">
              <Info label="Address" value={SITE.address.street}>
                {SITE.address.city}, {SITE.address.state} {SITE.address.zip}
              </Info>
              <Info label="Hours" value="Mon – Fri, 8:00 AM – 5:00 PM" />
              <Info label="Phone" value={SITE.phone.afterHours.display} />
            </div>
          </div>
        </div>

        {/* Services */}
        <SectionLabel>What We Offer</SectionLabel>
        <h2 className="mt-4 mb-12 font-display text-[clamp(44px,6.5vw,80px)] leading-[0.95] tracking-[0.02em]">
          SERVICES
        </h2>

        <div className="grid gap-px bg-border-faint sm:grid-cols-2 lg:grid-cols-3">
          {LAB_SERVICES.map((svc) => (
            <a
              key={svc.num}
              href={svc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden bg-card p-11 transition-colors hover:bg-card2"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -top-4 right-3 font-display text-[96px] leading-none tracking-tight text-y/[0.04]"
              >
                {svc.num}
              </span>
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-md border border-y/15 bg-y/[0.08] text-y">
                <Icon name={svc.icon} className="h-5 w-5" />
              </div>
              <div className="mb-3 font-display text-[30px] tracking-[0.04em] text-text">
                {svc.name}
              </div>
              <p className="text-[13px] leading-[1.8] text-text/40">
                {svc.description}
              </p>
              <div className="mt-6 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-y">
                Learn More <Icon name="arrowRight" className="h-3 w-3" />
              </div>
            </a>
          ))}
        </div>

        {/* Consultation CTA */}
        <div className="mt-px flex flex-wrap items-center justify-between gap-6 border border-y/15 bg-y/[0.04] p-11">
          <div>
            <SectionLabel>Ready to Get Started?</SectionLabel>
            <div className="mt-3 font-display text-[40px] leading-none tracking-[0.04em]">
              BOOK A CONSULTATION
            </div>
            <p className="mt-2.5 max-w-[400px] text-[13px] leading-[1.8] text-text/45">
              Talk to the team at The LAB about ceramic coatings, wraps, PPF,
              and paint correction. No commitment, just answers.
            </p>
          </div>
          <Button asChild>
            {SITE.externalLinks.theLab ? (
              <a
                href={`${SITE.externalLinks.theLab}/book-online-1`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a consultation <Icon name="arrowRight" className="h-3.5 w-3.5" />
              </a>
            ) : (
              <Link href="/contact">
                Contact us <Icon name="arrowRight" className="h-3.5 w-3.5" />
              </Link>
            )}
          </Button>
        </div>
      </div>

      <div className="pb-16 text-center">
        <Link
          href="/"
          className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.15em] text-muted transition-colors hover:text-y"
        >
          ← Back to Home
        </Link>
      </div>
    </>
  );
}

function Info({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
        {label}
      </div>
      <div className="text-[15px] font-bold">{value}</div>
      {children && (
        <div className="mt-0.5 font-mono text-xs text-muted">{children}</div>
      )}
    </div>
  );
}
