import type { Metadata, Viewport } from "next";
import { Bebas_Neue, JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";

import { Grain } from "@/components/site/grain";
import { AuthHashHandler } from "@/components/auth/auth-hash-handler";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";

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
  metadataBase: new URL("https://lemonheadsdetail.com"),
  title: {
    default: "Lemonhead's Mobile Detail — We Come to You",
    template: "%s · Lemonhead's Mobile Detail",
  },
  description:
    "Premium mobile car detailing in Oklahoma City, Tulsa, and Enid. Book online — we come to your home or office. Hand wash, interior detailing, paint correction, ceramic coatings.",
  applicationName: "Lemonhead's Mobile Detail",
  keywords: [
    "mobile detailing",
    "car detailing",
    "Oklahoma City detailing",
    "Tulsa detailing",
    "Enid detailing",
    "ceramic coating",
    "paint correction",
    "Lemonheads",
  ],
  authors: [{ name: "Lemonhead's Mobile Detail" }],
  openGraph: {
    title: "Lemonhead's Mobile Detail — We Come to You",
    description:
      "Premium mobile car detailing across Oklahoma. Book online — we come to you.",
    url: "https://lemonheadsdetail.com",
    siteName: "Lemonhead's Mobile Detail",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lemonhead's Mobile Detail",
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
      className={`${syne.variable} ${bebas.variable} ${jetbrains.variable} h-full`}
    >
      <body className="bg-bk text-text min-h-full flex flex-col antialiased">
        <Grain />
        <AuthHashHandler />
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
