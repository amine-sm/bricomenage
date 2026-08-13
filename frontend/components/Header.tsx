"use client";

import Link from "next/link";
import {
  usePathname,
  useSearchParams,
} from "next/navigation";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Droplets,
  Hammer,
  Home,
  Leaf,
  MapPin,
  Menu,
  Package,
  PaintRoller,
  Search,
  ShoppingBag,
  Sofa,
  Tag,
  Truck,
  X,
  Zap,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { getCart } from "@/lib/cart";

import {
  catalogApi,
  type CatalogCategory,
} from "@/lib/catalog";

const mainNavigation = [
  {
    label: "Accueil",
    href: "/",
    icon: Home,
  },
  {
    label: "Catalogue",
    href: "/articles",
    icon: Package,
  },
  {
    label: "Promotions",
    href:
      "/articles?promotion=1",
    icon: Tag,
  },
  {
    label: "Nos packs",
    href:
      "/articles?pack=1",
    icon: Boxes,
  },
  {
    label:
      "Suivi commande",
    href: "/suivi-commande",
    icon: MapPin,
  },
] as const;

type HeaderCategory = {
  id: number;
  label: string;
  slug: string;
  href: string;
  icon: typeof Hammer;
  className: string;
  articleCount: number;
  image?: string | null;
};

const fallbackCategories:
  HeaderCategory[] = [
    {
      id: 1,
      label: "Outillage",
      slug: "outillage",
      href:
        "/articles?categorie=Outillage",
      icon: Hammer,
      className:
        "bg-blue-50 text-blue-600",
      articleCount: 0,
    },
    {
      id: 2,
      label: "Jardin",
      slug: "jardin",
      href:
        "/articles?categorie=Jardin",
      icon: Leaf,
      className:
        "bg-emerald-50 text-emerald-600",
      articleCount: 0,
    },
    {
      id: 3,
      label: "Mobilier",
      slug: "mobilier",
      href:
        "/articles?categorie=Mobilier",
      icon: Sofa,
      className:
        "bg-orange-50 text-orange-600",
      articleCount: 0,
    },
    {
      id: 4,
      label: "Peinture",
      slug: "peinture",
      href:
        "/articles?categorie=Peinture",
      icon: PaintRoller,
      className:
        "bg-rose-50 text-rose-600",
      articleCount: 0,
    },
    {
      id: 5,
      label: "Électricité",
      slug: "electricite",
      href:
        "/articles?categorie=Électricité",
      icon: Zap,
      className:
        "bg-yellow-50 text-yellow-600",
      articleCount: 0,
    },
    {
      id: 6,
      label: "Plomberie",
      slug: "plomberie",
      href:
        "/articles?categorie=Plomberie",
      icon: Droplets,
      className:
        "bg-cyan-50 text-cyan-600",
      articleCount: 0,
    },
  ];

function getHeaderCategoryVisual(
  name: string,
) {
  const normalized = name
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase();

  if (
    normalized.includes("jardin")
  ) {
    return {
      icon: Leaf,
      className:
        "bg-emerald-50 text-emerald-600",
    };
  }

  if (
    normalized.includes("mobil")
  ) {
    return {
      icon: Sofa,
      className:
        "bg-orange-50 text-orange-600",
    };
  }

  if (
    normalized.includes("peint")
  ) {
    return {
      icon: PaintRoller,
      className:
        "bg-rose-50 text-rose-600",
    };
  }

  if (
    normalized.includes("elect")
  ) {
    return {
      icon: Zap,
      className:
        "bg-yellow-50 text-yellow-600",
    };
  }

  if (
    normalized.includes("plomb")
  ) {
    return {
      icon: Droplets,
      className:
        "bg-cyan-50 text-cyan-600",
    };
  }

  return {
    icon: Hammer,
    className:
      "bg-blue-50 text-blue-600",
  };
}

