/**
 * Content + pricing data for Lemonhead's Mobile Detail.
 *
 * Add a package → add it here AND make sure its `key` matches the
 * keys already wired through the booking flow.
 */

export type VehicleKey = "coupe" | "sedan" | "suv2" | "suv3" | "truck" | "van";

export const VEHICLE_OPTIONS: { key: VehicleKey; label: string; sub?: string }[] = [
  { key: "coupe", label: "2-Door Coupe" },
  { key: "sedan", label: "4-Door Sedan" },
  { key: "suv2", label: "2-Row SUV", sub: "RAV4, CR-V, Equinox" },
  { key: "suv3", label: "3-Row SUV", sub: "Tahoe, Suburban, Expedition" },
  { key: "truck", label: "Truck" },
  { key: "van", label: "Van" },
];

export type PackageKey =
  | "basic"
  | "quickie"
  | "toughy"
  | "fully"
  | "boujee"
  | "interior";

export interface Package {
  key: PackageKey;
  name: string;
  /** Pricing by VehicleKey index — [coupe, sedan, suv2, suv3, truck, van] */
  prices: Record<VehicleKey, number>;
  /** Estimated time on-site, used by scheduler */
  durationHours: number;
  description: string;
  features: string[];
  featured?: boolean;
}

export const PACKAGES: Package[] = [
  {
    key: "quickie",
    name: "Quickie",
    prices: { coupe: 69, sedan: 69, suv2: 79, suv3: 79, truck: 89, van: 79 },
    durationHours: 1.5,
    description:
      "A speedy refresh inside and out — perfect when you need it done fast.",
    features: [
      "Express exterior wash",
      "Interior vacuum",
      "Dashboard wipe-down",
      "Window cleaning",
    ],
  },
  {
    key: "basic",
    name: "Totally Basic",
    prices: { coupe: 129, sedan: 139, suv2: 149, suv3: 169, truck: 169, van: 169 },
    durationHours: 2,
    description:
      "Quick, clean, and no-frills. Gets your exterior looking sharp in no time.",
    features: [
      "Exterior hand wash & dry",
      "Wheel & tire cleaning",
      "Tire dressing",
      "Window exterior clean",
    ],
  },
  {
    key: "toughy",
    name: "Toughy",
    prices: { coupe: 129, sedan: 139, suv2: 139, suv3: 149, truck: 159, van: 159 },
    durationHours: 2.5,
    description:
      "Built for the vehicles that need a little extra elbow grease.",
    features: [
      "Heavy-duty exterior wash",
      "Wheel & tire deep clean",
      "Tire dressing",
      "Bug & tar removal",
      "Window exterior clean",
    ],
  },
  {
    key: "interior",
    name: "Interior Love",
    prices: { coupe: 169, sedan: 179, suv2: 189, suv3: 199, truck: 189, van: 209 },
    durationHours: 3,
    description:
      "Full interior refresh — deep cleaned, vacuumed, and smelling brand new.",
    features: [
      "Deep interior vacuum",
      "All surface wipe-down",
      "Leather/upholstery cleaning",
      "Interior window cleaning",
      "Odor treatment",
    ],
  },
  {
    key: "fully",
    name: "Fully Loaded",
    prices: { coupe: 209, sedan: 219, suv2: 229, suv3: 249, truck: 249, van: 259 },
    durationHours: 3.5,
    description:
      "The full treatment — every inch detailed inside and out to showroom condition.",
    features: [
      "Full exterior wash & dry",
      "Interior deep clean & vacuum",
      "Leather/upholstery treatment",
      "Windows inside & out",
      "Tire dressing & trim detail",
    ],
    featured: true,
  },
  {
    key: "boujee",
    name: "Boujee",
    prices: { coupe: 319, sedan: 339, suv2: 349, suv3: 359, truck: 349, van: 369 },
    durationHours: 4.5,
    description:
      "The ultimate luxury experience. Top-tier products, top-tier results.",
    features: [
      "Everything in Fully Loaded",
      "Paint decontamination",
      "Multi-stage machine polish",
      "Premium sealant & wax",
      "Swirl & scratch removal",
    ],
  },
];

export const PACKAGE_BY_KEY = Object.fromEntries(
  PACKAGES.map((p) => [p.key, p]),
) as Record<PackageKey, Package>;

/* ─── ADD-ONS ─── */

export interface AddOn {
  name: string;
  price: number;
  description: string;
  /** Display suffix on the price chip (e.g. "/ seat") */
  priceSuffix?: string;
  /** Used by `<Icon>` */
  icon:
    | "spray"
    | "steam"
    | "paw"
    | "ozone"
    | "clay"
    | "seat"
    | "headlight"
    | "clock"
    | "engine"
    | "ceramic";
}

export const ADDONS: AddOn[] = [
  {
    name: "Shampoo",
    price: 50,
    description: "Deep carpet & upholstery shampoo treatment",
    icon: "spray",
  },
  {
    name: "Steam Clean",
    price: 30,
    description: "High-pressure steam sanitizes surfaces & crevices",
    icon: "steam",
  },
  {
    name: "Pet Hair Removal",
    price: 50,
    description: "Full interior pet hair extraction & deodorize",
    icon: "paw",
  },
  {
    name: "Ozone Air Treatment",
    price: 70,
    description: "Eliminates odors at the molecular level",
    icon: "ozone",
  },
  {
    name: "Clay Bar",
    price: 50,
    description: "Removes bonded contaminants from paint surface",
    icon: "clay",
  },
  {
    name: "Child Seat Clean",
    price: 25,
    priceSuffix: "/ seat",
    description: "Thorough cleaning & sanitizing of child safety seats",
    icon: "seat",
  },
  {
    name: "Headlight Restoration",
    price: 120,
    description: "Clears yellowed & hazy lenses to like-new clarity",
    icon: "headlight",
  },
  {
    name: "Additional Cleaning",
    price: 75,
    description: "Extra time for heavily soiled or oversized vehicles",
    icon: "clock",
  },
  {
    name: "Engine Bay Clean",
    price: 75,
    description: "Degreased, cleaned & dressed engine compartment",
    icon: "engine",
  },
  {
    name: "Ceramic Spray",
    price: 40,
    description: "Hydrophobic ceramic coating spray for lasting shine",
    icon: "ceramic",
  },
];

