import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { assetPath } from "@/lib/asset-path";
import { SITE } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-[5%] pb-20 pt-[140px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 60% at 80% 30%, rgba(240,201,58,.06) 0%, transparent 65%), radial-gradient(ellipse 20% 30% at 20% 80%, rgba(240,201,58,.03) 0%, transparent 50%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-full w-[45%]"
        style={{
          background:
            "linear-gradient(135deg, transparent 50%, rgba(240,201,58,.03) 50%)",
        }}
      />
      <div className="lh-scan" />

      <div className="relative z-10 flex w-full max-w-[1400px] flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-14">
        <div className="flex-1 min-w-0 animate-[fadeUp_0.8s_ease_both]">
          <div className="mb-8 inline-flex w-fit items-center gap-2.5 rounded-[2px] border border-y/20 bg-y/[0.08] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-y">
            <span className="text-[8px] opacity-60">▶</span>
            OKC · Tulsa · Enid
          </div>

          <h1 className="font-display text-[clamp(72px,12vw,160px)] leading-[0.88] tracking-[0.01em]">
            WE COME
            <br />
            TO{" "}
            <span className="relative inline-block text-y [text-shadow:0_0_80px_rgba(240,201,58,0.25)]">
              YOU.
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-2 block h-[3px] bg-y"
              />
            </span>
          </h1>

          <p className="mt-7 max-w-[440px] text-[clamp(14px,1.6vw,17px)] leading-[1.8] text-text/50">
            Premium mobile detailing that fits your schedule. Book online, we
            handle the rest — right where you are.
          </p>

          <div className="mt-11 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/book">Book a Detail</Link>
            </Button>
            <Button asChild variant="outline">
              <a href="#how">How It Works</a>
            </Button>
          </div>

          <div className="mt-6 flex flex-col items-start gap-3">
            <div className="font-mono text-[15px] font-bold uppercase tracking-[0.2em] text-y [text-shadow:0_0_18px_rgba(240,201,58,0.5)]">
              Download the App
            </div>
            <a
              href={SITE.externalLinks.appStore}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-fit items-center gap-4 rounded-[10px] border-[1.5px] border-y/50 bg-y/10 px-7 py-4 text-text shadow-[0_0_24px_rgba(240,201,58,0.12)] transition-all hover:-translate-y-0.5 hover:border-y/75 hover:bg-y/[0.18] hover:shadow-[0_0_40px_rgba(240,201,58,0.25)]"
            >
              <Icon name="apple" className="h-10 w-10 flex-shrink-0 text-y" />
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-text/60">
                  Download on the
                </div>
                <div className="mt-1 text-[22px] font-bold leading-tight">
                  App Store
                </div>
              </div>
            </a>
          </div>

          <dl className="relative mt-16 flex flex-wrap gap-12 border-t border-white/[0.06] pt-12 before:absolute before:-top-px before:left-0 before:h-px before:w-[60px] before:bg-y">
            <Stat num="3K+" label="Happy Customers" />
            <Stat num="5★" label="Avg. Rating" />
            <Stat num="3" label="Cities Served" />
          </dl>
        </div>

        <div className="relative w-full max-w-[480px] flex-shrink-0 lg:w-[42%] lg:max-w-[520px]">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[4px] border border-y/25 max-lg:aspect-[4/3] max-lg:max-h-[360px]">
            <Image
              src={assetPath("/bike.webp")}
              alt="Lemonhead's Mobile Detail — detailing a Harley-Davidson CVO"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 42vw"
              className="object-cover object-center saturate-[0.85]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bk/55 via-transparent to-transparent"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div>
      <dt className="font-display text-[48px] leading-none tracking-[0.02em] text-y">
        {num}
      </dt>
      <dd className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
        {label}
      </dd>
    </div>
  );
}
