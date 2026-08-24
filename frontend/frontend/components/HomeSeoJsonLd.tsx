import {
  SEO_CATEGORIES,
  SITE_NAME,
  SITE_URL,
  categoryUrl,
} from "@/lib/seo";

export default function HomeSeoJsonLd() {
  const categoriesJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Catégories ${SITE_NAME}`,
    itemListElement: SEO_CATEGORIES.map((category, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: category,
      url: categoryUrl(category),
    })),
  };

  const navigationJsonLd = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: ["Accueil", "Catalogue", "Promotions", "Packs"],
    url: [
      `${SITE_URL}/`,
      `${SITE_URL}/articles/`,
      `${SITE_URL}/articles/?promotion=1`,
      `${SITE_URL}/articles/?pack=1`,
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoriesJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(navigationJsonLd) }}
      />
    </>
  );
}
