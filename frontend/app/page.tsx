"use client";

import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useInView,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Brush,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Droplets,
  Hammer,
  Leaf,
  PackageCheck,
  PaintRoller,
  ShieldCheck,
  Sofa,
  Sparkles,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import {
  type ElementType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import ProductCard, {
  type Product,
} from "@/components/ProductCard";
import HomeSeoJsonLd from "@/components/HomeSeoJsonLd";

import {
  catalogApi,
  type CatalogArticle,
  type CatalogCategory,
  type CatalogPack,
} from "@/lib/catalog";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image?: string | null;
  articleCount: number;
  icon: ElementType;
  href: string;
  iconClassName: string;
  iconBackground: string;
}

interface Advantage {
  title: string;
  description: string;
  icon: ElementType;
  iconClassName: string;
  iconBackground: string;
}

interface SectionWrapperProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

interface CarouselButtonProps {
  direction: "left" | "right";
  onClick: () => void;
}

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  label: string;
}

function getCategoryVisual(
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
      iconClassName:
        "text-emerald-600",
      iconBackground:
        "bg-emerald-50",
    };
  }

  if (
    normalized.includes("mobil")
  ) {
    return {
      icon: Sofa,
      iconClassName:
        "text-orange-600",
      iconBackground:
        "bg-orange-50",
    };
  }

  if (
    normalized.includes("peint")
  ) {
    return {
      icon: PaintRoller,
      iconClassName:
        "text-rose-600",
      iconBackground:
        "bg-rose-50",
    };
  }

  if (
    normalized.includes("elect")
  ) {
    return {
      icon: Zap,
      iconClassName:
        "text-yellow-600",
      iconBackground:
        "bg-yellow-50",
    };
  }

  if (
    normalized.includes("plomb")
  ) {
    return {
      icon: Droplets,
      iconClassName:
        "text-cyan-600",
      iconBackground:
        "bg-cyan-50",
    };
  }

  return {
    icon: Hammer,
    iconClassName:
      "text-blue-600",
    iconBackground:
      "bg-blue-50",
  };
}

const advantages: Advantage[] = [
  {
    title: "Livraison express",
    description: "Livraison rapide dans les 58 wilayas d’Algérie",
    icon: Truck,
    iconClassName: "text-orange-600",
    iconBackground: "bg-orange-50",
  },
  {
    title: "Qualité garantie",
    description: "Des produits sélectionnés pour leur fiabilité",
    icon: BadgeCheck,
    iconClassName: "text-emerald-600",
    iconBackground: "bg-emerald-50",
  },
  {
    title: "Paiement sécurisé",
    description: "Paiement à la livraison 100 % sécurisé",
    icon: ShieldCheck,
    iconClassName: "text-blue-600",
    iconBackground: "bg-blue-50",
  },
  {
    title: "Suivi en temps réel",
    description: "Suivez votre commande étape par étape",
    icon: PackageCheck,
    iconClassName: "text-violet-600",
    iconBackground: "bg-violet-50",
  },
];

const heroImages = [
  {
    src: "/images/bg1.webp",
    mobileSrc: "/images/bg1-mobile.webp",
    alt: "Atelier de bricolage avec perceuse et outils",
    eyebrow: "Outillage professionnel",
    title: "Construisez vos projets",
    highlightedTitle: "avec les bons outils.",
    description:
      "Perceuses, marteaux, coffrets et accessoires sélectionnés pour travailler efficacement.",
    href: "/articles/?categorie=Outillage",
    buttonLabel: "Découvrir l’outillage",
  },
  {
    src: "/images/bg2.webp",
    mobileSrc: "/images/bg2-mobile.webp",
    alt: "Matériel de jardinage et aménagement extérieur",
    eyebrow: "Maison et jardin",
    title: "Aménagez vos espaces",
    highlightedTitle: "avec style et confort.",
    description:
      "Mobilier, parasols et équipements pratiques pour profiter pleinement de vos extérieurs.",
    href: "/articles/?categorie=Jardin",
    buttonLabel: "Voir l’univers jardin",
  },
  {
    src: "/images/bg4.webp",
    mobileSrc: "/images/bg4-mobile.webp",
    alt: "Outils et équipements professionnels de bricolage",
    eyebrow: "Offres BricoMénage",
    title: "Équipez-vous mieux",
    highlightedTitle: "au meilleur prix.",
    description:
      "Découvrez nos promotions, nos packs complets et nos produits disponibles partout en Algérie.",
    href: "/articles/?promotion=1",
    buttonLabel: "Profiter des promotions",
  },
] as const;

const HERO_AUTOPLAY_DELAY = 8000;

const stats = [
  {
    icon: TrendingUp,
    label: "Articles",
    value: "+3 000",
  },
  {
    icon: Truck,
    label: "Wilayas",
    value: "58",
  },
  {
    icon: Clock3,
    label: "Commandes",
    value: "7/7",
  },
];

const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
};