export default function Header() {
  const [
    categories,
    setCategories,
  ] = useState<HeaderCategory[]>(
    fallbackCategories,
  );

  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const categoriesReference =
    useRef<HTMLDivElement>(
      null,
    );

  const [
    cartCount,
    setCartCount,
  ] = useState(0);

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    categoriesOpen,
    setCategoriesOpen,
  ] = useState(false);

  const [
    mobileCategoriesOpen,
    setMobileCategoriesOpen,
  ] = useState(false);

  const [
    scrolled,
    setScrolled,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const response =
          await catalogApi.categories();

        if (
          !active ||
          !Array.isArray(
            response.categories,
          )
        ) {
          return;
        }

        const normalized =
          response.categories.map(
            (
              category:
                CatalogCategory,
            ): HeaderCategory => {
              const visual =
                getHeaderCategoryVisual(
                  category.name,
                );

              return {
                id: Number(
                  category.id,
                ),
                label:
                  category.name,
                slug:
                  category.slug,
                href:
                  `/articles?categorie=${encodeURIComponent(
                    category.name,
                  )}`,
                articleCount:
                  Number(
                    category.article_count ||
                      0,
                  ),
                image:
                  category.image ||
                  null,
                ...visual,
              };
            },
          );

        setCategories(normalized);
      } catch {
        /*
         * Les catégories de secours
         * restent visibles si l’API
         * est indisponible.
         */
      }
    }

    void loadCategories();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function refreshCart() {
      try {
        const total =
          getCart().reduce(
            (
              sum,
              item,
            ) =>
              sum +
              Number(
                item.quantity ||
                  0,
              ),
            0,
          );

        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    }

    refreshCart();

    window.addEventListener(
      "cart-change",
      refreshCart,
    );

    window.addEventListener(
      "storage",
      refreshCart,
    );

    return () => {
      window.removeEventListener(
        "cart-change",
        refreshCart,
      );

      window.removeEventListener(
        "storage",
        refreshCart,
      );
    };
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(
        window.scrollY > 8,
      );
    }

    onScroll();

    window.addEventListener(
      "scroll",
      onScroll,
      {
        passive: true,
      },
    );

    return () =>
      window.removeEventListener(
        "scroll",
        onScroll,
      );
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setCategoriesOpen(false);
    setMobileCategoriesOpen(
      false,
    );
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        categoriesReference.current &&
        !categoriesReference.current.contains(
          event.target as Node,
        )
      ) {
        setCategoriesOpen(
          false,
        );
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      mobileOpen
        ? "hidden"
        : "";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [mobileOpen]);

  function normalizePath(
    path: string,
  ) {
    if (path === "/") {
      return "/";
    }

    return path.replace(
      /\/+$/,
      "",
    );
  }

  function isActive(
    href: string,
  ) {
    const [
      rawTargetPath,
      query = "",
    ] = href.split("?");

    const targetPath =
      normalizePath(
        rawTargetPath,
      );

    const currentPath =
      normalizePath(pathname);

    if (targetPath === "/") {
      return currentPath === "/";
    }

    if (
      currentPath !== targetPath
    ) {
      return false;
    }

    const expected =
      new URLSearchParams(
        query,
      );

    if (expected.size === 0) {
      return (
        !searchParams.has(
          "promotion",
        ) &&
        !searchParams.has(
          "pack",
        ) &&
        !searchParams.has(
          "categorie",
        )
      );
    }

    return Array.from(
      expected.entries(),
    ).every(
      ([key, value]) =>
        searchParams.get(
          key,
        ) === value,
    );
  }

  const categoryActive =
    pathname === "/articles" &&
    searchParams.has(
      "categorie",
    );

  return (
    <>
      <div className="bg-zinc-950 text-white">
        <div className="mx-auto flex min-h-10 max-w-7xl items-center justify-center gap-5 px-4 text-[11px] font-medium text-zinc-300 sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-orange-400" />
            Livraison disponible dans toute l’Algérie
          </div>

          <div className="hidden items-center gap-6 sm:flex">
            <span className="flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5 text-orange-400" />
              Paiement à la livraison
            </span>

            <Link
              href="/suivi-commande"
              className="flex items-center gap-2 transition hover:text-white"
            >
              <MapPin className="h-3.5 w-3.5 text-orange-400" />
              Suivre ma commande
            </Link>
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-zinc-200 bg-white/95 shadow-[0_12px_35px_rgba(24,24,27,0.08)] backdrop-blur-xl"
            : "border-zinc-200/70 bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[78px] items-center justify-between gap-4">
            <Link
              href="/"
              className="group flex items-center gap-3"
            >
              <motion.span
                whileHover={{
                  rotate: -3,
                  scale: 1.04,
                }}
                whileTap={{
                  scale: 0.96,
                }}
                className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <img
                  src="/images/logo-bricomenage.jpeg"
                  alt="BricoMénage"
                  className="h-full w-full object-contain p-1"
                />
              </motion.span>

              <span>
                <strong className="block text-lg font-black leading-none tracking-tight text-zinc-950 sm:text-xl">
                  Brico
                  <span className="text-orange-500">
                    Ménage
                  </span>
                </strong>

                <span className="mt-1 hidden text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400 sm:block">
                  Équipez tous vos projets
                </span>
              </span>
            </Link>

            <div className="hidden flex-1 justify-center px-6 lg:flex">
              <form
                action="/articles"
                method="get"
                className="relative w-full max-w-md"
              >
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

                <input
                  type="search"
                  name="search"
                  placeholder="Rechercher un marteau, une chaise, un parasol..."
                  autoComplete="off"
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-orange-300 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                />
              </form>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/articles"
                aria-label="Rechercher"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 lg:hidden"
              >
                <Search className="h-5 w-5" />
              </Link>

              <Link
                href="/panier"
                className="group relative flex h-12 items-center gap-2 rounded-2xl bg-orange-500 px-4 font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
              >
                <ShoppingBag className="h-5 w-5" />

                <span className="hidden text-sm sm:inline">
                  Mon panier
                </span>

                <AnimatePresence initial={false}>
                  {cartCount >
                    0 && (
                    <motion.span
                      key={
                        cartCount
                      }
                      initial={{
                        opacity: 0,
                        scale: 0.5,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.5,
                      }}
                      className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-zinc-950 px-1 text-[10px] font-black"
                    >
                      {cartCount >
                      99
                        ? "99+"
                        : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              <button
                type="button"
                aria-expanded={
                  mobileOpen
                }
                aria-label={
                  mobileOpen
                    ? "Fermer le menu"
                    : "Ouvrir le menu"
                }
                onClick={() =>
                  setMobileOpen(
                    (open) =>
                      !open,
                  )
                }
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 lg:hidden"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="hidden items-center justify-between border-t border-zinc-100 py-2 lg:flex">
            <div
              ref={
                categoriesReference
              }
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setCategoriesOpen(
                    (open) =>
                      !open,
                  )
                }
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                  categoryActive
                    ? "bg-orange-500 text-white"
                    : "bg-zinc-950 text-white hover:bg-orange-500"
                }`}
              >
                <Boxes className="h-4 w-4" />
                Toutes les catégories

                <motion.span
                  animate={{
                    rotate:
                      categoriesOpen
                        ? 180
                        : 0,
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </button>

              <AnimatePresence>
                {categoriesOpen && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 10,
                      scale: 0.98,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: 8,
                      scale: 0.98,
                    }}
                    className="absolute left-0 top-[calc(100%+12px)] w-[610px] overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_24px_70px_rgba(24,24,27,0.16)]"
                  >
                    <div className="mb-3 flex items-center justify-between px-2">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
                          Choisir un univers
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          Trouvez rapidement les produits adaptés à votre projet.
                        </p>
                      </div>

                      <Link
                        href="/articles"
                        className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-black text-zinc-700 transition hover:bg-orange-500 hover:text-white"
                      >
                        Tout voir
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {categories.map(
                        (
                          category,
                          index,
                        ) => {
                          const Icon =
                            category.icon;

                          const active =
                            isActive(
                              category.href,
                            );

                          return (
                            <motion.div
                              key={
                                category.id
                              }
                              initial={{
                                opacity: 0,
                                y: 8,
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                              }}
                              transition={{
                                delay:
                                  index *
                                  0.035,
                              }}
                            >
                              <Link
                                href={
                                  category.href
                                }
                                className={`group flex items-center gap-3 rounded-2xl border p-3 transition ${
                                  active
                                    ? "border-orange-300 bg-orange-50"
                                    : "border-transparent hover:border-orange-200 hover:bg-orange-50/50"
                                }`}
                              >
                                <span
                                  className={`relative flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
                                    active
                                      ? "bg-orange-500 text-white"
                                      : category.className
                                  }`}
                                >
                                  {category.image ? (
                                    <img
                                      src={category.image}
                                      alt={category.label}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Icon className="h-5 w-5" />
                                  )}

                                  {category.image && active && (
                                    <span className="absolute inset-0 ring-2 ring-inset ring-orange-500" />
                                  )}
                                </span>

                                <div className="min-w-0">
                                  <strong
                                    className={`block truncate text-sm ${
                                    active
                                      ? "text-orange-600"
                                      : "text-zinc-800 group-hover:text-orange-600"
                                  }`}
                                >
                                  {
                                    category.label
                                  }
                                  </strong>

                                  <span className="mt-0.5 block text-[10px] font-semibold text-zinc-400">
                                    {category.articleCount} article
                                    {category.articleCount > 1
                                      ? "s"
                                      : ""}
                                  </span>
                                </div>

                                {active && (
                                  <span className="ml-auto h-2 w-2 rounded-full bg-orange-500" />
                                )}
                              </Link>
                            </motion.div>
                          );
                        },
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <nav className="flex items-center gap-1">
              {mainNavigation.map(
                (item) => {
                  const Icon =
                    item.icon;

                  const active =
                    isActive(
                      item.href,
                    );

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`group relative flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-orange-50 text-orange-600"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          active
                            ? "text-orange-500"
                            : "text-zinc-400"
                        }`}
                      />

                      {item.label}

                      {active && (
                        <motion.span
                          layoutId="navbar-active"
                          className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-orange-500"
                        />
                      )}
                    </Link>
                  );
                },
              )}
            </nav>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {mobileOpen && (
            <motion.div
              initial={{
                height: 0,
                opacity: 0,
              }}
              animate={{
                height: "auto",
                opacity: 1,
              }}
              exit={{
                height: 0,
                opacity: 0,
              }}
              transition={{
                duration: 0.28,
              }}
              className="max-h-[calc(100vh-78px)] overflow-y-auto border-t border-zinc-200 bg-white lg:hidden"
            >
              <div className="space-y-2 px-4 py-4 sm:px-6">
                {mainNavigation.map(
                  (
                    item,
                    index,
                  ) => {
                    const Icon =
                      item.icon;

                    const active =
                      isActive(
                        item.href,
                      );

                    return (
                      <motion.div
                        key={
                          item.label
                        }
                        initial={{
                          opacity: 0,
                          x: -12,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          delay:
                            index *
                            0.04,
                        }}
                      >
                        <Link
                          href={
                            item.href
                          }
                          className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-semibold transition ${
                            active
                              ? "bg-orange-50 text-orange-600"
                              : "bg-white text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}

                          <ChevronRight className="ml-auto h-4 w-4" />
                        </Link>
                      </motion.div>
                    );
                  },
                )}

                <button
                  type="button"
                  onClick={() =>
                    setMobileCategoriesOpen(
                      (open) =>
                        !open,
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-2xl bg-zinc-950 px-4 py-4 text-sm font-black text-white"
                >
                  <Boxes className="h-5 w-5" />
                  Toutes les catégories

                  <motion.span
                    animate={{
                      rotate:
                        mobileCategoriesOpen
                          ? 180
                          : 0,
                    }}
                    className="ml-auto"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {mobileCategoriesOpen && (
                    <motion.div
                      initial={{
                        height: 0,
                        opacity: 0,
                      }}
                      animate={{
                        height: "auto",
                        opacity: 1,
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                      }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 grid gap-2 rounded-2xl bg-zinc-50 p-2">
                        {categories.map(
                          (
                            category,
                          ) => {
                            const Icon =
                              category.icon;

                            const active =
                              isActive(
                                category.href,
                              );

                            return (
                              <Link
                                key={
                                  category.id
                                }
                                href={
                                  category.href
                                }
                                className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold shadow-sm transition ${
                                  active
                                    ? "border-orange-300 bg-orange-50 text-orange-600"
                                    : "border-transparent bg-white text-zinc-700"
                                }`}
                              >
                                <span
                                  className={`flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
                                    active
                                      ? "bg-orange-500 text-white"
                                      : category.className
                                  }`}
                                >
                                  {category.image ? (
                                    <img
                                      src={category.image}
                                      alt={category.label}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Icon className="h-5 w-5" />
                                  )}
                                </span>

                                <span className="min-w-0 flex-1">
                                  <strong className="block truncate">
                                    {category.label}
                                  </strong>

                                  <small className="mt-0.5 block text-[10px] text-zinc-400">
                                    {category.articleCount} article
                                    {category.articleCount > 1
                                      ? "s"
                                      : ""}
                                  </small>
                                </span>

                                {active ? (
                                  <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white">
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  </span>
                                ) : (
                                  <ChevronRight className="ml-auto h-4 w-4" />
                                )}
                              </Link>
                            );
                          },
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-200 pt-4">
                  <Link
                    href="/panier"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-xs font-black text-white"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Mon panier
                  </Link>

                  <Link
                    href="/suivi-commande"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-xs font-black text-white"
                  >
                    <MapPin className="h-4 w-4" />
                    Suivi
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            aria-label="Fermer le menu"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={() =>
              setMobileOpen(
                false,
              )
            }
            className="fixed inset-0 z-40 bg-zinc-950/30 backdrop-blur-[2px] lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
