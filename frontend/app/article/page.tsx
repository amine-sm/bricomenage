"use client";

import Link from "next/link";
import {
  useSearchParams,
} from "next/navigation";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronRight,
  Heart,
  LoaderCircle,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  apiFetch,
} from "@/lib/api";

import {
  addToCart,
} from "@/lib/cart";

import type {
  Product,
} from "@/components/ProductCard";

const ARTICLE_CACHE_PREFIX =
  "bricomenage-article-cache:";

const CATALOG_CACHE_KEY =
  "bricomenage-articles-cache-v1";

const demoProducts: Product[] = [
  {
    id: 1,
    slug:
      "marteau-professionnel",
    designation:
      "Marteau professionnel",
    price: 1200,
    old_price: 1500,
    category: "Outillage",
    description:
      "Marteau robuste avec manche ergonomique, conçu pour les travaux de bricolage, de construction et de rénovation.",
    stock_quantity: 20,
    reference: "MAR-001",
    brand: "BricoPro",
    rating: 4.8,
    reviews: 124,
    image:
      "https://images.unsplash.com/photo-1607870411590-d5e9e06da09a?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 2,
    slug:
      "chaise-de-jardin",
    designation:
      "Chaise de jardin",
    price: 4500,
    old_price: 5200,
    category: "Jardin",
    description:
      "Chaise confortable et résistante pour votre jardin, votre balcon ou votre terrasse.",
    stock_quantity: 15,
    reference: "CHA-002",
    brand: "GardenHome",
    rating: 4.6,
    reviews: 89,
    image:
      "https://images.pexels.com/photos/17976470/pexels-photo-17976470/free-photo-of-wooden-chair-in-the-garden.jpeg?auto=compress&cs=tinysrgb&w=1000",
  },
  {
    id: 3,
    slug:
      "parasol-deporte",
    designation:
      "Parasol déporté",
    price: 18500,
    category: "Jardin",
    description:
      "Parasol déporté élégant offrant une large zone d’ombre pour votre terrasse.",
    stock_quantity: 8,
    reference: "PAR-003",
    brand: "GardenHome",
    rating: 4.9,
    reviews: 56,
    image:
      "https://images.pexels.com/photos/13872652/pexels-photo-13872652.jpeg?auto=compress&cs=tinysrgb&w=1000",
  },
  {
    id: 4,
    slug:
      "perceuse-750-w",
    designation:
      "Perceuse 750 W",
    price: 12900,
    old_price: 14900,
    category:
      "Électroportatif",
    description:
      "Perceuse électrique puissante de 750 W, idéale pour le bois, le métal et les travaux de rénovation.",
    stock_quantity: 12,
    reference: "PER-004",
    brand: "BricoPro",
    rating: 4.7,
    reviews: 203,
    image:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
  },
];

function formatPrice(
  value: number,
) {
  return new Intl.NumberFormat(
    "fr-DZ",
  ).format(value);
}

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
    slug:
      product.slug ||
      createSlug(
        product.designation,
      ),
    price:
      Number(product.price),
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
    rating:
      product.rating !==
      undefined
        ? Number(
            product.rating,
          )
        : undefined,
    reviews:
      product.reviews !==
      undefined
        ? Number(
            product.reviews,
          )
        : undefined,
  };
}

function findLocalProduct(
  slug: string,
): Product {
  const demo =
    demoProducts.find(
      (item) =>
        item.slug === slug,
    );

  if (demo) {
    return demo;
  }

  if (
    typeof window !==
    "undefined"
  ) {
    try {
      const catalogValue =
        window.sessionStorage.getItem(
          CATALOG_CACHE_KEY,
        );

      if (catalogValue) {
        const catalog =
          JSON.parse(
            catalogValue,
          );

        if (
          Array.isArray(
            catalog,
          )
        ) {
          const cached =
            catalog.find(
              (
                item: Product,
              ) =>
                item.slug ===
                slug,
            );

          if (cached) {
            return normalizeProduct(
              cached,
            );
          }
        }
      }
    } catch {
      /*
       * Le cache catalogue est optionnel.
       */
    }
  }

  return {
    ...demoProducts[0],
    slug,
  };
}

function readArticleCache(
  slug: string,
): Product | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const value =
      window.sessionStorage.getItem(
        `${ARTICLE_CACHE_PREFIX}${slug}`,
      );

    if (!value) {
      return null;
    }

    return normalizeProduct(
      JSON.parse(value),
    );
  } catch {
    return null;
  }
}

