"use client";

import Link from "next/link";

import {
  ChevronRight,
  Clock3,
  Facebook,
  Instagram,
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

/* =========================================================
   INFORMATIONS BRICOMÉNAGE
========================================================= */

const FACEBOOK_URL =
  "https://www.facebook.com/share/18wbQ77V1V/?mibextid=wwXIfr";

const INSTAGRAM_URL =
  "https://www.instagram.com/brico_menagedz?igsh=aTl5dWI5MHBodHBx";

const TIKTOK_URL =
  "https://www.tiktok.com/@brico.menage.31";

const PHONE_1_DISPLAY = "0667 59 37 50";
const PHONE_1_URL = "tel:+213667593750";

const PHONE_2_DISPLAY = "0563 35 97 07";
const PHONE_2_URL = "tel:+213563359707";

const STORE_ADDRESS =
  "136 Rue Marhaba en face IGMO, Es Sénia 31005";

const GOOGLE_MAPS_URL =
  "https://maps.app.goo.gl/KWKpDxrGrSJsc83ZA?g_st=ac";

const GOOGLE_MAPS_EMBED_URL =
  "https://www.google.com/maps?q=Brico%20M%C3%A9nage%2C%20136%20Rue%20Marhaba%20en%20face%20IGMO%2C%20Es%20S%C3%A9nia%2031005&z=17&output=embed";
/* =========================================================
   NAVIGATION
========================================================= */

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

/* =========================================================
   CATÉGORIES
========================================================= */

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

/* =========================================================
   ANIMATIONS
========================================================= */

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

/* =========================================================
   FOOTER
========================================================= */

export default function Footer() {
  const currentYear =
    new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#09090b] text-white">

      {/* =====================================================
          FOND DÉCORATIF
      ===================================================== */}

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

      {/* =====================================================
          CONTENU PRINCIPAL
      ===================================================== */}

      <div className="relative border-y border-white/10 bg-white/[0.015]">

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.15,
          }}
          className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.9fr_1.15fr] lg:px-8 lg:py-16"
        >

          {/* =================================================
              MARQUE
          ================================================= */}

          <motion.div variants={itemVariants}>

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

            {/* =============================================
                RÉSEAUX SOCIAUX
            ============================================= */}

            <div className="mt-7">

              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
                Suivez-nous
              </p>

              <div className="flex flex-wrap items-center gap-3">

                {/* Facebook */}

                <SocialLink
                  href={FACEBOOK_URL}
                  label="Facebook BricoMénage"
                  icon={Facebook}
                  external
                />

                {/* Instagram */}

                <SocialLink
                  href={INSTAGRAM_URL}
                  label="Instagram BricoMénage"
                  icon={Instagram}
                  external
                />

                {/* TikTok */}

                <SocialLink
                  href={TIKTOK_URL}
                  label="TikTok BricoMénage"
                  icon={Music2}
                  external
                />

                {/* Google Maps */}

                <SocialLink
                  href={GOOGLE_MAPS_URL}
                  label="Google Maps BricoMénage"
                  icon={MapPinned}
                  external
                />

              </div>

            </div>

          </motion.div>

          {/* =================================================
              NAVIGATION
          ================================================= */}

          <motion.div variants={itemVariants}>

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

          {/* =================================================
              CATÉGORIES
          ================================================= */}

          <motion.div variants={itemVariants}>

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

          {/* =================================================
              CONTACT
          ================================================= */}

          <motion.div variants={itemVariants}>

            <FooterTitle>
              Nous contacter
            </FooterTitle>

            <div className="mt-7 space-y-3">

              {/* ADRESSE */}

              <ContactCard
                icon={MapPin}
                label="Notre adresse"
                value={STORE_ADDRESS}
                href={GOOGLE_MAPS_URL}
                external
              />

              {/* TÉLÉPHONE 1 */}

              <ContactCard
                icon={Phone}
                label="Téléphone 1"
                value={PHONE_1_DISPLAY}
                href={PHONE_1_URL}
              />

              {/* TÉLÉPHONE 2 */}

              <ContactCard
                icon={Phone}
                label="Téléphone 2"
                value={PHONE_2_DISPLAY}
                href={PHONE_2_URL}
              />

              {/* HORAIRES */}

              <ContactCard
                icon={Clock3}
                label="Disponibilité"
                value="Samedi – Jeudi"
              />

              {/* GOOGLE MAPS */}

              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 text-sm font-black text-orange-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-500 hover:bg-orange-500 hover:text-white"
              >

                <MapPinned className="h-4 w-4" />

                Ouvrir dans Google Maps

              </a>

            </div>

          </motion.div>

        </motion.div>

      </div>

      {/* =====================================================
          GOOGLE MAPS
      ===================================================== */}

      <div className="relative border-t border-white/10">

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.025] shadow-2xl">

            {/* ENTÊTE MAP */}

            <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-4">

                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-500">

                  <MapPinned className="h-6 w-6" />

                </span>

                <div>

                  <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-orange-500">
                    Notre emplacement
                  </span>

                  <h3 className="mt-1 text-lg font-black text-white">
                    BricoMénage — Es Sénia
                  </h3>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-zinc-500">
                    {STORE_ADDRESS}
                  </p>

                </div>

              </div>

              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-600"
              >

                <MapPin className="h-4 w-4" />

                Ouvrir dans Google Maps

              </a>

            </div>

            {/* MAP */}

            <div className="relative h-[280px] w-full sm:h-[340px]">

              <iframe
                src={GOOGLE_MAPS_EMBED_URL}
                title="Localisation BricoMénage - 136 Rue Marhaba Es Sénia"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0"
                allowFullScreen
              />

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          BANDE CONTACT RAPIDE
      ===================================================== */}

      <div className="relative border-t border-white/10 bg-white/[0.015]">

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">

          <div>

            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Besoin d’un renseignement ?
            </p>

            <p className="mt-1 text-sm text-zinc-400">
              Contactez directement notre équipe BricoMénage.
            </p>

          </div>

          <div className="flex flex-col gap-2 sm:flex-row">

            <a
              href={PHONE_1_URL}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition-all hover:border-orange-500 hover:bg-orange-500"
            >

              <Phone className="h-4 w-4" />

              {PHONE_1_DISPLAY}

            </a>

            <a
              href={PHONE_2_URL}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition-all hover:border-orange-500 hover:bg-orange-500"
            >

              <Phone className="h-4 w-4" />

              {PHONE_2_DISPLAY}

            </a>

          </div>

        </div>

      </div>

      {/* =====================================================
          BAS DU FOOTER
      ===================================================== */}

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

/* =========================================================
   FOOTER TITLE
========================================================= */

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

/* =========================================================
   FOOTER LINK
========================================================= */

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

/* =========================================================
   CONTACT CARD
========================================================= */

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
    <div className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.025] p-3 transition-all duration-300 hover:border-orange-500/20 hover:bg-orange-500/[0.05]">

      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 transition-all group-hover:bg-orange-500 group-hover:text-white">

        <Icon className="h-4 w-4" />

      </span>

      <span className="min-w-0">

        <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          {label}
        </span>

        <strong className="mt-1 block text-sm font-semibold leading-5 text-zinc-300 transition-colors group-hover:text-white">
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
            ? "noopener noreferrer"
            : undefined
        }
      >
        {content}
      </a>
    );
  }

  return content;
}

/* =========================================================
   SOCIAL LINK
========================================================= */

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
      title={label}
      target={
        external
          ? "_blank"
          : undefined
      }
      rel={
        external
          ? "noopener noreferrer"
          : undefined
      }
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white"
    >
      <Icon className="h-5 w-5" />
    </motion.a>
  );
}