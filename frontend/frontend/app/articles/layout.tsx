import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Catalogue bricolage, maison et jardin",
  description:
    "Découvrez le catalogue BricoMénage : outillage, jardin, mobilier, peinture, plomberie, électricité, promotions et packs en Algérie.",
  openGraph: {
    title: "Catalogue BricoMénage",
    description:
      "Outillage, jardin, mobilier, peinture, plomberie, électricité, promotions et packs.",
    url: "/articles/",
  },
};

export default function ArticlesLayout({ children }: { children: ReactNode }) {
  return children;
}
