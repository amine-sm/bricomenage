"use client";

import Link from "next/link";

import {
  ChevronRight,
  Clock3,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MapPinned,
  Music2,
  Phone,
} from "lucide-react";

import {
  motion,
  type Variants,
} from "framer-motion";

import {
  type ElementType,
  type ReactNode,
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

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps?q=35.6613059,-0.6324169";

const GOOGLE_MAPS_EMBED_URL =
  "https://www.google.com/maps?q=35.6613059,-0.6324169&z=16&output=embed";

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

      <div className="relative border-y border-white/10 bg-white/[0.015]">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.15,
          }}
          className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.9fr_1fr] lg:px-8 lg:py-16"
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

            <p className="mt-6 max-w-sm text-sm leading-7 text-zinc-400">
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

              <SocialLink
                href="#"
                label="TikTok"
                icon={Music2}
              />

              <SocialLink
                href={GOOGLE_MAPS_URL}
                label="Google Maps"
                icon={MapPinned}
                external
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
                value="Es Sénia, Oran"
                href={GOOGLE_MAPS_URL}
                external
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

              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noreferrer"
                className="group flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 text-sm font-black text-orange-400 transition-all hover:border-orange-500 hover:bg-orange-500 hover:text-white"
              >
                <MapPinned className="h-4 w-4" />
                Ouvrir dans Google Maps
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Carte Google Maps */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.025] shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-500">
                  <MapPinned className="h-6 w-6" />
                </span>

                <div>
                  <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-orange-500">
                    Notre emplacement
                  </span>

                  <h3 className="mt-1 text-lg font-black text-white">
                    BricoMénage — Es Sénia, Oran
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    35.6613059, -0.6324169
                  </p>
                </div>
              </div>

              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
              >
                <MapPin className="h-4 w-4" />
                Ouvrir dans Google Maps
              </a>
            </div>

            <div className="relative h-[280px] w-full sm:h-[340px]">
              <iframe
                src={GOOGLE_MAPS_EMBED_URL}
                title="Localisation BricoMénage à Es Sénia, Oran"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0"
                allowFullScreen
              />
            </div>
          </div>
        </div>
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
  external?: boolean;
}

function ContactCard({
  icon: Icon,
  label,
  value,
  href,
  external = false,
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
      <a
        href={href}
        target={
          external
            ? "_blank"
            : undefined
        }
        rel={
          external
            ? "noreferrer"
            : undefined
        }
      >
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
  external?: boolean;
}

function SocialLink({
  href,
  label,
  icon: Icon,
  external = false,
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
      target={
        external
          ? "_blank"
          : undefined
      }
      rel={
        external
          ? "noreferrer"
          : undefined
      }
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white"
    >
      <Icon className="h-5 w-5" />
    </motion.a>
  );
}