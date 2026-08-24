import type { Metadata, Viewport } from "next";
import SiteChrome from "@/components/SiteChrome";
import MobilePerformance from "@/components/MobilePerformance";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  applicationName: SITE_NAME,

  title: {
    default:
      "BricoMénage | Bricolage, Outillage, Maison & Jardin en Algérie",
    template: "%s | BricoMénage",
  },

  description: SITE_DESCRIPTION,

  keywords: [
    "BricoMénage",
    "bricolage Algérie",
    "bricolage Oran",
    "outillage Algérie",
    "outillage Oran",
    "matériel bricolage",
    "maison et jardin Algérie",
    "jardinage Algérie",
    "peinture Algérie",
    "plomberie Algérie",
    "électricité Algérie",
    "mobilier Algérie",
  ],


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
    locale: "fr_DZ",
    url: SITE_URL,
    siteName: SITE_NAME,
    title:
      "BricoMénage | Bricolage, Outillage, Maison & Jardin en Algérie",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/images/bg1.png",
        width: 1536,
        height: 1024,
        alt: "BricoMénage - Bricolage, outillage, maison et jardin",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "BricoMénage | Bricolage, Outillage, Maison & Jardin",
    description: SITE_DESCRIPTION,
    images: ["/images/bg1.png"],
  },

  icons: {
    icon: "/images/favicon-64.png",
    shortcut: "/images/favicon-64.png",
    apple: "/images/apple-touch-icon.png",
  },

  category: "shopping",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f97316",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo-bricomenage.jpeg`,
  image: `${SITE_URL}/images/logo-bricomenage.jpeg`,
  telephone: "+213667593750",
  address: {
    "@type": "PostalAddress",
    streetAddress: "136 Rue Marhaba en face IGMO",
    addressLocality: "Es Sénia",
    postalCode: "31005",
    addressCountry: "DZ",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 35.6613059,
    longitude: -0.6324169,
  },
  hasMap:
    "https://maps.app.goo.gl/KWKpDxrGrSJsc83ZA?g_st=ac",
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+213667593750",
      contactType: "customer service",
      availableLanguage: ["fr", "ar"],
    },
    {
      "@type": "ContactPoint",
      telephone: "+213563359707",
      contactType: "customer service",
      availableLanguage: ["fr", "ar"],
    },
  ],
  sameAs: [
    "https://www.facebook.com/share/18wbQ77V1V/?mibextid=wwXIfr",
    "https://www.instagram.com/brico_menagedz?igsh=aTl5dWI5MHBodHBx",
    "https://www.tiktok.com/@brico.menage.31",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
  inLanguage: "fr-DZ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-DZ">
      <body className="bg-[#fafafa] font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />

        <MobilePerformance>
          <SiteChrome>{children}</SiteChrome>
        </MobilePerformance>
      </body>
    </html>
  );
}
