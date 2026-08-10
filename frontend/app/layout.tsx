
import type { Metadata } from "next";
import SiteChrome from "@/components/SiteChrome";

import "./globals.css";

export const metadata: Metadata = {
  title: "BricoMénage | Bricolage, maison et jardin",

  description:
    "Matériel de bricolage, mobilier, jardinage, peinture, plomberie et électricité.",

  icons: {
    icon: "/images/logo-bricomenage.jpeg",
    shortcut: "/images/logo-bricomenage.jpeg",
    apple: "/images/logo-bricomenage.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="bg-[#fafafa] font-sans antialiased">
        <SiteChrome>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}

