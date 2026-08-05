"use client";

import Link from "next/link";
import {
  useSearchParams,
} from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronRight,
  Heart,
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

import { apiFetch } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import type { Product } from "@/components/ProductCard";

const demoProducts: Product[] = [
  {
    id: 1,
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
      "/images/products/marteau.jpg",
  },
  {
    id: 2,
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
      "/images/products/chaise-jardin.jpg",
  },
  {
    id: 3,
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
      "/images/products/parasol.jpg",
  },
  {
    id: 4,
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
      "/images/products/perceuse.jpg",
  },
];

function formatPrice(
  value: number,
) {
  return new Intl.NumberFormat(
    "fr-DZ",
  ).format(value);
}

function ProductContent() {
  const searchParams =
    useSearchParams();

  const id =
    searchParams.get("id") ||
    "1";

  const fallbackProduct =
    demoProducts.find(
      (item) =>
        item.id ===
        Number(id),
    ) || demoProducts[0];

  const [product, setProduct] =
    useState<Product>(
      fallbackProduct,
    );

  const [loading, setLoading] =
    useState(true);

  const [quantity, setQuantity] =
    useState(1);

  const [
    selectedImage,
    setSelectedImage,
  ] = useState(
    fallbackProduct.image ||
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

  useEffect(() => {
    let active = true;

    async function loadArticle() {
      setLoading(true);
      setQuantity(1);

      const localProduct =
        demoProducts.find(
          (item) =>
            item.id ===
            Number(id),
        ) ||
        demoProducts[0];

      try {
        const response =
          await apiFetch<{
            article: Product;
          }>(
            `/articles/${id}`,
          );

        if (
          active &&
          response.article
        ) {
          setProduct(
            response.article,
          );

          setSelectedImage(
            response.article
              .image ||
              response.article
                .images?.[0] ||
              "",
          );
        }
      } catch {
        if (active) {
          setProduct(
            localProduct,
          );

          setSelectedImage(
            localProduct.image ||
              "",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadArticle();

    return () => {
      active = false;
    };
  }, [id]);

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

  useEffect(() => {
    if (
      !selectedImage &&
      images.length > 0
    ) {
      setSelectedImage(
        images[0],
      );
    }
  }, [
    images,
    selectedImage,
  ]);

  const stock = Number(
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

  function incrementQuantity() {
    setQuantity(
      (current) =>
        Math.min(
          current + 1,
          stock || 99,
        ),
    );
  }

  function decrementQuantity() {
    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1,
        ),
    );
  }

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
      image: product.image,
    });

    window.dispatchEvent(
      new Event("cart-change"),
    );

    setAddedToCart(true);

    window.setTimeout(() => {
      setAddedToCart(false);
    }, 2200);
  }

  if (loading) {
    return <ProductLoading />;
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-4 text-sm sm:px-6 lg:px-8">
          <Link
            href="/"
            className="shrink-0 text-zinc-500 transition-colors hover:text-orange-500"
          >
            Accueil
          </Link>

          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />

          <Link
            href="/articles"
            className="shrink-0 text-zinc-500 transition-colors hover:text-orange-500"
          >
            Articles
          </Link>

          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />

          <span className="truncate font-semibold text-zinc-900">
            {product.designation}
          </span>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute -bottom-28 left-16 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <Link
            href="/articles"
            className="group inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition-colors hover:text-orange-500"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Retour au catalogue
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <motion.div
              initial={{
                opacity: 0,
                x: -30,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.55,
                ease: "easeOut",
              }}
            >
              <div className="relative overflow-hidden rounded-[34px] border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100 shadow-sm">
                {promotion && (
                  <span className="absolute left-5 top-5 z-10 rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-orange-500/30">
                    -{promotion}%
                  </span>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setWishlisted(
                      (current) =>
                        !current,
                    )
                  }
                  aria-label="Ajouter aux favoris"
                  className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-600 shadow-sm backdrop-blur-md transition hover:scale-105 hover:text-red-500"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      wishlisted
                        ? "fill-red-500 text-red-500"
                        : ""
                    }`}
                  />
                </button>

                <div className="flex aspect-square items-center justify-center p-8 sm:p-12">
                  <AnimatePresence mode="wait">
                    {selectedImage ? (
                      <motion.img
                        key={
                          selectedImage
                        }
                        initial={{
                          opacity: 0,
                          scale: 0.92,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.96,
                        }}
                        transition={{
                          duration: 0.3,
                        }}
                        src={
                          selectedImage
                        }
                        alt={
                          product.designation
                        }
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <motion.div
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        className="flex flex-col items-center justify-center text-center"
                      >
                        <span className="text-8xl">
                          🛠️
                        </span>
                        <span className="mt-5 text-sm font-semibold text-zinc-400">
                          Image du produit
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {images.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {images.map(
                    (image) => {
                      const active =
                        selectedImage ===
                        image;

                      return (
                        <button
                          key={image}
                          type="button"
                          onClick={() =>
                            setSelectedImage(
                              image,
                            )
                          }
                          className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-white p-2 transition-all ${
                            active
                              ? "border-orange-500 ring-4 ring-orange-500/10"
                              : "border-zinc-200 hover:border-orange-300"
                          }`}
                        >
                          <img
                            src={image}
                            alt=""
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
              initial={{
                opacity: 0,
                x: 30,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.55,
                delay: 0.08,
                ease: "easeOut",
              }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                  {product.category ||
                    "Article"}
                </span>

                {product.reference && (
                  <span className="text-xs font-semibold text-zinc-400">
                    Référence :{" "}
                    {product.reference}
                  </span>
                )}
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
                {product.designation}
              </h1>

              {product.brand && (
                <p className="mt-3 text-sm text-zinc-500">
                  Marque :{" "}
                  <strong className="text-zinc-800">
                    {product.brand}
                  </strong>
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  {Array.from({
                    length: 5,
                  }).map(
                    (_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${
                          index <
                          Math.round(
                            product.rating ||
                              5,
                          )
                            ? "fill-orange-400 text-orange-400"
                            : "text-zinc-300"
                        }`}
                      />
                    ),
                  )}
                </div>

                <strong className="text-sm text-zinc-900">
                  {product.rating ||
                    4.8}
                </strong>

                <span className="text-sm text-zinc-400">
                  ({product.reviews || 0} avis)
                </span>
              </div>

              <div className="mt-7 flex flex-wrap items-end gap-3 border-b border-zinc-200 pb-7">
                <strong className="text-4xl font-black text-zinc-950 sm:text-5xl">
                  {formatPrice(
                    Number(
                      product.price,
                    ),
                  )}
                  <span className="ml-2 text-xl text-orange-500">
                    DA
                  </span>
                </strong>

                {product.old_price &&
                  product.old_price >
                    product.price && (
                    <span className="pb-1 text-lg font-semibold text-zinc-400 line-through">
                      {formatPrice(
                        product.old_price,
                      )}{" "}
                      DA
                    </span>
                  )}
              </div>

              <p className="mt-7 text-base leading-8 text-zinc-600">
                {product.description ||
                  "Aucune description disponible pour cet article."}
              </p>

              <div
                className={`mt-7 flex items-center gap-4 rounded-2xl border p-4 ${
                  inStock
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    inStock
                      ? "bg-emerald-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {inStock ? (
                    <PackageCheck className="h-5 w-5" />
                  ) : (
                    <ShoppingCart className="h-5 w-5" />
                  )}
                </span>

                <div>
                  <strong
                    className={`block text-sm font-black ${
                      inStock
                        ? "text-emerald-800"
                        : "text-red-700"
                    }`}
                  >
                    {inStock
                      ? "Produit disponible"
                      : "Rupture de stock"}
                  </strong>

                  <span
                    className={`mt-1 block text-xs ${
                      inStock
                        ? "text-emerald-700"
                        : "text-red-600"
                    }`}
                  >
                    {inStock
                      ? `${stock} unité${
                          stock > 1
                            ? "s"
                            : ""
                        } disponible${
                          stock > 1
                            ? "s"
                            : ""
                        }`
                      : "Ce produit est actuellement indisponible."}
                  </span>
                </div>
              </div>

              <div className="mt-7">
                <span className="block text-sm font-black text-zinc-900">
                  Quantité
                </span>

                <div className="mt-3 flex flex-col gap-4 sm:flex-row">
                  <div className="flex h-14 items-center rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={
                        decrementQuantity
                      }
                      disabled={
                        quantity <= 1
                      }
                      aria-label="Diminuer la quantité"
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={stock || 99}
                      value={quantity}
                      onChange={(event) => {
                        const value =
                          Number(
                            event.target.value,
                          );

                        setQuantity(
                          Math.max(
                            1,
                            Math.min(
                              value || 1,
                              stock || 99,
                            ),
                          ),
                        );
                      }}
                      className="h-11 w-14 bg-transparent text-center text-base font-black text-zinc-950 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />

                    <button
                      type="button"
                      onClick={
                        incrementQuantity
                      }
                      disabled={
                        quantity >= stock
                      }
                      aria-label="Augmenter la quantité"
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    type="button"
                    disabled={!inStock}
                    onClick={
                      handleAddToCart
                    }
                    className={`relative flex min-h-14 flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl px-7 text-sm font-black text-white shadow-lg transition-all ${
                      addedToCart
                        ? "bg-emerald-500 shadow-emerald-500/25"
                        : "bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35"
                    } disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none`}
                  >
                    <AnimatePresence mode="wait">
                      {addedToCart ? (
                        <motion.span
                          key="added"
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            y: -8,
                          }}
                          className="flex items-center gap-2"
                        >
                          <Check className="h-5 w-5" />
                          Ajouté au panier
                        </motion.span>
                      ) : (
                        <motion.span
                          key="add"
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            y: -8,
                          }}
                          className="flex items-center gap-2"
                        >
                          <ShoppingCart className="h-5 w-5" />
                          Ajouter au panier
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <FeatureCard
                  icon={Truck}
                  title="Livraison"
                  description="Partout en Algérie"
                />
                <FeatureCard
                  icon={ShieldCheck}
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

      <section className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-3">
            <InformationCard
              icon={BadgeCheck}
              title="Qualité contrôlée"
              description="Nos produits sont sélectionnés pour leur résistance, leur fiabilité et leur qualité."
            />
            <InformationCard
              icon={Truck}
              title="Livraison nationale"
              description="Nous livrons votre commande dans les différentes wilayas d’Algérie."
            />
            <InformationCard
              icon={ShieldCheck}
              title="Commande sécurisée"
              description="Vérifiez votre commande puis payez simplement au moment de la livraison."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

interface FeatureCardProps {
  icon: React.ElementType;
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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        <Icon className="h-5 w-5" />
      </span>

      <div>
        <strong className="block text-xs font-black text-zinc-900">
          {title}
        </strong>

        <span className="mt-1 block text-[10px] text-zinc-500">
          {description}
        </span>
      </div>
    </div>
  );
}

interface InformationCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function InformationCard({
  icon: Icon,
  title,
  description,
}: InformationCardProps) {
  return (
    <div className="group rounded-[26px] border border-zinc-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 transition-transform duration-300 group-hover:scale-110">
        <Icon className="h-7 w-7" />
      </span>

      <h3 className="mt-5 text-lg font-black text-zinc-950">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function ProductLoading() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="aspect-square animate-pulse rounded-[34px] bg-zinc-200" />
        <div className="space-y-6">
          <div className="h-7 w-32 animate-pulse rounded-full bg-zinc-200" />
          <div className="h-14 w-full animate-pulse rounded-2xl bg-zinc-200" />
          <div className="h-10 w-48 animate-pulse rounded-xl bg-zinc-200" />
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded-full bg-zinc-200" />
            <div className="h-4 w-full animate-pulse rounded-full bg-zinc-200" />
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-zinc-200" />
          </div>
          <div className="h-20 w-full animate-pulse rounded-2xl bg-zinc-200" />
          <div className="h-14 w-full animate-pulse rounded-2xl bg-zinc-200" />
        </div>
      </div>
    </main>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<ProductLoading />}>
      <ProductContent />
    </Suspense>
  );
}
