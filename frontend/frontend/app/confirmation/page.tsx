"use client";

import Link from "next/link";
import {
  useSearchParams,
} from "next/navigation";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Home,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

function ConfirmationContent() {
  const searchParams =
    useSearchParams();

  const tracking =
    searchParams.get("tracking") ||
    "";

  const [copied, setCopied] =
    useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  async function copyTrackingNumber() {
    if (!tracking) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        tracking,
      );

      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-50">
      {/* Décoration */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.12, 1],
            opacity: [
              0.12,
              0.22,
              0.12,
            ],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-32 -top-32 h-[430px] w-[430px] rounded-full bg-orange-500 blur-[130px]"
        />

        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [
              0.08,
              0.16,
              0.08,
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-40 -left-32 h-[430px] w-[430px] rounded-full bg-emerald-500 blur-[140px]"
        />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[size:55px_55px]" />
      </div>

      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-14 sm:px-6 lg:px-8">
        <motion.div
          initial={{
            opacity: 0,
            y: 35,
            scale: 0.96,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.65,
            ease: "easeOut",
          }}
          className="w-full max-w-3xl"
        >
          <div className="relative overflow-hidden rounded-[36px] border border-zinc-200 bg-white shadow-[0_30px_90px_rgba(24,24,27,0.12)]">
            {/* Bande supérieure */}
            <div className="relative overflow-hidden bg-zinc-950 px-6 py-10 text-center text-white sm:px-10 sm:py-12">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />

              <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />

              <div className="relative">
                <motion.div
                  initial={{
                    scale: 0,
                    rotate: -90,
                  }}
                  animate={{
                    scale: 1,
                    rotate: 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 18,
                    delay: 0.15,
                  }}
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-2xl shadow-emerald-500/30"
                >
                  <CheckCircle2 className="h-12 w-12" />
                </motion.div>

                <motion.span
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.3,
                  }}
                  className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-300 backdrop-blur"
                >
                  <Check className="h-4 w-4" />
                  Commande confirmée
                </motion.span>

                <motion.h1
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.4,
                  }}
                  className="mt-5 text-3xl font-black tracking-tight sm:text-5xl"
                >
                  Commande enregistrée
                </motion.h1>

                <motion.p
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.5,
                  }}
                  className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base"
                >
                  Votre commande a bien été
                  prise en compte. Conservez
                  votre numéro de suivi afin
                  de consulter son avancement.
                </motion.p>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6 sm:p-9">
              <div className="rounded-[28px] border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="block text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                      Numéro de suivi
                    </span>

                    <code className="mt-3 block break-all font-mono text-2xl font-black tracking-wide text-zinc-950 sm:text-3xl">
                      {tracking ||
                        "Indisponible"}
                    </code>
                  </div>

                  <button
                    type="button"
                    onClick={
                      copyTrackingNumber
                    }
                    disabled={!tracking}
                    className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-black text-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <AnimatePresence
                      mode="wait"
                      initial={false}
                    >
                      {copied ? (
                        <motion.span
                          key="copied"
                          initial={{
                            opacity: 0,
                            y: 6,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            y: -6,
                          }}
                          className="flex items-center gap-2"
                        >
                          <Check className="h-4 w-4 text-emerald-600" />
                          Copié
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{
                            opacity: 0,
                            y: 6,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            y: -6,
                          }}
                          className="flex items-center gap-2"
                        >
                          <Clipboard className="h-4 w-4" />
                          Copier
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </div>

              {/* Étapes */}
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                <ConfirmationStep
                  icon={PackageCheck}
                  title="Commande reçue"
                  description="Votre commande est enregistrée."
                  active
                />

                <ConfirmationStep
                  icon={Truck}
                  title="Préparation"
                  description="Elle sera préparée prochainement."
                />

                <ConfirmationStep
                  icon={ShieldCheck}
                  title="Livraison"
                  description="Paiement lors de la réception."
                />
              </div>

              {/* Actions */}
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link
                  href={
                    tracking
                      ? `/suivi-commande/?tracking=${encodeURIComponent(
                          tracking,
                        )}`
                      : "/suivi-commande"
                  }
                  className="group flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/35"
                >
                  Suivre la commande

                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/"
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 text-sm font-black text-zinc-700 transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                >
                  <Home className="h-5 w-5" />

                  Retour à l’accueil
                </Link>
              </div>

              <div className="mt-7 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                <p className="text-sm leading-6 text-emerald-700">
                  Le paiement s’effectuera à
                  la livraison. Aucun paiement
                  en ligne n’est demandé.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

interface ConfirmationStepProps {
  icon: React.ElementType;
  title: string;
  description: string;
  active?: boolean;
}

function ConfirmationStep({
  icon: Icon,
  title,
  description,
  active = false,
}: ConfirmationStepProps) {
  return (
    <div
      className={`rounded-[24px] border p-5 transition-all ${
        active
          ? "border-emerald-200 bg-emerald-50"
          : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          active
            ? "bg-emerald-500 text-white"
            : "bg-white text-zinc-500"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>

      <h3 className="mt-4 text-sm font-black text-zinc-950">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function ConfirmationLoading() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-14">
        <div className="h-[650px] w-full animate-pulse rounded-[36px] bg-zinc-200" />
      </div>
    </main>
  );
}

function ConfirmationPageContent() {
  return (
    <Suspense
      fallback={
        <ConfirmationLoading />
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<PageSearchParamsLoading />}>
      <ConfirmationPageContent />
    </Suspense>
  );
}

function PageSearchParamsLoading() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-zinc-200" />
        <div className="mt-6 h-64 animate-pulse rounded-[28px] bg-zinc-100" />
      </div>
    </main>
  );
}
