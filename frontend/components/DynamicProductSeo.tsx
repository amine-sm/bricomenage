"use client";

import { useEffect } from "react";

import type { Product } from "@/components/ProductCard";
import {
  SITE_NAME,
  SITE_URL,
  productUrl,
} from "@/lib/seo";

function absoluteImage(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  return value;
}

function setMeta(selector: string, attribute: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  const [key, keyValue] = attribute.split("=");
  element.setAttribute(key, keyValue.replace(/^"|"$/g, ""));
  element.setAttribute("content", value);
}

function setCanonical(url: string) {
  let link = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );

  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }

  link.href = url;
}

export default function DynamicProductSeo({ product }: { product: Product }) {
  const canonical = productUrl(product.slug);
  const description =
    String(product.description || "").trim() ||
    `Achetez ${product.designation} chez BricoMénage. Prix et disponibilité en Algérie.`;
  const shortDescription = description.slice(0, 160);
  const image = absoluteImage(product.image || product.images?.[0] || "");
  const allImages = [product.image, ...(product.images || [])]
    .map((value) => absoluteImage(value))
    .filter(Boolean);

  useEffect(() => {
    document.title = `${product.designation} | ${SITE_NAME}`;
    setCanonical(canonical);

    setMeta('meta[name="description"]', 'name="description"', shortDescription);
    setMeta('meta[property="og:title"]', 'property="og:title"', `${product.designation} | ${SITE_NAME}`);
    setMeta('meta[property="og:description"]', 'property="og:description"', shortDescription);
    setMeta('meta[property="og:url"]', 'property="og:url"', canonical);
    setMeta('meta[property="og:type"]', 'property="og:type"', "product");

    if (image) {
      setMeta('meta[property="og:image"]', 'property="og:image"', image);
    }
  }, [canonical, image, product.designation, shortDescription]);

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonical}#product`,
    name: product.designation,
    url: canonical,
    description,
    ...(allImages.length > 0 ? { image: allImages } : {}),
    category: product.category,
    ...(product.reference ? { sku: product.reference } : {}),
    ...(product.brand
      ? {
          brand: {
            "@type": "Brand",
            name: product.brand,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "DZD",
      price: Number(product.price).toFixed(2),
      availability:
        product.inStock === false || Number(product.stock_quantity ?? 1) <= 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
  };

  if (Number(product.rating) > 0 && Number(product.reviews) > 0) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.rating),
      reviewCount: Number(product.reviews),
    };
  }

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
        name: "Catalogue",
        item: `${SITE_URL}/articles/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.designation,
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
