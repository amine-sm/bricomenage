"use client";

import Link from "next/link";

import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock3,
  CreditCard,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import {
  motion,
  type Variants,
} from "framer-motion";

import {
  type ElementType,
  type FormEvent,
  type ReactNode,
  useState,
} from "react";

const navigationLinks = [
  {
    label: "Accueil",
    href: "/",
  },
  {
    label: "Tous les articles",
    href: "/articles",
  },
  {
    label: "Promotions",
    href: "/articles/?promotion=1",
  },
  {
    label: "Packs avantageux",
    href: "/articles/?pack=1",
  },
  {
    label: "Suivre ma commande",
    href: "/suivi-commande",
  },
];

const categoryLinks = [
  {
    label: "Outillage",
    href: "/articles/?categorie=Outillage",
  },
  {
    label: "Jardin",
    href: "/articles/?categorie=Jardin",
  },
  {
    label: "Mobilier",
    href: "/articles/?categorie=Mobilier",
  },
  {
    label: "Peinture",
    href: "/articles/?categorie=Peinture",
  },
  {
    label: "Électricité",
    href: "/articles/?categorie=Électricité",
  },
  {
    label: "Plomberie",
    href: "/articles/?categorie=Plomberie",
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
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 22,
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

export default function Footer() {
  const currentYear =
    new Date().getFullYear();

  const [email, setEmail] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

  function handleNewsletterSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    setSubmitted(true);
    setEmail("");

    window.setTimeout(() => {
      setSubmitted(false);
    }, 3000);
  }

  return (
    <footer className="relative overflow-hidden bg-[#09090b] text-white">
      {/* Fond décoratif */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <motion.div
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.14, 0.24, 0.14],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-orange-500 blur-[150px]"
        />

        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.08, 0.16, 0.08],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-60 -left-40 h-[520px] w-[520px] rounded-full bg-orange-600 blur-[160px]"
        />
      </div>

      {/* Bloc newsletter premium */}
      <div className="relative mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <motion.div
          initial={{
            opacity: 0,
            y: 35,
            scale: 0.97,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          viewport={{
            once: true,
            amount: 0.25,
          }}
          transition={{
            duration: 0.65,
            ease: "easeOut",
          }}
          className="relative overflow-hidden rounded-[36px] border border-orange-400/20 bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 p-6 shadow-[0_30px_90px_rgba(249,115,22,0.23)] sm:p-9 lg:p-12"
        >
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[70px] border-white/10"
          />

          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <motion.span
                initial={{
                  opacity: 0,
                  x: -20,
                }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                viewport={{
                  once: true,
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white backdrop-blur-md"
              >
                <Sparkles className="h-4 w-4" />

                Offres exclusives
              </motion.span>

              <h2 className="mt-6 max-w-2xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Recevez nos meilleures
                promotions directement
                dans votre boîte mail.
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-orange-50/85 sm:text-base">
                Nouveaux articles,
                réductions, packs et offres
                spéciales BricoMénage.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/20 bg-zinc-950/90 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                  <Mail className="h-6 w-6" />
                </span>

                <div>
                  <h3 className="font-black text-white">
                    Newsletter BricoMénage
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                    Inscription gratuite.
                    Vous pouvez vous
                    désinscrire à tout moment.
                  </p>
                </div>
              </div>

              <form
                onSubmit={
                  handleNewsletterSubmit
                }
                className="mt-6 space-y-3"
              >
                <label
                  htmlFor="footer-email"
                  className="sr-only"
                >
                  Votre adresse e-mail
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />

                  <input
                    id="footer-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    placeholder="Votre adresse e-mail"
                    required
                    className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:bg-white/10 focus:ring-4 focus:ring-orange-500/10"
                  />
                </div>

                <motion.button
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  type="submit"
                  className="group flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-zinc-950 shadow-xl transition-all hover:bg-orange-50"
                >
                  {submitted
                    ? "Inscription réussie"
                    : "Profiter des offres"}

                  {submitted ? (
                    <BadgeCheck className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  )}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Avantages */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{
          once: true,
          amount: 0.2,
        }}
        className="relative mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8 lg:py-14"
      >
        <ServiceCard
          icon={Truck}
          title="Livraison nationale"
          description="Livraison rapide dans toutes les wilayas."
        />

        <ServiceCard
          icon={CreditCard}
          title="Paiement à la livraison"
          description="Payez votre commande après réception."
        />

        <ServiceCard
          icon={ShieldCheck}
          title="Produits sélectionnés"
          description="Qualité, fiabilité et sécurité garanties."
        />

        <ServiceCard
          icon={PackageCheck}
          title="Suivi de commande"
          description="Consultez facilement l’état de votre colis."
        />
      </motion.div>

      <div className="relative border-y border-white/10 bg-white/[0.015]">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.15,
          }}
          className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.9fr_1fr] lg:px-8 lg:py-20"
        >
          {/* Marque */}
          <motion.div
            variants={itemVariants}
          >
            <Link
              href="/"
              className="group inline-flex items-center gap-4"
            >
              <motion.span
                whileHover={{
                  rotate: 4,
                  scale: 1.05,
                }}
                className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px] border border-white/15 bg-white p-1.5 shadow-2xl"
              >
                <img
                  src="/images/logo-bricomenage.jpeg"
                  alt="Logo BricoMénage"
                  className="h-full w-full rounded-2xl object-contain"
                />
              </motion.span>

              <span>
                <strong className="block text-2xl font-black tracking-tight text-white">
                  Brico
                  <span className="text-orange-500">
                    Ménage
                  </span>
                </strong>

                <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                  Maison &amp; bricolage
                </span>
              </span>
            </Link>

            <p className="mt-7 max-w-sm text-sm leading-7 text-zinc-400">
              Une sélection complète
              d’outils, de mobilier et
              d’équipements pour construire,
              rénover et aménager votre
              maison.
            </p>

            <div className="mt-7 flex items-center gap-3">
              <SocialLink
                href="#"
                label="Facebook"
                icon={Facebook}
              />

              <SocialLink
                href="#"
                label="Instagram"
                icon={Instagram}
              />

              <SocialLink
                href="mailto:contact@bricomenage.dz"
                label="E-mail"
                icon={Mail}
              />
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.div
            variants={itemVariants}
          >
            <FooterTitle>
              Navigation
            </FooterTitle>

            <div className="mt-7 flex flex-col gap-3">
              {navigationLinks.map(
                (item) => (
                  <FooterLink
                    key={item.label}
                    href={item.href}
                  >
                    {item.label}
                  </FooterLink>
                ),
              )}
            </div>
          </motion.div>

          {/* Catégories */}
          <motion.div
            variants={itemVariants}
          >
            <FooterTitle>
              Nos univers
            </FooterTitle>

            <div className="mt-7 flex flex-col gap-3">
              {categoryLinks.map(
                (item) => (
                  <FooterLink
                    key={item.label}
                    href={item.href}
                  >
                    {item.label}
                  </FooterLink>
                ),
              )}
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            variants={itemVariants}
          >
            <FooterTitle>
              Nous contacter
            </FooterTitle>

            <div className="mt-7 space-y-4">
              <ContactCard
                icon={MapPin}
                label="Notre adresse"
                value="Oran, Algérie"
              />

              <ContactCard
                icon={Phone}
                label="Téléphone"
                value="0550 00 00 00"
                href="tel:+213550000000"
              />

              <ContactCard
                icon={Mail}
                label="Adresse e-mail"
                value="contact@bricomenage.dz"
                href="mailto:contact@bricomenage.dz"
              />

              <ContactCard
                icon={Clock3}
                label="Disponibilité"
                value="Samedi – Jeudi"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bas du footer */}
      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 py-7 text-center text-xs text-zinc-500 sm:px-6 md:flex-row md:text-left lg:px-8">
        <p>
          © {currentYear}{" "}
          <span className="font-bold text-zinc-300">
            BricoMénage
          </span>
          . Tous droits réservés.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <Link
            href="/conditions-utilisation"
            className="transition-colors hover:text-orange-500"
          >
            Conditions d’utilisation
          </Link>

          <Link
            href="/politique-confidentialite"
            className="transition-colors hover:text-orange-500"
          >
            Confidentialité
          </Link>

          <Link
            href="/suivi-commande"
            className="transition-colors hover:text-orange-500"
          >
            Suivi de commande
          </Link>
        </div>
      </div>
    </footer>
  );
}

