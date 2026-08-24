"use client";

import { useEffect } from "react";

import { SITE_NAME, SITE_URL } from "@/lib/seo";

type CatalogMode = "articles" | "promotions" | "packs";

function setDescription(value: string) {
  let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }

  meta.content = value;
}

function setCanonical(value: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }

  link.href = value;
}

export default function DynamicCatalogSeo({
  mode,
  category,
}: {
  mode: CatalogMode;
  category: string;
}) {
  const title =
    mode === "packs"
      ? `Packs bricolage | ${SITE_NAME}`
      : mode === "promotions"
        ? `Promotions bricolage | ${SITE_NAME}`
        : category
          ? `${category} en Algérie | ${SITE_NAME}`
          : `Catalogue bricolage | ${SITE_NAME}`;

  const description =
    mode === "packs"
      ? "Découvrez les packs BricoMénage disponibles en Algérie."
      : mode === "promotions"
        ? "Découvrez les articles en promotion chez BricoMénage."
        : category
          ? `Découvrez nos articles ${category} chez BricoMénage : choix, prix et disponibilité en Algérie.`
          : "Découvrez le catalogue BricoMénage : outillage, jardin, mobilier, peinture, plomberie et électricité en Algérie.";

  const canonical =
    mode === "packs"
      ? `${SITE_URL}/articles/?pack=1`
      : mode === "promotions"
        ? `${SITE_URL}/articles/?promotion=1`
        : category
          ? `${SITE_URL}/articles/?categorie=${encodeURIComponent(category)}`
          : `${SITE_URL}/articles/`;

  useEffect(() => {
    document.title = title;
    setDescription(description);
    setCanonical(canonical);
  }, [canonical, description, title]);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name:
          mode === "packs"
            ? "Packs"
            : mode === "promotions"
              ? "Promotions"
              : category || "Catalogue",
        item: canonical,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
    />
  );
}
