import Link from "next/link";

import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { getHubLoginUrl } from "@/lib/app-url";
import { SITE } from "@/lib/site";

const FOOTER_LINKS = [
  { href: "/book", label: "Book Now" },
  { href: "/rewards", label: "Rewards" },
  { href: SITE.externalLinks.memberships, label: "Memberships", external: true },
  { href: SITE.externalLinks.faq, label: "FAQs", external: true },
  { href: SITE.externalLinks.shop, label: "Store", external: true },
  { href: SITE.externalLinks.blog, label: "Blog", external: true },
  { href: SITE.externalLinks.privacy, label: "Privacy", external: true },
  { href: "/feedback", label: "Site Feedback" },
];

const footerLinkClass =
  "font-mono text-[10px] uppercase tracking-[0.15em] text-muted transition-colors hover:text-y";

export function SiteFooter() {
  const hubLoginHref = getHubLoginUrl();
  const hubLoginExternal = hubLoginHref.startsWith("http");

  return (
    <footer className="flex flex-col gap-9 border-t border-border-faint bg-[#040404] px-[5%] pb-9 pt-12">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <Logo />

        <ul className="flex flex-wrap gap-7">
          {FOOTER_LINKS.map((link) => (
            <li key={link.label}>
              {link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerLinkClass}
                >
                  {link.label}
                </a>
              ) : (
                <Link href={link.href} className={footerLinkClass}>
                  {link.label}
                </Link>
              )}
            </li>
          ))}
          <li>
            {hubLoginExternal ? (
              <a href={hubLoginHref} className={footerLinkClass}>
                Employee Login
              </a>
            ) : (
              <Link href={hubLoginHref} className={footerLinkClass}>
                Employee Login
              </Link>
            )}
          </li>
        </ul>

        <div className="flex gap-2.5">
          <a
            href={SITE.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-border-faint bg-white/[0.04] text-muted transition-colors hover:border-y/25 hover:bg-y/[0.08] hover:text-y"
          >
            <Icon name="instagram" className="h-3.5 w-3.5" />
          </a>
          <a
            href={SITE.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-border-faint bg-white/[0.04] text-muted transition-colors hover:border-y/25 hover:bg-y/[0.08] hover:text-y"
          >
            <Icon name="facebook" className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.04] pt-7">
        <div className="font-mono text-[10px] tracking-[0.08em] text-muted/60">
          © {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </div>
        <Button asChild size="sm" className="text-[11px]">
          <Link href="/book">
            Book a Detail <Icon name="arrowRight" className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </footer>
  );
}
