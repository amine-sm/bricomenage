"use client";

import Link from "next/link";
import {
  useRouter,
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
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
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
  saveDirectCheckout,
} from "@/lib/cart";

import type {
  Product,
} from "@/components/ProductCard";

import DynamicProductSeo from "@/components/DynamicProductSeo";

const ARTICLE_CACHE_PREFIX =
  "bricomenage-article-cache:";

const CATALOG_CACHE_KEY =
  "bricomenage-articles-cache-v1";

function createLoadingProduct(
  slug: string,
): Product {
  return {
    id: 0,
    slug,
    designation: "Chargement de l’article...",
    price: 0,
    category: "Article",
    stock_quantity: 0,
    inStock: false,
    item_type: "ARTICLE",
  };
}

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
): Product | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

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
    /* Cache catalogue optionnel. */
  }

  return null;
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
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const slug =
    searchParams.get(
      "slug",
    )?.trim() ||
    "";

  const initialProduct =
    useMemo(
      () =>
        createLoadingProduct(
          slug,
        ),
      [slug],
    );

  const [
    product,
    setProduct,
  ] = useState<Product>(
    initialProduct,
  );

  const [
    articleReady,
    setArticleReady,
  ] = useState(false);

  const [
    articleLoading,
    setArticleLoading,
  ] = useState(true);

  const [
    articleError,
    setArticleError,
  ] = useState("");

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    selectedImage,
    setSelectedImage,
  ] = useState("");

  const [
    addedToCart,
    setAddedToCart,
  ] = useState(false);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    imageError,
    setImageError,
  ] = useState(false);

  const [
    relatedProducts,
    setRelatedProducts,
  ] = useState<Product[]>([]);

  const [
    relatedLoading,
    setRelatedLoading,
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

    if (!slug) {
      setProduct(
        createLoadingProduct(""),
      );
      setSelectedImage("");
      setArticleReady(false);
      setArticleLoading(false);
      setArticleError(
        "Aucun article n’a été sélectionné.",
      );
      setRefreshing(false);

      return () => {
        active = false;
        controller.abort();
      };
    }

    /*
     * On affiche uniquement une vraie donnée déjà mise en cache.
     * Sans cache, un squelette reste visible jusqu'à la réponse API :
     * aucune photo de démonstration n'est montrée.
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

    setArticleError("");
    setQuantity(1);
    setImageError(false);

    if (localProduct) {
      setProduct(localProduct);
      setSelectedImage(
        localProduct.image ||
          localProduct.images?.find(Boolean) ||
          "",
      );
      setArticleReady(true);
      setArticleLoading(false);
      setRefreshing(true);
    } else {
      setProduct(
        createLoadingProduct(
          slug,
        ),
      );
      setSelectedImage("");
      setArticleReady(false);
      setArticleLoading(true);
      setRefreshing(false);
    }

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
            normalized.images?.find(Boolean) ||
            "",
        );

        setArticleReady(true);
        setArticleLoading(false);
        setImageError(false);

        saveArticleCache(
          normalized,
        );
      } catch (loadError) {
        if (
          active &&
          !localProduct
        ) {
          setArticleError(
            loadError instanceof Error
              ? loadError.message
              : "Impossible de charger cet article.",
          );
        }
      } finally {
        if (active) {
          setRefreshing(false);
          setArticleLoading(false);
        }
      }
    }

    /* Démarre l'appel réseau après l'initialisation de l'état local. */
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

  useEffect(() => {
    let active = true;

    async function loadRelatedProducts() {
      if (
        !product.category ||
        !product.id
      ) {
        setRelatedProducts([]);
        return;
      }

      setRelatedLoading(true);

      try {
        const params =
          new URLSearchParams({
            category:
              product.category,
            limit: "12",
          });

        const response =
          await apiFetch<{
            articles: Product[];
            total?: number;
          }>(
            `/articles?${params.toString()}`,
          );

        if (!active) {
          return;
        }

        const normalized =
          Array.isArray(
            response.articles,
          )
            ? response.articles
                .map(
                  normalizeProduct,
                )
                .filter(
                  (item) =>
                    Number(
                      item.id,
                    ) !==
                    Number(
                      product.id,
                    ),
                )
                .sort((a, b) => {
                  /*
                   * Même marque d'abord lorsque possible,
                   * puis meilleure note.
                   */
                  const aSameBrand =
                    Boolean(
                      product.brand &&
                        a.brand ===
                          product.brand,
                    );

                  const bSameBrand =
                    Boolean(
                      product.brand &&
                        b.brand ===
                          product.brand,
                    );

                  if (
                    aSameBrand !==
                    bSameBrand
                  ) {
                    return aSameBrand
                      ? -1
                      : 1;
                  }

                  return (
                    Number(
                      b.rating ||
                        0,
                    ) -
                    Number(
                      a.rating ||
                        0,
                    )
                  );
                })
                .slice(0, 4)
            : [];

        setRelatedProducts(
          normalized,
        );
      } catch {
        if (active) {
          setRelatedProducts(
            [],
          );
        }
      } finally {
        if (active) {
          setRelatedLoading(
            false,
          );
        }
      }
    }

    void loadRelatedProducts();

    return () => {
      active = false;
    };
  }, [
    product.id,
    product.category,
    product.brand,
  ]);

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

  const activeImageIndex =
    Math.max(
      0,
      images.findIndex(
        (image) =>
          image === selectedImage,
      ),
    );

  function showPreviousImage() {
    if (images.length <= 1) {
      return;
    }

    const previousIndex =
      activeImageIndex <= 0
        ? images.length - 1
        : activeImageIndex - 1;

    setSelectedImage(
      images[previousIndex],
    );
    setImageError(false);
  }

  function showNextImage() {
    if (images.length <= 1) {
      return;
    }

    const nextIndex =
      activeImageIndex >=
      images.length - 1
        ? 0
        : activeImageIndex + 1;

    setSelectedImage(
      images[nextIndex],
    );
    setImageError(false);
  }

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

  const oldPrice =
    Number(
      product.old_price || 0,
    );

  const promotion =
    oldPrice > product.price
      ? Math.round(
          ((oldPrice -
            product.price) /
            oldPrice) *
            100,
        )
      : null;

  useEffect(() => {
    function handleGalleryKeyboard(
      event: KeyboardEvent,
    ) {
      if (images.length <= 1) {
        return;
      }

      if (event.key === "ArrowLeft") {
        showPreviousImage();
      }

      if (event.key === "ArrowRight") {
        showNextImage();
      }
    }

    window.addEventListener(
      "keydown",
      handleGalleryKeyboard,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleGalleryKeyboard,
      );
    };
  }, [
    activeImageIndex,
    images,
  ]);

  function handleBuyNow() {
    if (!inStock) {
      return;
    }

    saveDirectCheckout(
      {
        id: product.id,
        item_type: "ARTICLE",
        slug: product.slug,
        designation:
          product.designation,
        price: Number(
          product.price,
        ),
        quantity,
        image:
          product.image ||
          product.images?.find(
            Boolean,
          ),
      },
      `/article/?slug=${encodeURIComponent(
        product.slug,
      )}`,
    );

    router.push(
      "/commande/?direct=1",
    );
  }

  function handleAddToCart() {
    if (!inStock) {
      return;
    }

    addToCart({
      id: product.id,
      item_type: "ARTICLE",
      slug: product.slug,
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

  if (!articleReady) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-orange-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au catalogue
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
          {articleLoading ? (
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="aspect-square animate-pulse rounded-[28px] border border-zinc-200 bg-zinc-200/70 sm:rounded-[34px]" />
              <div className="space-y-5 py-2">
                <div className="h-5 w-28 animate-pulse rounded-full bg-zinc-200" />
                <div className="h-10 w-4/5 animate-pulse rounded-xl bg-zinc-200" />
                <div className="h-5 w-full animate-pulse rounded-lg bg-zinc-200" />
                <div className="h-5 w-3/4 animate-pulse rounded-lg bg-zinc-200" />
                <div className="h-16 w-44 animate-pulse rounded-2xl bg-zinc-200" />
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-center">
              <PackageCheck className="mx-auto h-10 w-10 text-red-400" />
              <p className="mt-3 font-black text-red-700">
                Article indisponible
              </p>
              <p className="mt-2 text-sm font-semibold text-red-600">
                {articleError ||
                  "Impossible de charger les informations de cet article."}
              </p>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <>
      <DynamicProductSeo product={product} />
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
                {promotion !== null &&
                  promotion > 0 && (
                  <span className="absolute left-5 top-5 z-20 rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-orange-500/20">
                    -{promotion} %
                  </span>
                )}

                {images.length > 1 && (
                  <span className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-zinc-950/80 px-3 py-1.5 text-xs font-black text-white backdrop-blur">
                    {activeImageIndex + 1} / {images.length}
                  </span>
                )}


                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      aria-label="Image précédente"
                      className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/90 text-zinc-800 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-orange-500 hover:text-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={showNextImage}
                      aria-label="Image suivante"
                      className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/90 text-zinc-800 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-orange-500 hover:text-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                <div className="flex aspect-square items-center justify-center overflow-hidden bg-zinc-100">
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
                          x: 16,
                          scale: 0.985,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          x: -16,
                        }}
                        transition={{
                          duration: 0.28,
                        }}
                        className="h-full w-full object-cover"
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

              {images.length > 1 && (
                <div className="mt-4 rounded-[24px] border border-zinc-200 bg-zinc-50 p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3 px-1 pb-3">
                    <strong className="text-sm font-black text-zinc-800">
                      Galerie produit
                    </strong>

                    <span className="text-xs font-bold text-zinc-400">
                      {images.length} photo
                      {images.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] [scrollbar-color:#f97316_transparent]">
                    {images.map(
                      (image, index) => {
                        const active =
                          image ===
                          selectedImage;

                        return (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => {
                              setSelectedImage(
                                image,
                              );

                              setImageError(
                                false,
                              );
                            }}
                            aria-label={`Afficher l’image ${index + 1}`}
                            className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-zinc-100 transition ${
                              active
                                ? "border-orange-500 ring-4 ring-orange-500/10"
                                : "border-zinc-200 hover:border-orange-300"
                            }`}
                          >
                            <img
                              src={image}
                              alt={`${product.designation} ${index + 1}`}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full rounded-xl object-cover"
                            />

                            <span className={`absolute bottom-1 right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black ${
                              active
                                ? "bg-orange-500 text-white"
                                : "bg-zinc-950/70 text-white"
                            }`}>
                              {index + 1}
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>
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

                {oldPrice >
                  product.price && (
                  <span className="ml-3 text-lg text-zinc-400 line-through">
                    {formatPrice(
                      oldPrice,
                    )}{" "}
                    DA
                  </span>
                )}
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

                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <motion.button
                    type="button"
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={
                      handleBuyNow
                    }
                    disabled={
                      !inStock
                    }
                    className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Acheter / اشتر الآن
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>

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
                    className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 ${
                      addedToCart
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-zinc-200 bg-white text-zinc-800 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
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
              </div>

              <div
                className={`mt-5 flex items-center gap-4 rounded-2xl border p-4 ${
                  inStock
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <PackageCheck
                  className={`h-6 w-6 shrink-0 ${
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

      <section className="border-t border-zinc-200 bg-zinc-50 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-8 lg:p-10">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <Sparkles className="h-5 w-5" />
              </span>

              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-500">
                  Détails de l’article
                </span>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
                  Description du produit
                </h2>
              </div>
            </div>

            <div className="mt-6 border-t border-zinc-100 pt-6">
              <p className="whitespace-pre-line text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
                {product.description ||
                  "Découvrez cet article sélectionné pour sa qualité et sa fiabilité."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-orange-600">
                <Sparkles className="h-3.5 w-3.5" />
                Vous aimerez aussi
              </span>

              <h2 className="mt-4 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
                Articles similaires
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Découvrez d’autres produits de la catégorie{" "}
                <strong className="text-zinc-700">
                  {product.category}
                </strong>
                .
              </p>
            </div>

            <Link
              href={`/articles/?categorie=${encodeURIComponent(
                product.category ||
                  "",
              )}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 sm:self-auto"
            >
              Voir la catégorie
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {relatedLoading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({
                length: 4,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-[26px] border border-zinc-200 bg-white"
                  >
                    <div className="aspect-[4/3] animate-pulse bg-zinc-200" />
                    <div className="space-y-3 p-4">
                      <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
                      <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
                      <div className="h-6 w-28 animate-pulse rounded bg-zinc-200" />
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : relatedProducts.length >
            0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map(
                (item) => {
                  const relatedOldPrice =
                    Number(
                      item.old_price ||
                        0,
                    );

                  const relatedDiscount =
                    relatedOldPrice >
                    Number(
                      item.price,
                    )
                      ? Math.round(
                          ((relatedOldPrice -
                            Number(
                              item.price,
                            )) /
                            relatedOldPrice) *
                            100,
                        )
                      : null;

                  const relatedStock =
                    Number(
                      item.stock_quantity ||
                        0,
                    );

                  return (
                    <Link
                      key={item.id}
                      href={`/article/?slug=${encodeURIComponent(
                        item.slug ||
                          "",
                      )}`}
                      className="group overflow-hidden rounded-[26px] border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                        {item.image ? (
                          <img
                            src={
                              item.image
                            }
                            alt={
                              item.designation
                            }
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-300">
                            <ShoppingCart className="h-12 w-12" />
                          </div>
                        )}

                        {relatedDiscount !==
                          null &&
                          relatedDiscount >
                            0 && (
                            <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-black text-white shadow">
                              -
                              {
                                relatedDiscount
                              }
                              %
                            </span>
                          )}

                        <span
                          className={`absolute bottom-3 left-3 rounded-full px-3 py-1.5 text-[10px] font-black shadow-sm ${
                            relatedStock > 0
                              ? "bg-emerald-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {relatedStock >
                          0
                            ? "En stock"
                            : "Rupture"}
                        </span>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-[10px] font-black uppercase tracking-[0.13em] text-orange-500">
                            {
                              item.category
                            }
                          </span>

                        </div>

                        <h3 className="mt-3 min-h-[44px] text-sm font-black leading-5 text-zinc-950 transition group-hover:text-orange-600">
                          {
                            item.designation
                          }
                        </h3>

                        {item.brand && (
                          <p className="mt-1 truncate text-xs font-semibold text-zinc-400">
                            {
                              item.brand
                            }
                          </p>
                        )}

                        <div className="mt-4 flex items-end justify-between gap-3 border-t border-zinc-100 pt-4">
                          <div>
                            {relatedOldPrice >
                              Number(
                                item.price,
                              ) && (
                              <span className="block text-[11px] text-zinc-400 line-through">
                                {formatPrice(
                                  relatedOldPrice,
                                )}{" "}
                                DA
                              </span>
                            )}

                            <strong className="block text-lg font-black text-zinc-950">
                              {formatPrice(
                                Number(
                                  item.price,
                                ),
                              )}{" "}
                              <span className="text-xs text-orange-500">
                                DA
                              </span>
                            </strong>
                          </div>

                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-500 group-hover:text-white">
                            <ChevronRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          ) : (
            <div className="mt-8 rounded-[26px] border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
              <p className="font-black text-zinc-800">
                Aucun article similaire disponible pour le moment.
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Les produits de la même catégorie apparaîtront ici automatiquement.
              </p>
            </div>
          )}
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
    </>
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

function ArticlePageContent() {
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

export default function ArticlePage() {
  return (
    <Suspense fallback={<PageSearchParamsLoading />}>
      <ArticlePageContent />
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
