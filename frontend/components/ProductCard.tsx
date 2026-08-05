"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Heart,
  ShoppingCart,
  Star,
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
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  reference?: string;
  brand?: string;
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
  const [isAdded, setIsAdded] =
    useState(false);

  const [isWishlisted, setIsWishlisted] =
    useState(false);

  const resetTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

  const stockQuantity = Number(
    p.stock_quantity ?? 0,
  );

  const inStock =
    p.inStock !== undefined
      ? p.inStock
      : p.stock_quantity !== undefined
        ? stockQuantity > 0
        : true;

  const rating = Math.min(
    5,
    Math.max(0, Number(p.rating ?? 0)),
  );

  const promotion =
    p.old_price && p.old_price > p.price
      ? Math.round(
          ((p.old_price - p.price) /
            p.old_price) *
            100,
        )
      : null;

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  function handleAddToCart() {
    if (!inStock) {
      return;
    }

    addToCart({
      id: p.id,
      designation: p.designation,
      price: Number(p.price),
      quantity: 1,
      image: p.image,
    });

    window.dispatchEvent(
      new Event("cart-change"),
    );

    setIsAdded(true);

    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }

    resetTimer.current = setTimeout(() => {
      setIsAdded(false);
    }, 1800);
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
      className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-sm transition-shadow duration-300 hover:shadow-[0_22px_55px_rgba(24,24,27,0.12)]"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-zinc-50 to-zinc-100">
        <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
          {promotion ? (
            <motion.span
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-full bg-orange-500 px-3 py-1.5 text-[11px] font-black text-white shadow-lg shadow-orange-500/25"
            >
              -{promotion}%
            </motion.span>
          ) : (
            <span className="rounded-full bg-emerald-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20">
              Nouveau
            </span>
          )}
        </div>

        <motion.button
          type="button"
          aria-label={
            isWishlisted
              ? "Retirer des favoris"
              : "Ajouter aux favoris"
          }
          aria-pressed={isWishlisted}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsWishlisted(
              (current) => !current,
            );
          }}
          whileTap={{ scale: 0.82 }}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/90 text-zinc-600 shadow-md backdrop-blur transition-colors hover:text-red-500"
        >
          <Heart
            className={`h-5 w-5 ${
              isWishlisted
                ? "fill-red-500 text-red-500"
                : ""
            }`}
          />
        </motion.button>

        <Link
          href={detailHref}
          aria-label={`Voir l’article ${p.designation}`}
          className="absolute inset-0 z-10 block"
        >
          {p.image ? (
            <motion.img
              src={p.image}
              alt={p.designation}
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
              className={`absolute bottom-4 left-4 right-4 z-20 flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white shadow-xl transition-colors ${
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

              {isAdded
                ? "Ajouté au panier"
                : "Ajouter au panier"}
            </motion.button>
          ) : (
            <motion.span
              key="out-of-stock"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 right-4 z-20 flex min-h-12 items-center justify-center rounded-2xl bg-red-50 px-4 text-sm font-bold text-red-600 shadow-lg"
            >
              Rupture de stock
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
            {p.category}
          </span>

          {p.rating !== undefined && (
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-zinc-600">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
              {p.reviews !== undefined && (
                <span className="font-normal text-zinc-400">
                  ({p.reviews})
                </span>
              )}
            </span>
          )}
        </div>

        <Link
          href={detailHref}
          className="mt-3"
        >
          <h3 className="line-clamp-2 min-h-12 text-base font-bold leading-6 text-zinc-950 transition-colors group-hover:text-orange-600">
            {p.designation}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <div>
            {p.old_price &&
              p.old_price > p.price && (
                <span className="block text-xs text-zinc-400 line-through">
                  {formatPrice(p.old_price)} DA
                </span>
              )}

            <div className="flex items-baseline gap-1">
              <strong className="text-xl font-black text-zinc-950">
                {formatPrice(p.price)}
              </strong>

              <span className="text-sm font-bold text-orange-500">
                DA
              </span>
            </div>
          </div>

          <Link
            href={detailHref}
            aria-label={`Voir les détails de ${p.designation}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-all hover:border-orange-500 hover:bg-orange-500 hover:text-white hover:shadow-lg hover:shadow-orange-500/20"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] font-medium">
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
            {inStock
              ? "Disponible en stock"
              : "Indisponible"}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