interface ServiceCardProps {
  icon: ElementType;
  title: string;
  description: string;
}

function ServiceCard({
  icon: Icon,
  title,
  description,
}: ServiceCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{
        y: -7,
      }}
      className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-md transition-colors hover:border-orange-500/30 hover:bg-orange-500/[0.06]"
    >
      <div className="absolute -right-7 -top-7 h-20 w-20 rounded-full bg-orange-500/10 blur-2xl transition-all group-hover:bg-orange-500/20" />

      <div className="relative flex items-start gap-4">
        <motion.span
          whileHover={{
            rotate: 8,
            scale: 1.08,
          }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20"
        >
          <Icon className="h-5 w-5" />
        </motion.span>

        <div>
          <strong className="block text-sm font-black text-white">
            {title}
          </strong>

          <p className="mt-2 text-xs leading-5 text-zinc-500">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface FooterTitleProps {
  children: ReactNode;
}

function FooterTitle({
  children,
}: FooterTitleProps) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white">
        {children}
      </h3>

      <div className="mt-3 flex items-center gap-1">
        <span className="h-1 w-8 rounded-full bg-orange-500" />
        <span className="h-1 w-2 rounded-full bg-orange-500/40" />
      </div>
    </div>
  );
}

interface FooterLinkProps {
  href: string;
  children: ReactNode;
}

function FooterLink({
  href,
  children,
}: FooterLinkProps) {
  return (
    <Link
      href={href}
      className="group flex w-fit items-center gap-2.5 text-sm text-zinc-400 transition-all duration-300 hover:translate-x-1 hover:text-orange-500"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 transition-colors group-hover:bg-orange-500/15">
        <ChevronRight className="h-3 w-3" />
      </span>

      {children}
    </Link>
  );
}

interface ContactCardProps {
  icon: ElementType;
  label: string;
  value: string;
  href?: string;
}

function ContactCard({
  icon: Icon,
  label,
  value,
  href,
}: ContactCardProps) {
  const content = (
    <div className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.025] p-3 transition-all hover:border-orange-500/20 hover:bg-orange-500/[0.05]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 transition-all group-hover:bg-orange-500 group-hover:text-white">
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          {label}
        </span>

        <strong className="mt-1 block truncate text-sm font-semibold text-zinc-300 transition-colors group-hover:text-white">
          {value}
        </strong>
      </span>
    </div>
  );

  if (href) {
    return (
      <a href={href}>
        {content}
      </a>
    );
  }

  return content;
}

interface SocialLinkProps {
  href: string;
  label: string;
  icon: ElementType;
}

function SocialLink({
  href,
  label,
  icon: Icon,
}: SocialLinkProps) {
  return (
    <motion.a
      whileHover={{
        y: -4,
        scale: 1.05,
      }}
      whileTap={{
        scale: 0.95,
      }}
      href={href}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white"
    >
      <Icon className="h-5 w-5" />
    </motion.a>
  );
}