function SectionWrapper({
  children,
  delay = 0,
  className = "",
}: SectionWrapperProps) {
  const reference = useRef<HTMLDivElement>(null);

  const visible = useInView(reference, {
    once: true,
    amount: 0.12,
  });

  return (
    <motion.div
      ref={reference}
      initial={{
        opacity: 0,
        y: 36,
      }}
      animate={
        visible
          ? {
              opacity: 1,
              y: 0,
            }
          : {
              opacity: 0,
              y: 36,
            }
      }
      transition={{
        duration: 0.6,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CarouselButton({
  direction,
  onClick,
}: CarouselButtonProps) {
  const Icon =
    direction === "left"
      ? ChevronLeft
      : ChevronRight;

  return (
    <motion.button
      whileHover={{
        scale: 1.06,
        x: direction === "left" ? -2 : 2,
      }}
      whileTap={{
        scale: 0.94,
      }}
      type="button"
      onClick={onClick}
      aria-label={
        direction === "left"
          ? "Articles précédents"
          : "Articles suivants"
      }
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-400 bg-orange-500 text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
    >
      <Icon className="h-5 w-5" />
    </motion.button>
  );
}

function ProductCarousel({
  products,
}: {
  products: Product[];
}) {
  const [
    currentProductIndex,
    setCurrentProductIndex,
  ] = useState(0);

  const [
    carouselPaused,
    setCarouselPaused,
  ] = useState(false);

  const [
    direction,
    setDirection,
  ] = useState<1 | -1>(1);

  const [
    visibleProducts,
    setVisibleProducts,
  ] = useState(4);

  useEffect(() => {
    function updateVisibleProducts() {
      const width = window.innerWidth;

      if (width < 640) {
        setVisibleProducts(1);
        return;
      }

      if (width < 1024) {
        setVisibleProducts(2);
        return;
      }

      if (width < 1280) {
        setVisibleProducts(3);
        return;
      }

      setVisibleProducts(4);
    }

    updateVisibleProducts();
    window.addEventListener(
      "resize",
      updateVisibleProducts,
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateVisibleProducts,
      );
    };
  }, []);

  useEffect(() => {
    if (
      carouselPaused ||
      products.length <= visibleProducts
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setDirection(1);

      setCurrentProductIndex(
        (current) =>
          (current + 1) % products.length,
      );
    }, 6000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    carouselPaused,
    products.length,
    visibleProducts,
  ]);

  function showPreviousProduct() {
    if (products.length === 0) {
      return;
    }

    setDirection(-1);

    setCurrentProductIndex(
      (current) =>
        current === 0
          ? products.length - 1
          : current - 1,
    );
  }

  function showNextProduct() {
    if (products.length === 0) {
      return;
    }

    setDirection(1);

    setCurrentProductIndex(
      (current) =>
        (current + 1) % products.length,
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
        Aucun article disponible.
      </div>
    );
  }

  const orderedProducts = Array.from(
    {
      length: Math.min(
        visibleProducts,
        products.length,
      ),
    },
    (_, offset) =>
      products[
        (currentProductIndex + offset) %
          products.length
      ],
  );

  const slideVariants: Variants = {
    enter: (
      customDirection: number,
    ) => ({
      x:
        customDirection > 0
          ? 120
          : -120,
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (
      customDirection: number,
    ) => ({
      x:
        customDirection > 0
          ? -120
          : 120,
      opacity: 0,
      scale: 0.96,
    }),
  };

  return (
    <div
      className="relative"
      onMouseEnter={() =>
        setCarouselPaused(true)
      }
      onMouseLeave={() =>
        setCarouselPaused(false)
      }
    >
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 sm:text-sm">
          <span className="rounded-full bg-white px-3 py-1 text-orange-600 shadow-sm">
            Glissez pour découvrir
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <CarouselButton
            direction="left"
            onClick={showPreviousProduct}
          />

          <span className="min-w-16 text-center text-[11px] font-black text-zinc-500 sm:min-w-20 sm:text-xs">
            {currentProductIndex + 1}
            {" / "}
            {products.length}
          </span>

          <CarouselButton
            direction="right"
            onClick={showNextProduct}
          />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/80 p-2 shadow-sm sm:p-3">
        <AnimatePresence
          mode="popLayout"
          initial={false}
          custom={direction}
        >
          <motion.div
            key={currentProductIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: {
                type: "spring",
                stiffness: 150,
                damping: 26,
              },
              opacity: {
                duration: 0.55,
              },
              scale: {
                duration: 0.6,
              },
            }}
            drag="x"
            dragConstraints={{
              left: 0,
              right: 0,
            }}
            dragElastic={0.18}
            onDragEnd={(
              _event,
              info,
            ) => {
              if (
                info.offset.x < -60 ||
                info.velocity.x < -450
              ) {
                showNextProduct();
                return;
              }

              if (
                info.offset.x > 60 ||
                info.velocity.x > 450
              ) {
                showPreviousProduct();
              }
            }}
            className="grid cursor-grab gap-4 active:cursor-grabbing sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4"
          >
            {orderedProducts.map(
              (product, index) => (
                <motion.div
                  key={`${currentProductIndex}-${product.id}`}
                  initial={{
                    opacity: 0,
                    y: 24,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.65,
                    delay: index * 0.07,
                  }}
                  whileHover={{
                    y: -7,
                    transition: {
                      duration: 0.2,
                    },
                  }}
                  className="h-full"
                >
                  <ProductCard p={product} />
                </motion.div>
              ),
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-7 flex items-center justify-center gap-2">
        {products.map(
          (product, index) => {
            const active =
              currentProductIndex === index;

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  setDirection(
                    index >
                      currentProductIndex
                      ? 1
                      : -1,
                  );

                  setCurrentProductIndex(
                    index,
                  );
                }}
                aria-label={`Afficher l’article ${
                  index + 1
                }`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  active
                    ? "w-9 bg-orange-500"
                    : "w-2.5 bg-zinc-300 hover:bg-orange-300"
                }`}
              />
            );
          },
        )}
      </div>
    </div>
  );
}


function CategoryCarousel({
  categories,
}: {
  categories: Category[];
}) {
  const [activeIndex, setActiveIndex] =
    useState(0);
  const [paused, setPaused] =
    useState(false);
  const [direction, setDirection] =
    useState<1 | -1>(1);

  useEffect(() => {
    if (
      paused ||
      categories.length <= 1
    ) {
      return;
    }

    const intervalId =
      window.setInterval(() => {
        setDirection(1);
        setActiveIndex((current) =>
          (current + 1) %
          categories.length,
        );
      }, 5200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [paused, categories.length]);

  useEffect(() => {
    if (
      activeIndex >= categories.length &&
      categories.length > 0
    ) {
      setActiveIndex(0);
    }
  }, [activeIndex, categories.length]);

  if (categories.length === 0) {
    return null;
  }

  function previousCategory() {
    setDirection(-1);
    setActiveIndex((current) =>
      current === 0
        ? categories.length - 1
        : current - 1,
    );
  }

  function nextCategory() {
    setDirection(1);
    setActiveIndex((current) =>
      (current + 1) %
      categories.length,
    );
  }

  function selectCategory(index: number) {
    if (index === activeIndex) {
      return;
    }

    setDirection(
      index > activeIndex ? 1 : -1,
    );
    setActiveIndex(index);
  }

  const activeCategory =
    categories[activeIndex];
  const ActiveIcon = activeCategory.icon;

  const previousIndex =
    activeIndex === 0
      ? categories.length - 1
      : activeIndex - 1;

  const nextIndex =
    (activeIndex + 1) %
    categories.length;

  const previousCategoryItem =
    categories[previousIndex];

  const nextCategoryItem =
    categories[nextIndex];

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Sélecteur rapide des catégories */}
      <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
        <div className="mx-auto flex w-max items-center gap-2 sm:w-auto sm:flex-wrap sm:justify-center">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const active = index === activeIndex;

            return (
              <motion.button
                key={category.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() =>
                  selectCategory(index)
                }
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2.5 text-xs font-black transition-all duration-300 sm:px-4 sm:text-sm ${
                  active
                    ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "border-orange-200 bg-orange-50 text-orange-600 hover:border-orange-400 hover:bg-orange-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* halo décoratif */}
        <motion.div
          aria-hidden="true"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.28, 0.5, 0.28],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300/20 blur-3xl"
        />

        <div className="relative flex min-h-[430px] items-center justify-center sm:min-h-[540px] lg:min-h-[590px]">
          {/* aperçu gauche desktop */}
          {categories.length > 1 && (
            <motion.button
              type="button"
              onClick={previousCategory}
              whileHover={{
                x: 8,
                scale: 1.02,
                opacity: 0.9,
              }}
              aria-label={`Afficher ${previousCategoryItem.name}`}
              className="absolute left-0 z-10 hidden w-[34%] max-w-[390px] -translate-x-[45%] overflow-hidden rounded-[34px] border border-white/70 bg-white text-left opacity-55 shadow-[0_24px_70px_rgba(24,24,27,0.16)] lg:block"
            >
              <div className="relative h-[360px]">
                {previousCategoryItem.image ? (
                  <img
                    src={previousCategoryItem.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-100 via-white to-orange-50">
                    {(() => {
                      const Icon =
                        previousCategoryItem.icon;
                      return (
                        <Icon className={`h-20 w-20 ${previousCategoryItem.iconClassName}`} />
                      );
                    })()}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                    Précédent
                  </span>
                  <h3 className="mt-2 text-3xl font-black">
                    {previousCategoryItem.name}
                  </h3>
                </div>
              </div>
            </motion.button>
          )}

          <AnimatePresence
            initial={false}
            mode="wait"
            custom={direction}
          >
            <motion.div
              key={activeCategory.id}
              custom={direction}
              initial={{
                opacity: 0,
                x: direction > 0 ? 90 : -90,
                y: 18,
                scale: 0.94,
                rotateY:
                  direction > 0 ? 5 : -5,
                filter: "blur(7px)",
              }}
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                rotateY: 0,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                x: direction > 0 ? -90 : 90,
                y: -12,
                scale: 0.95,
                rotateY:
                  direction > 0 ? -4 : 4,
                filter: "blur(6px)",
              }}
              transition={{
                duration: 0.62,
                ease: [0.22, 1, 0.36, 1],
              }}
              drag="x"
              dragConstraints={{
                left: 0,
                right: 0,
              }}
              dragElastic={0.15}
              onDragStart={() =>
                setPaused(true)
              }
              onDragEnd={(_event, info) => {
                setPaused(false);

                if (
                  info.offset.x < -55 ||
                  info.velocity.x < -420
                ) {
                  nextCategory();
                  return;
                }

                if (
                  info.offset.x > 55 ||
                  info.velocity.x > 420
                ) {
                  previousCategory();
                }
              }}
              className="relative z-20 w-full max-w-[720px] cursor-grab active:cursor-grabbing"
            >
              <Link
                href={activeCategory.href}
                className="group relative block overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_30px_100px_rgba(24,24,27,0.20)] sm:rounded-[38px]"
              >
                {/* image */}
                <div className="relative h-[300px] overflow-hidden sm:h-[420px] lg:h-[465px]">
                  {activeCategory.image ? (
                    <motion.img
                      key={activeCategory.image}
                      src={activeCategory.image}
                      alt={activeCategory.name}
                      initial={{ scale: 1.08 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: 1.1,
                        ease: "easeOut",
                      }}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 via-white to-orange-50">
                      <motion.span
                        animate={{
                          y: [0, -8, 0],
                          rotate: [0, 2, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className={`flex h-28 w-28 items-center justify-center rounded-[34px] sm:h-36 sm:w-36 ${activeCategory.iconBackground} ${activeCategory.iconClassName}`}
                      >
                        <ActiveIcon className="h-14 w-14 sm:h-20 sm:w-20" />
                      </motion.span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

                  {/* badge compteur */}
                  <motion.span
                    initial={{
                      opacity: 0,
                      y: -12,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: 0.18,
                    }}
                    className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/35 px-3 py-2 text-[11px] font-black text-white backdrop-blur-md sm:right-6 sm:top-6 sm:px-4 sm:text-xs"
                  >
                    {activeCategory.articleCount}{" "}
                    {activeCategory.articleCount > 1
                      ? "articles"
                      : "article"}
                  </motion.span>

                  {/* contenu */}
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-9">
                    <motion.span
                      initial={{
                        scale: 0.8,
                        opacity: 0,
                      }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                      }}
                      transition={{
                        delay: 0.12,
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 shadow-xl shadow-orange-950/30 sm:h-14 sm:w-14"
                    >
                      <ActiveIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </motion.span>

                    <motion.h3
                      initial={{
                        opacity: 0,
                        y: 24,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: 0.12,
                        duration: 0.5,
                      }}
                      className="mt-4 text-3xl font-black tracking-tight sm:mt-5 sm:text-5xl"
                    >
                      {activeCategory.name}
                    </motion.h3>

                    <motion.p
                      initial={{
                        opacity: 0,
                        y: 18,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: 0.2,
                        duration: 0.5,
                      }}
                      className="mt-2 max-w-xl line-clamp-2 text-sm leading-6 text-zinc-200 sm:mt-3 sm:text-base sm:leading-7"
                    >
                      {activeCategory.description}
                    </motion.p>
                  </div>
                </div>

                {/* barre action */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-9 sm:py-5">
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                      Explorer l’univers
                    </span>
                    <span className="mt-1 block text-sm font-black text-orange-600 sm:text-base">
                      Découvrir {activeCategory.name}
                    </span>
                  </div>

                  <motion.span
                    whileHover={{
                      x: 4,
                      scale: 1.05,
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-colors group-hover:bg-orange-600 sm:h-12 sm:w-12"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.span>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* aperçu droite desktop */}
          {categories.length > 1 && (
            <motion.button
              type="button"
              onClick={nextCategory}
              whileHover={{
                x: -8,
                scale: 1.02,
                opacity: 0.9,
              }}
              aria-label={`Afficher ${nextCategoryItem.name}`}
              className="absolute right-0 z-10 hidden w-[34%] max-w-[390px] translate-x-[45%] overflow-hidden rounded-[34px] border border-white/70 bg-white text-left opacity-55 shadow-[0_24px_70px_rgba(24,24,27,0.16)] lg:block"
            >
              <div className="relative h-[360px]">
                {nextCategoryItem.image ? (
                  <img
                    src={nextCategoryItem.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-100 via-white to-orange-50">
                    {(() => {
                      const Icon =
                        nextCategoryItem.icon;
                      return (
                        <Icon className={`h-20 w-20 ${nextCategoryItem.iconClassName}`} />
                      );
                    })()}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                    Suivant
                  </span>
                  <h3 className="mt-2 text-3xl font-black">
                    {nextCategoryItem.name}
                  </h3>
                </div>
              </div>
            </motion.button>
          )}

          {/* Flèches - très lisibles mobile/tablette */}
          {categories.length > 1 && (
            <>
              <motion.button
                type="button"
                whileTap={{
                  scale: 0.9,
                }}
                onClick={previousCategory}
                aria-label="Catégorie précédente"
                className="absolute left-2 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-orange-400 bg-orange-500 text-white shadow-xl shadow-orange-500/20 backdrop-blur transition hover:bg-orange-600 sm:left-4 sm:h-12 sm:w-12 lg:left-[8%]"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.button>

              <motion.button
                type="button"
                whileTap={{
                  scale: 0.9,
                }}
                onClick={nextCategory}
                aria-label="Catégorie suivante"
                className="absolute right-2 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-orange-400 bg-orange-500 text-white shadow-xl shadow-orange-500/20 backdrop-blur transition hover:bg-orange-600 sm:right-4 sm:h-12 sm:w-12 lg:right-[8%]"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-center gap-2 sm:mt-6">
        {categories.map((category, index) => (
          <button
            key={category.id}
            type="button"
            onClick={() =>
              selectCategory(index)
            }
            aria-label={`Afficher ${category.name}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? "w-10 bg-orange-500"
                : "w-2.5 bg-zinc-300 hover:bg-orange-300"
            }`}
          />
        ))}
      </div>

      {/* Astuce swipe mobile */}
      {categories.length > 1 && (
        <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400 sm:hidden">
          Glissez à gauche ou à droite
        </p>
      )}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  label,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div className="max-w-2xl">
        <span className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-500 sm:text-sm">
          {eyebrow}
        </span>

        <h2 className="mt-3 text-[1.9rem] font-black leading-tight tracking-tight sm:mt-4 sm:text-4xl lg:text-5xl">
          {title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-zinc-500 sm:mt-4 sm:text-base sm:leading-7">
          {description}
        </p>
      </div>

      <Link
        href={href}
        className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-orange-500 bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 sm:min-h-0 sm:w-fit"
      >
        {label}

        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}


type HomePack = CatalogPack & {
  images?: string[];
  article_images?: string[];
  articles?: Array<{
    id?: number;
    slug?: string;
    designation?: string;
    image?: string | null;
    images?: string[];
    quantity?: number;
  }>;
};

function formatPackPrice(value: number) {
  return new Intl.NumberFormat("fr-DZ").format(
    Number(value || 0),
  );
}

function LatestPackShowcase({
  pack,
  loading,
  error,
}: {
  pack: HomePack | null;
  loading: boolean;
  error: string;
}) {
  const [
    activePackImageIndex,
    setActivePackImageIndex,
  ] = useState(0);

  useEffect(() => {
    setActivePackImageIndex(0);
  }, [pack?.id]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-[30px] border border-zinc-800 bg-zinc-950 px-5 py-14 text-white shadow-2xl sm:rounded-[42px] sm:px-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="relative flex min-h-[320px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />
            <p className="mt-5 text-sm font-black text-zinc-300">
              Chargement du dernier pack...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="relative overflow-hidden rounded-[30px] border border-zinc-200 bg-zinc-50 px-6 py-14 text-center sm:rounded-[42px]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <Award className="h-8 w-8" />
        </div>

        <h3 className="mt-5 text-2xl font-black text-zinc-950">
          Aucun pack disponible.
        </h3>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-zinc-500">
          {error ||
            "Le dernier pack ajouté depuis l’administration apparaîtra automatiquement ici."}
        </p>

        <Link
          href="/articles/?pack=1"
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
        >
          Voir les packs
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const articleImages = (pack.articles || [])
    .flatMap((article) => [
      article.image,
      ...(article.images || []),
    ])
    .filter(
      (image): image is string =>
        Boolean(image),
    );

  const visualImages = Array.from(
    new Set(
      [
        pack.image,
        ...(pack.images || []),
        ...(pack.article_images || []),
        ...articleImages,
      ].filter(
        (image): image is string =>
          Boolean(image),
      ),
    ),
  ).slice(0, 8);

  const activePackImage =
    visualImages[
      activePackImageIndex
    ] || visualImages[0];

  function showNextPackImage() {
    if (visualImages.length <= 1) {
      return;
    }

    setActivePackImageIndex(
      (current) =>
        (current + 1) %
        visualImages.length,
    );
  }

  function selectPackImage(
    index: number,
  ) {
    if (
      index < 0 ||
      index >= visualImages.length
    ) {
      return;
    }

    setActivePackImageIndex(index);
  }

  const oldPrice = Number(
    pack.old_price || 0,
  );

  const price = Number(pack.price || 0);

  const saving =
    oldPrice > price
      ? oldPrice - price
      : 0;

  const reduction =
    oldPrice > price && oldPrice > 0
      ? Math.round(
          (saving / oldPrice) * 100,
        )
      : 0;

  const packHref =
    `/pack?slug=${encodeURIComponent(
      pack.slug,
    )}`;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 35,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.16,
      }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative isolate overflow-hidden rounded-[30px] border border-zinc-800/80 bg-zinc-950 text-white shadow-[0_40px_110px_rgba(24,24,27,0.28)] sm:rounded-[42px]"
    >
      {/* halos animés */}
      <motion.div
        aria-hidden="true"
        animate={{
          x: ["-12%", "15%", "-12%"],
          y: ["-10%", "12%", "-10%"],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -right-28 -top-32 h-[440px] w-[440px] rounded-full bg-orange-500/25 blur-[100px]"
      />

      <motion.div
        aria-hidden="true"
        animate={{
          x: ["10%", "-12%", "10%"],
          y: ["12%", "-8%", "12%"],
          scale: [1.06, 0.96, 1.06],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -bottom-44 -left-28 h-[460px] w-[460px] rounded-full bg-amber-400/10 blur-[120px]"
      />

      {/* balayage lumineux */}
      <motion.div
        aria-hidden="true"
        initial={{
          x: "-130%",
        }}
        animate={{
          x: "230%",
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          repeatDelay: 2.2,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute inset-y-0 z-0 w-28 rotate-12 bg-gradient-to-r from-transparent via-white/[0.055] to-transparent blur-xl"
      />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative z-10 grid lg:grid-cols-[0.92fr_1.08fr]">
        {/* =================================================
            VISUEL 3D
        ================================================= */}
        <div className="relative overflow-hidden border-b border-white/10 px-4 py-7 sm:px-8 sm:py-10 lg:border-b-0 lg:border-r lg:px-10 lg:py-14">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/70 to-transparent" />

          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300 backdrop-blur sm:text-xs">
              <Sparkles className="h-4 w-4" />
              Dernier pack ajouté
            </span>

            <motion.span
              animate={{
                boxShadow: pack.inStock
                  ? [
                      "0 0 0 0 rgba(34,197,94,0)",
                      "0 0 0 8px rgba(34,197,94,0.08)",
                      "0 0 0 0 rgba(34,197,94,0)",
                    ]
                  : [
                      "0 0 0 0 rgba(161,161,170,0)",
                      "0 0 0 8px rgba(161,161,170,0.06)",
                      "0 0 0 0 rgba(161,161,170,0)",
                    ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
              }}
              className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${
                pack.inStock
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-white/5 text-zinc-400"
              }`}
            >
              {pack.inStock
                ? "Disponible"
                : "Indisponible"}
            </motion.span>
          </div>

          {/* scène 3D */}
          <div className="relative mt-5 min-h-[350px] [perspective:1300px] sm:mt-7 sm:min-h-[440px] lg:min-h-[500px]">
            <motion.div
              animate={{
                y: [0, -9, 0],
                rotateY: [-7, 7, -7],
                rotateX: [3, -3, 3],
              }}
              transition={{
                y: {
                  duration: 4.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                rotateY: {
                  duration: 7.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                rotateX: {
                  duration: 6.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              whileHover={{
                rotateY: 0,
                rotateX: 0,
                scale: 1.02,
              }}
              style={{
                transformStyle:
                  "preserve-3d",
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* anneaux 3D */}
              <motion.div
                aria-hidden="true"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute h-[260px] w-[260px] rounded-full border border-orange-500/20 sm:h-[350px] sm:w-[350px] lg:h-[390px] lg:w-[390px]"
                style={{
                  transform:
                    "translateZ(-70px) rotateX(68deg)",
                }}
              />

              <motion.div
                aria-hidden="true"
                animate={{
                  rotate: [360, 0],
                }}
                transition={{
                  duration: 24,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute h-[220px] w-[220px] rounded-full border border-white/10 sm:h-[310px] sm:w-[310px]"
                style={{
                  transform:
                    "translateZ(-40px) rotateY(64deg)",
                }}
              />

              {/* image principale cliquable */}
              <motion.button
                type="button"
                onClick={
                  showNextPackImage
                }
                whileTap={{
                  scale: 0.985,
                }}
                aria-label={
                  visualImages.length > 1
                    ? "Afficher la photo suivante du pack"
                    : "Photo du pack"
                }
                className="group relative h-[255px] w-[78%] max-w-[330px] cursor-pointer overflow-hidden rounded-[28px] border border-white/15 bg-zinc-900 text-left shadow-[0_35px_80px_rgba(0,0,0,0.45)] outline-none transition focus-visible:ring-4 focus-visible:ring-orange-500/30 sm:h-[340px] sm:max-w-[400px] sm:rounded-[34px] lg:h-[390px]"
                style={{
                  transform:
                    "translateZ(55px)",
                }}
              >
                {activePackImage ? (
                  <AnimatePresence
                    mode="wait"
                    initial={false}
                  >
                    <motion.img
                      key={`${activePackImage}-${activePackImageIndex}`}
                      src={
                        activePackImage
                      }
                      alt={`${pack.name} - photo ${
                        activePackImageIndex +
                        1
                      }`}
                      draggable={false}
                      initial={{
                        opacity: 0,
                        scale: 1.08,
                        rotateY: 8,
                        x: 20,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        rotateY: 0,
                        x: 0,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.96,
                        rotateY: -8,
                        x: -20,
                      }}
                      transition={{
                        duration: 0.42,
                        ease: [
                          0.22,
                          1,
                          0.36,
                          1,
                        ],
                      }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </AnimatePresence>
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-950/40">
                    <motion.div
                      animate={{
                        y: [0, -8, 0],
                        rotate: [0, 3, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="flex h-24 w-24 items-center justify-center rounded-[30px] bg-orange-500/15 text-orange-400 sm:h-32 sm:w-32"
                    >
                      <Award className="h-12 w-12 sm:h-16 sm:w-16" />
                    </motion.div>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-white/[0.04]" />

                {/* nombre d'articles */}
                <div className="pointer-events-none absolute bottom-4 left-4 sm:bottom-5 sm:left-5">
                  <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur">
                    {pack.article_count} article
                    {pack.article_count > 1
                      ? "s"
                      : ""}
                  </span>
                </div>

                {/* compteur photos */}
                {visualImages.length > 0 && (
                  <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[10px] font-black text-white backdrop-blur sm:right-5 sm:top-5">
                    {activePackImageIndex + 1}
                    {" / "}
                    {visualImages.length}
                  </div>
                )}

                {/* indication de clic */}
                {visualImages.length > 1 && (
                  <motion.div
                    animate={{
                      opacity: [
                        0.72,
                        1,
                        0.72,
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="pointer-events-none absolute bottom-4 right-4 hidden items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/90 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-lg backdrop-blur sm:flex"
                  >
                    Cliquer pour changer
                    <ArrowRight className="h-3.5 w-3.5" />
                  </motion.div>
                )}
              </motion.button>

              {/* cartes flottantes */}
              {visualImages[1] && (
                <motion.button
                  type="button"
                  onClick={() =>
                    selectPackImage(1)
                  }
                  animate={{
                    y: [0, -12, 0],
                    rotate: [-5, 2, -5],
                  }}
                  transition={{
                    duration: 4.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  whileTap={{
                    scale: 0.94,
                  }}
                  aria-label="Afficher la photo 2"
                  className={`absolute left-0 top-[16%] h-24 w-24 overflow-hidden rounded-2xl border-2 bg-zinc-900 shadow-2xl sm:h-32 sm:w-32 ${
                    activePackImageIndex === 1
                      ? "border-orange-500"
                      : "border-white/15"
                  }`}
                  style={{
                    transform:
                      "translateZ(105px)",
                  }}
                >
                  <img
                    src={visualImages[1]}
                    alt={`${pack.name} - photo 2`}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                </motion.button>
              )}

              {visualImages[2] && (
                <motion.button
                  type="button"
                  onClick={() =>
                    selectPackImage(2)
                  }
                  animate={{
                    y: [0, 10, 0],
                    rotate: [6, -2, 6],
                  }}
                  transition={{
                    duration: 5.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  whileTap={{
                    scale: 0.94,
                  }}
                  aria-label="Afficher la photo 3"
                  className={`absolute bottom-[12%] right-0 h-24 w-24 overflow-hidden rounded-2xl border-2 bg-zinc-900 shadow-2xl sm:h-32 sm:w-32 ${
                    activePackImageIndex === 2
                      ? "border-orange-500"
                      : "border-orange-400/30"
                  }`}
                  style={{
                    transform:
                      "translateZ(125px)",
                  }}
                >
                  <img
                    src={visualImages[2]}
                    alt={`${pack.name} - photo 3`}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                </motion.button>
              )}

              {visualImages[3] && (
                <motion.button
                  type="button"
                  onClick={() =>
                    selectPackImage(3)
                  }
                  animate={{
                    y: [0, -7, 0],
                    rotate: [-2, 5, -2],
                  }}
                  transition={{
                    duration: 5.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  whileTap={{
                    scale: 0.94,
                  }}
                  aria-label="Afficher la photo 4"
                  className={`absolute bottom-[3%] left-[12%] hidden h-20 w-20 overflow-hidden rounded-2xl border bg-zinc-900 shadow-xl sm:block sm:h-24 sm:w-24 ${
                    activePackImageIndex === 3
                      ? "border-orange-500"
                      : "border-white/15"
                  }`}
                  style={{
                    transform:
                      "translateZ(80px)",
                  }}
                >
                  <img
                    src={visualImages[3]}
                    alt={`${pack.name} - photo 4`}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                </motion.button>
              )}

              {/* badge réduction flottant */}
              {reduction > 0 && (
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                    rotate: [-3, 3, -3],
                  }}
                  transition={{
                    duration: 3.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute right-[4%] top-[4%] rounded-2xl bg-orange-500 px-3 py-2 text-center text-white shadow-xl shadow-orange-500/25 sm:px-4 sm:py-3"
                  style={{
                    transform:
                      "translateZ(150px)",
                  }}
                >
                  <span className="block text-[9px] font-black uppercase tracking-[0.16em]">
                    Remise
                  </span>
                  <strong className="mt-0.5 block text-xl font-black sm:text-2xl">
                    -{reduction}%
                  </strong>
                </motion.div>
              )}
            </motion.div>

            <div className="pointer-events-none absolute inset-x-[18%] bottom-2 h-10 rounded-[50%] bg-black/50 blur-xl" />
          </div>

          {visualImages.length > 1 && (
            <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-2 sm:mx-auto">
                {visualImages.map(
                  (image, index) => {
                    const active =
                      index ===
                      activePackImageIndex;

                    return (
                      <motion.button
                        key={`${image}-${index}`}
                        type="button"
                        whileTap={{
                          scale: 0.94,
                        }}
                        onClick={() =>
                          selectPackImage(
                            index,
                          )
                        }
                        aria-label={`Afficher la photo ${
                          index + 1
                        } du pack`}
                        className={`relative h-14 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-zinc-900 transition sm:h-16 sm:w-20 ${
                          active
                            ? "border-orange-500 shadow-lg shadow-orange-500/15"
                            : "border-white/10 opacity-65 hover:border-white/30 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={image}
                          alt=""
                          draggable={false}
                          className="h-full w-full object-cover"
                        />

                        {active && (
                          <span className="absolute inset-x-1 bottom-1 rounded-full bg-orange-500 py-0.5 text-center text-[8px] font-black uppercase text-white">
                            Actif
                          </span>
                        )}
                      </motion.button>
                    );
                  },
                )}
              </div>
            </div>
          )}

          <p className="mt-2 text-center text-[10px] font-black uppercase tracking-[0.17em] text-zinc-600 sm:text-xs">
            {visualImages.length > 1
              ? "Cliquez sur la grande photo ou choisissez une miniature"
              : "Animation 3D · survolez le pack"}
          </p>
        </div>

        {/* =================================================
            INFORMATIONS
        ================================================= */}
        <div className="relative flex flex-col justify-center px-5 py-8 sm:px-9 sm:py-12 lg:px-14 lg:py-16">
          <motion.span
            initial={{
              opacity: 0,
              x: 18,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.12,
            }}
            className="w-fit rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300 sm:text-xs"
          >
            Pack n° {pack.id}
          </motion.span>

          <motion.h2
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
            transition={{
              delay: 0.16,
              duration: 0.55,
            }}
            className="mt-5 text-3xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl"
          >
            {pack.name}
          </motion.h2>

          <motion.p
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
            }}
            transition={{
              delay: 0.22,
              duration: 0.5,
            }}
            className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base sm:leading-8"
          >
            {pack.description ||
              "Découvrez notre dernier pack ajouté : un ensemble complet proposé à un prix avantageux."}
          </motion.p>

          {/* infos rapides */}
          <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              [
                String(
                  pack.article_count || 0,
                ),
                "Articles",
              ],
              [
                String(
                  pack.stock_quantity || 0,
                ),
                "Stock",
              ],
              [
                pack.inStock
                  ? "Oui"
                  : "Non",
                "Disponible",
              ],
            ].map(([value, label], index) => (
              <motion.div
                key={label}
                initial={{
                  opacity: 0,
                  y: 14,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  delay:
                    0.26 + index * 0.06,
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center backdrop-blur sm:px-4 sm:py-4"
              >
                <strong className="block text-lg font-black text-white sm:text-2xl">
                  {value}
                </strong>
                <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500 sm:text-[10px]">
                  {label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* prix */}
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.3,
            }}
            className="mt-7 rounded-[24px] border border-white/10 bg-white/[0.055] p-5 backdrop-blur sm:rounded-[28px] sm:p-6"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Prix du pack
                </span>

                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                  <motion.strong
                    animate={{
                      scale: [
                        1,
                        1.02,
                        1,
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="text-4xl font-black tracking-tight text-white sm:text-5xl"
                  >
                    {formatPackPrice(
                      price,
                    )}
                  </motion.strong>

                  <span className="text-lg font-black text-orange-500">
                    DA
                  </span>
                </div>

                {oldPrice > price && (
                  <span className="mt-2 block text-sm font-bold text-zinc-500 line-through">
                    {formatPackPrice(
                      oldPrice,
                    )}{" "}
                    DA
                  </span>
                )}
              </div>

              {saving > 0 && (
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 sm:text-right">
                  <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
                    Vous économisez
                  </span>

                  <strong className="mt-1 block text-lg font-black text-white">
                    {formatPackPrice(
                      saving,
                    )}{" "}
                    DA
                  </strong>
                </div>
              )}
            </div>
          </motion.div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <motion.div
              whileHover={{
                y: -3,
                scale: 1.01,
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="w-full sm:w-auto"
            >
              <Link
                href={packHref}
                className="group inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-sm font-black text-white shadow-xl shadow-orange-500/25 transition-colors hover:bg-orange-600 sm:w-auto"
              >
                Découvrir ce pack
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <Link
              href="/articles/?pack=1"
              className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl border border-orange-400 bg-orange-500 px-6 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 sm:w-auto"
            >
              Voir tous les packs
            </Link>
          </div>

          {pack.created_at && (
            <span className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600">
              Dernier ajout détecté automatiquement
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}


export default function Home() {
  const [
    categories,
    setCategories,
  ] = useState<Category[]>([]);

  const [
    latestProducts,
    setLatestProducts,
  ] = useState<Product[]>([]);

  const [
    latestPack,
    setLatestPack,
  ] = useState<HomePack | null>(null);

  const [
    packLoading,
    setPackLoading,
  ] = useState(true);

  const [
    packError,
    setPackError,
  ] = useState("");

  const [
    categoriesLoading,
    setCategoriesLoading,
  ] = useState(true);

  const [
    productsLoading,
    setProductsLoading,
  ] = useState(true);

  const [
    catalogError,
    setCatalogError,
  ] = useState("");

  const [
    currentHeroImage,
    setCurrentHeroImage,
  ] = useState(0);

  const [
    heroTransitioning,
    setHeroTransitioning,
  ] = useState(false);

  const [
    heroDirection,
    setHeroDirection,
  ] = useState<1 | -1>(1);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      setCategoriesLoading(true);

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
            ): Category => {
              const visual =
                getCategoryVisual(
                  category.name,
                );

              return {
                id: Number(
                  category.id,
                ),
                name:
                  category.name,
                slug:
                  category.slug,
                description:
                  category.description ||
                  "Découvrez les articles de cette catégorie.",
                image:
                  category.image,
                articleCount:
                  Number(
                    category.article_count ||
                      0,
                  ),
                href:
                  `/articles?categorie=${encodeURIComponent(
                    category.name,
                  )}`,
                ...visual,
              };
            },
          );

        setCategories(normalized);
      } catch (requestError) {
        if (active) {
          setCategories([]);
          setCatalogError(
            requestError instanceof Error
              ? requestError.message
              : "Impossible de charger les catégories depuis la base de données.",
          );
        }
      } finally {
        if (active) {
          setCategoriesLoading(false);
        }
      }
    }

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const timerId = window.setTimeout(
      () => void loadCategories(),
      mobile ? 180 : 0,
    );

    return () => {
      active = false;
      window.clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadLatestProducts() {
      setProductsLoading(true);

      try {
        const response =
          await catalogApi.latestArticles(24);

        if (
          !active ||
          !Array.isArray(
            response.articles,
          )
        ) {
          return;
        }

        const normalized =
          response.articles.map(
            (
              article: CatalogArticle,
            ): Product => ({
              id: Number(article.id),
              slug: article.slug,
              designation:
                article.designation,
              price: Number(
                article.price,
              ),
              old_price:
                article.old_price ===
                  null ||
                article.old_price ===
                  undefined
                  ? undefined
                  : Number(
                      article.old_price,
                    ),
              category:
                article.category ||
                "Article",
              description:
                article.description ||
                undefined,
              image:
                article.image ||
                undefined,
              images: article.images,
              stock_quantity: Number(
                article.stock_quantity ||
                  0,
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
              inStock: article.inStock,
              promotion_id:
                article.promotion_id,
              promotion_name:
                article.promotion_name,
              item_type: "ARTICLE",
            }),
          );

        const regularProducts =
          normalized.filter(
            (article) =>
              !article.promotion_id &&
              !(
                Number(
                  article.old_price || 0,
                ) >
                Number(
                  article.price || 0,
                )
              ),
          );

        setLatestProducts(
          regularProducts.slice(0, 8),
        );
      } catch (requestError) {
        if (active) {
          setLatestProducts([]);
          setCatalogError(
            requestError instanceof Error
              ? requestError.message
              : "Impossible de charger les articles depuis la base de données.",
          );
        }
      } finally {
        if (active) {
          setProductsLoading(false);
        }
      }
    }

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const timerId = window.setTimeout(
      () => void loadLatestProducts(),
      mobile ? 320 : 0,
    );

    return () => {
      active = false;
      window.clearTimeout(timerId);
    };
  }, []);


  useEffect(() => {
    let active = true;

    async function loadLatestPack() {
      setPackLoading(true);
      setPackError("");

      try {
        /*
         * On récupère plusieurs packs puis on choisit
         * le plus récent par created_at, avec l'id
         * comme solution de repli.
         */
        const response =
          await catalogApi.packs({
            limit: "100",
          });

        if (!active) {
          return;
        }

        const orderedPacks = [
          ...(response.packs || []),
        ].sort((a, b) => {
          const dateA = a.created_at
            ? Date.parse(a.created_at)
            : 0;

          const dateB = b.created_at
            ? Date.parse(b.created_at)
            : 0;

          const validDateA =
            Number.isFinite(dateA)
              ? dateA
              : 0;

          const validDateB =
            Number.isFinite(dateB)
              ? dateB
              : 0;

          if (validDateA !== validDateB) {
            return (
              validDateB - validDateA
            );
          }

          return (
            Number(b.id) -
            Number(a.id)
          );
        });

        const newestPack =
          orderedPacks[0];

        if (!newestPack) {
          setLatestPack(null);
          return;
        }

        /*
         * On enrichit ensuite le dernier pack avec
         * sa composition et les images de ses articles.
         */
        try {
          const detailResponse =
            await catalogApi.packBySlug(
              newestPack.slug,
            );

          if (!active) {
            return;
          }

          setLatestPack({
            ...(newestPack as HomePack),
            ...(detailResponse.pack as HomePack),
          });
        } catch {
          /*
           * Même si le détail échoue, on affiche
           * quand même le dernier pack de la liste.
           */
          if (active) {
            setLatestPack(
              newestPack as HomePack,
            );
          }
        }
      } catch (requestError) {
        if (active) {
          setLatestPack(null);
          setPackError(
            requestError instanceof Error
              ? requestError.message
              : "Impossible de charger le dernier pack.",
          );
        }
      } finally {
        if (active) {
          setPackLoading(false);
        }
      }
    }

    // Le bloc pack est loin sous la ligne de flottaison sur mobile :
    // on évite de lancer ses 2 requêtes en concurrence avec le hero.
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const timerId = window.setTimeout(
      () => void loadLatestPack(),
      mobile ? 1600 : 0,
    );

    return () => {
      active = false;
      window.clearTimeout(timerId);
    };
  }, []);

  /*
   * Préchargement des images du carrousel.
   */
  useEffect(() => {
    /*
     * On laisse d'abord le navigateur charger l'image visible.
     * Les autres slides sont préchargés ensuite, dans une version
     * beaucoup plus légère sur mobile, pour ne pas saturer le réseau.
     */
    const mobile = window.matchMedia(
      "(max-width: 767px)",
    ).matches;

    const timerId = window.setTimeout(() => {
      heroImages.slice(1).forEach((hero) => {
        const image = new window.Image();
        image.decoding = "async";
        image.src = mobile ? hero.mobileSrc : hero.src;
      });
    }, mobile ? 2600 : 900);

    return () => window.clearTimeout(timerId);
  }, []);

  /*
   * Carrousel automatique infini.
   * L’image change toutes les 6 secondes.
   * Il ne s’arrête pas au survol.
   */
  useEffect(() => {
    const intervalId =
      window.setInterval(() => {
        setHeroDirection(1);

        setCurrentHeroImage(
          (current) =>
            (current + 1) %
            heroImages.length,
        );
      }, HERO_AUTOPLAY_DELAY);

    return () => {
      window.clearInterval(
        intervalId,
      );
    };
  }, []);

  function changeHeroImage(
    nextIndex: number,
    direction: 1 | -1 = 1,
  ) {
    if (
      heroTransitioning ||
      nextIndex === currentHeroImage
    ) {
      return;
    }

    setHeroDirection(direction);
    setHeroTransitioning(true);
    setCurrentHeroImage(nextIndex);

    window.setTimeout(() => {
      setHeroTransitioning(false);
    }, 1100);
  }

  function showPreviousHeroImage() {
    changeHeroImage(
      currentHeroImage === 0
        ? heroImages.length - 1
        : currentHeroImage - 1,
      -1,
    );
  }

  function showNextHeroImage() {
    changeHeroImage(
      (currentHeroImage + 1) %
        heroImages.length,
      1,
    );
  }

  return (
    <>
      <HomeSeoJsonLd />
      <main className="overflow-hidden bg-white text-zinc-950">
      {/* HERO CAROUSEL */}
      <section className="relative min-h-[650px] overflow-hidden border-b border-zinc-200 bg-zinc-950 lg:min-h-[700px]">
        <div className="absolute inset-0 bg-zinc-950">
          {heroImages.map(
            (hero, index) => {
              const active =
                index ===
                currentHeroImage;

              return (
                <motion.div
                  key={hero.src}
                  initial={false}
                  animate={{
                    opacity: active
                      ? 1
                      : 0,
                    scale: active
                      ? 1
                      : 1.055,
                    filter: active
                      ? "blur(0px)"
                      : "blur(3px)",
                  }}
                  transition={{
                    opacity: {
                      duration: 1.1,
                      ease: "easeInOut",
                    },
                    scale: {
                      duration: 8,
                      ease: "easeOut",
                    },
                    filter: {
                      duration: 0.8,
                      ease: "easeOut",
                    },
                  }}
                  className={`absolute inset-0 ${
                    active
                      ? "z-[2]"
                      : "z-[1]"
                  }`}
                  aria-hidden={!active}
                >
                  <picture className="block h-full w-full">
                    <source
                      media="(max-width: 767px)"
                      srcSet={hero.mobileSrc}
                      type="image/webp"
                    />
                    <img
                      src={hero.src}
                      alt={
                        active
                          ? hero.alt
                          : ""
                      }
                      loading={
                        index === 0
                          ? "eager"
                          : "lazy"
                      }
                      fetchPriority={
                        index === 0
                          ? "high"
                          : "auto"
                      }
                      decoding="async"
                      draggable={false}
                      className="h-full w-full select-none object-cover"
                    />
                  </picture>
                </motion.div>
              );
            },
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-r from-black/55 via-black/30 to-transparent" />

        <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-black/25 via-transparent to-transparent" />

        {/* Barre de progression de 6 secondes */}
        <div className="absolute inset-x-0 top-0 z-10 h-1 bg-white/10">
          <motion.div
            key={`progress-${currentHeroImage}`}
            initial={{
              width: "0%",
            }}
            animate={{
              width: "100%",
            }}
            transition={{
              duration:
                HERO_AUTOPLAY_DELAY /
                1000,
              ease: "linear",
            }}
            className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 shadow-[0_0_14px_rgba(249,115,22,0.8)]"
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[650px] max-w-7xl items-center px-4 py-24 sm:px-6 lg:min-h-[700px] lg:px-8">
          <AnimatePresence
            mode="wait"
            initial={false}
            custom={heroDirection}
          >
            <motion.div
              key={`content-${currentHeroImage}`}
              custom={heroDirection}
              initial={{
                opacity: 0,
                x:
                  heroDirection > 0
                    ? 70
                    : -70,
                y: 24,
                filter: "blur(8px)",
              }}
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                x:
                  heroDirection > 0
                    ? -45
                    : 45,
                y: -12,
                filter: "blur(6px)",
              }}
              transition={{
                duration: 0.75,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              className="max-w-3xl"
            >
              <motion.div
                initial={{
                  opacity: 0,
                  y: -18,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                transition={{
                  delay: 0.12,
                  duration: 0.5,
                  ease: "easeOut",
                }}
                className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-300 backdrop-blur-md sm:text-sm"
              >
                <Sparkles className="h-4 w-4" />

                {
                  heroImages[
                    currentHeroImage
                  ].eyebrow
                }
              </motion.div>

              <motion.h1
                initial={{
                  opacity: 0,
                  y: 38,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.2,
                  duration: 0.7,
                  ease: [
                    0.22,
                    1,
                    0.36,
                    1,
                  ],
                }}
                className="mt-7 text-4xl font-black leading-[1.03] tracking-tight text-white sm:text-5xl lg:text-7xl"
              >
                {
                  heroImages[
                    currentHeroImage
                  ].title
                }

                <motion.span
                  initial={{
                    backgroundSize:
                      "0% 100%",
                  }}
                  animate={{
                    backgroundSize:
                      "100% 100%",
                  }}
                  transition={{
                    delay: 0.48,
                    duration: 0.85,
                    ease: "easeOut",
                  }}
                  className="mt-2 block bg-gradient-to-r from-orange-500 to-orange-400 bg-no-repeat text-transparent [background-position:0_100%] bg-clip-text"
                >
                  {
                    heroImages[
                      currentHeroImage
                    ].highlightedTitle
                  }
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{
                  opacity: 0,
                  y: 24,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.34,
                  duration: 0.62,
                  ease: "easeOut",
                }}
                className="mt-6 max-w-2xl text-base leading-8 text-zinc-200 sm:text-lg"
              >
                {
                  heroImages[
                    currentHeroImage
                  ].description
                }
              </motion.p>

              <motion.div
                initial={{
                  opacity: 0,
                  y: 24,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.46,
                  duration: 0.58,
                  ease: "easeOut",
                }}
                className="mt-9 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  href={
                    heroImages[
                      currentHeroImage
                    ].href
                  }
                  className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-7 text-sm font-black text-white shadow-xl shadow-orange-500/25 transition-all hover:-translate-y-0.5 hover:bg-orange-600"
                >
                  {
                    heroImages[
                      currentHeroImage
                    ].buttonLabel
                  }

                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/articles"
                  className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-orange-400 bg-orange-500 px-7 text-sm font-black text-white shadow-xl shadow-orange-500/25 backdrop-blur-md transition hover:bg-orange-600"
                >
                  Voir tout le catalogue
                </Link>
              </motion.div>

              <motion.div
                initial={{
                  opacity: 0,
                  y: 28,
                  scale: 0.97,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                transition={{
                  delay: 0.58,
                  duration: 0.65,
                  ease: [
                    0.22,
                    1,
                    0.36,
                    1,
                  ],
                }}
                className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black/35 py-5 backdrop-blur-md"
              >
                {stats.map((stat) => {
                  const Icon =
                    stat.icon;

                  return (
                    <div
                      key={stat.label}
                      className="flex flex-col items-center px-2 text-center"
                    >
                      <strong className="flex items-center gap-1.5 text-lg font-black text-white sm:text-2xl">
                        <Icon className="h-5 w-5 text-orange-400" />

                        {stat.value}
                      </strong>

                      <span className="mt-1 text-xs text-zinc-400">
                        {stat.label}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20">
          <div className="mx-auto flex max-w-7xl items-end justify-end px-4 pb-6 sm:px-6 lg:px-8 lg:pb-8">
            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                whileHover={{
                  scale: 1.06,
                  x: -2,
                }}
                whileTap={{
                  scale: 0.92,
                }}
                onClick={
                  showPreviousHeroImage
                }
                disabled={
                  heroTransitioning
                }
                aria-label="Image précédente"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-orange-400 bg-orange-500 text-white shadow-lg shadow-orange-500/20 backdrop-blur-md transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>

              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-2 backdrop-blur-md">
                {heroImages.map(
                  (image, index) => {
                    const active =
                      currentHeroImage ===
                      index;

                    return (
                      <button
                        key={image.src}
                        type="button"
                        onClick={() =>
                          changeHeroImage(
                            index,
                            index >
                              currentHeroImage
                              ? 1
                              : -1,
                          )
                        }
                        disabled={
                          heroTransitioning
                        }
                        aria-label={`Afficher l’image ${
                          index + 1
                        }`}
                        className={`h-2 rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                          active
                            ? "w-8 bg-orange-500"
                            : "w-2 bg-white/70 hover:bg-orange-300"
                        }`}
                      />
                    );
                  },
                )}
              </div>

              <motion.button
                type="button"
                whileHover={{
                  scale: 1.06,
                  x: 2,
                }}
                whileTap={{
                  scale: 0.92,
                }}
                onClick={
                  showNextHeroImage
                }
                disabled={
                  heroTransitioning
                }
                aria-label="Image suivante"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-orange-400 bg-orange-500 text-white shadow-lg shadow-orange-500/20 backdrop-blur-md transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* AVANTAGES */}
      <SectionWrapper>
        <section className="border-b border-zinc-200 bg-white">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.2,
            }}
            className="mx-auto grid max-w-7xl gap-3 px-4 py-7 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8"
          >
            {advantages.map(
              (advantage) => {
                const Icon =
                  advantage.icon;

                return (
                  <motion.div
                    key={
                      advantage.title
                    }
                    variants={itemVariants}
                    whileHover={{
                      y: -4,
                    }}
                    className="group flex items-start gap-4 rounded-2xl border border-zinc-200/70 bg-white p-5 transition-all hover:border-orange-200 hover:shadow-lg"
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${advantage.iconBackground} ${advantage.iconClassName}`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>

                    <div>
                      <h3 className="font-black text-zinc-950">
                        {advantage.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-zinc-500">
                        {
                          advantage.description
                        }
                      </p>
                    </div>
                  </motion.div>
                );
              },
            )}
          </motion.div>
        </section>
      </SectionWrapper>

      {catalogError && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {catalogError}
          </div>
        </div>
      )}

      {/* CATÉGORIES */}
      <SectionWrapper delay={0.08}>
        <section className="relative overflow-hidden border-y border-zinc-200 bg-[radial-gradient(circle_at_top,#fff7ed_0%,#fafafa_42%,#ffffff_100%)] py-14 sm:py-16 lg:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-120px] top-20 h-72 w-72 rounded-full bg-orange-200/25 blur-3xl" />
            <div className="absolute right-[-140px] top-1/3 h-80 w-80 rounded-full bg-amber-100/30 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                amount: 0.3,
              }}
              transition={{
                duration: 0.55,
                ease: "easeOut",
              }}
              className="mx-auto max-w-3xl text-center"
            >
              <motion.span
                initial={{
                  opacity: 0,
                  scale: 0.9,
                }}
                whileInView={{
                  opacity: 1,
                  scale: 1,
                }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-orange-500 shadow-sm backdrop-blur sm:text-xs"
              >
                <Sparkles className="h-4 w-4" />
                Nos univers
              </motion.span>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
                Trouvez votre univers,
                <span className="mt-1 block bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 bg-clip-text text-transparent">
                  trouvez votre prochain projet.
                </span>
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">
                Parcourez nos catégories, glissez sur mobile et accédez directement aux produits qui vous intéressent.
              </p>
            </motion.div>

            <div className="mt-8 sm:mt-10 lg:mt-12">
              {categoriesLoading ? (
                <div className="flex min-h-[330px] items-center justify-center rounded-[30px] border border-zinc-200 bg-white/80 shadow-sm backdrop-blur">
                  <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-orange-500" />
                    <p className="mt-4 text-sm font-bold text-zinc-500">
                      Chargement des catégories...
                    </p>
                  </div>
                </div>
              ) : categories.length > 0 ? (
                <CategoryCarousel
                  categories={categories}
                />
              ) : (
                <div className="rounded-[30px] border border-dashed border-zinc-300 bg-white/80 p-8 text-center sm:p-10">
                  <p className="font-black text-zinc-800">
                    Aucune catégorie disponible.
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Ajoutez des catégories depuis l’administration.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-9 flex justify-center sm:mt-11">
              <motion.div
                whileHover={{
                  y: -3,
                  scale: 1.01,
                }}
                whileTap={{
                  scale: 0.98,
                }}
              >
                <Link
                  href="/articles"
                  className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-sm font-black text-white shadow-xl shadow-orange-500/25 transition-colors hover:bg-orange-600 sm:min-h-14 sm:px-7"
                >
                  Voir toutes les catégories
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      </SectionWrapper>

      {/* PRODUITS */}
      <SectionWrapper delay={0.12}>
        <section className="border-y border-zinc-200 bg-white py-12 sm:py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Notre sélection"
              title="Les derniers articles ajoutés."
              description="Cette sélection est chargée directement depuis les derniers articles enregistrés dans la base de données."
              href="/articles"
              label="Voir tout le catalogue"
            />

            <div className="mt-7 sm:mt-10">
              {productsLoading ? (
                <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-zinc-200 bg-zinc-50">
                  <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-orange-500" />
                    <p className="mt-4 text-sm font-bold text-zinc-500">
                      Chargement des derniers articles...
                    </p>
                  </div>
                </div>
              ) : latestProducts.length > 0 ? (
                <ProductCarousel
                  products={
                    latestProducts
                  }
                />
              ) : (
                <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
                  <p className="font-black text-zinc-800">
                    Aucun article disponible.
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Les articles ajoutés depuis l’administration apparaîtront ici automatiquement.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </SectionWrapper>

      {/* PACK VEDETTE - DERNIER PACK EN BASE */}
      <SectionWrapper delay={0.16}>
        <section className="relative overflow-hidden bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <LatestPackShowcase
              pack={latestPack}
              loading={packLoading}
              error={packError}
            />
          </div>
        </section>
      </SectionWrapper>

      {/* CTA */}
      <SectionWrapper delay={0.2}>
        <section className="border-t border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 text-center sm:px-6 lg:flex-row lg:px-8 lg:text-left">
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-500/25">
                <Brush className="h-8 w-8" />
              </span>

              <div>
                <h2 className="text-xl font-black sm:text-2xl">
                  Besoin de matériel pour
                  votre projet ?
                </h2>

                <p className="mt-2 text-zinc-500">
                  Parcourez notre catalogue
                  et trouvez tous les
                  articles adaptés.
                </p>
              </div>
            </div>

            <Link
              href="/articles"
              className="group inline-flex min-h-14 items-center gap-2 rounded-2xl bg-orange-500 px-7 text-sm font-black text-white shadow-xl shadow-orange-500/25 transition hover:bg-orange-600"
            >
              Parcourir le catalogue

              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </SectionWrapper>
    </main>
    </>
  );
}