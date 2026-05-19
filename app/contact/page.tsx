import type { Metadata } from "next";

import { ContactForm } from "@/components/contact/contact-form";
import { Icon } from "@/components/ui/icons";
import { SectionLabel } from "@/components/ui/section";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Lemonhead's Mobile Detail. Call, text, or send us a message — we reply within one business day.",
};

export default function ContactPage() {
  return (
    <>
      <header className="px-[5%] pb-12 pt-20 text-center">
        <SectionLabel centered>Get in Touch</SectionLabel>
        <h1 className="mt-4 font-display text-[clamp(52px,8vw,96px)] leading-[0.95] tracking-[0.02em]">
          CONTACT <span className="text-y">US</span>
        </h1>
        <p className="mt-3.5 font-mono text-[13px] tracking-[0.08em] text-text/40">
          Questions, quotes, or just a hello — we&rsquo;re listening.
        </p>
      </header>

      <div className="mx-auto grid max-w-[1100px] gap-px bg-border-faint px-[5%] pb-24 lg:grid-cols-[1fr_360px]">
        <div className="bg-bk px-1 py-1 sm:px-9 sm:py-9">
          <ContactForm />
        </div>
        <aside className="bg-card p-9">
          <SectionLabel>Other Ways</SectionLabel>
          <div className="mt-6 flex flex-col gap-7">
            <SidebarItem
              icon="phoneCall"
              label="Main Line"
              value={SITE.phone.main.display}
              href={`tel:${SITE.phone.main.tel}`}
            />
            <SidebarItem
              icon="message"
              label="After Hours"
              value={SITE.phone.afterHours.display}
              detail="Text preferred after 5 PM"
              href={`tel:${SITE.phone.afterHours.tel}`}
            />
            <SidebarItem
              icon="mail"
              label="Email"
              value={SITE.email.info}
              href={`mailto:${SITE.email.info}`}
            />
            <SidebarItem
              icon="pin"
              label="Headquarters"
              value={SITE.address.street}
              detail={`${SITE.address.city}, ${SITE.address.state} ${SITE.address.zip}`}
            />
            <SidebarItem
              icon="clock"
              label="Hours"
              value="Mon – Fri"
              detail="8:00 AM – 5:00 PM"
            />
          </div>
        </aside>
      </div>
    </>
  );
}

function SidebarItem({
  icon,
  label,
  value,
  detail,
  href,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  value: string;
  detail?: string;
  href?: string;
}) {
  const content = (
    <div className="flex gap-4">
      <Icon name={icon} className="mt-0.5 h-5 w-5 flex-shrink-0 text-y opacity-80" />
      <div>
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
          {label}
        </div>
        <div className="mt-0.5 text-sm font-bold text-text">{value}</div>
        {detail && (
          <div className="mt-0.5 font-mono text-[10px] text-muted">{detail}</div>
        )}
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="transition-colors hover:text-y">
      {content}
    </a>
  ) : (
    content
  );
}
