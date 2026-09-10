import {
  adminHeaders,
  apiFetch,
} from "@/lib/api";

export type CatalogCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  article_count?: number;
};

export type CatalogArticle = {
  id: number;
  slug: string;
  designation: string;
  price: number;
  old_price?: number | null;
  category: string;
  description?: string | null;
  image?: string | null;
  images?: string[];

  colors?: {
    name?: string | null;
    hex: string;
    rgb: string;
    images?: string[];
  }[];

  variant_type?:
    | "COLOR"
    | "SIZE"
    | "SHOE_SIZE"
    | "SCENT"
    | null;

  variants?: {
    value: string;
    label?: string | null;
    name?: string | null;
    hex?: string;
    rgb?: string | null;
    images?: string[];
  }[];

  stock_quantity?: number;
  stock_managed?: boolean;

  rating?: number;
  reviews?: number;

  reference?: string | null;
  brand?: string | null;

  inStock?: boolean;

  item_type?: "ARTICLE";

  promotion_id?: number;
  promotion_name?: string;

  discount_type?: "PERCENT" | "FIXED";
  discount_value?: number;

  /**
   * Indique si l'article a été créé/publicé dans les 30 derniers jours.
   * Cette valeur est calculée côté backend/MySQL.
   */
  is_new?: boolean;

  /**
   * Date de création/publication de l'article.
   */
  created_at?: string | null;
};

export type CatalogPack = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  old_price?: number | null;
  image?: string | null;

  article_count: number;

  stock_quantity: number;
  stock_managed?: boolean;

  calculated_stock: number;
  inStock: boolean;

  item_type: "PACK";

  created_at?: string | null;
};

export type ArticleCategory = {
  id: number;
  name: string;
  slug?: string;
  article_count?: number;
};

export type ArticleSupplier = {
  id: number;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  wilaya?: string | null;
};

export const catalogApi = {
  categories: () =>
    apiFetch<{
      success: boolean;
      categories: CatalogCategory[];
    }>("/categories"),

  articles: (
    params?: Record<string, string>,
  ) =>
    apiFetch<{
      success: boolean;
      articles: CatalogArticle[];
      total: number;
    }>(
      `/articles${
        params
          ? `?${new URLSearchParams(params)}`
          : ""
      }`,
    ),

  latestArticles: (
    limit = 8,
  ) =>
    apiFetch<{
      success: boolean;
      articles: CatalogArticle[];
      total: number;
    }>(
      `/articles/latest?limit=${limit}`,
    ),

  articleBySlug: (
    slug: string,
  ) =>
    apiFetch<{
      success: boolean;
      article: CatalogArticle;
    }>(
      `/articles/slug/${encodeURIComponent(
        slug,
      )}`,
    ),

  packs: (
    params?: Record<string, string>,
  ) =>
    apiFetch<{
      success: boolean;
      packs: CatalogPack[];
      total: number;
    }>(
      `/packs${
        params
          ? `?${new URLSearchParams(params)}`
          : ""
      }`,
    ),

  packBySlug: (
    slug: string,
  ) =>
    apiFetch<{
      success: boolean;
      pack: CatalogPack & {
        articles?: unknown[];
      };
    }>(
      `/packs/slug/${encodeURIComponent(
        slug,
      )}`,
    ),

  promotions: (
    params?: Record<string, string>,
  ) =>
    apiFetch<{
      success: boolean;
      articles: CatalogArticle[];
      total: number;
    }>(
      `/promotions${
        params
          ? `?${new URLSearchParams(params)}`
          : ""
      }`,
    ),
};

export const adminCatalogApi = {
  list: <T>(
    resource: string,
  ) =>
    apiFetch<T>(
      `/admin/${resource}`,
      {
        headers: adminHeaders(),
      },
    ),
};
