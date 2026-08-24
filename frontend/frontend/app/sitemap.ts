export const dynamic = "force-static";

import type { MetadataRoute } from "next";

import {
  SEO_CATEGORIES,
  SITE_URL,
  categoryUrl,
  packUrl,
  productUrl,
} from "@/lib/seo";

type ApiCategory = {
  name?: string;
};

type ApiArticle = {
  slug?: string;
};

type ApiPack = {
  slug?: string;
};

function apiBaseUrl() {
  return String(
    process.env.NEXT_PUBLIC_API_URL ||
      "https://bricomenage.com/api",
  ).replace(/\/+$/, "");
}

async function safeJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${apiBaseUrl()}${path}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    // Le sitemap reste valide même si l'API est indisponible au build.
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/articles/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/articles/?promotion=1`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/articles/?pack=1`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/suivi-commande/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.35,
    },
  ];

  const fallbackCategoryEntries: MetadataRoute.Sitemap =
    SEO_CATEGORIES.map((name) => ({
      url: categoryUrl(name),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const [categoriesResponse, articlesResponse, packsResponse] =
    await Promise.all([
      safeJson<{ categories?: ApiCategory[] }>("/categories"),
      safeJson<{ articles?: ApiArticle[] }>("/articles?limit=5000"),
      safeJson<{ packs?: ApiPack[] }>("/packs?limit=1000"),
    ]);

  const apiCategories = (categoriesResponse?.categories || [])
    .map((category) => String(category.name || "").trim())
    .filter(Boolean);

  const categoryEntries: MetadataRoute.Sitemap =
    (apiCategories.length > 0 ? apiCategories : SEO_CATEGORIES).map(
      (name) => ({
        url: categoryUrl(name),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }),
    );

  const articleEntries: MetadataRoute.Sitemap =
    (articlesResponse?.articles || [])
      .map((article) => String(article.slug || "").trim())
      .filter(Boolean)
      .map((slug) => ({
        url: productUrl(slug),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      }));

  const packEntries: MetadataRoute.Sitemap =
    (packsResponse?.packs || [])
      .map((pack) => String(pack.slug || "").trim())
      .filter(Boolean)
      .map((slug) => ({
        url: packUrl(slug),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

  const combined = [
    ...staticEntries,
    ...(categoryEntries.length > 0
      ? categoryEntries
      : fallbackCategoryEntries),
    ...articleEntries,
    ...packEntries,
  ];

  const unique = new Map<string, MetadataRoute.Sitemap[number]>();

  for (const entry of combined) {
    unique.set(entry.url, entry);
  }

  return [...unique.values()];
}
