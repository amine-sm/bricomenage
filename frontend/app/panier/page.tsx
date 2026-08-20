
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
    <main className="min-h-screen bg-zinc-50 pb-24 lg:pb-0">
      {/* En-tête */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="absolute -bottom-28 left-20 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl" />

          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.022)_1px,transparent_1px)] bg-[size:55px_55px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8 lg:py-14">
          <Link
            href="/articles"
            className="group inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition-colors hover:text-orange-500"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />

            Continuer mes achats / متابعة التسوق
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-4 sm:mt-7 md:flex-row md:items-end md:gap-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                <ShoppingBag className="h-4 w-4" />

                Votre sélection / اختياراتك
              </span>

              <h1 className="mt-4 text-[2rem] font-black leading-tight tracking-tight text-zinc-950 sm:mt-5 sm:text-5xl">
                Votre panier / سلة التسوق
              </h1>

              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-zinc-500 sm:mt-3 sm:text-base sm:leading-7">
                Vérifiez vos articles avant
                de finaliser votre commande. / راجع منتجاتك قبل تأكيد طلبك.
              </p>
            </div>

            {items.length > 0 && (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:block sm:px-5 sm:py-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 sm:block sm:text-xs">
                  Articles sélectionnés / المنتجات المختارة
                </span>

                <strong className="text-xl font-black text-zinc-950 sm:mt-1 sm:block sm:text-2xl">
                  {totalQuantity}
                </strong>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-9 lg:px-8 lg:py-14">
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
            {/* Liste des articles */}
            <div>
              <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
                <div>
                  <h2 className="text-lg font-black text-zinc-950 sm:text-xl">
                    Articles du panier / منتجات السلة
                  </h2>

                  <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm">
                    {items.length}{" "}
                    {items.length > 1
                      ? "produits différents / منتجات مختلفة"
                      : "produit / منتج"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:h-auto sm:w-auto sm:border-0 sm:bg-transparent sm:px-3 sm:py-2 sm:text-sm"
                >
                  <Trash2 className="h-4 w-4" />

                  <span className="hidden sm:inline">
                    Vider le panier / إفراغ السلة
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

              <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
                <InfoCard
                  icon={Truck}
                  title="Livraison nationale / التوصيل إلى جميع الولايات"
                  description="Nous livrons vos commandes partout en Algérie. / نوصل طلباتكم إلى جميع أنحاء الجزائر."
                />

                <InfoCard
                  icon={ShieldCheck}
                  title="Paiement sécurisé / دفع آمن"
                  description="Réglez simplement votre commande à la livraison. / ادفع بكل بساطة عند استلام الطلب."
                />
              </div>
            </div>

            {/* Résumé / ملخص الطلب */}
            <aside className="lg:sticky lg:top-28">
              <div className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_16px_45px_rgba(24,24,27,0.07)] sm:rounded-[30px] sm:shadow-[0_20px_60px_rgba(24,24,27,0.08)]">
                <div className="relative overflow-hidden bg-zinc-950 px-4 py-5 text-white sm:px-6 sm:py-7">
                  <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />

                  <div className="relative">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/25 sm:h-12 sm:w-12 sm:rounded-2xl">
                      <ShoppingBag className="h-6 w-6" />
                    </span>

                    <h2 className="mt-3 text-xl font-black sm:mt-5 sm:text-2xl">
                      Résumé / ملخص الطلب
                    </h2>

                    <p className="mt-1 text-xs text-zinc-400 sm:mt-2 sm:text-sm">
                      Détails de votre
                      commande / تفاصيل طلبك
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="space-y-3 border-b border-zinc-200 pb-4 sm:space-y-4 sm:pb-6">
                    <SummaryRow
                      label={`Sous-total / المجموع الفرعي (${totalQuantity} article${
                        totalQuantity > 1
                          ? "s"
                          : ""
                      })`}
                      value={`${formatPrice(
                        subtotal,
                      )} DA`}
                    />

                    <SummaryRow
                      label="Livraison / التوصيل"
                      value="À confirmer / يحدد لاحقًا"
                      valueClassName="text-emerald-600"
                    />

                    <SummaryRow
                      label="Paiement / الدفع"
                      value="À la livraison / عند الاستلام"
                    />
                  </div>

                  <div className="flex items-end justify-between gap-4 py-4 sm:py-6">
                    <div>
                      <span className="block text-sm font-bold text-zinc-500">
                        Total / الإجمالي
                      </span>

                      <span className="mt-1 block text-xs text-zinc-400">
                        Hors frais de
                        livraison / بدون رسوم التوصيل
                      </span>
                    </div>

                    <strong className="text-right text-2xl font-black text-zinc-950 sm:text-3xl">
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
                    Passer la commande / إتمام الطلب

                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/articles"
                    className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 text-sm font-bold text-zinc-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Continuer mes achats / متابعة التسوق
                  </Link>

                  <div className="mt-6 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                    <p className="text-xs leading-5 text-emerald-700">
                      Votre panier est sauvegardé automatiquement
                      sur cet appareil. / يتم حفظ سلة التسوق تلقائيًا على هذا الجهاز.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>

      {/* Barre de validation fixe sur mobile */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-14px_35px_rgba(24,24,27,0.12)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400">
                Total panier
              </span>

              <strong className="mt-0.5 block truncate text-xl font-black text-zinc-950">
                {formatPrice(total)}
                <span className="ml-1 text-xs text-orange-500">
                  DA
                </span>
              </strong>
            </div>

            <Link
              href="/commande"
              className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-xs font-black text-white shadow-lg shadow-orange-500/25 transition active:scale-[0.98] active:bg-orange-600"
            >
              Commander / إتمام الطلب
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
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
          component.image || "",
      )
      .filter(Boolean);

  const isPack =
    item.item_type === "PACK";

  return (
    <article className="group relative overflow-hidden rounded-[22px] border border-zinc-200 bg-white p-3 shadow-[0_8px_26px_rgba(24,24,27,0.05)] transition-all duration-300 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 sm:rounded-[26px] sm:p-5">
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 group-hover:w-full" />

      {/* Mobile: image à gauche, informations à droite */}
      <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 sm:flex sm:items-center sm:gap-5">
        <Link
          href={detailHref}
          className="relative flex h-[92px] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100 sm:h-32 sm:w-32"
        >
          {isPack ? (
            <PackPhotoLayout
              images={componentImages}
              fallback={item.image}
              title={item.designation}
            />
          ) : item.image ? (
            <img
              src={productImageUrl(
                item.image,
              )}
              alt={item.designation}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <PackageOpen className="h-9 w-9 text-zinc-300" />
          )}

          <span
            className={`absolute left-1.5 top-1.5 rounded-lg px-2 py-1 text-[7px] font-black uppercase tracking-wide text-white shadow-sm ${
              isPack
                ? "bg-zinc-950"
                : "bg-orange-500"
            }`}
          >
            {isPack ? "PACK" : "ARTICLE"}
          </span>
        </Link>

        <div className="min-w-0">
          <Link
            href={detailHref}
            className="block"
          >
            <h3 className="line-clamp-2 text-[14px] font-black leading-5 text-zinc-950 transition-colors group-hover:text-orange-600 sm:text-lg sm:leading-6">
              {item.designation}
            </h3>
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <strong className="text-base font-black text-zinc-950 sm:text-lg">
              {formatPrice(
                item.price,
              )}{" "}
              <span className="text-xs text-orange-500">
                DA
              </span>
            </strong>

            <span className="text-[10px] font-semibold text-zinc-400 sm:text-xs">
              / unité / للوحدة
            </span>
          </div>

          {/* Petit total visible immédiatement sur mobile */}
          <div className="mt-2 flex items-center gap-2 sm:hidden">
            <span className="rounded-lg bg-orange-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-orange-600">
              Total
            </span>
            <strong className="text-sm font-black text-zinc-900">
              {formatPrice(
                lineTotal,
              )}{" "}
              DA
            </strong>
          </div>
        </div>

        {/* Composition d'un pack */}
        {isPack &&
          (
            item.pack_components ||
            []
          ).length > 0 && (
            <div className="col-span-2 rounded-2xl border border-orange-100 bg-orange-50/60 p-3 sm:ml-[148px] sm:mt-[-4px] sm:w-[calc(100%-148px)]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-600 sm:text-[10px]">
                  Produits inclus / المنتجات المضمنة
                </span>

                <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-zinc-600 ring-1 ring-orange-100 sm:text-[10px]">
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

              <div className="mt-2 grid gap-2 sm:mt-3 sm:grid-cols-2">
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
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 sm:h-11 sm:w-11">
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
                        <strong className="block truncate text-[10px] font-black text-zinc-900 sm:text-[11px]">
                          {
                            component.designation
                          }
                        </strong>

                        <span className="mt-0.5 block text-[9px] font-bold text-orange-600 sm:text-[10px]">
                          {
                            component.quantity_per_pack
                          }{" "}
                          × par pack / لكل باقة
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

        {/* Actions mobiles + desktop */}
        <div className="col-span-2 mt-1 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3 sm:ml-auto sm:mt-0 sm:border-0 sm:pt-0">
          <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-1 shadow-sm">
            <button
              type="button"
              onClick={onDecrement}
              disabled={
                item.quantity <= 1
              }
              aria-label="Diminuer la quantité / تقليل الكمية"
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
              aria-label={`Quantité de ${item.designation} / كمية ${item.designation}`}
              className="h-9 w-10 bg-transparent text-center text-sm font-black text-zinc-950 outline-none [appearance:textfield] sm:w-12 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />

            <button
              type="button"
              onClick={onIncrement}
              aria-label="Augmenter la quantité / زيادة الكمية"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white hover:text-orange-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="hidden min-w-[110px] text-right sm:block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Total / الإجمالي
            </span>

            <strong className="mt-1 block text-lg font-black text-zinc-950">
              {formatPrice(
                lineTotal,
              )}
              <span className="ml-1 text-xs text-orange-500">
                DA
              </span>
            </strong>
          </div>

          <button
            type="button"
            onClick={onRemove}
            aria-label={`Supprimer / حذف ${item.designation}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4.5 w-4.5" />
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
    <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:gap-4 sm:p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 sm:h-11 sm:w-11">
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
    <div className="relative overflow-hidden rounded-[26px] border border-zinc-200 bg-white px-5 py-12 text-center shadow-sm sm:rounded-[36px] sm:px-6 sm:py-20">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-lg">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-orange-50 text-orange-500 sm:h-24 sm:w-24 sm:rounded-[30px]">
          <ShoppingBag className="h-12 w-12" />
        </span>

        <h2 className="mt-6 text-2xl font-black tracking-tight text-zinc-950 sm:mt-7 sm:text-3xl">
          Votre panier est vide / سلة التسوق فارغة
        </h2>

        <p className="mt-4 text-sm leading-7 text-zinc-500 sm:text-base">
          Vous n’avez encore ajouté aucun
          article. Découvrez notre catalogue
          et trouvez le matériel adapté à
          vos projets. / لم تضف أي منتج إلى السلة بعد. تصفح الكتالوج واختر ما يناسب مشاريعك.
        </p>

        <Link
          href="/articles"
          className="group mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-7 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/35"
        >
          Découvrir les articles / اكتشف المنتجات

          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

function CartLoading() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-14 lg:px-8">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-zinc-200" />

        <div className="mt-7 grid gap-5 sm:mt-10 lg:grid-cols-[1fr_380px] lg:gap-8">
          <div className="space-y-4">
            {Array.from({
              length: 3,
            }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-[22px] border border-zinc-200 bg-white sm:h-40 sm:rounded-[26px]"
              />
            ))}
          </div>

          <div className="h-[480px] animate-pulse rounded-[30px] border border-zinc-200 bg-white" />
        </div>
      </div>
    </main>
  );
}

