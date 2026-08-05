"use client";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";

import {
  apiFetch,
} from "@/lib/api";

import {
  type CartItem,
  getCart,
  saveCart,
} from "@/lib/cart";

function formatPrice(
  value: number,
) {
  return new Intl.NumberFormat(
    "fr-DZ",
  ).format(value);
}

export default function Checkout() {
  const router =
    useRouter();

  const [items, setItems] =
    useState<CartItem[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [loaded, setLoaded] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    try {
      setItems(getCart());
    } catch {
      setItems([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  const totalQuantity = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          Number(item.quantity),
        0,
      ),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          Number(item.price) *
            Number(item.quantity),
        0,
      ),
    [items],
  );

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!items.length) {
      setError(
        "Votre panier est vide.",
      );
      return;
    }

    setLoading(true);
    setError("");

    const form = new FormData(
      event.currentTarget,
    );

    try {
      const response =
        await apiFetch<{
          trackingNumber: string;
        }>("/orders", {
          method: "POST",
          body: JSON.stringify({
            customerName:
              String(
                form.get("name") ||
                  "",
              ).trim(),

            phone:
              String(
                form.get("phone") ||
                  "",
              ).trim(),

            wilaya:
              String(
                form.get("wilaya") ||
                  "",
              ).trim(),

            commune:
              String(
                form.get("commune") ||
                  "",
              ).trim(),

            address:
              String(
                form.get("address") ||
                  "",
              ).trim(),

            note:
              String(
                form.get("note") ||
                  "",
              ).trim(),

            items: items.map(
              (item) => ({
                articleId:
                  item.id,

                quantity:
                  item.quantity,
              }),
            ),
          }),
        });

      saveCart([]);

      window.dispatchEvent(
        new Event(
          "cart-change",
        ),
      );

      router.push(
        `/confirmation/?tracking=${encodeURIComponent(
          response.trackingNumber,
        )}`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Une erreur est survenue pendant l’enregistrement de la commande.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!loaded) {
    return (
      <CheckoutLoading />
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* En-tête */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="absolute -bottom-28 left-20 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl" />

          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.022)_1px,transparent_1px)] bg-[size:55px_55px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Link
            href="/panier"
            className="group inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition-colors hover:text-orange-500"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />

            Retour au panier
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                <ClipboardList className="h-4 w-4" />

                Dernière étape
              </span>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
                Finaliser votre
                <span className="block text-orange-500">
                  commande
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-8 text-zinc-600">
                Renseignez vos informations
                de livraison puis confirmez
                votre commande. Le paiement
                s’effectue à la livraison.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[430px]">
              <CheckoutStat
                value={items.length}
                label="Produits"
              />

              <CheckoutStat
                value={totalQuantity}
                label="Quantité"
              />

              <CheckoutStat
                value={`${formatPrice(
                  subtotal,
                )} DA`}
                label="Total"
                className="col-span-2 sm:col-span-1"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-start gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_390px] lg:px-8 lg:py-14">
        {/* Formulaire */}
        <div className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(24,24,27,0.07)]">
          <div className="border-b border-zinc-200 px-5 py-6 sm:px-7">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <UserRound className="h-6 w-6" />
              </span>

              <div>
                <h2 className="text-xl font-black text-zinc-950 sm:text-2xl">
                  Informations de livraison
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Vérifiez vos informations
                  avant de confirmer.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="p-5 sm:p-7"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label="Nom et prénom"
                name="name"
                placeholder="Ex. Amine Benali"
                icon={UserRound}
                autoComplete="name"
                required
              />

              <FormField
                label="Téléphone"
                name="phone"
                type="tel"
                placeholder="Ex. 0550 00 00 00"
                icon={Phone}
                autoComplete="tel"
                required
              />

              <FormField
                label="Wilaya"
                name="wilaya"
                placeholder="Ex. Oran"
                icon={MapPin}
                autoComplete="address-level1"
                required
              />

              <FormField
                label="Commune"
                name="commune"
                placeholder="Ex. Bir El Djir"
                icon={MapPin}
                autoComplete="address-level2"
                required
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-black text-zinc-800"
              >
                Adresse complète
              </label>

              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-zinc-400" />

                <textarea
                  id="address"
                  name="address"
                  required
                  rows={4}
                  placeholder="Quartier, rue, numéro, point de repère..."
                  className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 py-4 pl-12 pr-4 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="note"
                className="mb-2 block text-sm font-black text-zinc-800"
              >
                Remarque
                <span className="ml-2 font-normal text-zinc-400">
                  facultatif
                </span>
              </label>

              <textarea
                id="note"
                name="note"
                rows={3}
                placeholder="Instructions supplémentaires pour la livraison..."
                className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                <p className="text-sm leading-6 text-emerald-700">
                  En confirmant, votre commande
                  sera enregistrée et un numéro
                  de suivi vous sera attribué.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                !items.length
              }
              className="group mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  Confirmer la commande

                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Résumé */}
        <aside className="lg:sticky lg:top-28">
          <div className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(24,24,27,0.08)]">
            <div className="relative overflow-hidden bg-zinc-950 px-6 py-7 text-white">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-500/20 blur-3xl" />

              <div className="relative">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/25">
                  <ShoppingBag className="h-6 w-6" />
                </span>

                <h2 className="mt-5 text-2xl font-black">
                  Votre commande
                </h2>

                <p className="mt-2 text-sm text-zinc-400">
                  Vérifiez les articles et
                  les quantités.
                </p>
              </div>
            </div>

            <div className="p-6">
              {items.length > 0 ? (
                <div className="max-h-[320px] space-y-4 overflow-y-auto pr-1">
                  {items.map(
                    (item) => (
                      <OrderItem
                        key={item.id}
                        item={item}
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-zinc-50 px-4 py-8 text-center">
                  <ShoppingBag className="mx-auto h-10 w-10 text-zinc-300" />

                  <p className="mt-3 text-sm font-semibold text-zinc-500">
                    Votre panier est vide.
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-4 border-t border-zinc-200 pt-6">
                <SummaryLine
                  label={`Sous-total (${totalQuantity} article${
                    totalQuantity > 1
                      ? "s"
                      : ""
                  })`}
                  value={`${formatPrice(
                    subtotal,
                  )} DA`}
                />

                <SummaryLine
                  label="Livraison"
                  value="À confirmer"
                  valueClassName="text-emerald-600"
                />

                <SummaryLine
                  label="Mode de paiement"
                  value="À la livraison"
                />
              </div>

              <div className="mt-6 flex items-end justify-between gap-4 border-t border-zinc-200 pt-6">
                <div>
                  <span className="block text-sm font-bold text-zinc-500">
                    Total
                  </span>

                  <span className="mt-1 block text-xs text-zinc-400">
                    Hors frais de livraison
                  </span>
                </div>

                <strong className="text-right text-3xl font-black text-zinc-950">
                  {formatPrice(
                    subtotal,
                  )}
                  <span className="ml-1 text-base text-orange-500">
                    DA
                  </span>
                </strong>
              </div>

              <div className="mt-6 grid gap-3">
                <CheckoutInfo
                  icon={CreditCard}
                  title="Paiement"
                  description="À la livraison"
                />

                <CheckoutInfo
                  icon={Truck}
                  title="Livraison"
                  description="Dans toute l’Algérie"
                />

                <CheckoutInfo
                  icon={ShieldCheck}
                  title="Commande"
                  description="Données sécurisées"
                />
              </div>

              <Link
                href="/panier"
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
              >
                Modifier le panier
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  placeholder: string;
  icon: React.ElementType;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}

function FormField({
  label,
  name,
  placeholder,
  icon: Icon,
  type = "text",
  autoComplete,
  required = false,
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-zinc-800">
        {label}
      </span>

      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

        <input
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="min-h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-4 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
        />
      </span>
    </label>
  );
}

interface OrderItemProps {
  item: CartItem;
}

function OrderItem({
  item,
}: OrderItemProps) {
  const total =
    Number(item.price) *
    Number(item.quantity);

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-100">
        {"image" in item &&
        typeof item.image ===
          "string" &&
        item.image ? (
          <img
            src={item.image}
            alt={item.designation}
            className="h-full w-full object-cover"
          />
        ) : (
          <PackageCheck className="h-6 w-6 text-zinc-300" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-black text-zinc-900">
          {item.designation}
        </h3>

        <p className="mt-1 text-xs text-zinc-500">
          {formatPrice(
            item.price,
          )}{" "}
          DA × {item.quantity}
        </p>
      </div>

      <strong className="shrink-0 text-sm font-black text-zinc-950">
        {formatPrice(total)} DA
      </strong>
    </div>
  );
}

interface SummaryLineProps {
  label: string;
  value: string;
  valueClassName?: string;
}

function SummaryLine({
  label,
  value,
  valueClassName = "",
}: SummaryLineProps) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-zinc-500">
        {label}
      </span>

      <strong
        className={`text-right text-zinc-950 ${valueClassName}`}
      >
        {value}
      </strong>
    </div>
  );
}

interface CheckoutInfoProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function CheckoutInfo({
  icon: Icon,
  title,
  description,
}: CheckoutInfoProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        <Icon className="h-5 w-5" />
      </span>

      <div>
        <strong className="block text-xs font-black text-zinc-900">
          {title}
        </strong>

        <span className="mt-1 block text-[10px] text-zinc-500">
          {description}
        </span>
      </div>
    </div>
  );
}

interface CheckoutStatProps {
  value: string | number;
  label: string;
  className?: string;
}

function CheckoutStat({
  value,
  label,
  className = "",
}: CheckoutStatProps) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur ${className}`}
    >
      <strong className="block text-xl font-black text-zinc-950">
        {value}
      </strong>

      <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        {label}
      </span>
    </div>
  );
}

function CheckoutLoading() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_390px] lg:px-8">
        <div className="h-[650px] animate-pulse rounded-[32px] bg-zinc-200" />

        <div className="h-[620px] animate-pulse rounded-[32px] bg-zinc-200" />
      </div>
    </main>
  );
}