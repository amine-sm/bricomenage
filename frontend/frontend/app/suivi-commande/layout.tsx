import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Suivi de commande",
  description:
    "Suivez votre commande BricoMénage avec votre numéro de suivi et votre téléphone.",
  alternates: {
    canonical: "/suivi-commande/",
  },
};

export default function TrackingLayout({ children }: { children: ReactNode }) {
  return children;
}