function saveArticleCache(
  product: Product,
) {
  try {
    window.sessionStorage.setItem(
      `${ARTICLE_CACHE_PREFIX}${product.slug}`,
      JSON.stringify(
        product,
      ),
    );
  } catch {
    /*
     * Le cache est optionnel.
     */
  }
}

function ArticleContent() {
  const searchParams =
    useSearchParams();

  const slug =
    searchParams.get(
      "slug",
    ) ||
    "marteau-professionnel";

  /*
   * Le produit de démonstration est affiché
   * immédiatement, sans attendre le serveur.
   */
  const initialProduct =
    useMemo(
      () =>
        demoProducts.find(
          (item) =>
            item.slug ===
            slug,
        ) ||
        demoProducts[0],
      [slug],
    );

  const [
    product,
    setProduct,
  ] = useState<Product>(
    initialProduct,
  );

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    selectedImage,
    setSelectedImage,
  ] = useState(
    initialProduct.image ||
      "",
  );

  const [
    addedToCart,
    setAddedToCart,
  ] = useState(false);

  const [
    wishlisted,
    setWishlisted,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    imageError,
    setImageError,
  ] = useState(false);

  const addedTimer =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  useEffect(() => {
    return () => {
      if (
        addedTimer.current
      ) {
        clearTimeout(
          addedTimer.current,
        );
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    const controller =
      new AbortController();

    /*
     * Priorité :
     * 1. cache de cet article ;
     * 2. cache du catalogue ;
     * 3. produit de démonstration.
     */
    const cached =
      readArticleCache(
        slug,
      );

    const localProduct =
      cached ||
      findLocalProduct(
        slug,
      );

    setProduct(
      localProduct,
    );

    setSelectedImage(
      localProduct.image ||
        localProduct.images?.[0] ||
        "",
    );

    setQuantity(1);
    setImageError(false);
    setRefreshing(true);

    async function loadArticle() {
      try {
        const response =
          await apiFetch<{
            article: Product;
          }>(
            `/articles/slug/${encodeURIComponent(
              slug,
            )}`,
            {
              signal:
                controller.signal,
            },
          );

        if (
          !active ||
          !response.article
        ) {
          return;
        }

        const normalized =
          normalizeProduct(
            response.article,
          );

        setProduct(
          normalized,
        );

        setSelectedImage(
          normalized.image ||
            normalized.images?.[0] ||
            "",
        );

        setImageError(false);

        saveArticleCache(
          normalized,
        );
      } catch {
        /*
         * Le produit local reste affiché
         * si l'API est lente ou indisponible.
         */
      } finally {
        if (active) {
          setRefreshing(false);
        }
      }
    }

    /*
     * Laisser React afficher le produit local
     * avant de démarrer l'appel réseau.
     */
    const timer =
      window.setTimeout(
        loadArticle,
        0,
      );

    return () => {
      active = false;
      controller.abort();

      window.clearTimeout(
        timer,
      );
    };
  }, [slug]);

  const images =
    useMemo(() => {
      const values = [
        product.image,
        ...(product.images ||
          []),
      ].filter(
        (
          image,
        ): image is string =>
          Boolean(image),
      );

      return Array.from(
        new Set(values),
      );
    }, [product]);

  const stock =
    Number(
      product.stock_quantity ??
        0,
    );

  const inStock =
    product.inStock !==
    undefined
      ? product.inStock
      : stock > 0;

  const promotion =
    product.old_price &&
    product.old_price >
      product.price
      ? Math.round(
          ((product.old_price -
            product.price) /
            product.old_price) *
            100,
        )
      : null;

  function handleAddToCart() {
    if (!inStock) {
      return;
    }

    addToCart({
      id: product.id,
      designation:
        product.designation,
      price: Number(
        product.price,
      ),
      quantity,
      image:
        product.image,
    });

    window.dispatchEvent(
      new Event(
        "cart-change",
      ),
    );

    setAddedToCart(true);

    if (
      addedTimer.current
    ) {
      clearTimeout(
        addedTimer.current,
      );
    }

    addedTimer.current =
      setTimeout(() => {
        setAddedToCart(
          false,
        );
      }, 1800);
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-4 text-sm sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-zinc-500 transition hover:text-orange-500"
          >
            Accueil
          </Link>

          <ChevronRight className="h-4 w-4 text-zinc-300" />

          <Link
            href="/articles"
            className="text-zinc-500 transition hover:text-orange-500"
          >
            Articles
          </Link>

          <ChevronRight className="h-4 w-4 text-zinc-300" />

          <span className="truncate font-semibold text-zinc-900">
            {
              product.designation
            }
          </span>

          {refreshing && (
            <span className="ml-auto hidden items-center gap-2 text-xs font-semibold text-zinc-400 sm:inline-flex">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin text-orange-500" />
              Actualisation
            </span>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
          <Link
            href="/articles"
            className="group inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-orange-500"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Retour au catalogue
          </Link>

          <div className="mt-7 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <motion.div
              key={`image-${slug}`}
              initial={{
                opacity: 0,
                x: -20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.35,
              }}
            >
              <div className="relative overflow-hidden rounded-[34px] border border-zinc-200 bg-zinc-50">
                {promotion && (
                  <span className="absolute left-5 top-5 z-10 rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-orange-500/20">
                    -{promotion} %
                  </span>
                )}

                <motion.button
                  type="button"
                  whileTap={{
                    scale: 0.85,
                  }}
                  onClick={() =>
                    setWishlisted(
                      (current) =>
                        !current,
                    )
                  }
                  className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white/90 shadow backdrop-blur"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      wishlisted
                        ? "fill-red-500 text-red-500"
                        : "text-zinc-600"
                    }`}
                  />
                </motion.button>

                <div className="flex aspect-square items-center justify-center p-5 sm:p-8 lg:p-10">
                  <AnimatePresence
                    mode="wait"
                    initial={false}
                  >
                    {selectedImage &&
                    !imageError ? (
                      <motion.img
                        key={
                          selectedImage
                        }
                        src={
                          selectedImage
                        }
                        alt={
                          product.designation
                        }
                        /*
                         * Image principale prioritaire :
                         * téléchargement immédiat et décodage asynchrone.
                         */
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        onError={() =>
                          setImageError(
                            true,
                          )
                        }
                        initial={{
                          opacity: 0,
                          scale: 0.98,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                        }}
                        transition={{
                          duration: 0.25,
                        }}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <motion.div
                        key="fallback"
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        className="flex flex-col items-center text-zinc-300"
                      >
                        <ShoppingCart className="h-20 w-20" />

                        <span className="mt-3 text-sm font-semibold text-zinc-400">
                          Image indisponible
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {images.length >
                1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {images.map(
                    (image) => {
                      const active =
                        image ===
                        selectedImage;

                      return (
                        <button
                          key={
                            image
                          }
                          type="button"
                          onClick={() => {
                            setSelectedImage(
                              image,
                            );

                            setImageError(
                              false,
                            );
                          }}
                          className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-white p-2 transition ${
                            active
                              ? "border-orange-500 ring-4 ring-orange-500/10"
                              : "border-zinc-200 hover:border-orange-300"
                          }`}
                        >
                          <img
                            src={
                              image
                            }
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain"
                          />
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </motion.div>

            <motion.div
              key={`details-${slug}`}
              initial={{
                opacity: 0,
                x: 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.35,
              }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase text-orange-600">
                  {
                    product.category
                  }
                </span>

                {product.brand && (
                  <span className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-500">
                    {
                      product.brand
                    }
                  </span>
                )}
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight text-zinc-950 sm:text-5xl">
                {
                  product.designation
                }
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-orange-400 text-orange-400" />

                  <strong>
                    {Number(
                      product.rating ||
                        4.8,
                    ).toFixed(1)}
                  </strong>
                </span>

                <span className="text-zinc-400">
                  (
                  {product.reviews ||
                    0}{" "}
                  avis)
                </span>

                {product.reference && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-zinc-300" />

                    <span className="text-sm font-semibold text-zinc-500">
                      Réf.{" "}
                      {
                        product.reference
                      }
                    </span>
                  </>
                )}
              </div>

              <div className="mt-7 border-b border-zinc-200 pb-7">
                <strong className="text-4xl font-black text-zinc-950">
                  {formatPrice(
                    product.price,
                  )}

                  <span className="ml-2 text-xl text-orange-500">
                    DA
                  </span>
                </strong>

                {product.old_price &&
                  product.old_price >
                    product.price && (
                  <span className="ml-3 text-lg text-zinc-400 line-through">
                    {formatPrice(
                      product.old_price,
                    )}{" "}
                    DA
                  </span>
                )}
              </div>

              <p className="mt-7 leading-8 text-zinc-600">
                {product.description ||
                  "Découvrez cet article sélectionné pour sa qualité et sa fiabilité."}
              </p>

              <div
                className={`mt-7 flex items-center gap-4 rounded-2xl border p-4 ${
                  inStock
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <PackageCheck
                  className={`h-6 w-6 ${
                    inStock
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                />

                <div>
                  <strong
                    className={`block ${
                      inStock
                        ? "text-emerald-800"
                        : "text-red-800"
                    }`}
                  >
                    {inStock
                      ? "Article disponible"
                      : "Rupture de stock"}
                  </strong>

                  <span className="text-sm text-zinc-500">
                    {stock} unité
                    {stock > 1
                      ? "s"
                      : ""}
                  </span>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-4 sm:flex-row">
                <div className="flex h-14 items-center justify-between rounded-2xl border border-zinc-200 bg-white p-1 sm:w-40">
                  <button
                    type="button"
                    aria-label="Réduire la quantité"
                    onClick={() =>
                      setQuantity(
                        (current) =>
                          Math.max(
                            1,
                            current -
                              1,
                          ),
                      )
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-zinc-100"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="w-12 text-center font-black">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    aria-label="Augmenter la quantité"
                    onClick={() =>
                      setQuantity(
                        (current) =>
                          Math.min(
                            current +
                              1,
                            stock ||
                              99,
                          ),
                      )
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-zinc-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <motion.button
                  type="button"
                  whileTap={{
                    scale: 0.98,
                  }}
                  onClick={
                    handleAddToCart
                  }
                  disabled={
                    !inStock
                  }
                  className={`flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none ${
                    addedToCart
                      ? "bg-emerald-500 shadow-emerald-500/20"
                      : "bg-orange-500 shadow-orange-500/20 hover:bg-orange-600"
                  }`}
                >
                  <AnimatePresence
                    mode="wait"
                    initial={false}
                  >
                    <motion.span
                      key={
                        addedToCart
                          ? "added"
                          : "add"
                      }
                      initial={{
                        opacity: 0,
                        y: 5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -5,
                      }}
                      className="flex items-center gap-2"
                    >
                      {addedToCart ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <ShoppingCart className="h-5 w-5" />
                      )}

                      {addedToCart
                        ? "Ajouté au panier"
                        : "Ajouter au panier"}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <FeatureCard
                  icon={Truck}
                  title="Livraison"
                  description="Partout en Algérie"
                />

                <FeatureCard
                  icon={
                    ShieldCheck
                  }
                  title="Paiement"
                  description="À la livraison"
                />

                <FeatureCard
                  icon={RotateCcw}
                  title="Assistance"
                  description="Service disponible"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section
        className="border-t border-zinc-200 bg-zinc-50 py-14"
        style={{
          contentVisibility:
            "auto",
          containIntrinsicSize:
            "300px",
        }}
      >
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <InformationCard
            icon={BadgeCheck}
            title="Qualité contrôlée"
            description="Des articles fiables et sélectionnés."
          />

          <InformationCard
            icon={Truck}
            title="Livraison nationale"
            description="Livraison dans toutes les wilayas."
          />

          <InformationCard
            icon={ShieldCheck}
            title="Commande sécurisée"
            description="Paiement simple à la livraison."
          />
        </div>
      </section>
    </main>
  );
}

interface FeatureCardProps {
  icon:
    React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        <Icon className="h-5 w-5" />
      </span>

      <div>
        <strong className="block text-xs font-black">
          {title}
        </strong>

        <span className="text-[10px] text-zinc-500">
          {description}
        </span>
      </div>
    </div>
  );
}

interface InformationCardProps {
  icon:
    React.ElementType;
  title: string;
  description: string;
}

function InformationCard({
  icon: Icon,
  title,
  description,
}: InformationCardProps) {
  return (
    <div className="rounded-[26px] border border-zinc-200 bg-white p-6 shadow-sm">
      <Icon className="h-8 w-8 text-orange-500" />

      <h3 className="mt-5 text-lg font-black">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

/*
 * Le fallback de Suspense est très léger.
 * Le vrai produit apparaît immédiatement
 * dès que useSearchParams est disponible.
 */
function ArticleFallback() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-zinc-200" />

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-[34px] bg-zinc-200" />

          <div className="h-[460px] animate-pulse rounded-[34px] bg-zinc-200" />
        </div>
      </div>
    </main>
  );
}

export default function ArticlePage() {
  return (
    <Suspense
      fallback={
        <ArticleFallback />
      }
    >
      <ArticleContent />
    </Suspense>
  );
}
