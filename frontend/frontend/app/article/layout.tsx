import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Article de bricolage",
  description:
    "Découvrez cet article BricoMénage : caractéristiques, prix, disponibilité et commande en Algérie.",
};

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}
