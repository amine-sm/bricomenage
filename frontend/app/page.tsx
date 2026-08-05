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
  Drill,
  Droplets,
  Hammer,
  Leaf,
  PackageCheck,
  PaintRoller,
  ShieldCheck,
  Sofa,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
  Users,
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

interface Category {
  name: string;
  description: string;
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

const categories: Category[] = [
  {
    name: "Outillage",
    description:
      "Outils manuels et accessoires",
    icon: Hammer,
    href:
      "/articles/?categorie=Outillage",
    iconClassName:
      "text-blue-600",
    iconBackground:
      "bg-blue-50",
  },
  {
    name: "Jardin",
    description:
      "Équipements pour vos extérieurs",
    icon: Leaf,
    href:
      "/articles/?categorie=Jardin",
    iconClassName:
      "text-emerald-600",
    iconBackground:
      "bg-emerald-50",
  },
  {
    name: "Mobilier",
    description:
      "Mobilier intérieur et extérieur",
    icon: Sofa,
    href:
      "/articles/?categorie=Mobilier",
    iconClassName:
      "text-orange-600",
    iconBackground:
      "bg-orange-50",
  },
  {
    name: "Peinture",
    description:
      "Peintures, rouleaux et pinceaux",
    icon: PaintRoller,
    href:
      "/articles/?categorie=Peinture",
    iconClassName:
      "text-rose-600",
    iconBackground:
      "bg-rose-50",
  },
  {
    name: "Électricité",
    description:
      "Matériel et accessoires électriques",
    icon: Zap,
    href:
      "/articles/?categorie=Électricité",
    iconClassName:
      "text-yellow-600",
    iconBackground:
      "bg-yellow-50",
  },
  {
    name: "Plomberie",
    description:
      "Équipements et raccords",
    icon: Droplets,
    href:
      "/articles/?categorie=Plomberie",
    iconClassName:
      "text-cyan-600",
    iconBackground:
      "bg-cyan-50",
  },
];

const products: Product[] = [
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
    title:
      "Livraison express",
    description:
      "Livraison rapide dans les 48 wilayas d’Algérie",
    icon: Truck,
    iconClassName:
      "text-orange-600",
    iconBackground:
      "bg-orange-50",
  },
  {
    title:
      "Qualité garantie",
    description:
      "Des produits sélectionnés pour leur fiabilité",
    icon: BadgeCheck,
    iconClassName:
      "text-emerald-600",
    iconBackground:
      "bg-emerald-50",
  },
  {
    title:
      "Paiement sécurisé",
    description:
      "Paiement à la livraison 100 % sécurisé",
    icon: ShieldCheck,
    iconClassName:
      "text-blue-600",
    iconBackground:
      "bg-blue-50",
  },
  {
    title:
      "Suivi en temps réel",
    description:
      "Suivez votre commande étape par étape",
    icon: PackageCheck,
    iconClassName:
      "text-violet-600",
    iconBackground:
      "bg-violet-50",
  },
];

const heroImages = [
  {
    src: "/images/image1.png",
    alt: "Atelier de bricolage avec perceuse et outils",
  },
  {
    src: "/images/image2.png",
    alt: "Matériel de jardinage et aménagement extérieur",
  },
  {
    src: "/images/image3.png",
    alt: "Outils et équipements professionnels de bricolage",
  },
] as const;

const HERO_AUTOPLAY_DELAY = 5000;

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
  const reference =
    useRef<HTMLDivElement>(null);

  const visible = useInView(
    reference,
    {
      once: true,
      amount: 0.12,
    },
  );

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

