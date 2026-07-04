import { Icon, type IconName } from "@/components/ui/icons";
import { Section, SectionLabel, SectionTitle } from "@/components/ui/section";
import { SITE } from "@/lib/site";

interface CardSpec {
  icon: IconName;
  label: string;
  value: string;
  detail?: string;
  href?: string;
  external?: boolean;
  highlight?: boolean;
}

export function ContactCards() {
  const cards: CardSpec[] = [
    {
      icon: "pin",
      label: "Headquarters",
      value: SITE.address.street,
      detail: `${SITE.address.city}, ${SITE.address.state} ${SITE.address.zip}`,
    },
    {
      icon: "clock",
      label: "Office Hours",
      value: "Mon – Fri",
      detail: "8:00 AM – 5:00 PM",
    },
    {
      icon: "phoneCall",
      label: "Main Line",
      value: SITE.phone.main.display,
      detail: "Call or text anytime",
      href: `tel:${SITE.phone.main.tel}`,
    },
    {
      icon: "message",
      label: "After Hours",
      value: SITE.phone.afterHours.display,
      detail: "Text preferred after 5 PM",
      href: `tel:${SITE.phone.afterHours.tel}`,
    },
    {
      icon: "mail",
      label: "Email",
      value: SITE.email.info,
      href: `mailto:${SITE.email.info}`,
    },
    {
      icon: "gift",
      label: "Gift Cards",
      value: "Purchase E-Gift Card",
      detail: "Perfect for any occasion",
      href: SITE.externalLinks.giftCards || undefined,
      external: true,
      highlight: true,
    },
  ];

  return (
    <Section id="contact" className="bg-dk">
      <SectionLabel>Get in Touch</SectionLabel>
      <SectionTitle>CONTACT US</SectionTitle>

      <div className="mt-14 grid gap-px bg-border-faint sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <ContactCard key={card.label} {...card} />
        ))}
      </div>
    </Section>
  );
}

function ContactCard({
  icon,
  label,
  value,
  detail,
  href,
  external,
  highlight,
}: CardSpec) {
  const inner = (
    <div
      className={`flex h-full flex-col bg-dk px-7 py-8 transition-colors hover:bg-card2 ${
        highlight ? "border border-y/20 bg-y/[0.06]" : ""
      }`}
    >
      <Icon name={icon} className="mb-4 h-7 w-7 text-y opacity-80" />
      <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
        {label}
      </div>
      <div
        className={`block text-[15px] font-bold ${
          highlight ? "text-y" : "text-text"
        }`}
      >
        {value}
      </div>
      {detail && (
        <div className="mt-1 font-mono text-[11px] text-muted">{detail}</div>
      )}
    </div>
  );

  if (!href) return inner;
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="contents">
      {inner}
    </a>
  ) : (
    <a href={href} className="contents">
      {inner}
    </a>
  );
}
