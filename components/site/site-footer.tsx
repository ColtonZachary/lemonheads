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
].filter((link) => !link.external || link.href);

const footerLinkClass =
  "font-mono text-[10px] uppercase tracking-[0.15em] text-text/55 transition-colors hover:text-y";

const socialClass =
  "flex size-9 items-center justify-center rounded-[4px] border border-border-faint bg-white/[0.04] text-text/55 transition-colors hover:border-y/25 hover:bg-y/[0.08] hover:text-y";

export function SiteFooter() {
  const hubLoginHref = getHubLoginUrl();
  const hubLoginExternal = hubLoginHref.startsWith("http");
  const socialLinks = [
    { href: SITE.social.instagram, label: "Instagram", icon: "instagram" as const },
    { href: SITE.social.facebook, label: "Facebook", icon: "facebook" as const },
  ].filter((link) => link.href);

  return (
    <footer className="flex flex-col gap-9 border-t border-border-faint bg-bk px-[5%] pb-9 pt-12">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <Logo />

        <ul className="flex flex-wrap items-center gap-x-7 gap-y-3">
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

        {socialLinks.length > 0 ? (
          <div className="flex gap-2.5">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className={socialClass}
              >
                <Icon name={link.icon} className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-faint pt-7">
        <p className="font-mono text-[10px] tracking-[0.08em] text-text/45">
          © {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </p>
        <Button asChild variant="default" size="sm" className="text-[11px]">
          <Link href="/book">
            Book a Detail <Icon name="arrowRight" className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </footer>
  );
}
