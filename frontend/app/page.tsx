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

import {
  catalogApi,
  type CatalogArticle,
  type CatalogCategory,
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

const fallbackCategories: Category[] = [
  {
    id: 1,
    name: "Outillage",
    slug: "outillage",
    description: "Outils manuels et accessoires",
    articleCount: 0,
    icon: Hammer,
    href: "/articles/?categorie=Outillage",
    iconClassName: "text-blue-600",
    iconBackground: "bg-blue-50",
  },
  {
    id: 2,
    name: "Jardin",
    slug: "jardin",
    description: "Équipements pour vos extérieurs",
    articleCount: 0,
    icon: Leaf,
    href: "/articles/?categorie=Jardin",
    iconClassName: "text-emerald-600",
    iconBackground: "bg-emerald-50",
  },
  {
    id: 3,
    name: "Mobilier",
    slug: "mobilier",
    description: "Mobilier intérieur et extérieur",
    articleCount: 0,
    icon: Sofa,
    href: "/articles/?categorie=Mobilier",
    iconClassName: "text-orange-600",
    iconBackground: "bg-orange-50",
  },
  {
    id: 4,
    name: "Peinture",
    slug: "peinture",
    description: "Peintures, rouleaux et pinceaux",
    articleCount: 0,
    icon: PaintRoller,
    href: "/articles/?categorie=Peinture",
    iconClassName: "text-rose-600",
    iconBackground: "bg-rose-50",
  },
  {
    id: 5,
    name: "Électricité",
    slug: "electricite",
    description: "Matériel et accessoires électriques",
    articleCount: 0,
    icon: Zap,
    href: "/articles/?categorie=Électricité",
    iconClassName: "text-yellow-600",
    iconBackground: "bg-yellow-50",
  },
  {
    id: 6,
    name: "Plomberie",
    slug: "plomberie",
    description: "Équipements et raccords",
    articleCount: 0,
    icon: Droplets,
    href: "/articles/?categorie=Plomberie",
    iconClassName: "text-cyan-600",
    iconBackground: "bg-cyan-50",
  },
];

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

const fallbackProducts: Product[] = [
  {
    id: 1,
    slug: "marteau-professionnel-500g",
    designation: "Marteau professionnel 500 g",
    price: 1200,
    old_price: 1500,
    category: "Outillage",
    image:
      "https://images.unsplash.com/photo-1607870411590-d5e9e06da09a?auto=format&fit=crop&w=900&q=85",
    rating: 4.8,
    reviews: 124,
    stock_quantity: 20,
  },
  {
    id: 2,
    slug: "chaise-de-jardin-confort",
    designation: "Chaise de jardin confort",
    price: 4500,
    old_price: 5200,
    category: "Jardin",
    image:
      "https://images.pexels.com/photos/17976470/pexels-photo-17976470/free-photo-of-wooden-chair-in-the-garden.jpeg?auto=compress&cs=tinysrgb&w=900",
    rating: 4.6,
    reviews: 89,
    stock_quantity: 15,
  },
  {
    id: 3,
    slug: "parasol-deporte-3x3m",
    designation: "Parasol déporté 3 × 3 m",
    price: 18500,
    category: "Jardin",
    image:
      "https://images.pexels.com/photos/13872652/pexels-photo-13872652.jpeg?auto=compress&cs=tinysrgb&w=900",
    rating: 4.9,
    reviews: 56,
    stock_quantity: 8,
  },
  {
    id: 4,
    slug: "perceuse-electrique-750w",
    designation: "Perceuse électrique 750 W",
    price: 12900,
    old_price: 14900,
    category: "Électroportatif",
    image:
      "https://images.unsplash.com/photo-1593307315564-c96172dc89dc?auto=format&fit=crop&w=900&q=85",
    rating: 4.7,
    reviews: 203,
    stock_quantity: 12,
  },
  {
    id: 5,
    slug: "kit-de-peinture-professionnel",
    designation: "Kit de peinture professionnel",
    price: 6800,
    category: "Peinture",
    image:
      "https://images.pexels.com/photos/5799083/pexels-photo-5799083.jpeg?auto=compress&cs=tinysrgb&w=900",
    rating: 4.5,
    reviews: 71,
    stock_quantity: 18,
  },
  {
    id: 6,
    slug: "coffret-outils-108-pieces",
    designation: "Coffret d’outils 108 pièces",
    price: 15900,
    old_price: 17900,
    category: "Outillage",
    image:
      "https://images.unsplash.com/photo-1696685747241-5f243fb9e76f?auto=format&fit=crop&w=900&q=85",
    rating: 4.9,
    reviews: 164,
    stock_quantity: 9,
  },
];

const advantages: Advantage[] = [
  {
    title: "Livraison express",
    description: "Livraison rapide dans les 48 wilayas d’Algérie",
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
    src: "/images/bg1.png",
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
    src: "/images/bg2.png",
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
    src: "/images/bg4.png",
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
    value: "48",
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
      className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm transition ${
        direction === "right"
          ? "bg-zinc-950 text-white hover:bg-orange-500"
          : "border border-zinc-200 bg-white text-zinc-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
      }`}
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

  const visibleProducts = 4;

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
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
       
        
        </div>

        <div className="flex items-center gap-2">
          <CarouselButton
            direction="left"
            onClick={showPreviousProduct}
          />

          <span className="min-w-20 text-center text-xs font-black text-zinc-500">
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

      <div className="relative overflow-hidden">
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
            className="grid cursor-grab gap-6 active:cursor-grabbing sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
                  className={
                    index ===
                    orderedProducts.length - 1
                      ? "hidden xl:block"
                      : index === 2
                        ? "hidden lg:block"
                        : ""
                  }
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
      }, 5000);

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

  const activeCategory =
    categories[activeIndex];
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
  const ActiveIcon = activeCategory.icon;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative mx-auto flex min-h-[500px] max-w-6xl items-center justify-center overflow-hidden px-3 sm:min-h-[560px] sm:px-16 lg:px-24">
        {categories.length > 1 && (
          <button
            type="button"
            onClick={previousCategory}
            aria-label={`Afficher ${previousCategoryItem.name}`}
            className="absolute left-0 z-10 hidden w-[42%] max-w-[430px] -translate-x-[38%] overflow-hidden rounded-[34px] border border-zinc-200 bg-white text-left opacity-55 shadow-xl transition duration-300 hover:opacity-80 sm:block"
          >
            <div className="relative h-[330px]">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <h3 className="absolute bottom-7 left-8 text-3xl font-black text-white">
                {previousCategoryItem.name}
              </h3>
            </div>
          </button>
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
              scale: 0.93,
              filter: "blur(5px)",
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              filter: "blur(0px)",
            }}
            exit={{
              opacity: 0,
              x: direction > 0 ? -90 : 90,
              scale: 0.93,
              filter: "blur(5px)",
            }}
            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            drag="x"
            dragConstraints={{
              left: 0,
              right: 0,
            }}
            dragElastic={0.16}
            onDragEnd={(_event, info) => {
              if (
                info.offset.x < -65 ||
                info.velocity.x < -450
              ) {
                nextCategory();
                return;
              }

              if (
                info.offset.x > 65 ||
                info.velocity.x > 450
              ) {
                previousCategory();
              }
            }}
            className="relative z-20 w-full max-w-[650px] cursor-grab active:cursor-grabbing"
          >
            <Link
              href={activeCategory.href}
              className="group block overflow-hidden rounded-[36px] border border-orange-200 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.18)]"
            >
              <div className="relative h-[350px] overflow-hidden sm:h-[410px]">
                {activeCategory.image ? (
                  <img
                    src={activeCategory.image}
                    alt={activeCategory.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 via-white to-orange-50">
                    <span className={`flex h-32 w-32 items-center justify-center rounded-[38px] ${activeCategory.iconBackground} ${activeCategory.iconClassName}`}>
                      <ActiveIcon className="h-16 w-16" />
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

                <span className="absolute right-5 top-5 rounded-full border border-white/20 bg-black/35 px-4 py-2 text-xs font-black text-white backdrop-blur-md">
                  {activeCategory.articleCount}{" "}
                  {activeCategory.articleCount > 1
                    ? "articles"
                    : "article"}
                </span>

                <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 shadow-xl shadow-orange-950/20">
                    <ActiveIcon className="h-7 w-7" />
                  </span>

                  <h3 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                    {activeCategory.name}
                  </h3>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-200 sm:text-base">
                    {activeCategory.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 px-7 py-5 sm:px-9">
                <span className="text-sm font-black text-orange-600 sm:text-base">
                  Découvrir cette catégorie
                </span>

                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white transition group-hover:bg-orange-500">
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>

        {categories.length > 1 && (
          <button
            type="button"
            onClick={nextCategory}
            aria-label={`Afficher ${nextCategoryItem.name}`}
            className="absolute right-0 z-10 hidden w-[42%] max-w-[430px] translate-x-[38%] overflow-hidden rounded-[34px] border border-zinc-200 bg-white text-left opacity-55 shadow-xl transition duration-300 hover:opacity-80 sm:block"
          >
            <div className="relative h-[330px]">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <h3 className="absolute bottom-7 left-8 text-3xl font-black text-white">
                {nextCategoryItem.name}
              </h3>
            </div>
          </button>
        )}

        {categories.length > 1 && (
          <>
            <button
              type="button"
              onClick={previousCategory}
              aria-label="Catégorie précédente"
              className="absolute left-2 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-950 shadow-xl transition hover:border-orange-400 hover:bg-orange-500 hover:text-white sm:left-5"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={nextCategory}
              aria-label="Catégorie suivante"
              className="absolute right-2 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-950 shadow-xl transition hover:border-orange-400 hover:bg-orange-500 hover:text-white sm:right-5"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {categories.map((category, index) => (
          <button
            key={category.id}
            type="button"
            onClick={() => {
              setDirection(
                index >= activeIndex ? 1 : -1,
              );
              setActiveIndex(index);
            }}
            aria-label={`Afficher ${category.name}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? "w-10 bg-orange-500"
                : "w-2.5 bg-zinc-300 hover:bg-orange-300"
            }`}
          />
        ))}
      </div>
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
        <span className="text-sm font-black uppercase tracking-[0.18em] text-orange-500">
          {eyebrow}
        </span>

        <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h2>

        <p className="mt-4 text-base leading-7 text-zinc-500">
          {description}
        </p>
      </div>

      <Link
        href={href}
        className="group inline-flex w-fit items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-black transition hover:border-orange-300 hover:text-orange-600"
      >
        {label}

        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

export default function Home() {
  const [
    categories,
    setCategories,
  ] = useState<Category[]>(
    fallbackCategories,
  );

  const [
    latestProducts,
    setLatestProducts,
  ] = useState<Product[]>(
    fallbackProducts,
  );

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
    let active = true;

    async function loadLatestProducts() {
      try {
        const response =
          await catalogApi.latestArticles(8);

        if (
          !active ||
          !Array.isArray(
            response.articles,
          ) ||
          response.articles.length === 0
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
              item_type: "ARTICLE",
            }),
          );

        setLatestProducts(
          normalized,
        );
      } catch {
        /*
         * Les produits de secours restent affichés
         * si l’API est indisponible.
         */
      }
    }

    void loadLatestProducts();

    return () => {
      active = false;
    };
  }, []);

  /*
   * Préchargement des images du carrousel.
   */
  useEffect(() => {
    heroImages.forEach((hero) => {
      const image =
        new window.Image();

      image.src = hero.src;
    });
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
                    decoding="async"
                    draggable={false}
                    className="h-full w-full select-none object-cover"
                  />
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
                  className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-7 text-sm font-black text-white backdrop-blur-md transition hover:border-orange-400 hover:bg-white/15"
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
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition hover:border-orange-400 hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition hover:border-orange-400 hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* CATÉGORIES */}
      <SectionWrapper delay={0.08}>
        <section className="overflow-hidden border-y border-zinc-200 bg-zinc-50 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">
                Nos univers
              </span>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
                Tout ce qu’il vous faut,
                <span className="block text-orange-500">
                  classé par catégorie.
                </span>
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">
                Faites défiler nos univers et sélectionnez la catégorie adaptée à votre projet.
              </p>
            </div>

            <div className="mt-8 lg:mt-12">
              <CategoryCarousel
                categories={categories}
              />
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                href="/articles"
                className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-7 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-orange-500"
              >
                Voir tout le catalogue

                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </SectionWrapper>

      {/* PRODUITS */}
      <SectionWrapper delay={0.12}>
        <section className="border-y border-zinc-200 bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Notre sélection"
              title="Les derniers articles ajoutés."
              description="Cette sélection est chargée directement depuis les derniers articles enregistrés dans la base de données."
              href="/articles"
              label="Voir tout le catalogue"
            />

            <div className="mt-10">
              <ProductCarousel
                products={
                  latestProducts
                }
              />
            </div>
          </div>
        </section>
      </SectionWrapper>

      {/* PACK */}
      <SectionWrapper delay={0.16}>
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[40px] bg-zinc-950 px-6 py-10 text-white shadow-2xl sm:px-10 lg:px-16 lg:py-16">
            <div className="absolute -right-20 -top-28 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />

            <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1fr_320px]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
                  <Sparkles className="h-4 w-4" />

                  Pack jardin
                </span>

                <h2 className="mt-6 text-3xl font-black sm:text-5xl">
                  Table, quatre chaises

                  <span className="block text-orange-500">
                    et parasol.
                  </span>
                </h2>

                <p className="mt-5 max-w-xl leading-8 text-zinc-400">
                  Un ensemble complet pour
                  aménager votre jardin ou
                  votre terrasse.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  {[
                    "Table résistante",
                    "4 chaises confort",
                    "Parasol inclus",
                  ].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm"
                    >
                      <BadgeCheck className="h-4 w-4 text-orange-500" />

                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">
                    Prix du pack
                  </span>

                  <Award className="h-5 w-5 text-orange-500" />
                </div>

                <strong className="mt-3 block text-4xl font-black">
                  39 900

                  <span className="ml-2 text-lg text-orange-500">
                    DA
                  </span>
                </strong>

                <span className="mt-2 block text-sm text-zinc-500 line-through">
                  47 500 DA
                </span>

                <Link
                  href="/articles/?pack=1"
                  className="group mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-sm font-black transition hover:bg-orange-600"
                >
                  Découvrir le pack

                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
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
              className="group inline-flex min-h-14 items-center gap-2 rounded-2xl bg-zinc-950 px-7 text-sm font-black text-white transition hover:bg-orange-500"
            >
              Parcourir le catalogue

              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </SectionWrapper>
    </main>
  );
}