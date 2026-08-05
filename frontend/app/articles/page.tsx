"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  ArrowDownAZ,
  Boxes,
  ChevronDown,
  LoaderCircle,
  PackageSearch,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import ProductCard, {
  type Product,
} from "@/components/ProductCard";

import {
  apiFetch,
} from "@/lib/api";

const CACHE_KEY =
  "bricomenage-articles-cache-v1";

const INITIAL_VISIBLE_COUNT = 12;
const LOAD_MORE_COUNT = 12;

const demoProducts: Product[] = [
  {
    id: 1,
    slug: "marteau-professionnel",
    designation:
      "Marteau professionnel",
    price: 1200,
    old_price: 1500,
    category: "Outillage",
    description:
      "Marteau robuste avec manche ergonomique.",
    image:
      "https://images.unsplash.com/photo-1607870411590-d5e9e06da09a?auto=format&fit=crop&w=700&q=75",
    stock_quantity: 20,
    rating: 4.8,
    reviews: 124,
    reference: "MAR-001",
    brand: "BricoPro",
  },
  {
    id: 2,
    slug: "chaise-de-jardin",
    designation:
      "Chaise de jardin",
    price: 4500,
    old_price: 5200,
    category: "Jardin",
    description:
      "Chaise confortable adaptée aux jardins et terrasses.",
    image:
      "https://images.pexels.com/photos/17976470/pexels-photo-17976470/free-photo-of-wooden-chair-in-the-garden.jpeg?auto=compress&cs=tinysrgb&w=700",
    stock_quantity: 15,
    rating: 4.6,
    reviews: 89,
    reference: "CHA-002",
    brand: "GardenHome",
  },
  {
    id: 3,
    slug: "parasol-deporte",
    designation:
      "Parasol déporté",
    price: 18500,
    category: "Jardin",
    description:
      "Parasol déporté idéal pour protéger votre terrasse du soleil.",
    image:
      "https://images.pexels.com/photos/13872652/pexels-photo-13872652.jpeg?auto=compress&cs=tinysrgb&w=700",
    stock_quantity: 8,
    rating: 4.9,
    reviews: 56,
    reference: "PAR-003",
    brand: "GardenHome",
  },
  {
    id: 4,
    slug: "perceuse-750-w",
    designation:
      "Perceuse 750 W",
    price: 12900,
    old_price: 14900,
    category:
      "Électroportatif",
    description:
      "Perceuse électrique puissante de 750 W pour vos travaux.",
    image:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=700&q=75",
    stock_quantity: 12,
    rating: 4.7,
    reviews: 203,
    reference: "PER-004",
    brand: "BricoPro",
  },
];

type SortOption =
  | "default"
  | "price-asc"
  | "price-desc"
  | "name-asc";

function createSlug(
  value: string,
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

function normalizeProduct(
  product: Product,
): Product {
  return {
    ...product,
    id: Number(product.id),
    price: Number(product.price),
    old_price:
      product.old_price !==
      undefined
        ? Number(
            product.old_price,
          )
        : undefined,
    stock_quantity:
      product.stock_quantity !==
      undefined
        ? Number(
            product.stock_quantity,
          )
        : undefined,
    slug:
      product.slug ||
      createSlug(
        product.designation,
      ),
  };
}

function readCachedProducts():
  Product[] | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const saved =
      window.sessionStorage.getItem(
        CACHE_KEY,
      );

    if (!saved) {
      return null;
    }

    const parsed =
      JSON.parse(saved);

    if (
      !Array.isArray(parsed) ||
      parsed.length === 0
    ) {
      return null;
    }

    return parsed.map(
      normalizeProduct,
    );
  } catch {
    return null;
  }
}

function saveCachedProducts(
  products: Product[],
) {
  try {
    window.sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify(products),
    );
  } catch {
    /*
     * Le cache est optionnel.
     */
  }
}

