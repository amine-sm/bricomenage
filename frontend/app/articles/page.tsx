"use client";

import Link from "next/link";
import {
  Suspense,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useSearchParams,
} from "next/navigation";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  ArrowUpDown,
  PackageSearch,
  RotateCcw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Tag,
} from "lucide-react";
import {
  motion,
} from "framer-motion";

import ProductCard, {
  type Product,
} from "@/components/ProductCard";
import DynamicCatalogSeo from "@/components/DynamicCatalogSeo";
import {
  addToCart,
} from "@/lib/cart";
import {
  catalogApi,
  type CatalogArticle,
  type CatalogPack,
} from "@/lib/catalog";

type CatalogMode =
  | "articles"
  | "promotions"
  | "packs";

type SortOption =
  | "newest"
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc";

type StockOption =
  | "all"
  | "available"
  | "unavailable";

const PAGE_SIZE = 20;

type PackWithImages =
  CatalogPack & {
    article_images?: string[];
    images?: string[];
    articles?: Array<{
      image?: string | null;
      images?: string[];
    }>;
  };

function formatPrice(
  value: number,
) {
  return new Intl.NumberFormat(
    "fr-DZ",
  ).format(value);
}

function normalizeSearchValue(
  value: unknown,
) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
}

function articleToProduct(
  article: CatalogArticle,
): Product {
  return {
    id: Number(article.id),
    slug: article.slug,
    designation:
      article.designation,
    price: Number(article.price),
    old_price:
      article.old_price === null ||
      article.old_price === undefined
        ? undefined
        : Number(article.old_price),
    category:
      article.category ||
      "Article",
    description:
      article.description ||
      undefined,
    image:
      article.image ||
      article.images?.find(Boolean) ||
      undefined,
    images:
      article.images,
    stock_quantity: Number(
      article.stock_quantity || 0,
    ),
    rating: Number(
      article.rating || 0,
    ),
    reviews: Number(
      article.reviews || 0,
    ),
    reference:
      article.reference ||
      undefined,
    brand:
      article.brand ||
      undefined,
    inStock:
      article.inStock,
    promotion_id:
      article.promotion_id,
    promotion_name:
      article.promotion_name,
    item_type: "ARTICLE",
  };
}

