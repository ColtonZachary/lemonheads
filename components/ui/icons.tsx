import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

const baseProps: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function Icon({
  name,
  className,
  ...rest
}: { name: IconName } & IconProps) {
  const Comp = ICONS[name];
  return <Comp {...baseProps} className={className} {...rest} />;
}

export type IconName = keyof typeof ICONS;

export const ICONS = {
  /* Hero / how-it-works */
  phone: (p: IconProps) => (
    <svg {...p}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={2.5} />
    </svg>
  ),
  car: (p: IconProps) => (
    <svg {...p}>
      <path d="M5 17H3a2 2 0 01-2-2v-4l2.5-5h13L19 11v4a2 2 0 01-2 2h-2m-8 0a2 2 0 104 0m4 0a2 2 0 104 0" />
    </svg>
  ),
  star: (p: IconProps) => (
    <svg {...p}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  ),
  /* Locations */
  building: (p: IconProps) => (
    <svg {...p}>
      <path d="M3 21h18M9 21V7l6-4v18M9 9H6a1 1 0 00-1 1v11M15 9h3a1 1 0 011 1v11" />
    </svg>
  ),
  /* Contact */
  pin: (p: IconProps) => (
    <svg {...p}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  clock: (p: IconProps) => (
    <svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  phoneCall: (p: IconProps) => (
    <svg {...p}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .92h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.9a16 16 0 006.29 6.29l1.35-1.35a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  message: (p: IconProps) => (
    <svg {...p}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  mail: (p: IconProps) => (
    <svg {...p}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  gift: (p: IconProps) => (
    <svg {...p}>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  ),
  /* Social */
  instagram: (p: IconProps) => (
    <svg {...p}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (p: IconProps) => (
    <svg {...p}>
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  ),
  /* Apple/App store */
  apple: (p: IconProps) => (
    <svg {...p} fill="currentColor" stroke="none">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  ),
  /* Service icons */
  document: (p: IconProps) => (
    <svg {...p}>
      <path d="M9 12h6M9 16h6m-3-12v4M5 6a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6z" />
    </svg>
  ),
  bolt: (p: IconProps) => (
    <svg {...p}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  wrench: (p: IconProps) => (
    <svg {...p}>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  diamond: (p: IconProps) => (
    <svg {...p}>
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M2 9h20M6 3l-2 6m16-6l2 6M10 3L8 9l4 13M14 3l2 6-4 13" />
    </svg>
  ),
  couch: (p: IconProps) => (
    <svg {...p}>
      <path d="M4 10h16M4 10V6a2 2 0 012-2h12a2 2 0 012 2v4M4 10l-1 8h18l-1-8M8 18v3m8-3v3" />
    </svg>
  ),
  /* Vehicle icons */
  coupe: (p: IconProps) => (
    <svg {...p}>
      <path d="M2 14l3-7h14l3 7M2 14h20M2 14v4h2m16-4v4h-2m-14 0a2 2 0 104 0m6 0a2 2 0 104 0M7 7l2-4m8 4l-2-4" />
    </svg>
  ),
  sedan: (p: IconProps) => (
    <svg {...p}>
      <path d="M5 17H3a2 2 0 01-2-2v-4l2.5-5h13L19 11v4a2 2 0 01-2 2h-2m-8 0a2 2 0 104 0m4 0a2 2 0 104 0" />
    </svg>
  ),
  suv: (p: IconProps) => (
    <svg {...p}>
      <path d="M1 4h14l3 5h3a2 2 0 012 2v4h-2m-2 0H7m-4 0H3v-4M1 4v7m0 0h2" />
      <circle cx="6" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M1 11h18" />
    </svg>
  ),
  truck: (p: IconProps) => (
    <svg {...p}>
      <path d="M1 7h10v8H1zM11 11h6l4 4v0h-10z" />
      <circle cx="4" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
  van: (p: IconProps) => (
    <svg {...p}>
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <path d="M1 10h22M7 4v16m5-16v6" />
    </svg>
  ),
  /* Add-ons */
  spray: (p: IconProps) => (
    <svg {...p}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4" />
      <path d="M12 8v1m0 6v1m-4-4h1m6 0h1" />
    </svg>
  ),
  steam: (p: IconProps) => (
    <svg {...p}>
      <path d="M3 12h18M3 6l4 6-4 6M21 6l-4 6 4 6" />
    </svg>
  ),
  paw: (p: IconProps) => (
    <svg {...p}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  ozone: (p: IconProps) => (
    <svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  ),
  clay: (p: IconProps) => (
    <svg {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  seat: (p: IconProps) => (
    <svg {...p}>
      <path d="M12 22V12m0-10v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" />
    </svg>
  ),
  headlight: (p: IconProps) => (
    <svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M3 12h3m12 0h3M12 3v3m0 12v3" />
    </svg>
  ),
  engine: (p: IconProps) => (
    <svg {...p}>
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  ceramic: (p: IconProps) => (
    <svg {...p}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  /* LAB icons */
  wrap: (p: IconProps) => (
    <svg {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  polish: (p: IconProps) => (
    <svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  ),
  ppfColor: (p: IconProps) => (
    <svg {...p}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  ppf: (p: IconProps) => (
    <svg {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  user: (p: IconProps) => (
    <svg {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  check: (p: IconProps) => (
    <svg {...p} viewBox="0 0 12 12">
      <polyline points="2,6 5,9 10,3" strokeWidth={2.5} />
    </svg>
  ),
  arrowRight: (p: IconProps) => (
    <svg {...p}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  arrowLeft: (p: IconProps) => (
    <svg {...p}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  shield: (p: IconProps) => (
    <svg {...p}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  alert: (p: IconProps) => (
    <svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth={2.5} />
    </svg>
  ),
  menu: (p: IconProps) => (
    <svg {...p}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  x: (p: IconProps) => (
    <svg {...p}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
} satisfies Record<string, React.FC<IconProps>>;
