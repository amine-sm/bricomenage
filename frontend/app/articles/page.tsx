"use client";

import Link from "next/link";
import {
  Suspense,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
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
  X,
} from "lucide-react";
import {
  AnimatePresence,
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

function rankProductSuggestions(
  products: Product[],
  query: string,
) {
  const term =
    normalizeSearchValue(query);

  if (!term) {
    return [];
  }

  function score(
    product: Product,
  ) {
    const designation =
      normalizeSearchValue(
        product.designation,
      );

    const category =
      normalizeSearchValue(
        product.category,
      );

    const brand =
      normalizeSearchValue(
        product.brand,
      );

    const reference =
      normalizeSearchValue(
        product.reference,
      );

    let total = 0;

    if (designation === term) {
      total += 150;
    }

    if (
      designation.startsWith(term)
    ) {
      total += 100;
    }

    if (
      designation
        .split(/\s+/)
        .some((word) =>
          word.startsWith(term),
        )
    ) {
      total += 75;
    }

    if (
      designation.includes(term)
    ) {
      total += 55;
    }

    if (brand.startsWith(term)) {
      total += 35;
    } else if (
      brand.includes(term)
    ) {
      total += 24;
    }

    if (
      category.startsWith(term)
    ) {
      total += 28;
    } else if (
      category.includes(term)
    ) {
      total += 18;
    }

    if (
      reference.includes(term)
    ) {
      total += 15;
    }

    return total;
  }

  return [...products]
    .sort(
      (a, b) =>
        score(b) - score(a),
    )
    .slice(0, 8);
}

function rankPackSuggestions(
  packs: PackWithImages[],
  query: string,
) {
  const term =
    normalizeSearchValue(query);

  if (!term) {
    return [];
  }

  function score(
    pack: PackWithImages,
  ) {
    const name =
      normalizeSearchValue(
        pack.name,
      );

    const description =
      normalizeSearchValue(
        pack.description,
      );

    let total = 0;

    if (name === term) {
      total += 150;
    }

    if (name.startsWith(term)) {
      total += 100;
    }

    if (
      name
        .split(/\s+/)
        .some((word) =>
          word.startsWith(term),
        )
    ) {
      total += 75;
    }

    if (name.includes(term)) {
      total += 55;
    }

    if (
      description.includes(term)
    ) {
      total += 18;
    }

    return total;
  }

  return [...packs]
    .sort(
      (a, b) =>
        score(b) - score(a),
    )
    .slice(0, 8);
}

function isPromotionProduct(
  product: Product,
) {
  return (
    Boolean(product.promotion_id) ||
    Number(product.old_price || 0) >
      Number(product.price || 0)
  );
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
    packImages.slice(0, 8);

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
      className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-zinc-200/80 bg-white shadow-[0_12px_35px_rgba(24,24,27,0.07)] ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-200 hover:ring-orange-100 hover:shadow-[0_26px_65px_rgba(24,24,27,0.14)] sm:rounded-[28px]"
    >
      <Link
        href={`/pack?slug=${encodeURIComponent(
          pack.slug,
        )}`}
        className="relative block aspect-[1.08/1] overflow-hidden bg-gradient-to-br from-zinc-50 to-zinc-100 sm:aspect-square"
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

        <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-zinc-950/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg backdrop-blur sm:left-4 sm:top-4 sm:text-[11px]">
          Pack
        </span>

        {cardImages.length > 1 && (
          <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black text-zinc-800 shadow-lg backdrop-blur">
            {cardImages.length} photos
          </span>
        )}

        {reduction !== null &&
          reduction > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-black text-white shadow-lg shadow-orange-500/20 sm:right-4 sm:top-4 sm:text-[11px]">
            -{reduction} %
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
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
          className="mt-2 block line-clamp-2 text-lg font-black leading-tight text-zinc-950 transition hover:text-orange-600 sm:text-xl"
        >
          {pack.name}
        </Link>

        <p className="mt-2.5 line-clamp-2 text-sm leading-6 text-zinc-500 sm:line-clamp-3">
          {pack.description ||
            "Ensemble complet à prix avantageux."}
        </p>

        <div className="mt-auto pt-5">
          <div className="flex items-end gap-2">
            <strong className="text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">
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

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2 sm:mt-5">
            <button
              type="button"
              disabled={!pack.inStock}
              onClick={addPack}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black text-white shadow-lg transition active:scale-[0.98] sm:px-4 sm:text-sm ${
                !pack.inStock
                  ? "cursor-not-allowed bg-zinc-300"
                  : added
                    ? "bg-emerald-500"
                    : "bg-orange-500 shadow-orange-500/20 hover:bg-orange-600"
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
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-orange-400 hover:bg-orange-500 hover:text-white sm:h-12 sm:w-12"
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
    catalogSearchOpen,
    setCatalogSearchOpen,
  ] = useState(false);

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const catalogGridRef =
    useRef<HTMLDivElement | null>(null);

  const catalogSearchRef =
    useRef<HTMLDivElement | null>(null);

  const catalogSearchInputRef =
    useRef<HTMLInputElement | null>(null);

  function scrollToFirstCatalogItem() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const grid =
          catalogGridRef.current;

        if (!grid) {
          return;
        }

        const headerOffset =
          window.innerWidth < 640
            ? 76
            : 92;

        const top =
          grid.getBoundingClientRect().top +
          window.scrollY -
          headerOffset;

        window.scrollTo({
          top: Math.max(0, top),
          behavior: "smooth",
        });
      });
    });
  }

  useEffect(() => {
    setQuery(headerSearch);
  }, [headerSearch]);

  useEffect(() => {
    setSortBy("newest");
    setStockFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setCurrentPage(1);
    setMobileFiltersOpen(false);
    setCatalogSearchOpen(false);
  }, [mode, category]);

  useEffect(() => {
    if (!mobileFiltersOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleDrawerKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setMobileFiltersOpen(false);
      }
    }

    function handleDrawerResize() {
      if (window.innerWidth >= 1024) {
        setMobileFiltersOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleDrawerKeyDown,
    );
    window.addEventListener(
      "resize",
      handleDrawerResize,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;
      window.removeEventListener(
        "keydown",
        handleDrawerKeyDown,
      );
      window.removeEventListener(
        "resize",
        handleDrawerResize,
      );
    };
  }, [mobileFiltersOpen]);

  useEffect(() => {
    function handleSearchOutsideClick(
      event: MouseEvent,
    ) {
      if (
        catalogSearchRef.current &&
        !catalogSearchRef.current.contains(
          event.target as Node,
        )
      ) {
        setCatalogSearchOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleSearchOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleSearchOutsideClick,
      );
    };
  }, []);

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

  const [
    searchIndexArticles,
    setSearchIndexArticles,
  ] = useState<Product[]>([]);

  const [
    searchIndexPromotions,
    setSearchIndexPromotions,
  ] = useState<Product[]>([]);

  const [
    searchIndexPacks,
    setSearchIndexPacks,
  ] = useState<PackWithImages[]>([]);

  const [
    searchIndexLoading,
    setSearchIndexLoading,
  ] = useState(false);

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
              ...(deferredQuery.trim()
                ? {
                    search:
                      deferredQuery.trim(),
                  }
                : {}),
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
              ...(deferredQuery.trim()
                ? {
                    search:
                      deferredQuery.trim(),
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
    deferredQuery,
    mode,
    serverSearch,
  ]);

  useEffect(() => {
    let active = true;

    const searchValue =
      query.trim();

    if (
      !catalogSearchOpen ||
      !searchValue
    ) {
      setSearchIndexArticles([]);
      setSearchIndexPromotions([]);
      setSearchIndexPacks([]);
      setSearchIndexLoading(false);
      return;
    }

    setSearchIndexLoading(true);

    const timerId =
      window.setTimeout(
        async () => {
          try {
            const [
              articlesResponse,
              promotionsResponse,
              packsResponse,
            ] = await Promise.all([
              catalogApi.articles({
                search: searchValue,
                limit: "20",
              }),
              catalogApi.promotions({
                search: searchValue,
                limit: "20",
              }),
              catalogApi.packs({
                search: searchValue,
                limit: "20",
              }),
            ]);

            if (!active) {
              return;
            }

            const articleProducts =
              (
                articlesResponse.articles ||
                []
              ).map(
                articleToProduct,
              );

            const promotionProducts =
              (
                promotionsResponse.articles ||
                []
              ).map(
                articleToProduct,
              );

            /*
             * Un produit peut aussi remonter depuis /articles
             * même s'il est en promotion.
             *
             * On le classe donc comme PROMOTION si :
             * - promotion_id existe,
             * - ou old_price > price,
             * - ou son id existe dans la réponse /promotions.
             */
            const promotionById =
              new Map<number, Product>();

            promotionProducts.forEach(
              (product) => {
                promotionById.set(
                  Number(product.id),
                  product,
                );
              },
            );

            articleProducts
              .filter(
                isPromotionProduct,
              )
              .forEach(
                (product) => {
                  if (
                    !promotionById.has(
                      Number(
                        product.id,
                      ),
                    )
                  ) {
                    promotionById.set(
                      Number(
                        product.id,
                      ),
                      product,
                    );
                  }
                },
              );

            const promotionIds =
              new Set(
                Array.from(
                  promotionById.keys(),
                ),
              );

            const normalArticles =
              articleProducts.filter(
                (product) =>
                  !promotionIds.has(
                    Number(product.id),
                  ) &&
                  !isPromotionProduct(
                    product,
                  ),
              );

            const rankedArticles =
              rankProductSuggestions(
                normalArticles,
                searchValue,
              ).slice(0, 4);

            const rankedPromotions =
              rankProductSuggestions(
                Array.from(
                  promotionById.values(),
                ),
                searchValue,
              ).slice(0, 4);

            const rankedPacks =
              rankPackSuggestions(
                (packsResponse.packs ||
                  []) as PackWithImages[],
                searchValue,
              ).slice(0, 4);

            setSearchIndexArticles(
              rankedArticles,
            );
            setSearchIndexPromotions(
              rankedPromotions,
            );
            setSearchIndexPacks(
              rankedPacks,
            );
          } catch {
            if (!active) {
              return;
            }

            setSearchIndexArticles([]);
            setSearchIndexPromotions([]);
            setSearchIndexPacks([]);
          } finally {
            if (active) {
              setSearchIndexLoading(false);
            }
          }
        },
        230,
      );

    return () => {
      active = false;
      window.clearTimeout(
        timerId,
      );
    };
  }, [
    catalogSearchOpen,
    query,
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

  const globalSearchTerm =
    normalizeSearchValue(query);

  function matchesArticleSearch(
    article: Product,
  ) {
    if (!globalSearchTerm) {
      return false;
    }

    return [
      article.designation,
      article.category,
      article.reference,
      article.brand,
    ]
      .filter(Boolean)
      .some((value) =>
        normalizeSearchValue(
          value,
        ).includes(
          globalSearchTerm,
        ),
      );
  }

  function matchesPackSearch(
    pack: PackWithImages,
  ) {
    if (!globalSearchTerm) {
      return false;
    }

    return [
      pack.name,
      pack.description,
    ]
      .filter(Boolean)
      .some((value) =>
        normalizeSearchValue(
          value,
        ).includes(
          globalSearchTerm,
        ),
      );
  }

  const catalogArticleSuggestions =
    globalSearchTerm
      ? searchIndexArticles
          .filter(
            matchesArticleSearch,
          )
          .slice(0, 8)
      : [];

  const catalogPromotionSuggestions =
    globalSearchTerm
      ? searchIndexPromotions
          .filter(
            matchesArticleSearch,
          )
          .slice(0, 8)
      : [];

  const catalogPackSuggestions =
    globalSearchTerm
      ? searchIndexPacks
          .filter(
            matchesPackSearch,
          )
          .slice(0, 8)
      : [];

  const catalogSuggestionCount =
    catalogArticleSuggestions.length +
    catalogPromotionSuggestions.length +
    catalogPackSuggestions.length;

  function resetFilters() {
    setQuery("");
    setSortBy("newest");
    setStockFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setCurrentPage(1);
    setCatalogSearchOpen(false);
  }

  const activeFilterCount = [
    Boolean(query.trim()),
    sortBy !== "newest",
    stockFilter !== "all",
    minPrice !== "",
    maxPrice !== "",
  ].filter(Boolean).length;

  const hasActiveFilters =
    activeFilterCount > 0;

  const title =
    mode === "packs"
      ? "Nos packs"
      : mode === "promotions"
        ? "Articles en promotion"
        : category
          ? `Articles : ${category}`
          : "Tous les articles";

  function buildTabHref(
    targetMode: CatalogMode,
  ) {
    const params =
      new URLSearchParams();

    if (
      targetMode === "promotions"
    ) {
      params.set(
        "promotion",
        "1",
      );
    }

    if (
      targetMode === "packs"
    ) {
      params.set(
        "pack",
        "1",
      );
    }

    const currentSearch =
      query.trim();

    if (currentSearch) {
      params.set(
        "search",
        currentSearch,
      );
    }

    const queryString =
      params.toString();

    return queryString
      ? `/articles?${queryString}`
      : "/articles";
  }

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
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ed_0%,#fafafa_32%,#f4f4f5_100%)] text-zinc-950">
        {/* =========================================================
            HERO CATALOGUE
        ========================================================== */}
        <section className="relative overflow-hidden border-b border-zinc-800 bg-zinc-950">
          <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-orange-500/25 blur-3xl sm:h-[30rem] sm:w-[30rem]" />
          <div className="pointer-events-none absolute -right-20 top-8 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl sm:h-96 sm:w-96" />

          <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-7 sm:px-6 sm:pb-24 sm:pt-11 lg:px-8 lg:pb-28">
            <motion.div
              initial={{
                opacity: 0,
                y: 18,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.45,
                ease: "easeOut",
              }}
              className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.055] px-5 py-7 shadow-[0_30px_100px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:rounded-[36px] sm:px-8 sm:py-10 lg:px-11 lg:py-12"
            >
              <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 translate-x-1/3 translate-y-1/3 rounded-full border-[26px] border-orange-400/10" />

              <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300 shadow-sm backdrop-blur sm:text-xs">
                      {mode === "packs" ? (
                        <Boxes className="h-4 w-4" />
                      ) : mode === "promotions" ? (
                        <Tag className="h-4 w-4" />
                      ) : (
                        <PackageSearch className="h-4 w-4" />
                      )}
                      Catalogue BricoMénage
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-lg backdrop-blur sm:text-xs">
                      <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                      {count} résultat{count > 1 ? "s" : ""}
                    </span>
                  </div>

                  <h1 className="mt-5 max-w-3xl text-[2.15rem] font-black leading-[1.02] tracking-[-0.045em] text-white sm:mt-6 sm:text-5xl lg:text-[3.8rem]">
                    {title}
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base sm:leading-8">
                    {description}
                  </p>
                </div>

                <div className="hidden min-w-[225px] rounded-[24px] border border-white/10 bg-white/[0.07] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.2)] backdrop-blur-xl lg:block">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                    Vue actuelle
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                      {mode === "packs" ? (
                        <Boxes className="h-5 w-5" />
                      ) : mode === "promotions" ? (
                        <Tag className="h-5 w-5" />
                      ) : (
                        <PackageSearch className="h-5 w-5" />
                      )}
                    </span>

                    <div>
                      <strong className="block text-sm font-black text-white">
                        {mode === "packs"
                          ? "Packs"
                          : mode === "promotions"
                            ? "Promotions"
                            : "Articles"}
                      </strong>

                      <span className="text-xs text-zinc-400">
                        Navigation rapide
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation catalogue premium */}
              <div className="relative mt-8 sm:mt-10">
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-orange-300 sm:text-[10px]">
                      Explorer le catalogue
                    </p>
                    <p className="mt-1 hidden text-xs text-zinc-400 sm:block">
                      Choisissez rapidement le type de produits à afficher.
                    </p>
                  </div>

                  <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-[10px] font-bold text-zinc-300 backdrop-blur sm:inline-flex">
                    <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                    Navigation rapide
                  </span>
                </div>

                <nav
                  aria-label="Navigation du catalogue"
                  className="grid grid-cols-3 gap-2 rounded-[26px] border border-white/10 bg-black/25 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:gap-3 sm:rounded-[30px] sm:p-3"
                >
                  <Link
                    href={buildTabHref("articles")}
                    aria-current={mode === "articles" ? "page" : undefined}
                    className="group relative min-w-0 overflow-hidden rounded-[20px] sm:rounded-[24px]"
                  >
                    {mode === "articles" && (
                      <motion.span
                        layoutId="catalog-active-tab"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        className="absolute inset-0 rounded-[20px] border border-white/80 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.22)] sm:rounded-[24px]"
                      />
                    )}

                    <span className={`relative flex min-h-[86px] flex-col items-center justify-center gap-2 px-2 py-3 text-center transition sm:min-h-[104px] sm:flex-row sm:justify-start sm:gap-3 sm:px-4 sm:py-4 ${
                      mode === "articles"
                        ? "text-zinc-950"
                        : "text-zinc-300 group-hover:bg-white/[0.07] group-hover:text-white"
                    }`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition sm:h-12 sm:w-12 ${
                        mode === "articles"
                          ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/20"
                          : "border border-white/10 bg-white/[0.06] text-zinc-300 group-hover:border-white/20 group-hover:bg-white/10"
                      }`}>
                        <PackageSearch className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                      </span>

                      <span className="min-w-0 sm:text-left">
                        <strong className="block truncate text-[11px] font-black sm:text-sm">
                          Articles
                        </strong>
                        <span className={`mt-0.5 hidden text-[10px] font-semibold sm:block ${
                          mode === "articles" ? "text-zinc-500" : "text-zinc-500"
                        }`}>
                          Tout le catalogue
                        </span>
                      </span>

                      <ChevronRight className={`hidden h-4 w-4 shrink-0 transition sm:ml-auto sm:block ${
                        mode === "articles"
                          ? "translate-x-0 text-orange-500"
                          : "-translate-x-1 text-zinc-600 group-hover:translate-x-0 group-hover:text-orange-400"
                      }`} />
                    </span>
                  </Link>

                  <Link
                    href={buildTabHref("promotions")}
                    aria-current={mode === "promotions" ? "page" : undefined}
                    className="group relative min-w-0 overflow-hidden rounded-[20px] sm:rounded-[24px]"
                  >
                    {mode === "promotions" && (
                      <motion.span
                        layoutId="catalog-active-tab"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        className="absolute inset-0 rounded-[20px] border border-orange-300/80 bg-[linear-gradient(135deg,#fb923c_0%,#f97316_58%,#ea580c_100%)] shadow-[0_16px_38px_rgba(249,115,22,0.34)] sm:rounded-[24px]"
                      />
                    )}

                    <span className={`relative flex min-h-[86px] flex-col items-center justify-center gap-2 px-2 py-3 text-center transition sm:min-h-[104px] sm:flex-row sm:justify-start sm:gap-3 sm:px-4 sm:py-4 ${
                      mode === "promotions"
                        ? "text-white"
                        : "text-zinc-300 group-hover:bg-orange-500/[0.08] group-hover:text-orange-200"
                    }`}>
                      <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition sm:h-12 sm:w-12 ${
                        mode === "promotions"
                          ? "bg-white/20 text-white shadow-lg ring-1 ring-white/20"
                          : "border border-orange-400/15 bg-orange-500/10 text-orange-300 group-hover:border-orange-400/30 group-hover:bg-orange-500/15"
                      }`}>
                        <Tag className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                        {mode !== "promotions" && (
                          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-orange-500" />
                        )}
                      </span>

                      <span className="min-w-0 sm:text-left">
                        <strong className="block truncate text-[11px] font-black sm:text-sm">
                          Promotions
                        </strong>
                        <span className={`mt-0.5 hidden text-[10px] font-semibold sm:block ${
                          mode === "promotions" ? "text-orange-100" : "text-zinc-500"
                        }`}>
                          Les meilleures offres
                        </span>
                      </span>

                      <ChevronRight className={`hidden h-4 w-4 shrink-0 transition sm:ml-auto sm:block ${
                        mode === "promotions"
                          ? "translate-x-0 text-white"
                          : "-translate-x-1 text-zinc-600 group-hover:translate-x-0 group-hover:text-orange-300"
                      }`} />
                    </span>
                  </Link>

                  <Link
                    href={buildTabHref("packs")}
                    aria-current={mode === "packs" ? "page" : undefined}
                    className="group relative min-w-0 overflow-hidden rounded-[20px] sm:rounded-[24px]"
                  >
                    {mode === "packs" && (
                      <motion.span
                        layoutId="catalog-active-tab"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        className="absolute inset-0 rounded-[20px] border border-white/80 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.22)] sm:rounded-[24px]"
                      />
                    )}

                    <span className={`relative flex min-h-[86px] flex-col items-center justify-center gap-2 px-2 py-3 text-center transition sm:min-h-[104px] sm:flex-row sm:justify-start sm:gap-3 sm:px-4 sm:py-4 ${
                      mode === "packs"
                        ? "text-zinc-950"
                        : "text-zinc-300 group-hover:bg-white/[0.07] group-hover:text-white"
                    }`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition sm:h-12 sm:w-12 ${
                        mode === "packs"
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                          : "border border-white/10 bg-white/[0.06] text-zinc-300 group-hover:border-white/20 group-hover:bg-white/10"
                      }`}>
                        <Boxes className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                      </span>

                      <span className="min-w-0 sm:text-left">
                        <strong className="block truncate text-[11px] font-black sm:text-sm">
                          Packs
                        </strong>
                        <span className={`mt-0.5 hidden text-[10px] font-semibold sm:block ${
                          mode === "packs" ? "text-zinc-500" : "text-zinc-500"
                        }`}>
                          Ensembles avantageux
                        </span>
                      </span>

                      <ChevronRight className={`hidden h-4 w-4 shrink-0 transition sm:ml-auto sm:block ${
                        mode === "packs"
                          ? "translate-x-0 text-orange-500"
                          : "-translate-x-1 text-zinc-600 group-hover:translate-x-0 group-hover:text-orange-400"
                      }`} />
                    </span>
                  </Link>
                </nav>
              </div>
            </motion.div>
          </div>
        </section>

      <section
        className={`relative ${
          mobileFiltersOpen
            ? "z-[9999]"
            : "z-20"
        } mx-auto -mt-11 max-w-7xl px-4 pb-16 sm:-mt-14 sm:px-6 sm:pb-20 lg:-mt-16 lg:px-8`}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45 }}
          className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-[0_30px_90px_rgba(24,24,27,0.12)] ring-1 ring-zinc-950/[0.02] backdrop-blur-xl sm:rounded-[34px] lg:rounded-b-none"
        >
          {/* Barre supérieure premium */}
          <div className="relative overflow-hidden border-b border-zinc-100 bg-white px-4 py-4 sm:px-6 sm:py-5">
            <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-orange-100/80 blur-3xl" />
            <div className="pointer-events-none absolute left-0 top-0 h-1 w-full bg-[linear-gradient(90deg,#18181b_0%,#18181b_28%,#f97316_28%,#f97316_64%,#fdba74_100%)]" />

            <div className="relative flex items-center justify-between gap-4 pt-1">
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-[0_10px_25px_rgba(24,24,27,0.20)] sm:h-12 sm:w-12">
                  <SlidersHorizontal className="h-5 w-5" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-orange-500 px-1 text-[9px] font-black text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-black tracking-[-0.01em] text-zinc-950 sm:text-base">
                      Recherche & filtres
                    </h2>
                    {hasActiveFilters && (
                      <span className="hidden rounded-full bg-orange-50 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-orange-600 sm:inline-flex">
                        {activeFilterCount} actif{activeFilterCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 hidden text-xs text-zinc-500 sm:block">
                    Recherchez, affinez le prix, le stock et l’ordre d’affichage.
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-zinc-400 sm:hidden">
                    Recherche, prix, stock et tri
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/80 bg-orange-50 px-3 py-2 text-[10px] font-black text-orange-700 shadow-sm sm:px-4 sm:text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                  {count}
                  <span className="hidden sm:inline">
                    résultat{count > 1 ? "s" : ""}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  aria-expanded={mobileFiltersOpen}
                  aria-controls="catalog-mobile-filters"
                  aria-label="Ouvrir les filtres"
                  className={`group relative flex h-11 w-11 items-center justify-center overflow-visible rounded-2xl border transition-all duration-200 active:scale-95 lg:hidden ${
                    hasActiveFilters
                      ? "border-orange-500 bg-orange-500 text-white shadow-[0_10px_26px_rgba(249,115,22,0.30)]"
                      : "border-zinc-900 bg-zinc-950 text-white shadow-[0_10px_26px_rgba(24,24,27,0.20)] hover:bg-zinc-800"
                  }`}
                >
                  <SlidersHorizontal className="h-[18px] w-[18px] transition-transform duration-200 group-hover:rotate-6" />

                  {activeFilterCount > 0 ? (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-orange-500 px-1 text-[9px] font-black text-white shadow-sm">
                      {activeFilterCount}
                    </span>
                  ) : (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-orange-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Overlay mobile du panneau de filtres */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <motion.button
              type="button"
              aria-label="Fermer les filtres"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 z-[9998] bg-zinc-950/55 backdrop-blur-[2px] lg:hidden"
            />
          )}
        </AnimatePresence>

        <aside
          id="catalog-mobile-filters"
          aria-label="Filtres du catalogue"
          className={`fixed inset-y-0 right-0 z-[9999] flex h-dvh w-[min(92vw,390px)] flex-col border-l border-zinc-200 bg-white shadow-[-24px_0_70px_rgba(24,24,27,0.22)] transition-transform duration-300 ease-out lg:static lg:z-auto lg:h-auto lg:w-full lg:translate-x-0 lg:border lg:border-t-0 lg:border-white/80 lg:shadow-[0_30px_90px_rgba(24,24,27,0.12)] lg:rounded-b-[34px] ${
            mobileFiltersOpen
              ? "translate-x-0 pointer-events-auto"
              : "translate-x-full pointer-events-none lg:pointer-events-auto"
          }`}
        >
          {/* En-tête du drawer : mobile uniquement */}
          <div className="relative shrink-0 overflow-hidden border-b border-zinc-800 bg-zinc-950 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] text-white lg:hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-500/25 blur-3xl" />

            <div className="relative flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
                  <SlidersHorizontal className="h-5 w-5" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-zinc-950 bg-white px-1 text-[9px] font-black text-orange-600">
                      {activeFilterCount}
                    </span>
                  )}
                </span>

                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-300">
                    Catalogue
                  </p>
                  <h3 className="mt-0.5 truncate text-base font-black tracking-tight text-white">
                    Recherche & filtres
                  </h3>
                  <p className="mt-0.5 text-[10px] font-semibold text-zinc-400">
                    {count} résultat{count > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Fermer"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15 active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain lg:overflow-visible">
            <div className="bg-[linear-gradient(180deg,#ffffff_0%,#fffdfa_100%)] p-4 pb-28 sm:p-6 sm:pb-28 lg:pb-6">
              {/* Recherche principale */}
              <div
                ref={catalogSearchRef}
                className="relative"
              >
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                  Recherche produit
                </label>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

                  <input
                    ref={catalogSearchInputRef}
                    value={query}
                    onFocus={() =>
                      setCatalogSearchOpen(true)
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Escape"
                      ) {
                        setCatalogSearchOpen(
                          false,
                        );
                        catalogSearchInputRef.current?.blur();
                      }
                    }}
                    onChange={(event) => {
                      setQuery(
                        event.target.value,
                      );
                      setCatalogSearchOpen(
                        true,
                      );
                    }}
                    placeholder={
                      mode === "packs"
                        ? "Rechercher un pack..."
                        : "Ex. perceuse, torche, CROWN, référence..."
                    }
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="h-[54px] w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-12 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition placeholder:font-normal placeholder:text-zinc-400 hover:border-zinc-300 focus:border-orange-400 focus:shadow-[0_10px_30px_rgba(249,115,22,0.10)] focus:ring-4 focus:ring-orange-500/10 sm:h-14"
                  />

                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setCatalogSearchOpen(
                          false,
                        );
                        catalogSearchInputRef.current?.focus();
                      }}
                      aria-label="Effacer la recherche"
                      className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-200/80 text-zinc-500 transition hover:bg-zinc-300 active:scale-95"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Suggestions : dans le flux, donc plus de chevauchement avec les cartes */}
                <AnimatePresence initial={false}>
                  {catalogSearchOpen &&
                    query.trim() && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          height: 0,
                          y: -6,
                        }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                          y: -4,
                        }}
                        transition={{
                          duration: 0.2,
                          ease: "easeOut",
                        }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-[0_20px_55px_rgba(24,24,27,0.12)]">
                          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-500">
                                Suggestions produits
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                                Résultats proches de «{" "}
                                <span className="font-bold text-zinc-600">
                                  {query.trim()}
                                </span>
                                {" "}»
                              </p>
                            </div>

                            {loading && (
                              <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-orange-500" />
                            )}
                          </div>

                          {searchIndexLoading &&
                          catalogSuggestionCount ===
                            0 ? (
                            <div className="grid gap-2 p-3 sm:grid-cols-2">
                              {Array.from({
                                length: 4,
                              }).map(
                                (
                                  _,
                                  index,
                                ) => (
                                  <div
                                    key={index}
                                    className="flex animate-pulse items-center gap-3 rounded-xl border border-zinc-100 p-2"
                                  >
                                    <div className="h-14 w-20 shrink-0 rounded-xl bg-zinc-200" />
                                    <div className="min-w-0 flex-1">
                                      <div className="h-3 w-4/5 rounded bg-zinc-200" />
                                      <div className="mt-2 h-3 w-2/5 rounded bg-zinc-100" />
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          ) : catalogSuggestionCount >
                            0 ? (
                            <div className="divide-y divide-zinc-100">
                              {/* ARTICLES NORMAUX */}
                              {catalogArticleSuggestions.length >
                                0 && (
                                <div className="p-2">
                                  <div className="flex items-center gap-2 px-2 pb-1.5 pt-1">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                                      <PackageSearch className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                      Articles
                                    </span>
                                    <span className="ml-auto rounded-full bg-zinc-100 px-2 py-1 text-[8px] font-black text-zinc-500">
                                      {catalogArticleSuggestions.length}
                                    </span>
                                  </div>

                                  <div className="grid gap-1 sm:grid-cols-2">
                                    {catalogArticleSuggestions.map(
                                      (
                                        article,
                                      ) => {
                                        const image =
                                          article.image ||
                                          article.images?.find(
                                            Boolean,
                                          ) ||
                                          "";

                                        return (
                                          <Link
                                            key={`article-${article.id}`}
                                            href={`/article?slug=${encodeURIComponent(
                                              article.slug,
                                            )}`}
                                            onClick={() =>
                                              setCatalogSearchOpen(
                                                false,
                                              )
                                            }
                                            className="group flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-zinc-50"
                                          >
                                            <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                                              {image ? (
                                                <img
                                                  src={
                                                    image
                                                  }
                                                  alt={
                                                    article.designation
                                                  }
                                                  loading="lazy"
                                                  className="h-full w-full object-cover"
                                                />
                                              ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                  <PackageSearch className="h-6 w-6 text-zinc-300" />
                                                </div>
                                              )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                              <strong className="line-clamp-2 text-[12px] font-black leading-4 text-zinc-900 group-hover:text-orange-600 sm:text-[13px]">
                                                {
                                                  article.designation
                                                }
                                              </strong>

                                              <p className="mt-1 truncate text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
                                                {
                                                  article.category
                                                }
                                                {article.brand
                                                  ? ` · ${article.brand}`
                                                  : ""}
                                              </p>

                                              <span className="mt-1 block text-[12px] font-black text-zinc-950">
                                                {formatPrice(
                                                  Number(
                                                    article.price,
                                                  ),
                                                )}{" "}
                                                DA
                                              </span>
                                            </div>

                                            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
                                          </Link>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* PROMOTIONS */}
                              {catalogPromotionSuggestions.length >
                                0 && (
                                <div className="bg-orange-50/30 p-2">
                                  <div className="flex items-center gap-2 px-2 pb-1.5 pt-1">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                                      <Tag className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-600">
                                      Promotions
                                    </span>
                                    <span className="ml-auto rounded-full bg-orange-100 px-2 py-1 text-[8px] font-black text-orange-600">
                                      {catalogPromotionSuggestions.length}
                                    </span>
                                  </div>

                                  <div className="grid gap-1 sm:grid-cols-2">
                                    {catalogPromotionSuggestions.map(
                                      (
                                        article,
                                      ) => {
                                        const image =
                                          article.image ||
                                          article.images?.find(
                                            Boolean,
                                          ) ||
                                          "";

                                        return (
                                          <Link
                                            key={`promotion-${article.id}`}
                                            href={`/article?slug=${encodeURIComponent(
                                              article.slug,
                                            )}`}
                                            onClick={() =>
                                              setCatalogSearchOpen(
                                                false,
                                              )
                                            }
                                            className="group flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-orange-50"
                                          >
                                            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                                              {image ? (
                                                <img
                                                  src={
                                                    image
                                                  }
                                                  alt={
                                                    article.designation
                                                  }
                                                  loading="lazy"
                                                  className="h-full w-full object-cover"
                                                />
                                              ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                  <Tag className="h-6 w-6 text-orange-300" />
                                                </div>
                                              )}

                                              <span className="absolute left-1 top-1 rounded-md bg-orange-500 px-1.5 py-0.5 text-[7px] font-black uppercase text-white">
                                                Promo
                                              </span>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                              <strong className="line-clamp-2 text-[12px] font-black leading-4 text-zinc-900 group-hover:text-orange-600 sm:text-[13px]">
                                                {
                                                  article.designation
                                                }
                                              </strong>

                                              <p className="mt-1 truncate text-[9px] font-semibold uppercase tracking-wide text-orange-500/80">
                                                {article.promotion_name ||
                                                  article.category}
                                              </p>

                                              <div className="mt-1 flex items-baseline gap-1.5">
                                                <span className="text-[12px] font-black text-orange-600">
                                                  {formatPrice(
                                                    Number(
                                                      article.price,
                                                    ),
                                                  )}{" "}
                                                  DA
                                                </span>

                                                {article.old_price &&
                                                  Number(
                                                    article.old_price,
                                                  ) >
                                                    Number(
                                                      article.price,
                                                    ) && (
                                                    <span className="text-[9px] text-zinc-400 line-through">
                                                      {formatPrice(
                                                        Number(
                                                          article.old_price,
                                                        ),
                                                      )}{" "}
                                                      DA
                                                    </span>
                                                  )}
                                              </div>
                                            </div>

                                            <ChevronRight className="h-4 w-4 shrink-0 text-orange-300" />
                                          </Link>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* PACKS */}
                              {catalogPackSuggestions.length >
                                0 && (
                                <div className="p-2">
                                  <div className="flex items-center gap-2 px-2 pb-1.5 pt-1">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-950 text-white">
                                      <Boxes className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-700">
                                      Packs
                                    </span>
                                    <span className="ml-auto rounded-full bg-zinc-100 px-2 py-1 text-[8px] font-black text-zinc-600">
                                      {catalogPackSuggestions.length}
                                    </span>
                                  </div>

                                  <div className="grid gap-1 sm:grid-cols-2">
                                    {catalogPackSuggestions.map(
                                      (pack) => {
                                        const packImage =
                                          pack.image ||
                                          pack.images?.find(
                                            Boolean,
                                          ) ||
                                          pack.article_images?.find(
                                            Boolean,
                                          ) ||
                                          pack.articles
                                            ?.flatMap(
                                              (
                                                article,
                                              ) => [
                                                article.image,
                                                ...(article.images ||
                                                  []),
                                              ],
                                            )
                                            .find(Boolean) ||
                                          "";

                                        return (
                                          <Link
                                            key={`pack-${pack.id}`}
                                            href={`/pack?slug=${encodeURIComponent(
                                              pack.slug,
                                            )}`}
                                            onClick={() =>
                                              setCatalogSearchOpen(
                                                false,
                                              )
                                            }
                                            className="group flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-zinc-50"
                                          >
                                            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                                              {packImage ? (
                                                <img
                                                  src={
                                                    packImage
                                                  }
                                                  alt={
                                                    pack.name
                                                  }
                                                  loading="lazy"
                                                  className="h-full w-full object-cover"
                                                />
                                              ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                  <Boxes className="h-6 w-6 text-zinc-300" />
                                                </div>
                                              )}

                                              <span className="absolute left-1 top-1 rounded-md bg-zinc-950 px-1.5 py-0.5 text-[7px] font-black uppercase text-white">
                                                Pack
                                              </span>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                              <strong className="line-clamp-2 text-[12px] font-black leading-4 text-zinc-900 group-hover:text-orange-600 sm:text-[13px]">
                                                {
                                                  pack.name
                                                }
                                              </strong>

                                              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
                                                {
                                                  pack.article_count
                                                }{" "}
                                                article
                                                {pack.article_count >
                                                1
                                                  ? "s"
                                                  : ""}
                                              </p>

                                              <div className="mt-1 flex items-baseline gap-1.5">
                                                <span className="text-[12px] font-black text-zinc-950">
                                                  {formatPrice(
                                                    Number(
                                                      pack.price,
                                                    ),
                                                  )}{" "}
                                                  DA
                                                </span>

                                                {Number(
                                                  pack.old_price ||
                                                    0,
                                                ) >
                                                  Number(
                                                    pack.price,
                                                  ) && (
                                                  <span className="text-[9px] text-zinc-400 line-through">
                                                    {formatPrice(
                                                      Number(
                                                        pack.old_price ||
                                                          0,
                                                      ),
                                                    )}{" "}
                                                    DA
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
                                          </Link>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : !searchIndexLoading ? (
                            <div className="px-5 py-7 text-center">
                              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                                <Search className="h-5 w-5" />
                              </div>

                              <p className="mt-3 text-sm font-black text-zinc-800">
                                Aucun résultat trouvé
                              </p>

                              <p className="mt-1 text-xs text-zinc-400">
                                Aucun article, promotion ou pack ne correspond à votre recherche.
                              </p>
                            </div>
                          ) : null}

                          {!searchIndexLoading &&
                            catalogSuggestionCount >
                              0 && (
                              <div className="border-t border-zinc-100 p-2.5">
                                <div className="grid gap-2 sm:grid-cols-3">
                                  {catalogArticleSuggestions.length >
                                    0 && (
                                    <Link
                                      href={`/articles?search=${encodeURIComponent(
                                        query.trim(),
                                      )}`}
                                      onClick={() =>
                                        setCatalogSearchOpen(
                                          false,
                                        )
                                      }
                                      className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-zinc-100 px-3 text-[10px] font-black text-zinc-700 transition hover:bg-zinc-200 sm:text-xs"
                                    >
                                      <PackageSearch className="h-4 w-4" />
                                      Articles
                                    </Link>
                                  )}

                                  {catalogPromotionSuggestions.length >
                                    0 && (
                                    <Link
                                      href={`/articles?promotion=1&search=${encodeURIComponent(
                                        query.trim(),
                                      )}`}
                                      onClick={() =>
                                        setCatalogSearchOpen(
                                          false,
                                        )
                                      }
                                      className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 text-[10px] font-black text-white shadow-sm transition hover:bg-orange-600 sm:text-xs"
                                    >
                                      <Tag className="h-4 w-4" />
                                      Promotions
                                    </Link>
                                  )}

                                  {catalogPackSuggestions.length >
                                    0 && (
                                    <Link
                                      href={`/articles?pack=1&search=${encodeURIComponent(
                                        query.trim(),
                                      )}`}
                                      onClick={() =>
                                        setCatalogSearchOpen(
                                          false,
                                        )
                                      }
                                      className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-3 text-[10px] font-black text-white transition hover:bg-zinc-800 sm:text-xs"
                                    >
                                      <Boxes className="h-4 w-4" />
                                      Packs
                                    </Link>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>

              {/* Filtres secondaires premium */}
              <div className="mt-5 rounded-[26px] border border-zinc-200/80 bg-zinc-50/70 p-2.5 shadow-inner sm:p-3">
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="group rounded-[20px] border border-zinc-200/80 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_12px_30px_rgba(24,24,27,0.07)]">
                    <span className="mb-2.5 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <Tag className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">
                        Prix minimum
                      </span>
                    </span>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-400">
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
                        placeholder="0 DA"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 pl-12 pr-3 text-sm font-black text-zinc-800 outline-none transition placeholder:font-semibold placeholder:text-zinc-400 hover:border-zinc-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                      />
                    </div>
                  </label>

                  <label className="group rounded-[20px] border border-zinc-200/80 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_12px_30px_rgba(24,24,27,0.07)]">
                    <span className="mb-2.5 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <Tag className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">
                        Prix maximum
                      </span>
                    </span>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-400">
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
                        placeholder="Tous"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 pl-12 pr-3 text-sm font-black text-zinc-800 outline-none transition placeholder:font-semibold placeholder:text-zinc-400 hover:border-zinc-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                      />
                    </div>
                  </label>

                  <label className="group rounded-[20px] border border-zinc-200/80 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_12px_30px_rgba(24,24,27,0.07)]">
                    <span className="mb-2.5 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <PackageSearch className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">
                        Disponibilité
                      </span>
                    </span>

                    <select
                      value={stockFilter}
                      onChange={(event) =>
                        setStockFilter(
                          event.target
                            .value as StockOption,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 text-sm font-black text-zinc-700 outline-none transition hover:border-zinc-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
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
                  </label>

                  <label className="group rounded-[20px] border border-zinc-200/80 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_12px_30px_rgba(24,24,27,0.07)]">
                    <span className="mb-2.5 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">
                        Trier par
                      </span>
                    </span>

                    <select
                      value={sortBy}
                      onChange={(event) =>
                        setSortBy(
                          event.target
                            .value as SortOption,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 text-sm font-black text-zinc-700 outline-none transition hover:border-zinc-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
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
                  </label>
                </div>
              </div>

              {/* Résumé + reset */}
              <div className="mt-4 flex flex-col gap-3 rounded-[20px] border border-zinc-200/70 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-black text-zinc-600">
                    <ArrowUpDown className="h-3.5 w-3.5 text-orange-500" />
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
                  </span>

                  {stockFilter !==
                    "all" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {stockFilter ===
                      "available"
                        ? "Disponible"
                        : "Indisponible"}
                    </span>
                  )}

                  {(minPrice ||
                    maxPrice) && (
                    <span className="inline-flex rounded-full border border-orange-100 bg-orange-50 px-3 py-2 text-[10px] font-black text-orange-700">
                      Prix{" "}
                      {minPrice
                        ? `≥ ${formatPrice(
                            Number(
                              minPrice,
                            ),
                          )} DA`
                        : ""}
                      {minPrice &&
                      maxPrice
                        ? " · "
                        : ""}
                      {maxPrice
                        ? `≤ ${formatPrice(
                            Number(
                              maxPrice,
                            ),
                          )} DA`
                        : ""}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-black text-zinc-600 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <RotateCcw className="h-4 w-4" />
                  Réinitialiser
                </button>
              </div>
            </div>

            {/* Action fixe en bas du drawer mobile */}
            <div className="sticky bottom-0 border-t border-zinc-200 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-14px_35px_rgba(24,24,27,0.08)] backdrop-blur-xl lg:hidden">
              <div className="grid grid-cols-[auto_1fr] gap-2.5">
                <button
                  type="button"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  aria-label="Réinitialiser les filtres"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <RotateCcw className="h-[18px] w-[18px]" />
                </button>

                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 active:scale-[0.98]"
                >
                  Voir {count} résultat{count > 1 ? "s" : ""}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {!loading && !error && count > 0 && (
          <div className="mt-8 flex items-end justify-between gap-4 sm:mt-10">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-1.5 w-7 rounded-full bg-orange-500" />
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-600">
                  Sélection actuelle
                </span>
              </div>
              <h2 className="truncate text-xl font-black tracking-[-0.03em] text-zinc-950 sm:text-2xl">
                {mode === "packs"
                  ? "Packs disponibles"
                  : mode === "promotions"
                    ? "Nos meilleures promotions"
                    : category
                      ? `Produits · ${category}`
                      : "Produits disponibles"}
              </h2>
              <p className="mt-1 text-xs font-semibold text-zinc-400 sm:text-sm">
                {count} résultat{count > 1 ? "s" : ""} correspondant à votre sélection.
              </p>
            </div>

            <div className="hidden shrink-0 items-center gap-3 rounded-[18px] border border-zinc-200 bg-white px-3 py-2.5 shadow-sm sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-white">
                {mode === "packs" ? (
                  <Boxes className="h-4 w-4" />
                ) : mode === "promotions" ? (
                  <Tag className="h-4 w-4" />
                ) : (
                  <PackageSearch className="h-4 w-4" />
                )}
              </span>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.15em] text-zinc-400">
                  Affichage
                </p>
                <p className="mt-0.5 text-xs font-black text-zinc-800">
                  {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, count)} sur {count}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex min-h-80 items-center justify-center rounded-[30px] border border-zinc-200/80 bg-white shadow-[0_18px_55px_rgba(24,24,27,0.06)]">
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <LoaderCircle className="h-7 w-7 animate-spin" />
              </span>
              <p className="mt-4 text-sm font-black text-zinc-700">
                Chargement du catalogue...
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Nous préparons les produits pour vous.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-[28px] border border-red-200 bg-red-50/90 p-6 text-sm font-bold text-red-700 shadow-[0_18px_55px_rgba(239,68,68,0.08)]">
            {error}
          </div>
        ) : mode === "packs" ? (
          filteredPacks.length >
          0 ? (
            <div
              ref={catalogGridRef}
              className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
            >
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
          <div
            ref={catalogGridRef}
            className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 md:gap-6 lg:grid-cols-3 xl:grid-cols-4"
          >
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
                scrollToFirstCatalogItem();
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
      className="mt-10 flex items-center justify-center gap-2 rounded-[24px] border border-zinc-200/80 bg-white/85 p-2 shadow-[0_12px_35px_rgba(24,24,27,0.06)] backdrop-blur sm:mt-12 sm:w-fit sm:mx-auto"
    >
      <button
        type="button"
        onClick={() =>
          onPageChange(currentPage - 1)
        }
        disabled={currentPage === 1}
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
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
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
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
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
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
    <div className="mt-10 flex min-h-80 flex-col items-center justify-center rounded-[32px] border border-dashed border-orange-200 bg-[linear-gradient(145deg,#ffffff_0%,#fff7ed_100%)] p-8 text-center shadow-[0_18px_55px_rgba(24,24,27,0.06)]">
      <span className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-orange-500 text-white shadow-xl shadow-orange-500/20">
        <PackageSearch className="h-9 w-9" />
      </span>
      <p className="mt-5 text-lg font-black text-zinc-800">
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
