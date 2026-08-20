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
  type MouseEvent,
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

  const detailHref =
    `/article?slug=${encodeURIComponent(p.slug)}`;

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

    window.dispatchEvent(
      new Event("cart-change"),
    );
  }

  function handleAddToCart(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();

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
    }, 1600);
  }

  function handleBuyNow() {
    if (!inStock) {
      return;
    }

    addCurrentProductToCart();
    router.push("/commande");
  }

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 18,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.12,
      }}
      transition={{
        duration: 0.42,
        ease: "easeOut",
      }}
      whileHover={{
        y: -5,
      }}
      className="
        group
        relative
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-[22px]
        border
        border-zinc-200/80
        bg-white
        shadow-[0_10px_32px_rgba(24,24,27,0.07)]
        transition-all
        duration-300
        hover:border-orange-200/80
        hover:shadow-[0_24px_60px_rgba(24,24,27,0.13)]
        sm:rounded-[28px]
      "
    >
      {/* =========================
          PHOTO
      ========================== */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-zinc-100">
        {/* Badge promotion / nouveau */}
        <div className="absolute left-2.5 top-2.5 z-30 flex flex-wrap gap-1.5 sm:left-4 sm:top-4">
          {promotion ? (
            <motion.span
              initial={{
                opacity: 0,
                x: -10,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              className="
                rounded-full
                bg-orange-500
                px-2.5
                py-1.5
                text-[9px]
                font-black
                text-white
                shadow-lg
                shadow-orange-500/25
                sm:px-3
                sm:text-[11px]
              "
            >
              -{promotion}%
            </motion.span>
          ) : (
            <span
              className="
                rounded-full
                border
                border-white/70
                bg-emerald-500
                px-2.5
                py-1.5
                text-[8px]
                font-black
                uppercase
                tracking-wide
                text-white
                shadow-lg
                shadow-emerald-500/20
                sm:px-3
                sm:text-[10px]
                sm:tracking-wider
              "
            >
              Nouveau
            </span>
          )}
        </div>

        {/* Bouton panier premium */}
        <AnimatePresence
          mode="wait"
          initial={false}
        >
          {inStock ? (
            <motion.button
              key={
                isAdded
                  ? "added"
                  : "cart"
              }
              type="button"
              onClick={handleAddToCart}
              initial={{
                opacity: 0,
                scale: 0.82,
                y: -8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.82,
              }}
              whileHover={{
                scale: 1.08,
                y: -1,
              }}
              whileTap={{
                scale: 0.9,
              }}
              aria-label={
                isAdded
                  ? `${p.designation} ajouté au panier`
                  : `Ajouter ${p.designation} au panier`
              }
              title={
                isAdded
                  ? "Ajouté au panier"
                  : "Ajouter au panier"
              }
              className={`
                absolute
                right-2.5
                top-2.5
                z-40
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                backdrop-blur-md
                transition-colors
                duration-200
                sm:right-4
                sm:top-4
                sm:h-11
                sm:w-11
                ${
                  isAdded
                    ? "border-emerald-400 bg-emerald-500 text-white shadow-[0_8px_22px_rgba(16,185,129,0.34)]"
                    : "border-white/90 bg-white/95 text-orange-500 shadow-[0_8px_24px_rgba(24,24,27,0.16)] hover:bg-orange-500 hover:text-white"
                }
              `}
            >
              {isAdded ? (
                <Check className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              ) : (
                <ShoppingCart className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              )}
            </motion.button>
          ) : (
            <span
              className="
                absolute
                right-2.5
                top-2.5
                z-40
                rounded-full
                border
                border-red-100
                bg-white/95
                px-2.5
                py-1.5
                text-[8px]
                font-black
                uppercase
                text-red-500
                shadow-lg
                backdrop-blur
                sm:right-4
                sm:top-4
                sm:px-3
                sm:text-[10px]
              "
            >
              Indispo
            </span>
          )}
        </AnimatePresence>

        {/* Image cliquable */}
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
              draggable={false}
              className="h-full w-full object-cover"
              whileHover={{
                scale: 1.055,
              }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingCart className="h-14 w-14 text-zinc-300 sm:h-16 sm:w-16" />
            </div>
          )}

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-black/20
              via-transparent
              to-transparent
              opacity-0
              transition-opacity
              duration-300
              group-hover:opacity-100
            "
          />
        </Link>

        {/* petit halo visuel en bas */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-white/10 to-transparent" />
      </div>

      {/* =========================
          CONTENU
      ========================== */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span
            className="
              truncate
              text-[8px]
              font-black
              uppercase
              tracking-[0.13em]
              text-orange-500
              sm:text-[10px]
              sm:tracking-[0.18em]
            "
          >
            {p.category}
          </span>

          {promotion && p.promotion_name ? (
            <span className="max-w-[46%] truncate rounded-full bg-orange-50 px-2 py-1 text-[8px] font-black text-orange-600 sm:text-[9px]">
              {p.promotion_name}
            </span>
          ) : null}
        </div>

        <Link
          href={detailHref}
          className="mt-2.5 sm:mt-3"
        >
          <h3
            className="
              line-clamp-2
              min-h-10
              text-[13px]
              font-black
              leading-5
              text-zinc-950
              transition-colors
              group-hover:text-orange-600
              sm:min-h-12
              sm:text-base
              sm:font-bold
              sm:leading-6
            "
          >
            {p.designation}
          </h3>
        </Link>

        {/* Prix + détails */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3.5 sm:gap-4 sm:pt-5">
          <div className="min-w-0">
            {p.old_price &&
              p.old_price > p.price && (
                <span className="mb-0.5 block text-[9px] font-semibold text-zinc-400 line-through sm:text-xs">
                  {formatPrice(p.old_price)} DA
                </span>
              )}

            <div className="flex flex-wrap items-baseline gap-1">
              <strong className="text-[17px] font-black tracking-tight text-zinc-950 sm:text-xl">
                {formatPrice(p.price)}
              </strong>

              <span className="text-[10px] font-black text-orange-500 sm:text-sm">
                DA
              </span>
            </div>
          </div>

          <motion.div
            whileHover={{
              x: 2,
            }}
            whileTap={{
              scale: 0.94,
            }}
          >
            <Link
              href={detailHref}
              aria-label={`Voir les détails de ${p.designation}`}
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-zinc-200
                bg-zinc-50
                text-zinc-500
                transition-all
                hover:border-orange-500
                hover:bg-orange-500
                hover:text-white
                sm:h-10
                sm:w-10
                sm:rounded-2xl
              "
            >
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </motion.div>
        </div>

        {/* Stock */}
        <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-bold sm:mt-3 sm:gap-2 sm:text-[11px] sm:font-medium">
          <motion.span
            animate={
              inStock
                ? {
                    scale: [1, 1.18, 1],
                  }
                : {
                    scale: 1,
                  }
            }
            transition={{
              duration: 1.8,
              repeat: inStock
                ? Infinity
                : 0,
              ease: "easeInOut",
            }}
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

        {/* Acheter */}
        <motion.button
          type="button"
          onClick={handleBuyNow}
          disabled={!inStock}
          whileHover={
            inStock
              ? {
                  y: -1,
                }
              : undefined
          }
          whileTap={
            inStock
              ? {
                  scale: 0.98,
                }
              : undefined
          }
          className={`mt-3.5 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl px-3 text-[10px] font-black transition-all sm:mt-4 sm:min-h-11 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm ${
            inStock
              ? "bg-orange-500 text-white shadow-[0_8px_22px_rgba(249,115,22,0.24)] hover:bg-orange-600 hover:shadow-[0_10px_28px_rgba(249,115,22,0.32)]"
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