export default function Articles() {
  const searchParams =
    useSearchParams();

  const categoryFromUrl =
    searchParams.get(
      "categorie",
    );

  const promotionOnly =
    searchParams.get(
      "promotion",
    ) === "1";

  /*
   * Les produits de démonstration s'affichent
   * immédiatement. Aucun écran de chargement
   * ne bloque la page.
   */
  const [
    items,
    setItems,
  ] = useState<Product[]>(
    demoProducts,
  );

  const [
    query,
    setQuery,
  ] = useState("");

  /*
   * Évite de recalculer toute la liste à chaque
   * frappe rapide dans le champ de recherche.
   */
  const deferredQuery =
    useDeferredValue(query);

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState(
    categoryFromUrl ||
      "Toutes",
  );

  const [
    sortBy,
    setSortBy,
  ] = useState<SortOption>(
    "default",
  );

  const [
    visibleCount,
    setVisibleCount,
  ] = useState(
    INITIAL_VISIBLE_COUNT,
  );

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  useEffect(() => {
    setSelectedCategory(
      categoryFromUrl ||
        "Toutes",
    );

    setVisibleCount(
      INITIAL_VISIBLE_COUNT,
    );
  }, [categoryFromUrl]);

  useEffect(() => {
    /*
     * 1. Lire immédiatement le cache.
     * 2. Actualiser ensuite en arrière-plan.
     */
    const cached =
      readCachedProducts();

    if (
      cached &&
      cached.length > 0
    ) {
      setItems(cached);
    }

    let active = true;
    const controller =
      new AbortController();

    async function loadArticles() {
      setRefreshing(true);

      try {
        const response =
          await apiFetch<{
            articles:
              Product[];
          }>("/articles", {
            signal:
              controller.signal,
          });

        if (
          !active ||
          !Array.isArray(
            response.articles,
          ) ||
          response.articles
            .length === 0
        ) {
          return;
        }

        const normalized =
          response.articles.map(
            normalizeProduct,
          );

        setItems(normalized);
        saveCachedProducts(
          normalized,
        );
      } catch {
        /*
         * Le catalogue déjà affiché reste visible
         * si le serveur est lent ou indisponible.
         */
      } finally {
        if (active) {
          setRefreshing(false);
        }
      }
    }

    /*
     * Laisser d'abord le navigateur afficher
     * la page, puis lancer l'appel réseau.
     */
    const timer =
      window.setTimeout(
        loadArticles,
        0,
      );

    return () => {
      active = false;
      controller.abort();

      window.clearTimeout(
        timer,
      );
    };
  }, []);

  const categories =
    useMemo(() => {
      const unique =
        new Set<string>();

      for (
        const item of items
      ) {
        if (item.category) {
          unique.add(
            item.category,
          );
        }
      }

      return [
        "Toutes",
        ...Array.from(
          unique,
        ),
      ];
    }, [items]);

  const filteredItems =
    useMemo(() => {
      const normalizedQuery =
        deferredQuery
          .trim()
          .toLocaleLowerCase(
            "fr",
          );

      const result =
        items.filter(
          (item) => {
            const designation =
              item.designation.toLocaleLowerCase(
                "fr",
              );

            const category =
              item.category.toLocaleLowerCase(
                "fr",
              );

            const matchesSearch =
              !normalizedQuery ||
              designation.includes(
                normalizedQuery,
              ) ||
              category.includes(
                normalizedQuery,
              );

            const matchesCategory =
              selectedCategory ===
                "Toutes" ||
              item.category ===
                selectedCategory;

            const matchesPromotion =
              !promotionOnly ||
              Boolean(
                item.old_price &&
                  item.old_price >
                    item.price,
              );

            return (
              matchesSearch &&
              matchesCategory &&
              matchesPromotion
            );
          },
        );

      if (
        sortBy === "default"
      ) {
        return result;
      }

      return [...result].sort(
        (a, b) => {
          if (
            sortBy ===
            "price-asc"
          ) {
            return (
              a.price -
              b.price
            );
          }

          if (
            sortBy ===
            "price-desc"
          ) {
            return (
              b.price -
              a.price
            );
          }

          return a.designation.localeCompare(
            b.designation,
            "fr",
          );
        },
      );
    }, [
      deferredQuery,
      items,
      promotionOnly,
      selectedCategory,
      sortBy,
    ]);

  /*
   * Avec 3 000 produits, ne rendre que les
   * premières cartes améliore énormément
   * les performances.
   */
  const visibleItems =
    useMemo(
      () =>
        filteredItems.slice(
          0,
          visibleCount,
        ),
      [
        filteredItems,
        visibleCount,
      ],
    );

  const remainingCount =
    Math.max(
      0,
      filteredItems.length -
        visibleItems.length,
    );

  useEffect(() => {
    setVisibleCount(
      INITIAL_VISIBLE_COUNT,
    );
  }, [
    deferredQuery,
    promotionOnly,
    selectedCategory,
    sortBy,
  ]);

  function resetFilters() {
    setQuery("");
    setSelectedCategory(
      "Toutes",
    );
    setSortBy("default");
    setVisibleCount(
      INITIAL_VISIBLE_COUNT,
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600">
              <Sparkles className="h-4 w-4" />
              Catalogue BricoMénage
            </span>

            {refreshing && (
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-500 shadow-sm">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin text-orange-500" />
                Actualisation...
              </span>
            )}
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
            Découvrez tous
            <span className="block text-orange-500">
              nos articles
            </span>
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

              <input
                type="search"
                value={query}
                onChange={(
                  event,
                ) =>
                  setQuery(
                    event.target
                      .value,
                  )
                }
                placeholder="Rechercher un article..."
                className="min-h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-11 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
              />

              {query && (
                <button
                  type="button"
                  aria-label="Effacer la recherche"
                  onClick={() =>
                    setQuery("")
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-orange-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="relative lg:w-56">
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <select
                value={
                  selectedCategory
                }
                onChange={(
                  event,
                ) =>
                  setSelectedCategory(
                    event.target
                      .value,
                  )
                }
                className="min-h-14 w-full appearance-none rounded-2xl border border-zinc-200 bg-white pl-11 pr-10 text-sm font-bold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
              >
                {categories.map(
                  (category) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {category}
                    </option>
                  ),
                )}
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>

            <div className="relative lg:w-52">
              <ArrowDownAZ className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <select
                value={sortBy}
                onChange={(
                  event,
                ) =>
                  setSortBy(
                    event.target
                      .value as SortOption,
                  )
                }
                className="min-h-14 w-full appearance-none rounded-2xl border border-zinc-200 bg-white pl-11 pr-10 text-sm font-bold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
              >
                <option value="default">
                  Tri par défaut
                </option>

                <option value="price-asc">
                  Prix croissant
                </option>

                <option value="price-desc">
                  Prix décroissant
                </option>

                <option value="name-asc">
                  Nom de A à Z
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>
        </div>

        <div className="mb-7 mt-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-black text-zinc-950">
              Nos articles
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {
                filteredItems.length
              }{" "}
              article
              {filteredItems.length >
              1
                ? "s"
                : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={
              resetFilters
            }
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
          >
            <X className="h-4 w-4" />
            Réinitialiser
          </button>
        </div>

        {visibleItems.length >
        0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleItems.map(
                (
                  product,
                  index,
                ) => (
                  <div
                    key={
                      product.id
                    }
                    /*
                     * Le navigateur peut ignorer le rendu
                     * des cartes hors écran.
                     */
                    style={{
                      contentVisibility:
                        "auto",
                      containIntrinsicSize:
                        "420px",
                    }}
                  >
                    <ProductCard
                      p={product}
                    />
                  </div>
                ),
              )}
            </div>

            {remainingCount >
              0 && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount(
                      (current) =>
                        current +
                        LOAD_MORE_COUNT,
                    )
                  }
                  className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-7 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-orange-500/20"
                >
                  <Boxes className="h-5 w-5" />

                  Afficher plus

                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">
                    {
                      remainingCount
                    }
                  </span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[30px] border border-dashed border-zinc-300 bg-white px-5 text-center">
            <PackageSearch className="h-14 w-14 text-orange-500" />

            <h3 className="mt-5 text-2xl font-black">
              Aucun article trouvé
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              Modifiez votre recherche ou réinitialisez les filtres.
            </p>

            <button
              type="button"
              onClick={
                resetFilters
              }
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-6 py-3 text-white transition hover:bg-orange-500"
            >
              <Boxes className="h-4 w-4" />
              Voir tous les articles
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
