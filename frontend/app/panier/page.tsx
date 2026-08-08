
"use client";

import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ImageIcon,
  Minus,
  PackageOpen,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type CartItem,
  getCart,
  saveCart,
} from "@/lib/cart";

import {
  API_URL,
} from "@/lib/api";

import {
  catalogApi,
} from "@/lib/catalog";

function formatPrice(value: number) {
  return new Intl.NumberFormat(
    "fr-DZ",
  ).format(value);
}

function productImageUrl(
  value?: string | null,
) {
  if (!value) {
    return "";
  }

  if (
    value.startsWith(
      "http://",
    ) ||
    value.startsWith(
      "https://",
    ) ||
    value.startsWith(
      "data:",
    )
  ) {
    return value;
  }

  const apiOrigin =
    API_URL.replace(
      /\/api\/?$/,
      "",
    );

  const normalized =
    value.startsWith("/")
      ? value
      : `/${value.replace(
          /^\/+/,
          "",
        )}`;

  if (
    normalized.startsWith(
      "/uploads/",
    )
  ) {
    return `${apiOrigin}${normalized}`;
  }

  return normalized;
}

function PackPhotoLayout({
  images,
  fallback,
  title,
}: {
  images: string[];
  fallback?: string;
  title: string;
}) {
  const normalized =
    Array.from(
      new Set(
        images
          .map(
            productImageUrl,
          )
          .filter(Boolean),
      ),
    ).slice(0, 4);

  if (
    normalized.length === 0 &&
    fallback
  ) {
    normalized.push(
      productImageUrl(
        fallback,
      ),
    );
  }

  if (
    normalized.length === 0
  ) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <PackageOpen className="h-10 w-10 text-zinc-300" />
      </div>
    );
  }

  if (
    normalized.length === 1
  ) {
    return (
      <img
        src={normalized[0]}
        alt={title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 bg-white">
      {normalized.map(
        (image, index) => (
          <div
            key={`${image}-${index}`}
            className={`overflow-hidden bg-zinc-100 ${
              normalized.length ===
                2
                ? "row-span-2"
                : normalized.length ===
                      3 &&
                    index === 0
                  ? "row-span-2"
                  : ""
            }`}
          >
            <img
              src={image}
              alt={`${title} - produit ${
                index + 1
              }`}
              className="h-full w-full object-cover"
            />
          </div>
        ),
      )}
    </div>
  );
}

export default function Cart() {
  const [items, setItems] =
    useState<CartItem[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function loadCart() {
      try {
        const saved =
          getCart();

        if (active) {
          setItems(saved);
        }

        /*
         * Les anciens paniers peuvent
         * ne pas encore contenir la
         * composition du pack.
         *
         * On la récupère automatiquement
         * depuis l'API.
         */
        const enriched =
          await Promise.all(
            saved.map(
              async (item) => {
                if (
                  item.item_type !==
                    "PACK" ||
                  !item.slug ||
                  (
                    item.pack_components ||
                    []
                  ).length > 0
                ) {
                  return item;
                }

                try {
                  const response =
                    await catalogApi.packBySlug(
                      item.slug,
                    );

                  const pack =
                    response.pack as {
                      image?: string | null;
                      articles?: Array<{
                        id: number;
                        slug?: string;
                        designation: string;
                        image?: string | null;
                        quantity?: number;
                      }>;
                    };

                  return {
                    ...item,
                    image:
                      pack.image ||
                      item.image,

                    pack_components:
                      (
                        pack.articles ||
                        []
                      ).map(
                        (
                          article,
                        ) => ({
                          article_id:
                            Number(
                              article.id,
                            ),
                          slug:
                            article.slug,
                          designation:
                            article.designation,
                          image:
                            article.image ||
                            undefined,
                          quantity_per_pack:
                            Number(
                              article.quantity ||
                                1,
                            ),
                        }),
                      ),
                  };
                } catch {
                  return item;
                }
              },
            ),
          );

        if (active) {
          setItems(enriched);

          if (
            JSON.stringify(
              enriched,
            ) !==
            JSON.stringify(
              saved,
            )
          ) {
            saveCart(enriched);
          }
        }
      } catch {
        if (active) {
          setItems([]);
        }
      } finally {
        if (active) {
          setLoaded(true);
        }
      }
    }

    void loadCart();

    return () => {
      active = false;
    };
  }, []);

  function persistCart(
    nextItems: CartItem[],
  ) {
    setItems(nextItems);
    saveCart(nextItems);

    window.dispatchEvent(
      new Event("cart-change"),
    );
  }

  function updateQuantity(
    id: number,
    quantity: number,
  ) {
    const safeQuantity = Math.max(
      1,
      Math.floor(
        Number.isFinite(quantity)
          ? quantity
          : 1,
      ),
    );

    const target =
      items.find(
        (item) =>
          item.id === id,
      );

    const nextItems =
      items.map(
        (item) =>
          item.id === id &&
          (
            !target ||
            item.item_type ===
              target.item_type
          )
            ? {
                ...item,
                quantity:
                  safeQuantity,
              }
            : item,
      );

    persistCart(nextItems);
  }

  function incrementQuantity(
    item: CartItem,
  ) {
    updateQuantity(
      item.id,
      item.quantity + 1,
    );
  }

  function decrementQuantity(
    item: CartItem,
  ) {
    updateQuantity(
      item.id,
      item.quantity - 1,
    );
  }

  function removeItem(
    target: CartItem,
  ) {
    const nextItems =
      items.filter(
        (item) =>
          !(
            item.id ===
              target.id &&
            item.item_type ===
              target.item_type
          ),
      );

    persistCart(nextItems);
  }

  function clearCart() {
    persistCart([]);
  }

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

  const deliveryPrice = 0;
  const total =
    subtotal + deliveryPrice;

  if (!loaded) {
    return <CartLoading />;
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* En-tête */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="absolute -bottom-28 left-20 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl" />

          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.022)_1px,transparent_1px)] bg-[size:55px_55px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Link
            href="/articles"
            className="group inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition-colors hover:text-orange-500"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />

            Continuer mes achats
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                <ShoppingBag className="h-4 w-4" />

                Votre sélection
              </span>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
                Votre panier
              </h1>

              <p className="mt-3 text-sm leading-7 text-zinc-500 sm:text-base">
                Vérifiez vos articles avant
                de finaliser votre commande.
              </p>
            </div>

            {items.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
                <span className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Articles sélectionnés
                </span>

                <strong className="mt-1 block text-2xl font-black text-zinc-950">
                  {totalQuantity}
                </strong>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
            {/* Liste des articles */}
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-zinc-950">
                    Articles du panier
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    {items.length}{" "}
                    {items.length > 1
                      ? "produits différents"
                      : "produit"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />

                  <span className="hidden sm:inline">
                    Vider le panier
                  </span>
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <CartProduct
                    key={item.id}
                    item={item}
                    onIncrement={() =>
                      incrementQuantity(
                        item,
                      )
                    }
                    onDecrement={() =>
                      decrementQuantity(
                        item,
                      )
                    }
                    onQuantityChange={(
                      quantity,
                    ) =>
                      updateQuantity(
                        item.id,
                        quantity,
                      )
                    }
                    onRemove={() =>
                      removeItem(item)
                    }
                  />
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  icon={Truck}
                  title="Livraison nationale"
                  description="Nous livrons vos commandes partout en Algérie."
                />

                <InfoCard
                  icon={ShieldCheck}
                  title="Paiement sécurisé"
                  description="Réglez simplement votre commande à la livraison."
                />
              </div>
            </div>

            {/* Résumé */}
            <aside className="lg:sticky lg:top-28">
              <div className="overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(24,24,27,0.08)]">
                <div className="relative overflow-hidden bg-zinc-950 px-6 py-7 text-white">
                  <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />

                  <div className="relative">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
                      <ShoppingBag className="h-6 w-6" />
                    </span>

                    <h2 className="mt-5 text-2xl font-black">
                      Résumé
                    </h2>

                    <p className="mt-2 text-sm text-zinc-400">
                      Détails de votre
                      commande
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4 border-b border-zinc-200 pb-6">
                    <SummaryRow
                      label={`Sous-total (${totalQuantity} article${
                        totalQuantity > 1
                          ? "s"
                          : ""
                      })`}
                      value={`${formatPrice(
                        subtotal,
                      )} DA`}
                    />

                    <SummaryRow
                      label="Livraison"
                      value="À confirmer"
                      valueClassName="text-emerald-600"
                    />

                    <SummaryRow
                      label="Paiement"
                      value="À la livraison"
                    />
                  </div>

                  <div className="flex items-end justify-between gap-4 py-6">
                    <div>
                      <span className="block text-sm font-bold text-zinc-500">
                        Total
                      </span>

                      <span className="mt-1 block text-xs text-zinc-400">
                        Hors frais de
                        livraison
                      </span>
                    </div>

                    <strong className="text-right text-3xl font-black text-zinc-950">
                      {formatPrice(total)}
                      <span className="ml-1 text-base text-orange-500">
                        DA
                      </span>
                    </strong>
                  </div>

                  <Link
                    href="/commande"
                    className="group flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/35"
                  >
                    Passer la commande

                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/articles"
                    className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 text-sm font-bold text-zinc-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Continuer mes achats
                  </Link>

                  <div className="mt-6 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                    <p className="text-xs leading-5 text-emerald-700">
                      Votre panier est
                      sauvegardé automatiquement
                      sur cet appareil.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

interface CartProductProps {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onQuantityChange: (
    quantity: number,
  ) => void;
  onRemove: () => void;
}

function CartProduct({
  item,
  onIncrement,
  onDecrement,
  onQuantityChange,
  onRemove,
}: CartProductProps) {
  const lineTotal =
    Number(item.price) *
    Number(item.quantity);

  const detailHref =
    item.item_type === "PACK"
      ? `/pack/?slug=${encodeURIComponent(
          item.slug || "",
        )}`
      : item.slug
        ? `/article/?slug=${encodeURIComponent(
            item.slug,
          )}`
        : `/produit/?id=${item.id}`;

  const componentImages =
    (
      item.pack_components ||
      []
    )
      .map(
        (component) =>
          component.image ||
          "",
      )
      .filter(Boolean);

  return (
    <article className="group relative overflow-hidden rounded-[26px] border border-zinc-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 sm:p-5">
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 group-hover:w-full" />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* Visuel */}
        <Link
          href={detailHref}
          className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100 sm:h-32 sm:w-32"
        >
          {item.item_type ===
          "PACK" ? (
            <PackPhotoLayout
              images={
                componentImages
              }
              fallback={
                item.image
              }
              title={
                item.designation
              }
            />
          ) : item.image ? (
            <img
              src={productImageUrl(
                item.image,
              )}
              alt={
                item.designation
              }
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <PackageOpen className="h-10 w-10 text-zinc-300" />
          )}
        </Link>

        {/* Informations */}
        <div className="min-w-0 flex-1">
          {item.item_type && (
            <span className="mb-2 inline-flex rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-orange-600">
              {item.item_type === "PACK"
                ? "Pack"
                : "Article"}
            </span>
          )}

          <Link
            href={detailHref}
            className="block"
          >
            <h3 className="line-clamp-2 text-lg font-black leading-6 text-zinc-950 transition-colors group-hover:text-orange-600">
              {item.designation}
            </h3>
          </Link>

          <p className="mt-2 text-sm font-bold text-zinc-500">
            {formatPrice(item.price)} DA
            <span className="font-normal">
              {" "}
              / unité
            </span>
          </p>
          {item.item_type ===
            "PACK" &&
            (
              item.pack_components ||
              []
            ).length > 0 && (
              <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.13em] text-orange-600">
                    Produits inclus
                  </span>

                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-zinc-600 ring-1 ring-orange-100">
                    {
                      item
                        .pack_components
                        ?.length
                    }{" "}
                    produit
                    {(item
                      .pack_components
                      ?.length ||
                      0) > 1
                      ? "s"
                      : ""}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {item.pack_components?.map(
                    (
                      component,
                    ) => (
                      <div
                        key={
                          component.article_id
                        }
                        className="flex min-w-0 items-center gap-2 rounded-xl border border-orange-100 bg-white p-2"
                      >
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                          {component.image ? (
                            <img
                              src={productImageUrl(
                                component.image,
                              )}
                              alt={
                                component.designation
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-zinc-300" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <strong className="block truncate text-[11px] font-black text-zinc-900">
                            {
                              component.designation
                            }
                          </strong>

                          <span className="mt-0.5 block text-[10px] font-bold text-orange-600">
                            {
                              component.quantity_per_pack
                            }{" "}
                            × par pack
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          <button
            type="button"
            onClick={onRemove}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 transition-colors hover:text-red-600 sm:hidden"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>

        {/* Quantité */}
        <div className="flex items-center justify-between gap-5 sm:justify-end">
          <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-1">
            <button
              type="button"
              onClick={onDecrement}
              disabled={
                item.quantity <= 1
              }
              aria-label="Diminuer la quantité"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Minus className="h-4 w-4" />
            </button>

            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(event) =>
                onQuantityChange(
                  Number(
                    event.target.value,
                  ),
                )
              }
              aria-label={`Quantité de ${item.designation}`}
              className="h-9 w-12 bg-transparent text-center text-sm font-black text-zinc-950 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />

            <button
              type="button"
              onClick={onIncrement}
              aria-label="Augmenter la quantité"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white hover:text-orange-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="min-w-[115px] text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Total
            </span>

            <strong className="mt-1 block text-lg font-black text-zinc-950">
              {formatPrice(lineTotal)}
              <span className="ml-1 text-xs text-orange-500">
                DA
              </span>
            </strong>
          </div>

          <button
            type="button"
            onClick={onRemove}
            aria-label={`Supprimer ${item.designation}`}
            className="hidden h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-all hover:bg-red-50 hover:text-red-600 sm:flex"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  valueClassName?: string;
}

function SummaryRow({
  label,
  value,
  valueClassName = "",
}: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-zinc-500">
        {label}
      </span>

      <strong
        className={`text-right font-bold text-zinc-950 ${valueClassName}`}
      >
        {value}
      </strong>
    </div>
  );
}

interface InfoCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: InfoCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        <Icon className="h-5 w-5" />
      </span>

      <div>
        <strong className="block text-sm font-black text-zinc-950">
          {title}
        </strong>

        <p className="mt-1 text-xs leading-5 text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="relative overflow-hidden rounded-[36px] border border-zinc-200 bg-white px-6 py-16 text-center shadow-sm sm:py-20">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-lg">
        <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] bg-orange-50 text-orange-500">
          <ShoppingBag className="h-12 w-12" />
        </span>

        <h2 className="mt-7 text-3xl font-black tracking-tight text-zinc-950">
          Votre panier est vide
        </h2>

        <p className="mt-4 text-sm leading-7 text-zinc-500 sm:text-base">
          Vous n’avez encore ajouté aucun
          article. Découvrez notre catalogue
          et trouvez le matériel adapté à
          vos projets.
        </p>

        <Link
          href="/articles"
          className="group mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-7 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/35"
        >
          Découvrir les articles

          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

function CartLoading() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-zinc-200" />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {Array.from({
              length: 3,
            }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-[26px] border border-zinc-200 bg-white"
              />
            ))}
          </div>

          <div className="h-[480px] animate-pulse rounded-[30px] border border-zinc-200 bg-white" />
        </div>
      </div>
    </main>
  );
}

