// src/app/layout.tsx
// Layout raiz: metadata Enterprise SEO (canonical absoluto via metadataBase,
// OG/Twitter com imagem 1200x630, robots refinado, theme-color, geo),
// JSON-LD global de entidade (Organization + WebSite) e Analytics (GA4/GTM
// carregam apenas com NEXT_PUBLIC_GA_ID/NEXT_PUBLIC_GTM_ID definidos).

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { JsonLd } from "@/components/seo/json-ld";
import { Analytics } from "@/components/analytics";
import { SITE } from "@/content/site-config";
import { OG_IMAGE, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: `${SITE.name} — Nicho + cidade viram leads quentes em segundos`,
  description: SITE.description,
  keywords: [
    "gerador de leads",
    "prospecção b2b",
    "captação de leads",
    "gerar leads por cidade",
    "leads whatsapp",
    "google places",
    "openstreetmap leads",
    "kanban de leads",
    "saas de leads",
    "prospecção ativa",
  ],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.legalName,
  category: "technology",
  formatDetection: { telephone: false, email: false, address: false },
  alternates: {
    canonical: `${SITE.url}/`,
    languages: { "pt-BR": `${SITE.url}/` },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: SITE.ogLocale,
    url: `${SITE.url}/`,
    siteName: SITE.name,
    title: `${SITE.name} — Nicho + cidade viram leads quentes em segundos`,
    description: SITE.shortDescription,
    images: [
      {
        url: `${SITE.url}${OG_IMAGE}`,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: `${SITE.name} — ${SITE.shortDescription}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — leads quentes em segundos`,
    description: SITE.shortDescription,
    images: [`${SITE.url}${OG_IMAGE}`],
  },
  other: {
    "geo.region": `BR-SP`,
    "geo.placename": SITE.geoPlacename,
    "og:image:alt": `${SITE.name} — ${SITE.shortDescription}`,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

/** JSON-LD global: entidade da marca + site. Mesma fonte (site-config). */
function GlobalJsonLd() {
  const socials = Object.values(SITE.socials).filter(Boolean)
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: `${SITE.url}/og/og-default.png`,
    description: SITE.description,
    foundingDate: SITE.founded,
    ...(socials.length > 0 ? { sameAs: socials } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      email: SITE.contact.email,
      contactType: "sales",
      areaServed: SITE.contact.areaServed,
      availableLanguage: ["Portuguese", "English", "Spanish"],
    },
  }
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.shortDescription,
    inLanguage: SITE.locale,
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  }
  return <JsonLd data={[organization, website]} />
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <Analytics />
        <GlobalJsonLd />
      </body>
    </html>
  );
}
