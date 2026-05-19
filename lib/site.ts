/**
 * Single source of truth for business contact + brand metadata.
 * Update once here and it flows into nav, footer, contact, email templates, etc.
 */
export const SITE = {
  name: "Lemonhead's Mobile Detail",
  shortName: "LEMONHEADS",
  tagline: "Mobile Detail",
  domain: "lemonheadsdetail.com",
  url: "https://lemonheadsdetail.com",

  address: {
    street: "2600 Linda Ln, Suite 9",
    city: "Edmond",
    state: "OK",
    zip: "73013",
  },

  phone: {
    main: { display: "833-536-6648", tel: "+18335366648" },
    afterHours: { display: "405-471-1168", tel: "+14054711168" },
  },

  email: {
    info: "info@lemonheadsdetail.com",
    /** Inbox that booking + contact form submissions are routed to */
    bookings: "info@lemonheadsdetail.com",
  },

  hours: "Mon – Fri · 8:00 AM – 5:00 PM",

  social: {
    instagram: "https://www.instagram.com/lemonheadsdetail/",
    facebook: "https://www.facebook.com/Lemonheadsdetail/",
  },

  externalLinks: {
    appStore: "https://apps.apple.com/us/app/lemonheads/id6444708582",
    memberships:
      "https://www.lemonheadsdetail.com/mobiledetailingmemberships",
    faq: "https://www.lemonheadsdetail.com/q-a",
    shop: "https://www.lemonheadsdetail.com/shop",
    blog: "https://www.lemonheadsdetail.com/blog",
    privacy: "https://www.lemonheadsdetail.com/privacy-policy",
    giftCards: "https://squareup.com/gift/8F6FQP6M1ZSDD/order",
    theLab: "https://www.thelabok.com",
  },
} as const;
