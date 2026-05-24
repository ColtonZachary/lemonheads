"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/site/logo";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const PRIMARY_LINKS = [
  { href: "/#packages", label: "Packages" },
  { href: "/#addons", label: "Add-Ons" },
  { href: "/the-lab", label: "The LAB" },
];

const MORE_LINKS = [
  { href: "/#how", label: "How It Works" },
  { href: "/#locations", label: "Locations" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/contact", label: "Contact" },
  { href: "/team", label: "Team" },
];

export function SiteNav() {
  // pathname is captured so child <Link> clicks close the mobile drawer
  // without needing a setState-in-effect anti-pattern.
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openedFor, setOpenedFor] = useState<string | null>(null);

  // Derive: if the drawer was opened for a different path than the current one,
  // it's effectively closed. Cheap, no effect needed.
  const isOpen = mobileOpen && openedFor === pathname;

  const toggle = () => {
    setMobileOpen((v) => !v);
    setOpenedFor(pathname);
  };

  const close = () => setMobileOpen(false);

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 flex h-[68px] items-center justify-between border-b border-y/10 bg-bk/95 px-[5%] backdrop-blur-xl">
        <Logo />

        <ul className="hidden items-center gap-7 lg:flex">
          <li>
            <Link
              href="/rewards"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:text-y"
            >
              Rewards
            </Link>
          </li>
          {PRIMARY_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:text-y"
              >
                {link.label}
              </Link>
            </li>
          ))}

          <li className="group relative flex items-center">
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors group-hover:text-y"
            >
              <div className="flex flex-col gap-1">
                <span className="block h-px w-4 bg-white transition-colors group-hover:bg-y" />
                <span className="block h-px w-4 bg-white transition-colors group-hover:bg-y" />
                <span className="block h-px w-4 bg-white transition-colors group-hover:bg-y" />
              </div>
              More
            </button>
            <div className="absolute right-0 top-full hidden min-w-[200px] pt-4 group-hover:flex">
              <div className="flex w-full flex-col border border-y/15 bg-bk/95 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                {MORE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="border-b border-white/5 px-5 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-text/70 transition-colors last:border-b-0 hover:bg-y/[0.04] hover:text-y"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </li>

          <li>
            <Link
              href="/book"
              className="rounded-[4px] bg-y px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-black transition-all hover:-translate-y-px hover:bg-white hover:shadow-[0_0_30px_rgba(240,201,58,0.3)]"
            >
              Book Now
            </Link>
          </li>
        </ul>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          onClick={toggle}
          className="flex cursor-pointer flex-col gap-1.5 p-1 lg:hidden"
        >
          <span
            className={cn(
              "block h-px w-6 bg-y transition-transform duration-300",
              isOpen && "translate-y-[6.5px] rotate-45",
            )}
          />
          <span
            className={cn(
              "block h-px w-6 bg-y transition-opacity duration-300",
              isOpen && "opacity-0",
            )}
          />
          <span
            className={cn(
              "block h-px w-6 bg-y transition-transform duration-300",
              isOpen && "-translate-y-[6.5px] -rotate-45",
            )}
          />
        </button>
      </nav>

      {/* Mobile menu drawer */}
      <div
        className={cn(
          "fixed inset-x-0 top-[68px] z-40 flex-col gap-1 border-b border-y/10 bg-bk/95 px-[5%] pb-7 pt-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] lg:hidden",
          isOpen ? "flex" : "hidden",
        )}
      >
        <Link
          href="/rewards"
          onClick={close}
          className="border-b border-white/5 py-3 font-mono text-sm font-semibold uppercase tracking-[0.1em] text-text transition-colors hover:text-y"
        >
          Rewards
        </Link>
        {[...PRIMARY_LINKS, ...MORE_LINKS].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={close}
            className="border-b border-white/5 py-3 font-mono text-sm font-semibold uppercase tracking-[0.1em] text-text transition-colors hover:text-y"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/book"
          onClick={close}
          className="mt-4 rounded-[4px] bg-y px-4 py-3.5 text-center font-mono text-[13px] font-bold uppercase tracking-[0.15em] text-black"
        >
          <span className="inline-flex items-center gap-2">
            Book Online <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>

      {/* Spacer so content doesn't slide under the fixed nav */}
      <div aria-hidden className="h-[68px]" />
    </>
  );
}
