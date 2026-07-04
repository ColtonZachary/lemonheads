/**
 * Single source of truth for business contact + brand metadata.
 * Customize all values here when rebranding for a new detailing company.
 */
export const SITE = {
  name: "Your Detailing Company",
  shortName: "DETAIL CO",
  tagline: "Mobile Detail",
  domain: "yourdomain.com",
  url: "https://yourdomain.com",

  address: {
    street: "123 Main St",
    city: "Your City",
    state: "ST",
    zip: "00000",
  },

  phone: {
    main: { display: "555-000-0000", tel: "+15550000000" },
    afterHours: { display: "555-000-0001", tel: "+15550000001" },
  },

  email: {
    info: "info@yourdomain.com",
    /** Inbox that booking + contact form submissions are routed to */
    bookings: "info@yourdomain.com",
  },

  hours: "Mon – Fri · 8:00 AM – 5:00 PM",

  social: {
    instagram: "",
    facebook: "",
  },

  externalLinks: {
    /** Leave empty until your iOS app is live */
    appStore: "",
    memberships: "",
    faq: "",
    shop: "",
    blog: "",
    privacy: "",
    giftCards: "",
  },
} as const;

/** Prefix for outbound SMS messages, e.g. "DETAIL CO:" */
export function smsBrandLabel(): string {
  return `${SITE.shortName}:`;
}
