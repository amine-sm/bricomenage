import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pack BricoMénage",
  description:
    "Découvrez nos packs BricoMénage et leurs articles inclus, disponibles à la commande en Algérie.",
};

export default function PackLayout({ children }: { children: ReactNode }) {
  return children;
}
