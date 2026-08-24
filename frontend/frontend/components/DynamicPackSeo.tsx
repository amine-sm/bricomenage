"use client";

import { useEffect } from "react";

import type { CatalogPack } from "@/lib/catalog";
import { SITE_NAME, SITE_URL, packUrl } from "@/lib/seo";

type PackSeoData = CatalogPack & {
  articles?: Array<{
    designation: string;
    image?: string | null;
  }>;
};

function absoluteImage(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  return value;
}

export default function DynamicPackSeo({ pack }: { pack: PackSeoData }) {
  const canonical = packUrl(pack.slug);
  const description =
    String(pack.description || "").trim() ||
    `Découvrez le pack ${pack.name} chez BricoMénage, disponible à la commande en Algérie.`;
  const shortDescription = description.slice(0, 160);
  const image = absoluteImage(
    pack.image || pack.articles?.find((article) => Boolean(article.image))?.image,
  );

  useEffect(() => {
    document.title = `${pack.name} | ${SITE_NAME}`;

    let canonicalLink = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    let descriptionMeta = document.head.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!descriptionMeta) {
      descriptionMeta = document.createElement("meta");
      descriptionMeta.name = "description";
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.content = shortDescription;
  }, [canonical, pack.name, shortDescription]);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonical}#product`,
    name: pack.name,
    url: canonical,
    description,
    ...(image ? { image: [image] } : {}),
    category: "Pack bricolage",
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "DZD",
      price: Number(pack.price).toFixed(2),
      availability: pack.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
  };

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
        name: "Packs",
        item: `${SITE_URL}/articles/?pack=1`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: pack.name,
        item: canonical,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