function ProductCarousel() {
  const carouselReference =
    useRef<HTMLDivElement>(null);

  function scroll(
    direction: "left" | "right",
  ) {
    const carousel =
      carouselReference.current;

    if (!carousel) {
      return;
    }

    const slide =
      carousel.querySelector<HTMLElement>(
        "[data-product-slide]",
      );

    const distance =
      slide
        ? slide.offsetWidth + 24
        : carousel.clientWidth *
          0.85;

    carousel.scrollBy({
      left:
        direction === "right"
          ? distance
          : -distance,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
          Faites glisser pour découvrir plus d’articles
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <CarouselButton
            direction="left"
            onClick={() =>
              scroll("left")
            }
          />

          <CarouselButton
            direction="right"
            onClick={() =>
              scroll("right")
            }
          />
        </div>
      </div>

      <motion.div
        ref={carouselReference}
        variants={
          containerVariants
        }
        initial="hidden"
        whileInView="visible"
        viewport={{
          once: true,
          amount: 0.12,
        }}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-8 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map(
          (product) => (
            <motion.div
              key={product.id}
              data-product-slide
              variants={itemVariants}
              className="min-w-[88%] snap-start sm:min-w-[48%] lg:min-w-[31%] xl:min-w-[calc(25%-18px)]"
            >
              <ProductCard
                p={product}
              />
            </motion.div>
          ),
        )}
      </motion.div>

      <div className="mt-1 flex items-center justify-center gap-3 sm:hidden">
        <CarouselButton
          direction="left"
          onClick={() =>
            scroll("left")
          }
        />

        <span className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-500">
          Glissez les cartes
        </span>

        <CarouselButton
          direction="right"
          onClick={() =>
            scroll("right")
          }
        />
      </div>
    </div>
  );
}

interface CarouselButtonProps {
  direction:
    | "left"
    | "right";
  onClick: () => void;
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
        x:
          direction === "left"
            ? -2
            : 2,
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

export default function Home() {
  const [currentHeroImage, setCurrentHeroImage] =
    useState(0);

  const [heroPaused, setHeroPaused] =
    useState(false);

  useEffect(() => {
    if (heroPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentHeroImage((current) =>
        (current + 1) % heroImages.length
      );
    }, HERO_AUTOPLAY_DELAY);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [heroPaused]);

  function showPreviousHeroImage() {
    setCurrentHeroImage((current) =>
      current === 0
        ? heroImages.length - 1
        : current - 1
    );
  }

  function showNextHeroImage() {
    setCurrentHeroImage((current) =>
      (current + 1) % heroImages.length
    );
  }

  return (
    <main className="overflow-hidden bg-white text-zinc-950">
      {/* HERO */}
      <section className="relative min-h-[610px] overflow-hidden border-b border-zinc-200 lg:min-h-[640px]">
        <div
          className="absolute inset-0"
          onMouseEnter={() => setHeroPaused(true)}
          onMouseLeave={() => setHeroPaused(false)}
        >
          <AnimatePresence mode="sync" initial={false}>
            <motion.img
              key={heroImages[currentHeroImage].src}
              src={heroImages[currentHeroImage].src}
              alt={heroImages[currentHeroImage].alt}
              initial={{
                opacity: 0,
                scale: 1.07,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 1.025,
              }}
              transition={{
                opacity: {
                  duration: 0.9,
                  ease: "easeInOut",
                },
                scale: {
                  duration: 5.5,
                  ease: "easeOut",
                },
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/72 to-black/36" />

          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,transparent_0%,rgba(0,0,0,0.05)_38%,rgba(0,0,0,0.42)_100%)]" />
        </div>

        <div className="relative z-10 mx-auto grid min-h-[610px] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:min-h-[640px] lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
          <div className="max-w-2xl">
            <motion.div
              initial={{
                opacity: 0,
                y: -16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
              }}
              className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-black/45 px-4 py-2 text-xs font-black text-orange-300 backdrop-blur-md sm:text-sm"
            >
              <Sparkles className="h-4 w-4" />
              Nouveau magasin de bricolage en ligne
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            </motion.div>

            <motion.h1
              initial={{
                opacity: 0,
                y: 28,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.65,
                delay: 0.08,
              }}
              className="mt-6 text-4xl font-black leading-[1.03] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Tout pour construire,
              <span className="mt-2 block text-orange-500">
                rénover et aménager.
              </span>
            </motion.h1>

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
                duration: 0.5,
                delay: 0.18,
              }}
              className="mt-6 max-w-xl text-base leading-8 text-zinc-300 sm:text-lg"
            >
              Découvrez une sélection complète d’outils, de mobilier, de matériel de jardinage et d’équipements pour la maison.
            </motion.p>

            <motion.div
              initial={{
                opacity: 0,
                y: 18,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
                delay: 0.26,
              }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/articles"
                className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-7 text-sm font-black text-white shadow-xl shadow-orange-500/25 transition-all hover:-translate-y-0.5 hover:bg-orange-600"
              >
                Découvrir nos articles
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/articles/?promotion=1"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 text-sm font-black text-white backdrop-blur-md transition-all hover:border-orange-400 hover:bg-white/15"
              >
                Voir les promotions
                <Sparkles className="h-4 w-4 text-orange-400" />
              </Link>
            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                y: 18,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
                delay: 0.34,
              }}
              className="mt-9 grid max-w-xl grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black/40 py-5 backdrop-blur-md"
            >
              {stats.map(
                (stat) => {
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
                },
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{
              opacity: 0,
              x: 36,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
            }}
            transition={{
              duration: 0.75,
              delay: 0.15,
            }}
            className="relative mx-auto hidden w-full max-w-[500px] lg:block"
          >
            <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="relative min-h-[460px] overflow-hidden rounded-[28px] bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 p-8">
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 24,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[55px] border-white/10"
                />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
                    <Award className="h-4 w-4" />
                    BricoMénage
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-4 py-2 text-xs font-black text-white">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    4.8/5
                  </span>
                </div>

                <div className="mt-12 flex justify-center">
                  <div className="relative flex h-52 w-52 items-center justify-center">
                    {/* Cercle décoratif qui tourne */}
                    <motion.div
                      aria-hidden="true"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0 rounded-full border-[10px] border-white/30 border-t-white border-r-orange-200 shadow-2xl"
                    />

                    {/* Deuxième cercle pour un effet plus premium */}
                    <motion.div
                      aria-hidden="true"
                      animate={{ rotate: -360 }}
                      transition={{
                        duration: 16,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-3 rounded-full border-2 border-dashed border-orange-200/70"
                    />

                    {/* Fond blanc fixe */}
                    <div className="absolute inset-5 rounded-full bg-white shadow-2xl" />

                    {/* Logo fixe : il ne tourne pas */}
                    <div className="relative z-10 flex h-[78%] w-[78%] items-center justify-center rounded-full bg-white p-5">
                      <img
                        src="/images/logo-bricomenage.jpeg"
                        alt="Logo BricoMénage"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10 rounded-3xl border border-white/20 bg-white/15 p-5 text-white backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-950">
                      <Drill className="h-7 w-7" />
                    </span>

                    <div>
                      <strong className="block text-lg">
                        Des outils pour chaque projet
                      </strong>

                      <span className="mt-1 block text-sm text-orange-50/80">
                        Bricolage, maison, jardin et équipements.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 left-1/2 flex w-[90%] -translate-x-1/2 items-center justify-between rounded-2xl border border-white/10 bg-black/80 px-5 py-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                  <Truck className="h-5 w-5" />
                </span>

                <div>
                  <span className="block text-xs text-zinc-400">
                    Paiement
                  </span>

                  <strong className="text-sm text-white">
                    À la livraison
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Users className="h-4 w-4" />
                +500 clients
              </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 sm:bottom-7">
          <motion.button
            type="button"
            whileHover={{ scale: 1.08, x: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={showPreviousHeroImage}
            aria-label="Image précédente"
            className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:border-orange-400 hover:bg-orange-500 sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>

          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-2 shadow-lg backdrop-blur-md">
            {heroImages.map((image, index) => {
              const active = currentHeroImage === index;

              return (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => setCurrentHeroImage(index)}
                  aria-label={`Afficher l’image ${index + 1}`}
                  aria-current={active ? "true" : undefined}
                  className="group flex h-5 items-center justify-center"
                >
                  <motion.span
                    animate={{
                      width: active ? 30 : 8,
                      opacity: active ? 1 : 0.6,
                    }}
                    transition={{
                      duration: 0.28,
                      ease: "easeOut",
                    }}
                    className={`h-2 rounded-full transition-colors ${
                      active
                        ? "bg-orange-500"
                        : "bg-white group-hover:bg-orange-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.08, x: 2 }}
            whileTap={{ scale: 0.92 }}
            onClick={showNextHeroImage}
            aria-label="Image suivante"
            className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:border-orange-400 hover:bg-orange-500 sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        </div>
      </section>

      {/* AVANTAGES */}
      <SectionWrapper>
        <section className="border-b border-zinc-200 bg-white">
          <motion.div
            variants={
              containerVariants
            }
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
                    variants={
                      itemVariants
                    }
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
                        {advantage.description}
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
        <section className="bg-zinc-50 py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:items-end">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
                  Nos univers
                </span>

                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  Tout ce qu’il vous faut,
                  <span className="block text-orange-500">
                    classé par catégorie.
                  </span>
                </h2>
              </div>

              <motion.div
                variants={
                  containerVariants
                }
                initial="hidden"
                whileInView="visible"
                viewport={{
                  once: true,
                  amount: 0.15,
                }}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
              >
                {categories.map(
                  (category) => {
                    const Icon =
                      category.icon;

                    return (
                      <motion.div
                        key={
                          category.name
                        }
                        variants={
                          itemVariants
                        }
                        whileHover={{
                          y: -6,
                        }}
                      >
                        <Link
                          href={
                            category.href
                          }
                          className="group flex min-h-[170px] flex-col rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-orange-300 hover:shadow-xl"
                        >
                          <span
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${category.iconBackground} ${category.iconClassName}`}
                          >
                            <Icon className="h-6 w-6" />
                          </span>

                          <h3 className="mt-6 font-black text-zinc-950">
                            {category.name}
                          </h3>

                          <p className="mt-2 text-xs leading-5 text-zinc-500">
                            {category.description}
                          </p>
                        </Link>
                      </motion.div>
                    );
                  },
                )}
              </motion.div>
            </div>

            <div className="mt-8 flex justify-end">
              <Link
                href="/articles"
                className="group inline-flex items-center gap-2 text-sm font-black text-orange-600"
              >
                Voir tout le catalogue
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
              title="Les articles qui font la différence."
              description="Découvrez nos meilleures ventes dans un carrousel fluide."
              href="/articles"
              label="Voir tout le catalogue"
            />

            <div className="mt-10">
              <ProductCarousel />
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
                  Un ensemble complet pour aménager votre jardin ou votre terrasse.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  {[
                    "Table résistante",
                    "4 chaises confort",
                    "Parasol inclus",
                  ].map(
                    (item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm"
                      >
                        <BadgeCheck className="h-4 w-4 text-orange-500" />
                        {item}
                      </span>
                    ),
                  )}
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
                  Besoin de matériel pour votre projet ?
                </h2>

                <p className="mt-2 text-zinc-500">
                  Parcourez notre catalogue et trouvez tous les articles adaptés.
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

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  label: string;
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
