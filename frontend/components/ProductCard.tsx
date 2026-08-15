"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { addToCart } from "@/lib/cart";

export interface Product {
  id: number;
  slug: string;
  designation: string;
  price: number;
  old_price?: number;
  category: string;
  description?: string;
  image?: string;
  images?: string[];
  stock_quantity?: number;
  stock_managed?: boolean;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  reference?: string;
  brand?: string;
  item_type?: "ARTICLE" | "PACK";
  promotion_id?: number;
  promotion_name?: string;
}

interface ProductCardProps {
  p: Product;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-DZ").format(price);
}

export default function ProductCard({
  p,
}: ProductCardProps) {
  const router = useRouter();

  const [isAdded, setIsAdded] =
    useState(false);


  const resetTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

  const stockQuantity = Number(
    p.stock_quantity ?? 0,
  );

  const stockManaged =
    p.stock_managed !== false;

  const inStock =
    p.inStock !== undefined
      ? p.inStock
      : !stockManaged
        ? true
        : p.stock_quantity !== undefined
          ? stockQuantity > 0
          : true;


  const promotion =
    p.old_price && p.old_price > p.price
      ? Math.round(
          ((p.old_price - p.price) /
            p.old_price) *
            100,
        )
      : null;

  const primaryImage =
    p.image ||
    p.images?.find(Boolean) ||
    "";

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  function addCurrentProductToCart() {
    addToCart({
      id: p.id,
      item_type:
        p.item_type ||
        "ARTICLE",
      slug: p.slug,
      designation: p.designation,
      price: Number(p.price),
      quantity: 1,
      image: primaryImage || undefined,
    });
  }

  function handleAddToCart() {
    if (!inStock) {
      return;
    }

    addCurrentProductToCart();

    setIsAdded(true);

    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }

    resetTimer.current = setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  }

  function handleBuyNow() {
    if (!inStock) {
      return;
    }

    addCurrentProductToCart();
    router.push("/commande");
  }

  const detailHref =
    `/article?slug=${encodeURIComponent(p.slug)}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -7 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_8px_28px_rgba(24,24,27,0.07)] transition-shadow duration-300 hover:shadow-[0_22px_55px_rgba(24,24,27,0.12)] sm:rounded-[28px]"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-zinc-50 to-zinc-100">
        <div className="absolute left-2 top-2 z-20 flex flex-wrap gap-1.5 sm:left-4 sm:top-4 sm:gap-2">
          {promotion ? (
            <motion.span
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-full bg-orange-500 px-2 py-1 text-[9px] font-black text-white shadow-lg shadow-orange-500/25 sm:px-3 sm:py-1.5 sm:text-[11px]"
            >
              -{promotion}%
            </motion.span>
          ) : (
            <span className="rounded-full bg-emerald-500 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-white shadow-lg shadow-emerald-500/20 sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-wider">
              Nouveau
            </span>
          )}
        </div>


        <Link
          href={detailHref}
          aria-label={`Voir l’article ${p.designation}`}
          className="absolute inset-0 z-10 block"
        >
          {primaryImage ? (
            <motion.img
              src={primaryImage}
              alt={p.designation}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              whileHover={{ scale: 1.075 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingCart className="h-16 w-16 text-zinc-300" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>

        <AnimatePresence mode="wait" initial={false}>
          {inStock ? (
            <motion.button
              key={isAdded ? "added" : "add"}
              type="button"
              onClick={handleAddToCart}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              whileTap={{ scale: 0.97 }}
              className={`absolute bottom-2 left-2 right-2 z-20 flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-[10px] font-black text-white shadow-xl transition-colors sm:bottom-4 sm:left-4 sm:right-4 sm:min-h-12 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm ${
                isAdded
                  ? "bg-emerald-500 shadow-emerald-500/25"
                  : "bg-zinc-950 shadow-zinc-950/20 hover:bg-orange-500 hover:shadow-orange-500/25"
              }`}
            >
              {isAdded ? (
                <Check className="h-4 w-4" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}

              <span className="sm:hidden">
                {isAdded ? "Ajouté" : "Ajouter"}
              </span>
              <span className="hidden sm:inline">
                {isAdded
                  ? "Ajouté au panier"
                  : "Ajouter au panier"}
              </span>
            </motion.button>
          ) : (
            <motion.span
              key="out-of-stock"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-2 left-2 right-2 z-20 flex min-h-9 items-center justify-center rounded-xl bg-red-50 px-2 text-[10px] font-bold text-red-600 shadow-lg sm:bottom-4 sm:left-4 sm:right-4 sm:min-h-12 sm:rounded-2xl sm:px-4 sm:text-sm"
            >
              Rupture de stock
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="truncate text-[8px] font-black uppercase tracking-[0.12em] text-orange-500 sm:text-[10px] sm:tracking-[0.18em]">
            {p.category}
          </span>

        </div>

        <Link
          href={detailHref}
          className="mt-2 sm:mt-3"
        >
          <h3 className="line-clamp-2 min-h-10 text-[13px] font-black leading-5 text-zinc-950 transition-colors group-hover:text-orange-600 sm:min-h-12 sm:text-base sm:font-bold sm:leading-6">
            {p.designation}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3 sm:gap-4 sm:pt-5">
          <div>
            {p.old_price &&
              p.old_price > p.price && (
                <span className="block text-[10px] text-zinc-400 line-through sm:text-xs">
                  {formatPrice(p.old_price)} DA
                </span>
              )}

            <div className="flex items-baseline gap-1">
              <strong className="text-base font-black text-zinc-950 sm:text-xl">
                {formatPrice(p.price)}
              </strong>

              <span className="text-[10px] font-bold text-orange-500 sm:text-sm">
                DA
              </span>
            </div>
          </div>

          <Link
            href={detailHref}
            aria-label={`Voir les détails de ${p.designation}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-all hover:border-orange-500 hover:bg-orange-500 hover:text-white hover:shadow-lg hover:shadow-orange-500/20 sm:h-10 sm:w-10 sm:rounded-xl"
          >
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold sm:mt-3 sm:gap-2 sm:text-[11px] sm:font-medium">
          <span
            className={`h-2 w-2 rounded-full ${
              inStock
                ? "bg-emerald-500"
                : "bg-red-500"
            }`}
          />

          <span
            className={
              inStock
                ? "text-emerald-600"
                : "text-red-600"
            }
          >
            <span className="sm:hidden">
              {!stockManaged
                ? "Disponible"
                : inStock
                  ? "En stock"
                  : "Indisponible"}
            </span>
            <span className="hidden sm:inline">
              {!stockManaged
                ? "Disponible"
                : inStock
                  ? "Disponible en stock"
                  : "Indisponible"}
            </span>
          </span>
        </div>

        <motion.button
          type="button"
          onClick={handleBuyNow}
          disabled={!inStock}
          whileTap={inStock ? { scale: 0.98 } : undefined}
          className={`mt-3 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl px-2 text-[10px] font-black transition-all sm:mt-4 sm:min-h-11 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm ${
            inStock
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30"
              : "cursor-not-allowed bg-zinc-100 text-zinc-400"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Acheter / شراء</span>
        </motion.button>
      </div>
    </motion.article>
  );
}