function PackCard({
  pack,
}: {
  pack: PackWithImages;
}) {
  const [added, setAdded] =
    useState(false);

  async function addPack() {
    if (!pack.inStock) {
      return;
    }

    try {
      /*
       * On charge la composition
       * exacte du pack avant de le
       * mettre dans le panier.
       */
      const response =
        await catalogApi.packBySlug(
          pack.slug,
        );

      const detail =
        response.pack as CatalogPack & {
          articles?: Array<{
            id: number;
            slug?: string;
            designation: string;
            image?: string | null;
            quantity?: number;
          }>;
        };

      addToCart({
        id: pack.id,
        item_type: "PACK",
        slug: pack.slug,
        designation: pack.name,
        price:
          Number(pack.price),

        image:
          detail.image ||
          cardImages[0] ||
          undefined,

        pack_components:
          (
            detail.articles ||
            []
          ).map(
            (article) => ({
              article_id:
                Number(
                  article.id,
                ),
              slug:
                article.slug,
              designation:
                article.designation,
              image:
                article.image ||
                undefined,
              quantity_per_pack:
                Number(
                  article.quantity ||
                    1,
                ),
            }),
          ),

        quantity: 1,
      });
    } catch {
      /*
       * Si le détail n'est pas
       * disponible, le pack reste
       * commandable. Le panier
       * tentera de l'enrichir.
       */
      addToCart({
        id: pack.id,
        item_type: "PACK",
        slug: pack.slug,
        designation: pack.name,
        price:
          Number(pack.price),
        image:
          cardImages[0] ||
          undefined,
        quantity: 1,
      });
    }

    setAdded(true);

    window.setTimeout(
      () => setAdded(false),
      1600,
    );
  }

  const packImages =
    useMemo(() => {
      const articleImages =
        (pack.articles || [])
          .flatMap(
            (article) => [
              article.image,
              ...(article.images || []),
            ],
          )
          .filter(
            (
              image,
            ): image is string =>
              Boolean(image),
          );

      return Array.from(
        new Set(
          [
            pack.image,
            ...(pack.images || []),
            ...(pack.article_images || []),
            ...articleImages,
          ].filter(
            (
              image,
            ): image is string =>
              Boolean(image),
          ),
        ),
      );
    }, [pack]);

  const cardImages =
    packImages.slice(0, 4);

  const reduction =
    pack.old_price &&
    pack.old_price >
      pack.price
      ? Math.round(
          ((pack.old_price -
            pack.price) /
            pack.old_price) *
            100,
        )
      : null;

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 24,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
      }}
      whileHover={{
        y: -7,
      }}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-xl"
    >
      <Link
        href={`/pack?slug=${encodeURIComponent(
          pack.slug,
        )}`}
        className="relative block aspect-square overflow-hidden bg-zinc-100"
      >
        {cardImages.length === 0 ? (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
            <Boxes className="h-20 w-20 text-zinc-300" />
          </div>
        ) : cardImages.length === 1 ? (
          <img
            src={cardImages[0]}
            alt={pack.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : cardImages.length === 2 ? (
          <div className="grid h-full grid-cols-2 gap-1 bg-zinc-200">
            {cardImages.map(
              (
                image,
                index,
              ) => (
                <div
                  key={`${image}-${index}`}
                  className="relative overflow-hidden bg-zinc-100"
                >
                  <img
                    src={image}
                    alt={`${pack.name} ${index + 1}`}
                    loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <span className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-1 bg-zinc-200">
            {cardImages.map(
              (
                image,
                index,
              ) => (
                <div
                  key={`${image}-${index}`}
                  className={`relative overflow-hidden bg-zinc-100 ${
                    cardImages.length === 3 &&
                    index === 0
                      ? "row-span-2"
                      : ""
                  }`}
                >
                  <img
                    src={image}
                    alt={`${pack.name} ${index + 1}`}
                    loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <span className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                </div>
              ),
            )}
          </div>
        )}

        <span className="absolute left-4 top-4 rounded-full bg-zinc-950 px-3 py-1.5 text-[11px] font-black uppercase text-white shadow-lg">
          Pack
        </span>

        {cardImages.length > 1 && (
          <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black text-zinc-800 shadow-lg backdrop-blur">
            {cardImages.length} photos
          </span>
        )}

        {reduction !== null &&
          reduction > 0 && (
          <span className="absolute right-4 top-4 rounded-full bg-orange-500 px-3 py-1.5 text-[11px] font-black text-white">
            -{reduction} %
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-black uppercase tracking-wider text-orange-500">
          {pack.article_count} article
          {pack.article_count > 1
            ? "s"
            : ""}
        </p>

        <Link
          href={`/pack?slug=${encodeURIComponent(
            pack.slug,
          )}`}
          className="mt-2 block text-xl font-black text-zinc-950 transition hover:text-orange-600"
        >
          {pack.name}
        </Link>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">
          {pack.description ||
            "Ensemble complet à prix avantageux."}
        </p>

        <div className="mt-auto pt-5">
          <div className="flex items-end gap-2">
            <strong className="text-2xl font-black text-zinc-950">
              {formatPrice(
                pack.price,
              )}{" "}
              DA
            </strong>

            {Number(pack.old_price || 0) >
              Number(pack.price) && (
              <span className="pb-1 text-sm text-zinc-400 line-through">
                {formatPrice(
                  Number(
                    pack.old_price || 0,
                  ),
                )}{" "}
                DA
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              disabled={!pack.inStock}
              onClick={addPack}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-white transition ${
                !pack.inStock
                  ? "cursor-not-allowed bg-zinc-300"
                  : added
                    ? "bg-emerald-500"
                    : "bg-zinc-950 hover:bg-orange-500"
              }`}
            >
              <ShoppingCart className="h-5 w-5" />

              {!pack.inStock
                ? "Pack indisponible"
                : added
                  ? "Pack ajouté"
                  : "Ajouter le pack"}
            </button>

            <Link
              href={`/pack?slug=${encodeURIComponent(
                pack.slug,
              )}`}
              aria-label={`Voir ${pack.name}`}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 transition hover:border-orange-400 hover:bg-orange-500 hover:text-white"
            >
              <Eye className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ArticlesPageContent() {
  const searchParams =
    useSearchParams();

  const mode: CatalogMode =
    searchParams.get("pack") ===
    "1"
      ? "packs"
      : searchParams.get(
            "promotion",
          ) === "1"
        ? "promotions"
        : "articles";

  const category =
    searchParams.get(
      "categorie",
    ) || "";

  const headerSearch =
    searchParams.get("search") || "";

  const [query, setQuery] =
    useState(headerSearch);

  const [
    sortBy,
    setSortBy,
  ] = useState<SortOption>(
    "newest",
  );

  const [
    stockFilter,
    setStockFilter,
  ] = useState<StockOption>(
    "all",
  );

  const [
    minPrice,
    setMinPrice,
  ] = useState("");

  const [
    maxPrice,
    setMaxPrice,
  ] = useState("");

  const [
    mobileFiltersOpen,
    setMobileFiltersOpen,
  ] = useState(false);

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  useEffect(() => {
    setQuery(headerSearch);
    setSortBy("newest");
    setStockFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setCurrentPage(1);
    setMobileFiltersOpen(false);
  }, [headerSearch, mode, category]);

  const deferredQuery =
    useDeferredValue(query);

  const serverSearch =
    mode === "articles"
      ? deferredQuery.trim()
      : "";

  const [articles, setArticles] =
    useState<Product[]>([]);

  const [packs, setPacks] =
    useState<PackWithImages[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        if (mode === "packs") {
          const response =
            await catalogApi.packs({
              limit: "100",
            });

          if (active) {
            setPacks(
              (response.packs ||
                []) as PackWithImages[],
            );
            setArticles([]);
          }

          return;
        }

        if (
          mode === "promotions"
        ) {
          const response =
            await catalogApi.promotions({
              limit: "200",
            });

          if (active) {
            setArticles(
              (
                response.articles ||
                []
              ).map(
                articleToProduct,
              ),
            );
            setPacks([]);
          }

          return;
        }

        const response =
          await catalogApi.articles({
            limit: "100",
            ...(category
              ? {
                  categorie:
                    category,
                }
              : {}),
            ...(serverSearch
              ? {
                  search:
                    serverSearch,
                }
              : {}),
          });

        if (active) {
          setArticles(
            (
              response.articles ||
              []
            ).map(
              articleToProduct,
            ),
          );
          setPacks([]);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Impossible de charger le catalogue.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [
    category,
    mode,
    serverSearch,
  ]);

  const filteredArticles =
    useMemo(() => {
      const term =
        normalizeSearchValue(
          deferredQuery,
        );

      const minimum =
        minPrice === ""
          ? null
          : Number(minPrice);

      const maximum =
        maxPrice === ""
          ? null
          : Number(maxPrice);

      const filtered =
        articles.filter(
          (article) => {
            const matchesSearch =
              !term ||
              [
                article.designation,
                article.category,
                article.reference,
                article.brand,
              ]
                .filter(Boolean)
                .some((value) =>
                  normalizeSearchValue(
                    value,
                  ).includes(term),
                );

            const price =
              Number(
                article.price || 0,
              );

            const matchesMinPrice =
              minimum === null ||
              Number.isNaN(minimum) ||
              price >= minimum;

            const matchesMaxPrice =
              maximum === null ||
              Number.isNaN(maximum) ||
              price <= maximum;

            const available =
              Number(
                article.stock_quantity ||
                  0,
              ) > 0 &&
              article.inStock !== false;

            const matchesStock =
              stockFilter === "all" ||
              (stockFilter ===
                "available" &&
                available) ||
              (stockFilter ===
                "unavailable" &&
                !available);

            const hasActivePromotion =
              Boolean(
                article.promotion_id,
              ) ||
              Number(
                article.old_price || 0,
              ) > price;

            const matchesCatalogMode =
              mode !== "articles" ||
              !hasActivePromotion;

            return (
              matchesSearch &&
              matchesMinPrice &&
              matchesMaxPrice &&
              matchesStock &&
              matchesCatalogMode
            );
          },
        );

      return [...filtered].sort(
        (a, b) => {
          switch (sortBy) {
            case "name-asc":
              return a.designation.localeCompare(
                b.designation,
                "fr",
              );

            case "name-desc":
              return b.designation.localeCompare(
                a.designation,
                "fr",
              );

            case "price-asc":
              return (
                Number(a.price) -
                Number(b.price)
              );

            case "price-desc":
              return (
                Number(b.price) -
                Number(a.price)
              );

            default:
              return (
                Number(b.id) -
                Number(a.id)
              );
          }
        },
      );
    }, [
      articles,
      deferredQuery,
      maxPrice,
      minPrice,
      mode,
      sortBy,
      stockFilter,
    ]);

  const filteredPacks =
    useMemo(() => {
      const term =
        normalizeSearchValue(
          deferredQuery,
        );

      const minimum =
        minPrice === ""
          ? null
          : Number(minPrice);

      const maximum =
        maxPrice === ""
          ? null
          : Number(maxPrice);

      const filtered =
        packs.filter(
          (pack) => {
            const matchesSearch =
              !term ||
              [
                pack.name,
                pack.description,
              ]
                .filter(Boolean)
                .some((value) =>
                  normalizeSearchValue(
                    value,
                  ).includes(term),
                );

            const price =
              Number(pack.price || 0);

            const matchesMinPrice =
              minimum === null ||
              Number.isNaN(minimum) ||
              price >= minimum;

            const matchesMaxPrice =
              maximum === null ||
              Number.isNaN(maximum) ||
              price <= maximum;

            const available =
              pack.inStock !== false &&
              Number(
                pack.stock_quantity ||
                  0,
              ) > 0;

            const matchesStock =
              stockFilter === "all" ||
              (stockFilter ===
                "available" &&
                available) ||
              (stockFilter ===
                "unavailable" &&
                !available);

            return (
              matchesSearch &&
              matchesMinPrice &&
              matchesMaxPrice &&
              matchesStock
            );
          },
        );

      return [...filtered].sort(
        (a, b) => {
          switch (sortBy) {
            case "name-asc":
              return a.name.localeCompare(
                b.name,
                "fr",
              );

            case "name-desc":
              return b.name.localeCompare(
                a.name,
                "fr",
              );

            case "price-asc":
              return (
                Number(a.price) -
                Number(b.price)
              );

            case "price-desc":
              return (
                Number(b.price) -
                Number(a.price)
              );

            default:
              return (
                Number(b.id) -
                Number(a.id)
              );
          }
        },
      );
    }, [
      deferredQuery,
      maxPrice,
      minPrice,
      packs,
      sortBy,
      stockFilter,
    ]);

  function resetFilters() {
    setQuery("");
    setSortBy("newest");
    setStockFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setCurrentPage(1);
  }

  const hasActiveFilters =
    Boolean(query.trim()) ||
    sortBy !== "newest" ||
    stockFilter !== "all" ||
    minPrice !== "" ||
    maxPrice !== "";

  const title =
    mode === "packs"
      ? "Nos packs"
      : mode === "promotions"
        ? "Articles en promotion"
        : category
          ? `Articles : ${category}`
          : "Tous les articles";

  const description =
    mode === "packs"
      ? "Découvrez uniquement les packs actifs enregistrés dans la base de données."
      : mode ===
          "promotions"
        ? "Retrouvez uniquement les articles liés à une promotion active."
        : "Consultez les articles actifs enregistrés dans votre catalogue.";

  const count =
    mode === "packs"
      ? filteredPacks.length
      : filteredArticles.length;

  const totalPages = Math.max(
    1,
    Math.ceil(count / PAGE_SIZE),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    deferredQuery,
    maxPrice,
    minPrice,
    mode,
    category,
    sortBy,
    stockFilter,
  ]);

  useEffect(() => {
    setCurrentPage((page) =>
      Math.min(page, totalPages),
    );
  }, [totalPages]);

  const pageStart =
    (currentPage - 1) * PAGE_SIZE;

  const paginatedArticles =
    filteredArticles.slice(
      pageStart,
      pageStart + PAGE_SIZE,
    );

  const paginatedPacks =
    filteredPacks.slice(
      pageStart,
      pageStart + PAGE_SIZE,
    );

  return (
    <>
      <DynamicCatalogSeo mode={mode} category={category} />
      <main className="min-h-screen bg-zinc-50">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-600">
            {mode === "packs" ? (
              <Boxes className="h-4 w-4" />
            ) : mode ===
              "promotions" ? (
              <Tag className="h-4 w-4" />
            ) : (
              <PackageSearch className="h-4 w-4" />
            )}
            Catalogue BricoMénage
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-zinc-500">
            {description}
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            <Link
              href="/articles"
              className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                mode === "articles"
                  ? "bg-zinc-950 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-orange-300"
              }`}
            >
              Articles
            </Link>

            <Link
              href="/articles?promotion=1"
              className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                mode ===
                "promotions"
                  ? "bg-orange-500 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-orange-300"
              }`}
            >
              Promotions
            </Link>

            <Link
              href="/articles?pack=1"
              className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                mode === "packs"
                  ? "bg-zinc-950 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-orange-300"
              }`}
            >
              Packs
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-orange-100/50 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(
                    (open) => !open,
                  )
                }
                aria-expanded={mobileFiltersOpen}
                aria-controls="catalog-mobile-filters"
                className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition lg:hidden ${
                  mobileFiltersOpen ||
                  hasActiveFilters
                    ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "border-zinc-200 bg-white text-zinc-700"
                }`}
              >
                <SlidersHorizontal className="h-5 w-5" />

                {hasActiveFilters && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                )}
              </button>

              <div className="hidden items-center gap-3 lg:flex">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <SlidersHorizontal className="h-5 w-5" />
                </span>

                <div>
                  <h2 className="font-black text-zinc-950">
                    Filtrer les résultats
                  </h2>

                  <p className="text-xs text-zinc-500">
                    Recherchez et triez les produits selon vos besoins.
                  </p>
                </div>
              </div>

              <div className="min-w-0 flex-1 lg:hidden">
                <p className="text-sm font-black text-zinc-900">
                  Filtres
                </p>
                <p className="truncate text-[11px] font-semibold text-zinc-500">
                  Touchez l’icône pour afficher les options
                </p>
              </div>

              <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-100 px-3 py-2 text-xs font-black text-zinc-600 sm:px-4 sm:text-sm">
                <Sparkles className="h-4 w-4 text-orange-500" />
                {count}
                <span className="hidden sm:inline">
                  résultat{count > 1 ? "s" : ""}
                </span>
              </span>
            </div>

            <div
              id="catalog-mobile-filters"
              className={`${
                mobileFiltersOpen
                  ? "block"
                  : "hidden"
              } mt-4 lg:block lg:mt-5`}
            >
            <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.5fr)_repeat(4,minmax(140px,1fr))]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target.value,
                    )
                  }
                  placeholder={
                    mode === "packs"
                      ? "Rechercher un pack..."
                      : "Nom, catégorie, référence..."
                  }
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-4 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                />
              </label>

              <label className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">
                  MIN
                </span>

                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(event) =>
                    setMinPrice(
                      event.target.value,
                    )
                  }
                  placeholder="Prix min."
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-14 pr-3 text-sm font-bold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                />
              </label>

              <label className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">
                  MAX
                </span>

                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(event) =>
                    setMaxPrice(
                      event.target.value,
                    )
                  }
                  placeholder="Prix max."
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-14 pr-3 text-sm font-bold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                />
              </label>

              <select
                value={stockFilter}
                onChange={(event) =>
                  setStockFilter(
                    event.target
                      .value as StockOption,
                  )
                }
                className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
              >
                <option value="all">
                  Tous les stocks
                </option>

                <option value="available">
                  Disponible
                </option>

                <option value="unavailable">
                  Indisponible
                </option>
              </select>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target
                      .value as SortOption,
                  )
                }
                className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
              >
                <option value="newest">
                  Plus récents
                </option>

                <option value="name-asc">
                  Nom A → Z
                </option>

                <option value="name-desc">
                  Nom Z → A
                </option>

                <option value="price-asc">
                  Prix croissant
                </option>

                <option value="price-desc">
                  Prix décroissant
                </option>
              </select>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
                <ArrowUpDown className="h-4 w-4 text-orange-500" />

                <span>
                  Tri actuel :
                </span>

                <strong className="text-zinc-800">
                  {sortBy === "newest"
                    ? "Plus récents"
                    : sortBy ===
                        "name-asc"
                      ? "Nom A → Z"
                      : sortBy ===
                          "name-desc"
                        ? "Nom Z → A"
                        : sortBy ===
                            "price-asc"
                          ? "Prix croissant"
                          : "Prix décroissant"}
                </strong>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-black text-zinc-600 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser les filtres
              </button>
            </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <LoaderCircle className="h-9 w-9 animate-spin text-orange-500" />
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : mode === "packs" ? (
          filteredPacks.length >
          0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedPacks.map(
                (pack) => (
                  <PackCard
                    key={pack.id}
                    pack={pack}
                  />
                ),
              )}
            </div>
          ) : (
            <EmptyState
              label="Aucun pack actif n’est disponible."
            />
          )
        ) : filteredArticles.length >
          0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedArticles.map(
              (article) => (
                <ProductCard
                  key={article.id}
                  p={article}
                />
              ),
            )}
          </div>
        ) : (
          <EmptyState
            label={
              mode ===
              "promotions"
                ? "Aucun article en promotion active."
                : "Aucun article trouvé."
            }
          />
        )}

        {!loading &&
          !error &&
          count > PAGE_SIZE && (
            <CatalogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            />
          )}
      </section>
    </main>
    </>
  );
}

function CatalogPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1,
  );

  return (
    <nav
      aria-label="Pagination du catalogue"
      className="mt-8 flex items-center justify-center gap-2 sm:mt-10"
    >
      <button
        type="button"
        onClick={() =>
          onPageChange(currentPage - 1)
        }
        disabled={currentPage === 1}
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Page précédente"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-1.5">
        {pages.map((page, index) => {
          const previous = pages[index - 1];
          const showGap =
            previous !== undefined &&
            page - previous > 1;

          return (
            <span
              key={page}
              className="flex items-center gap-1.5"
            >
              {showGap && (
                <span className="px-1 text-sm font-black text-zinc-400">
                  …
                </span>
              )}

              <button
                type="button"
                onClick={() =>
                  onPageChange(page)
                }
                aria-current={
                  page === currentPage
                    ? "page"
                    : undefined
                }
                className={`flex h-11 min-w-11 items-center justify-center rounded-2xl px-3 text-sm font-black transition ${
                  page === currentPage
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:border-orange-300 hover:text-orange-600"
                }`}
              >
                {page}
              </button>
            </span>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() =>
          onPageChange(currentPage + 1)
        }
        disabled={
          currentPage === totalPages
        }
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Page suivante"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
}

function EmptyState({
  label,
}: {
  label: string;
}) {
  return (
    <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-[28px] border border-dashed border-zinc-300 bg-white p-8 text-center">
      <PackageSearch className="h-14 w-14 text-zinc-300" />
      <p className="mt-4 font-black text-zinc-700">
        {label}
      </p>
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<PageSearchParamsLoading />}>
      <ArticlesPageContent />
    </Suspense>
  );
}

function PageSearchParamsLoading() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-zinc-200" />
        <div className="mt-6 h-64 animate-pulse rounded-[28px] bg-zinc-100" />
      </div>
    </main>
  );
}