/* ─── LOCATIONS ─── */

export interface Location {
  city: string;
  state: string;
  url: string;
}

export const LOCATIONS: Location[] = [
  {
    city: "Oklahoma City",
    state: "Oklahoma",
    url: "https://www.lemonheadsdetail.com/okcmobiledetailing",
  },
  {
    city: "Tulsa",
    state: "Oklahoma",
    url: "https://www.lemonheadsdetail.com/tulsamobiledetailing",
  },
  {
    city: "Enid",
    state: "Oklahoma",
    url: "https://www.lemonheadsdetail.com/enid-oklahoma-car-mobile-detailing-services",
  },
];

/* ─── TEAM ─── */

export type TeamRole = "Detailer" | "Manager" | "Detailer · Wrap Specialist";

export interface TeamMember {
  name: string;
  role: TeamRole;
  bio: string;
  /** Optional headshot path under /public; falls back to placeholder when missing */
  photo?: string;
  /** True if this team member can be booked as a detailer */
  isDetailer: boolean;
}

export const TEAM: TeamMember[] = [
  {
    name: "Colton",
    role: "Detailer",
    bio: "Hi I'm Colton and my hobbies include riding and working on motorcycles, going to the gym and learning. I am going to UCO for Mechanical Engineering and Computer Science. I want to work for NASA or SpaceX after graduation.",
    photo: "/team/colton.webp",
    isDetailer: true,
  },
  {
    name: "Dave",
    role: "Manager",
    bio: "Former educator and Texas Transplant. I enjoy video games and making music in my free time. Dream car is a 70s Datsun 240z.",
    photo: "/team/dave.webp",
    isDetailer: false,
  },
  {
    name: "Gunner",
    role: "Manager",
    bio: "Enjoys lifting, reading, and hanging out with his girlfriend.",
    photo: "/team/gunner.jpg",
    isDetailer: false,
  },
  {
    name: "Owen",
    role: "Detailer",
    bio: "27. Enjoy spending time with family, playing video games, and cleaning cars.",
    photo: "/team/owen.webp",
    isDetailer: true,
  },
  {
    name: "Austin",
    role: "Detailer · Wrap Specialist",
    bio: "No bio available.",
    photo: "/team/austin.webp",
    isDetailer: true,
  },
  {
    name: "Richard",
    role: "Detailer",
    bio: "I enjoy basketball, football, photography, and gaming. My goal is to stay healthy and be successful.",
    photo: "/team/richard.jpg",
    isDetailer: true,
  },
];

/** Names bookable in the online flow (must match `bookings.detailer_name`). */
export const DETAILER_NAMES = TEAM.filter((m) => m.isDetailer).map(
  (m) => m.name,
);

/* ─── REVIEWS ─── */

export interface Review {
  text: string;
  name: string;
  location: string;
  initials: string;
}

export const REVIEWS: Review[] = [
  {
    text: "Super convenient, great service, quality results. My husband's car had sunscreen smears and pine needles. Our cars look brand new.",
    name: "Allison",
    location: "Dallas, TX",
    initials: "AL",
  },
  {
    text: "10/10 every time! Paint correction made my car look incredible. Each detailer is kind, timely, and always above and beyond.",
    name: "Allie",
    location: "Edmond, OK",
    initials: "AE",
  },
  {
    text: "My 10-year-old car looks brand new. They came to my house and detailed to perfection while I ran errands. Unreal.",
    name: "Marci",
    location: "Wichita, KS",
    initials: "MA",
  },
];

/* ─── THE LAB SERVICES ─── */

export interface LabService {
  num: string;
  name: string;
  description: string;
  url: string;
  icon: "ceramic" | "wrap" | "polish" | "ppfColor" | "ppf";
}

export const LAB_SERVICES: LabService[] = [
  {
    num: "01",
    name: "Ceramic Coatings",
    description:
      "Long-term paint protection with hydrophobic ceramic coating — rated for years, not months.",
    url: "https://www.thelabok.com/ceramiccoatings",
    icon: "ceramic",
  },
  {
    num: "02",
    name: "Vinyl Wraps",
    description:
      "Full and partial vehicle wraps in any color or finish. Change the look without touching the paint.",
    url: "https://www.thelabok.com/vinylwraps",
    icon: "wrap",
  },
  {
    num: "03",
    name: "Paint Correction",
    description:
      "Machine polishing to remove swirls, scratches, and oxidation. Restore your paint to showroom clarity.",
    url: "https://www.thelabok.com/paintcorrection",
    icon: "polish",
  },
  {
    num: "04",
    name: "Colored PPF",
    description:
      "Paint protection film in a full range of colors — the look of a wrap with the protection of PPF.",
    url: "https://www.thelabok.com/colored-ppf",
    icon: "ppfColor",
  },
  {
    num: "05",
    name: "PPF",
    description:
      "Clear paint protection film that shields against rock chips, road debris, and UV damage — invisible armor.",
    url: "https://www.thelabok.com/paintprotectionfilm",
    icon: "ppf",
  },
];
