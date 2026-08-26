"use client";
import Link from "next/link";
import { usePathname, useSearchParams, } from "next/navigation";
import { Boxes, ChevronDown, ChevronRight, CreditCard, Droplets, Hammer, Home, Leaf, LoaderCircle, MapPin, Menu, Package, PaintRoller, Search, ShoppingBag, Sofa, Tag, Truck, X, Zap, } from "lucide-react";
import { useEffect, useRef, useState, } from "react";
import { getCart } from "@/lib/cart";
import { catalogApi, type CatalogArticle, type CatalogCategory, } from "@/lib/catalog";
/* =========================================================
   NAVIGATION PRINCIPALE
========================================================= */
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
        href: "/articles?promotion=1",
        icon: Tag,
    },
    {
        label: "Nos packs",
        href: "/articles?pack=1",
        icon: Boxes,
    },
    {
        label: "Suivi commande",
        href: "/suivi-commande",
        icon: MapPin,
    },
] as const;
/* =========================================================
   TYPES
========================================================= */
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
/* =========================================================
   CATÉGORIES DE SECOURS
========================================================= */
const fallbackCategories: HeaderCategory[] = [
    {
        id: 1,
        label: "Outillage",
        slug: "outillage",
        href: "/articles?categorie=Outillage",
        icon: Hammer,
        className: "bg-blue-50 text-blue-600",
        articleCount: 0,
    },
    {
        id: 2,
        label: "Jardin",
        slug: "jardin",
        href: "/articles?categorie=Jardin",
        icon: Leaf,
        className: "bg-emerald-50 text-emerald-600",
        articleCount: 0,
    },
    {
        id: 3,
        label: "Mobilier",
        slug: "mobilier",
        href: "/articles?categorie=Mobilier",
        icon: Sofa,
        className: "bg-orange-50 text-orange-600",
        articleCount: 0,
    },
    {
        id: 4,
        label: "Peinture",
        slug: "peinture",
        href: "/articles?categorie=Peinture",
        icon: PaintRoller,
        className: "bg-rose-50 text-rose-600",
        articleCount: 0,
    },
    {
        id: 5,
        label: "Électricité",
        slug: "electricite",
        href: "/articles?categorie=Électricité",
        icon: Zap,
        className: "bg-yellow-50 text-yellow-600",
        articleCount: 0,
    },
    {
        id: 6,
        label: "Plomberie",
        slug: "plomberie",
        href: "/articles?categorie=Plomberie",
        icon: Droplets,
        className: "bg-cyan-50 text-cyan-600",
        articleCount: 0,
    },
];
/* =========================================================
   VISUEL CATÉGORIE
========================================================= */
function getHeaderCategoryVisual(name: string) {
    const normalized = name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    if (normalized.includes("jardin")) {
        return {
            icon: Leaf,
            className: "bg-emerald-50 text-emerald-600",
        };
    }
    if (normalized.includes("mobil")) {
        return {
            icon: Sofa,
            className: "bg-orange-50 text-orange-600",
        };
    }
    if (normalized.includes("peint")) {
        return {
            icon: PaintRoller,
            className: "bg-rose-50 text-rose-600",
        };
    }
    if (normalized.includes("elect")) {
        return {
            icon: Zap,
            className: "bg-yellow-50 text-yellow-600",
        };
    }
    if (normalized.includes("plomb")) {
        return {
            icon: Droplets,
            className: "bg-cyan-50 text-cyan-600",
        };
    }
    return {
        icon: Hammer,
        className: "bg-blue-50 text-blue-600",
    };
}
/* =========================================================
   FORMATAGE PRIX
========================================================= */
function formatSearchPrice(value: number) {
    return new Intl.NumberFormat("fr-DZ").format(Number(value || 0));
}
/* =========================================================
   NORMALISATION RECHERCHE
========================================================= */
function normalizeSearchValue(value?: string | null) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("fr")
        .trim();
}
/* =========================================================
   CLASSEMENT SUGGESTIONS
========================================================= */
function rankSearchSuggestions(articles: CatalogArticle[], query: string) {
    const term = normalizeSearchValue(query);
    if (!term) {
        return [];
    }
    function score(article: CatalogArticle) {
        const designation = normalizeSearchValue(article.designation);
        const category = normalizeSearchValue(article.category);
        const brand = normalizeSearchValue(article.brand);
        const reference = normalizeSearchValue(article.reference);
        let total = 0;
        if (designation === term) {
            total += 150;
        }
        if (designation.startsWith(term)) {
            total += 100;
        }
        if (designation
            .split(/\s+/)
            .some((word) => word.startsWith(term))) {
            total += 75;
        }
        if (designation.includes(term)) {
            total += 55;
        }
        if (brand.startsWith(term)) {
            total += 35;
        }
        else if (brand.includes(term)) {
            total += 24;
        }
        if (category.startsWith(term)) {
            total += 28;
        }
        else if (category.includes(term)) {
            total += 18;
        }
        if (reference.includes(term)) {
            total += 15;
        }
        return total;
    }
    return [...articles]
        .sort((a, b) => score(b) - score(a))
        .slice(0, 8);
}
/* =========================================================
   HEADER
========================================================= */
export default function Header() {
    const [categories, setCategories,] = useState<HeaderCategory[]>(fallbackCategories);
    const pathname = usePathname();
    const currentPath = pathname === "/"
        ? "/"
        : pathname.replace(/\/+$/, "");
    const searchParams = useSearchParams();
    /* =======================================================
       REFS
    ======================================================= */
    const categoriesReference = useRef<HTMLDivElement>(null);
    const mobileSearchInputReference = useRef<HTMLInputElement>(null);
    const desktopSearchReference = useRef<HTMLDivElement>(null);
    /* =======================================================
       STATES
    ======================================================= */
    const [desktopSearchOpen, setDesktopSearchOpen,] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen,] = useState(false);
    const [mobileSearchQuery, setMobileSearchQuery,] = useState(searchParams.get("search") ||
        "");
    const [searchSuggestions, setSearchSuggestions,] = useState<CatalogArticle[]>([]);
    const [searchSuggestionsLoading, setSearchSuggestionsLoading,] = useState(false);
    const [searchSuggestionsError, setSearchSuggestionsError,] = useState("");
    const [cartCount, setCartCount,] = useState(0);
    const [mobileOpen, setMobileOpen,] = useState(false);
    const [categoriesOpen, setCategoriesOpen,] = useState(false);
    const [mobileCategoriesOpen, setMobileCategoriesOpen,] = useState(false);
    const [scrolled, setScrolled,] = useState(false);
    /* =======================================================
       CHARGEMENT CATÉGORIES
    ======================================================= */
    useEffect(() => {
        let active = true;
        async function loadCategories() {
            try {
                const response = await catalogApi.categories();
                if (!active ||
                    !Array.isArray(response.categories)) {
                    return;
                }
                const normalized = response.categories.map((category: CatalogCategory): HeaderCategory => {
                    const visual = getHeaderCategoryVisual(category.name);
                    return {
                        id: Number(category.id),
                        label: category.name,
                        slug: category.slug,
                        href: `/articles?categorie=${encodeURIComponent(category.name)}`,
                        articleCount: Number(category.article_count ||
                            0),
                        image: category.image ||
                            null,
                        ...visual,
                    };
                });
                setCategories(normalized);
            }
            catch {
                // Les catégories fallback restent affichées.
            }
        }
        const mobile = window.matchMedia("(max-width: 767px)").matches;
        const timerId = window.setTimeout(() => void loadCategories(), mobile ? 3000 : 0);
        return () => {
            active = false;
            window.clearTimeout(timerId);
        };
    }, []);
    /* =======================================================
       SYNCHRONISATION RECHERCHE URL
    ======================================================= */
    useEffect(() => {
        setMobileSearchQuery(searchParams.get("search") ||
            "");
    }, [
        currentPath,
        searchParams,
    ]);
    /* =======================================================
       FOCUS RECHERCHE MOBILE
    ======================================================= */
    useEffect(() => {
        if (!mobileSearchOpen) {
            return;
        }
        const frame = window.requestAnimationFrame(() => {
            mobileSearchInputReference.current?.focus();
        });
        return () => {
            window.cancelAnimationFrame(frame);
        };
    }, [mobileSearchOpen]);
    /* =======================================================
       SUGGESTIONS RECHERCHE
    ======================================================= */
    useEffect(() => {
        let active = true;
        const query = mobileSearchQuery.trim();
        if (!mobileSearchOpen &&
            !desktopSearchOpen) {
            setSearchSuggestions([]);
            setSearchSuggestionsLoading(false);
            return;
        }
        if (!query) {
            setSearchSuggestions([]);
            setSearchSuggestionsLoading(false);
            setSearchSuggestionsError("");
            return;
        }
        setSearchSuggestionsLoading(true);
        setSearchSuggestionsError("");
        const timerId = window.setTimeout(async () => {
            try {
                const response = await catalogApi.articles({
                    search: query,
                    limit: "12",
                });
                if (!active) {
                    return;
                }
                const articles = Array.isArray(response.articles)
                    ? response.articles
                    : [];
                setSearchSuggestions(rankSearchSuggestions(articles, query));
            }
            catch (error) {
                if (!active) {
                    return;
                }
                setSearchSuggestions([]);
                setSearchSuggestionsError(error instanceof Error
                    ? error.message
                    : "Impossible de charger les suggestions.");
            }
            finally {
                if (active) {
                    setSearchSuggestionsLoading(false);
                }
            }
        }, 230);
        return () => {
            active = false;
            window.clearTimeout(timerId);
        };
    }, [
        desktopSearchOpen,
        mobileSearchOpen,
        mobileSearchQuery,
    ]);
    /* =======================================================
       PANIER
    ======================================================= */
    useEffect(() => {
        function refreshCart() {
            try {
                const total = getCart().reduce((sum, item) => sum +
                    Number(item.quantity ||
                        0), 0);
                setCartCount(total);
            }
            catch {
                setCartCount(0);
            }
        }
        refreshCart();
        window.addEventListener("cart-change", refreshCart);
        window.addEventListener("storage", refreshCart);
        return () => {
            window.removeEventListener("cart-change", refreshCart);
            window.removeEventListener("storage", refreshCart);
        };
    }, []);
    /* =======================================================
       SCROLL HEADER
    ======================================================= */
    useEffect(() => {
        let frame = 0;
        function updateScrolled() {
            frame = 0;
            setScrolled((current) => {
                const next = window.scrollY >
                    8;
                return current ===
                    next
                    ? current
                    : next;
            });
        }
        function onScroll() {
            if (frame) {
                return;
            }
            frame =
                window.requestAnimationFrame(updateScrolled);
        }
        updateScrolled();
        window.addEventListener("scroll", onScroll, {
            passive: true,
        });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (frame) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, []);
    /* =======================================================
       FERMETURE APRÈS CHANGEMENT DE PAGE
    ======================================================= */
    useEffect(() => {
        setMobileOpen(false);
        setCategoriesOpen(false);
        setMobileCategoriesOpen(false);
        setMobileSearchOpen(false);
    }, [
        currentPath,
        searchParams,
    ]);
    /* =======================================================
       CLICK EXTÉRIEUR CATÉGORIES
    ======================================================= */
    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            if (categoriesReference.current &&
                !categoriesReference.current.contains(event.target as Node)) {
                setCategoriesOpen(false);
            }
        }
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);
    /* =======================================================
       CLICK EXTÉRIEUR RECHERCHE PC
    ======================================================= */
    useEffect(() => {
        function handleDesktopSearchOutside(event: MouseEvent) {
            if (desktopSearchReference.current &&
                !desktopSearchReference.current.contains(event.target as Node)) {
                setDesktopSearchOpen(false);
            }
        }
        document.addEventListener("mousedown", handleDesktopSearchOutside);
        return () => {
            document.removeEventListener("mousedown", handleDesktopSearchOutside);
        };
    }, []);
    /* =======================================================
       BLOQUER SCROLL QUAND MENU MOBILE OUVERT
    ======================================================= */
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
    /* =======================================================
       FONCTIONS ROUTES
    ======================================================= */
    function normalizePath(path: string) {
        if (path === "/") {
            return "/";
        }
        return path.replace(/\/+$/, "");
    }
    function isActive(href: string) {
        const [rawTargetPath, query = "",] = href.split("?");
        const targetPath = normalizePath(rawTargetPath);
        const currentNormalizedPath = normalizePath(pathname);
        if (targetPath === "/") {
            return (currentNormalizedPath ===
                "/");
        }
        if (currentNormalizedPath !==
            targetPath) {
            return false;
        }
        const expected = new URLSearchParams(query);
        if (expected.size === 0) {
            return (!searchParams.has("promotion") &&
                !searchParams.has("pack") &&
                !searchParams.has("categorie"));
        }
        return Array.from(expected.entries()).every(([key, value]) => searchParams.get(key) === value);
    }
    const categoryActive = currentPath ===
        "/articles" &&
        searchParams.has("categorie");
    const catalogueBottomActive = currentPath ===
        "/articles" &&
        !searchParams.has("promotion") &&
        !searchParams.has("pack");
    /* =======================================================
       RENDER
    ======================================================= */
    return (<>
      {/* =====================================================
            BANDEAU SUPÉRIEUR
        ===================================================== */}

      <div className="bg-zinc-950 text-white">
        <div className="mx-auto flex min-h-10 max-w-7xl items-center justify-center gap-5 px-4 text-[11px] font-medium text-zinc-300 sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-orange-400"/>

            Livraison disponible dans toute l’Algérie
          </div>

          <div className="hidden items-center gap-6 sm:flex">
            <span className="flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5 text-orange-400"/>

              Paiement à la livraison
            </span>

            <Link href="/suivi-commande" className="flex items-center gap-2 transition hover:text-white">
              <MapPin className="h-3.5 w-3.5 text-orange-400"/>

              Suivre ma commande
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================
            HEADER
        ===================================================== */}

      <header className={`sticky top-0 z-50 border-b transition-shadow duration-150 ${scrolled
            ? "border-zinc-200 bg-white shadow-[0_10px_28px_rgba(24,24,27,0.07)] lg:bg-white/95 lg:backdrop-blur-xl"
            : "border-zinc-200/70 bg-white"}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* =================================================
            LOGO + RECHERCHE + PANIER
        ================================================= */}

          <div className="flex min-h-[78px] items-center justify-between gap-3">

            {/* LOGO */}

            <Link href="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm sm:h-12 sm:w-12">
                <img src="/images/logo-bricomenage-320.webp" alt="BricoMénage" width={48} height={48} loading="eager" fetchPriority="high" decoding="async" className="h-full w-full object-contain p-1"/>
              </span>

              <span className="min-w-0">
                <strong className="block truncate text-base font-black leading-none tracking-tight text-zinc-950 sm:text-xl">
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

            {/* =================================================
            RECHERCHE DESKTOP
        ================================================= */}

            <div className="hidden flex-1 justify-center px-6 lg:flex">
              <div ref={desktopSearchReference} className="relative w-full max-w-xl">
                <form action="/articles" method="get" onSubmit={() => setDesktopSearchOpen(false)} className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-zinc-400"/>

                  <input type="search" name="search" value={mobileSearchQuery} onFocus={() => setDesktopSearchOpen(true)} onChange={(event) => {
            setMobileSearchQuery(event.target
                .value);
            setDesktopSearchOpen(true);
        }} placeholder="Rechercher un marteau, une chaise, un parasol..." autoComplete="off" autoCorrect="off" spellCheck={false} className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-12 text-sm font-medium text-zinc-900 outline-none transition placeholder:font-normal placeholder:text-zinc-400 hover:border-orange-300 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"/>

                  {mobileSearchQuery && (<button type="button" onClick={() => {
                setMobileSearchQuery("");
                setSearchSuggestions([]);
            }} aria-label="Effacer la recherche" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-200/80 text-zinc-500 transition hover:bg-zinc-300 active:scale-95">
                      <X className="h-4 w-4"/>
                    </button>)}
                </form>

                {/* =================================================
            SUGGESTIONS DESKTOP
        ================================================= */}

                <>
                  {desktopSearchOpen &&
            mobileSearchQuery.trim() && (<div className="absolute left-0 right-0 top-[calc(100%+10px)] z-[120] max-h-[min(70vh,620px)] overflow-y-auto overscroll-contain rounded-3xl border border-zinc-200 bg-white shadow-[0_28px_80px_rgba(24,24,27,0.20)]">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
                              Suggestions produits
                            </p>

                            <p className="mt-0.5 text-xs text-zinc-400">
                              Résultats proches de «{" "}
                              <span className="font-bold text-zinc-600">
                                {mobileSearchQuery.trim()}
                              </span>{" "}
                              »
                            </p>
                          </div>

                          {searchSuggestionsLoading && (<LoaderCircle className="h-5 w-5 animate-spin text-orange-500"/>)}
                        </div>

                        {searchSuggestionsLoading &&
                searchSuggestions.length ===
                    0 ? (<div className="space-y-1.5 p-3">
                            {Array.from({
                    length: 5,
                }).map((_, index) => (<div key={index} className="flex animate-pulse items-center gap-4 rounded-2xl p-2.5">
                                  <div className="h-16 w-24 shrink-0 rounded-2xl bg-zinc-200"/>

                                  <div className="min-w-0 flex-1">
                                    <div className="h-4 w-3/4 rounded bg-zinc-200"/>

                                    <div className="mt-2 h-3 w-2/5 rounded bg-zinc-100"/>

                                    <div className="mt-2 h-3.5 w-1/4 rounded bg-zinc-200"/>
                                  </div>
                                </div>))}
                          </div>) : searchSuggestionsError ? (<div className="px-6 py-10 text-center">
                            <p className="text-sm font-black text-zinc-800">
                              Recherche momentanément indisponible
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                              Réessayez dans quelques instants.
                            </p>
                          </div>) : searchSuggestions.length >
                0 ? (<div className="p-2.5">
                            {searchSuggestions.map((article) => {
                    const image = article.image ||
                        article.images?.find(Boolean) ||
                        "";
                    return (<Link key={article.id} href={`/article?slug=${encodeURIComponent(article.slug)}`} onClick={() => setDesktopSearchOpen(false)} className="group flex items-center gap-4 rounded-2xl p-2.5 transition hover:bg-orange-50/70">
                                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
                                      {image ? (<img src={image} alt={article.designation} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105"/>) : (<div className="flex h-full w-full items-center justify-center">
                                          <Package className="h-7 w-7 text-zinc-300"/>
                                        </div>)}

                                      {article.old_price &&
                            Number(article.old_price) >
                                Number(article.price) && (<span className="absolute left-1.5 top-1.5 rounded-md bg-orange-500 px-1.5 py-0.5 text-[8px] font-black uppercase text-white">
                                            Promo
                                          </span>)}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <strong className="line-clamp-2 text-sm font-black leading-5 text-zinc-900 transition group-hover:text-orange-600">
                                        {article.designation}
                                      </strong>

                                      <div className="mt-1 flex min-w-0 items-center gap-2">
                                        <span className="truncate text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                                          {article.category}
                                        </span>

                                        {article.brand && (<>
                                            <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-300"/>

                                            <span className="truncate text-[10px] text-zinc-400">
                                              {article.brand}
                                            </span>
                                          </>)}
                                      </div>

                                      <div className="mt-1.5 flex items-baseline gap-2">
                                        <span className="text-base font-black text-zinc-950">
                                          {formatSearchPrice(Number(article.price))}{" "}
                                          DA
                                        </span>

                                        {article.old_price &&
                            Number(article.old_price) >
                                Number(article.price) && (<span className="text-[11px] text-zinc-400 line-through">
                                              {formatSearchPrice(Number(article.old_price))}{" "}
                                              DA
                                            </span>)}
                                      </div>
                                    </div>

                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 transition group-hover:bg-orange-500 group-hover:text-white">
                                      <ChevronRight className="h-4 w-4"/>
                                    </span>
                                  </Link>);
                })}

                            <Link href={`/articles?search=${encodeURIComponent(mobileSearchQuery.trim())}`} onClick={() => setDesktopSearchOpen(false)} className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-50 px-5 text-sm font-black text-orange-600 transition hover:bg-orange-100">
                              <Search className="h-4 w-4"/>

                              Voir tous les résultats
                            </Link>
                          </div>) : (<div className="px-6 py-10 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                              <Search className="h-5 w-5"/>
                            </div>

                            <p className="mt-3 text-sm font-black text-zinc-800">
                              Aucun produit trouvé
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                              Essayez un autre nom, une marque ou une catégorie.
                            </p>
                          </div>)}
                      </div>)}
                </>
              </div>
            </div>

            {/* =================================================
            ACTIONS HEADER MOBILE
        ================================================= */}

            <div className="flex shrink-0 items-center gap-2">

              {/* RECHERCHE MOBILE */}

              <button type="button" aria-label={mobileSearchOpen
            ? "Fermer la recherche"
            : "Rechercher un produit"} aria-expanded={mobileSearchOpen} onClick={() => {
            setMobileOpen(false);
            setDesktopSearchOpen(false);
            setMobileSearchOpen((open) => !open);
        }} className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition lg:hidden ${mobileSearchOpen
            ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20"
            : "border-zinc-200 bg-white text-zinc-700"}`}>
                {mobileSearchOpen ? (<X className="h-5 w-5"/>) : (<Search className="h-5 w-5"/>)}
              </button>

              {/* PANIER HEADER DESKTOP */}

              <Link href="/panier" className="group relative hidden h-12 items-center gap-2 rounded-2xl bg-orange-500 px-4 font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600 sm:flex">
                <ShoppingBag className="h-5 w-5"/>

                <span className="hidden text-sm lg:inline">
                  Mon panier
                </span>

                <>
                  {cartCount >
            0 && (<span key={cartCount} className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-zinc-950 px-1 text-[10px] font-black">
                      {cartCount >
                99
                ? "99+"
                : cartCount}
                    </span>)}
                </>
              </Link>
            </div>
          </div>

          {/* =================================================
            RECHERCHE MOBILE
        ================================================= */}

          <>
            {mobileSearchOpen && (<div className="relative z-[80] pb-3 lg:hidden">
                <form action="/articles" method="get" onSubmit={() => setMobileSearchOpen(false)} className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-zinc-400"/>

                  <input ref={mobileSearchInputReference} type="search" name="search" value={mobileSearchQuery} onChange={(event) => setMobileSearchQuery(event.target
                .value)} placeholder="Rechercher un produit..." autoComplete="off" autoCorrect="off" spellCheck={false} className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-12 text-[15px] font-medium text-zinc-950 outline-none transition placeholder:font-normal placeholder:text-zinc-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"/>

                  {mobileSearchQuery && (<button type="button" onClick={() => {
                    setMobileSearchQuery("");
                    setSearchSuggestions([]);
                    mobileSearchInputReference.current?.focus();
                }} aria-label="Effacer la recherche" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-200/80 text-zinc-500 transition active:scale-95">
                      <X className="h-4 w-4"/>
                    </button>)}
                </form>

                {/* =================================================
                SUGGESTIONS MOBILE
            ================================================= */}

                <>
                  {mobileSearchQuery.trim() && (<div className="absolute inset-x-0 top-[calc(100%-5px)] z-[100] max-h-[min(68vh,540px)] overflow-y-auto overscroll-contain rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_70px_rgba(24,24,27,0.20)]">
                      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
                            Suggestions
                          </p>

                          <p className="mt-0.5 text-[11px] text-zinc-400">
                            Produits correspondant à votre recherche
                          </p>
                        </div>

                        {searchSuggestionsLoading && (<LoaderCircle className="h-5 w-5 animate-spin text-orange-500"/>)}
                      </div>

                      {searchSuggestionsLoading &&
                    searchSuggestions.length ===
                        0 ? (<div className="space-y-2 p-3">
                          {Array.from({
                        length: 4,
                    }).map((_, index) => (<div key={index} className="flex animate-pulse items-center gap-3 rounded-xl p-2">
                                <div className="h-14 w-20 shrink-0 rounded-xl bg-zinc-200"/>

                                <div className="min-w-0 flex-1">
                                  <div className="h-3.5 w-4/5 rounded bg-zinc-200"/>

                                  <div className="mt-2 h-3 w-2/5 rounded bg-zinc-100"/>
                                </div>
                              </div>))}
                        </div>) : searchSuggestionsError ? (<div className="px-5 py-7 text-center">
                          <p className="text-sm font-bold text-zinc-700">
                            Recherche momentanément indisponible
                          </p>

                          <p className="mt-1 text-xs leading-5 text-zinc-400">
                            Réessayez dans quelques instants.
                          </p>
                        </div>) : searchSuggestions.length >
                    0 ? (<div className="p-2">
                          {searchSuggestions.map((article) => {
                        const image = article.image ||
                            article.images?.find(Boolean) ||
                            "";
                        return (<Link key={article.id} href={`/article?slug=${encodeURIComponent(article.slug)}`} onClick={() => setMobileSearchOpen(false)} className="group flex items-center gap-3 rounded-xl p-2.5 transition active:bg-orange-50">
                                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                                    {image ? (<img src={image} alt={article.designation} loading="lazy" className="h-full w-full object-cover"/>) : (<div className="flex h-full w-full items-center justify-center">
                                        <Package className="h-6 w-6 text-zinc-300"/>
                                      </div>)}

                                    {article.old_price &&
                                Number(article.old_price) >
                                    Number(article.price) && (<span className="absolute left-1 top-1 rounded-md bg-orange-500 px-1.5 py-0.5 text-[8px] font-black text-white">
                                          Promo
                                        </span>)}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <strong className="line-clamp-2 text-[13px] font-black leading-[18px] text-zinc-900">
                                      {article.designation}
                                    </strong>

                                    <div className="mt-1 flex min-w-0 items-center gap-2">
                                      <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                        {article.category}
                                      </span>

                                      {article.brand && (<>
                                          <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-300"/>

                                          <span className="truncate text-[10px] text-zinc-400">
                                            {article.brand}
                                          </span>
                                        </>)}
                                    </div>

                                    <div className="mt-1.5 flex items-baseline gap-1.5">
                                      <span className="text-sm font-black text-zinc-950">
                                        {formatSearchPrice(Number(article.price))}{" "}
                                        DA
                                      </span>

                                      {article.old_price &&
                                Number(article.old_price) >
                                    Number(article.price) && (<span className="text-[10px] text-zinc-400 line-through">
                                            {formatSearchPrice(Number(article.old_price))}{" "}
                                            DA
                                          </span>)}
                                    </div>
                                  </div>

                                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300"/>
                                </Link>);
                    })}

                          <Link href={`/articles?search=${encodeURIComponent(mobileSearchQuery.trim())}`} onClick={() => setMobileSearchOpen(false)} className="mt-1 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-50 px-4 text-xs font-black text-orange-600 transition active:bg-orange-100">
                            <Search className="h-4 w-4"/>

                            Voir tous les résultats
                          </Link>
                        </div>) : (<div className="px-5 py-8 text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                            <Search className="h-5 w-5"/>
                          </div>

                          <p className="mt-3 text-sm font-black text-zinc-800">
                            Aucun produit trouvé
                          </p>

                          <p className="mt-1 text-xs leading-5 text-zinc-400">
                            Essayez un autre mot ou une marque.
                          </p>
                        </div>)}
                    </div>)}
                </>
              </div>)}
          </>

          {/* =================================================
            NAVIGATION DESKTOP
        ================================================= */}

          <div className="hidden items-center justify-between border-t border-zinc-100 py-2 lg:flex">

            {/* CATÉGORIES */}

            <div ref={categoriesReference} className="relative">
              <button type="button" onClick={() => setCategoriesOpen((open) => !open)} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${categoryActive
            ? "bg-orange-500 text-white"
            : "bg-zinc-950 text-white hover:bg-orange-500"}`}>
                <Boxes className="h-4 w-4"/>

                Toutes les catégories

                <span>
                  <ChevronDown className="h-4 w-4"/>
                </span>
              </button>

              <>
                {categoriesOpen && (<div className="absolute left-0 top-[calc(100%+12px)] w-[610px] overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_24px_70px_rgba(24,24,27,0.16)]">
                    <div className="mb-3 flex items-center justify-between px-2">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
                          Choisir un univers
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          Trouvez rapidement les produits adaptés à votre projet.
                        </p>
                      </div>

                      <Link href="/articles" className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-black text-zinc-700 transition hover:bg-orange-500 hover:text-white">
                        Tout voir
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category, index) => {
                const Icon = category.icon;
                const active = isActive(category.href);
                return (<div key={category.id}>
                              <Link href={category.href} className={`group flex items-center gap-3 rounded-2xl border p-3 transition ${active
                        ? "border-orange-300 bg-orange-50"
                        : "border-transparent hover:border-orange-200 hover:bg-orange-50/50"}`}>
                                <span className={`relative flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl ${active
                        ? "bg-orange-500 text-white"
                        : category.className}`}>
                                  {category.image ? (<img src={category.image} alt={category.label} className="h-full w-full object-cover"/>) : (<Icon className="h-5 w-5"/>)}
                                </span>

                                <div className="min-w-0">
                                  <strong className={`block truncate text-sm ${active
                        ? "text-orange-600"
                        : "text-zinc-800 group-hover:text-orange-600"}`}>
                                    {category.label}
                                  </strong>

                                  <span className="mt-0.5 block text-[10px] font-semibold text-zinc-400">
                                    {category.articleCount}{" "}
                                    article
                                    {category.articleCount >
                        1
                        ? "s"
                        : ""}
                                  </span>
                                </div>

                                {active && (<span className="ml-auto h-2 w-2 rounded-full bg-orange-500"/>)}
                              </Link>
                            </div>);
            })}
                    </div>
                  </div>)}
              </>
            </div>

            {/* NAVIGATION */}

            <nav className="flex items-center gap-1">
              {mainNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (<Link key={item.label} href={item.href} className={`group relative flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${active
                    ? "bg-orange-50 text-orange-600"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"}`}>
                      <Icon className={`h-4 w-4 ${active
                    ? "text-orange-500"
                    : "text-zinc-400"}`}/>

                      {item.label}

                      {active && (<span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-orange-500"/>)}
                    </Link>);
        })}
            </nav>
          </div>
        </div>

        {/* ===================================================
            MENU MOBILE PLEIN ÉCRAN
        =================================================== */}

        <>
          {mobileOpen && (<div className="fixed inset-x-0 bottom-[76px] top-0 z-[110] overflow-y-auto overscroll-contain bg-white lg:hidden">
              <div className="min-h-full px-4 pb-8 pt-3 sm:px-6">

                {/* HEADER MENU */}

                <div className="sticky top-0 z-20 -mx-4 mb-3 flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-3 sm:-mx-6 sm:px-6">
                  <Link href="/" className="flex min-w-0 items-center gap-2.5">
                    <img src="/images/logo-bricomenage-320.webp" alt="BricoMénage" width={42} height={42} className="h-10 w-10 rounded-xl border border-zinc-200 bg-white object-contain p-0.5"/>

                    <div className="min-w-0">
                      <strong className="block truncate text-base font-black text-zinc-950">
                        Brico
                        <span className="text-orange-500">
                          Ménage
                        </span>
                      </strong>

                      <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                        Menu principal
                      </span>
                    </div>
                  </Link>

                  <button type="button" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} className="touch-manipulation flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 active:scale-95">
                    <X className="h-5 w-5"/>
                  </button>
                </div>

                {/* NAVIGATION MOBILE */}

                <div className="space-y-2">
                  {mainNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (<div key={item.label}>
                          <Link href={item.href} className={`touch-manipulation flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-semibold transition-colors duration-100 ${active
                        ? "bg-orange-50 text-orange-600"
                        : "bg-white text-zinc-700 hover:bg-zinc-50"}`}>
                            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active
                        ? "bg-orange-500 text-white"
                        : "bg-zinc-100 text-zinc-500"}`}>
                              <Icon className="h-5 w-5"/>
                            </span>

                            {item.label}

                            <ChevronRight className="ml-auto h-4 w-4"/>
                          </Link>
                        </div>);
            })}
                </div>

                {/* CATÉGORIES MOBILE */}

                <button type="button" onClick={() => setMobileCategoriesOpen((open) => !open)} className="touch-manipulation mt-3 flex w-full items-center gap-3 rounded-2xl bg-zinc-950 px-4 py-4 text-sm font-black text-white active:scale-[0.99]">
                  <Boxes className="h-5 w-5"/>

                  Toutes les catégories

                  <span className={`ml-auto transition-transform duration-100 ${mobileCategoriesOpen ? "rotate-180" : ""}`}>
                    <ChevronDown className="h-4 w-4"/>
                  </span>
                </button>

                <>
                  {mobileCategoriesOpen && (<div className="overflow-hidden">
                      <div className="mt-2 grid gap-2 rounded-2xl bg-zinc-50 p-2">
                        {categories.map((category) => {
                    const Icon = category.icon;
                    const active = isActive(category.href);
                    return (<Link key={category.id} href={category.href} className={`touch-manipulation flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold shadow-sm transition-colors duration-100 ${active
                            ? "border-orange-300 bg-orange-50 text-orange-600"
                            : "border-transparent bg-white text-zinc-700"}`}>
                                <span className={`flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl ${active
                            ? "bg-orange-500 text-white"
                            : category.className}`}>
                                  {category.image ? (<img src={category.image} alt={category.label} className="h-full w-full object-cover"/>) : (<Icon className="h-5 w-5"/>)}
                                </span>

                                <span className="min-w-0 flex-1">
                                  <strong className="block truncate">
                                    {category.label}
                                  </strong>

                                  <small className="mt-0.5 block text-[10px] text-zinc-400">
                                    {category.articleCount}{" "}
                                    article
                                    {category.articleCount >
                            1
                            ? "s"
                            : ""}
                                  </small>
                                </span>

                                <ChevronRight className="ml-auto h-4 w-4"/>
                              </Link>);
                })}
                      </div>
                    </div>)}
                </>
              </div>
            </div>)}
        </>
      </header>

      {/* =====================================================
            NAVIGATION MOBILE FIXE EN BAS
        ===================================================== */}

      <nav className="
          fixed bottom-0 left-0 right-0 z-[120]
          border-t border-zinc-200/90
          bg-white
          shadow-[0_-6px_22px_rgba(0,0,0,0.07)]
          lg:hidden
        ">
        <div className="
            mx-auto grid
            h-[76px]
            max-w-lg
            grid-cols-5
            items-end
            px-2
            pb-[env(safe-area-inset-bottom)]
          ">
          {/* =================================================
            ACCUEIL
        ================================================= */}

          <Link href="/" onClick={() => setMobileOpen(false)} className={`touch-manipulation relative flex h-[72px] flex-col items-center justify-center gap-1 ${isActive("/")
            ? "text-orange-500"
            : "text-zinc-400"}`}>
            {isActive("/") && (<span className="absolute top-1 h-1 w-6 rounded-full bg-orange-500"/>)}

            <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${isActive("/")
            ? "bg-orange-50"
            : ""}`}>
              <Home className={`h-[21px] w-[21px] ${isActive("/")
            ? "stroke-[2.6]"
            : ""}`}/>
            </span>

            <span className="text-[10px] font-bold">
              Accueil
            </span>
          </Link>

          {/* =================================================
            CATALOGUE
        ================================================= */}

          <Link href="/articles" onClick={() => setMobileOpen(false)} className={`touch-manipulation relative flex h-[72px] flex-col items-center justify-center gap-1 ${catalogueBottomActive
            ? "text-orange-500"
            : "text-zinc-400"}`}>
            {catalogueBottomActive && (<span className="absolute top-1 h-1 w-6 rounded-full bg-orange-500"/>)}

            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${catalogueBottomActive
            ? "bg-orange-50"
            : ""}`}>
              <Package className="h-[21px] w-[21px]"/>
            </span>

            <span className="text-[10px] font-bold">
              Catalogue
            </span>
          </Link>

          {/* =================================================
            PANIER CENTRAL
        ================================================= */}

          <div className="relative flex h-[76px] items-start justify-center">
            <Link href="/panier" onClick={() => setMobileOpen(false)} aria-label="Mon panier" className="
                touch-manipulation
                relative
                -mt-5
                flex
                h-[62px]
                w-[62px]
                items-center
                justify-center
                rounded-full
                border-[5px]
                border-white
                bg-orange-500
                text-white
                shadow-[0_10px_30px_rgba(249,115,22,0.42)]
                transition
                active:scale-90
              ">
              <ShoppingBag className="h-6 w-6"/>

              <>
                {cartCount >
            0 && (<span key={cartCount} className="
                      absolute
                      -right-1
                      -top-1
                      flex
                      h-5
                      min-w-5
                      items-center
                      justify-center
                      rounded-full
                      border-2
                      border-white
                      bg-zinc-950
                      px-1
                      text-[9px]
                      font-black
                      text-white
                    ">
                    {cartCount >
                99
                ? "99+"
                : cartCount}
                  </span>)}
              </>
            </Link>

            <span className="absolute bottom-1 text-[10px] font-black text-orange-500">
              Panier
            </span>
          </div>

          {/* =================================================
            SUIVI
        ================================================= */}

          <Link href="/suivi-commande" onClick={() => setMobileOpen(false)} className={`touch-manipulation relative flex h-[72px] flex-col items-center justify-center gap-1 ${isActive("/suivi-commande")
            ? "text-orange-500"
            : "text-zinc-400"}`}>
            {isActive("/suivi-commande") && (<span className="absolute top-1 h-1 w-6 rounded-full bg-orange-500"/>)}

            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isActive("/suivi-commande")
            ? "bg-orange-50"
            : ""}`}>
              <MapPin className="h-[21px] w-[21px]"/>
            </span>

            <span className="text-[10px] font-bold">
              Suivi
            </span>
          </Link>

          {/* =================================================
            MENU
        ================================================= */}

          <button type="button" aria-label={mobileOpen
            ? "Fermer le menu"
            : "Ouvrir le menu"} aria-expanded={mobileOpen} onClick={() => {
            setMobileSearchOpen(false);
            setDesktopSearchOpen(false);
            setMobileOpen((open) => !open);
        }} className={`touch-manipulation relative flex h-[72px] flex-col items-center justify-center gap-1 ${mobileOpen
            ? "text-orange-500"
            : "text-zinc-400"}`}>
            {mobileOpen && (<span className="absolute top-1 h-1 w-6 rounded-full bg-orange-500"/>)}

            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${mobileOpen
            ? "bg-orange-50"
            : ""}`}>
              {mobileOpen ? (<X className="h-[21px] w-[21px]"/>) : (<Menu className="h-[21px] w-[21px]"/>)}
            </span>

            <span className="text-[10px] font-bold">
              Menu
            </span>
          </button>
        </div>
      </nav>
    </>);
}
