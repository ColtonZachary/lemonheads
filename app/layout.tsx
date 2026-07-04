import type { Metadata, Viewport } from "next";
import { Bebas_Neue, JetBrains_Mono, Syne, Geist } from "next/font/google";
import "./globals.css";

import { Grain } from "@/components/site/grain";
import { AuthHashHandler } from "@/components/auth/auth-hash-handler";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — We Come to You`,
    template: `%s · ${SITE.name}`,
  },
  description:
    "Premium mobile car detailing. Book online — we come to your home or office. Hand wash, interior detailing, paint correction, ceramic coatings.",
  applicationName: SITE.name,
  keywords: [
    "mobile detailing",
    "car detailing",
    "ceramic coating",
    "paint correction",
    SITE.shortName,
  ],
  authors: [{ name: SITE.name }],
  openGraph: {
    title: `${SITE.name} — We Come to You`,
    description:
      "Premium mobile car detailing. Book online — we come to you.",
    url: SITE.url,
    siteName: SITE.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: "Premium mobile detailing — booked online, delivered to you.",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn("h-full", syne.variable, bebas.variable, jetbrains.variable, "font-sans", geist.variable)}
    >
      <body className="bg-bk text-text min-h-full flex flex-col antialiased">
        <Grain />
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
