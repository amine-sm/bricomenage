
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

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
  Home,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

import {
  type CartItem,
  getCart,
  saveCart,
} from "@/lib/cart";

import {
  zrApi,
  type ZrHub,
  type ZrTerritory,
} from "@/lib/zr";

function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-DZ").format(value);
}

export default function Checkout() {
  const router = useRouter();

  const [items, setItems] =
    useState<CartItem[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [loaded, setLoaded] =
    useState(false);

  const [error, setError] =
    useState("");

  const [zrConfigured, setZrConfigured] =
    useState(false);

  const [zrLoading, setZrLoading] =
    useState(true);

  const [zrError, setZrError] =
    useState("");

  const [wilayas, setWilayas] =
    useState<ZrTerritory[]>([]);

  const [communes, setCommunes] =
    useState<ZrTerritory[]>([]);

  const [hubs, setHubs] =
    useState<ZrHub[]>([]);

  const [cityId, setCityId] =
    useState("");

  const [districtId, setDistrictId] =
    useState("");

  const [deliveryType, setDeliveryType] =
    useState<"HOME" | "STOP_DESK">("HOME");

  const [
    destinationHubId,
    setDestinationHubId,
  ] = useState("");

  const [deliveryFee, setDeliveryFee] =
    useState<number | null>(null);

  const [quoteLoading, setQuoteLoading] =
    useState(false);

  useEffect(() => {
    try {
      setItems(getCart());
    } catch {
      setItems([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadZr() {
      setZrLoading(true);
      setZrError("");

      try {
        const status =
          await zrApi.status();

        if (!active) {
          return;
        }

        const configured = Boolean(
          status.configured &&
            status.enabled,
        );

        setZrConfigured(configured);

        if (configured) {
          const response =
            await zrApi.wilayas();

          if (!active) {
            return;
          }

          setWilayas(
            response.wilayas || [],
          );
        }
      } catch (caughtError) {
        if (!active) {
          return;
        }

        setZrError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de charger ZR Express. / تعذر تحميل ZR Express.",
        );
      } finally {
        if (active) {
          setZrLoading(false);
        }
      }
    }

    void loadZr();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCommunes() {
      setDistrictId("");
      setDestinationHubId("");
      setCommunes([]);
      setHubs([]);
      setDeliveryFee(null);

      if (!cityId) {
        return;
      }

      try {
        const response =
          await zrApi.communes(
            cityId,
          );

        if (active) {
          setCommunes(
            response.communes || [],
          );
        }
      } catch (caughtError) {
        if (active) {
          setZrError(
            caughtError instanceof Error
              ? caughtError.message
              : "Impossible de charger les communes ZR. / تعذر تحميل بلديات ZR.",
          );
        }
      }
    }

    void loadCommunes();

    return () => {
      active = false;
    };
  }, [cityId]);

  useEffect(() => {
    let active = true;

    async function loadQuote() {
      setDeliveryFee(null);
      setDestinationHubId("");
      setHubs([]);

      if (
        !zrConfigured ||
        !cityId ||
        !districtId
      ) {
        return;
      }

      setQuoteLoading(true);
      setZrError("");

      try {
        const [
          quote,
          hubsResponse,
        ] = await Promise.all([
          zrApi.quote({
            cityId,
            districtId,
            deliveryType,
          }),

          deliveryType ===
          "STOP_DESK"
            ? zrApi.hubs({
                cityId,
                districtId,
              })
            : Promise.resolve({
                success: true,
                hubs: [] as ZrHub[],
              }),
        ]);

        if (!active) {
          return;
        }

        setDeliveryFee(
          Number(quote.fee),
        );

        setHubs(
          hubsResponse.hubs || [],
        );
      } catch (caughtError) {
        if (active) {
          setZrError(
            caughtError instanceof Error
              ? caughtError.message
              : "Tarif ZR Express indisponible. / سعر ZR Express غير متوفر.",
          );
        }
      } finally {
        if (active) {
          setQuoteLoading(false);
        }
      }
    }

    void loadQuote();

    return () => {
      active = false;
    };
  }, [
    zrConfigured,
    cityId,
    districtId,
    deliveryType,
  ]);

  const totalQuantity =
    useMemo(
      () =>
        items.reduce(
          (total, item) =>
            total +
            Number(item.quantity),
          0,
        ),
      [items],
    );

  const subtotal =
    useMemo(
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

  const selectedWilaya =
    useMemo(
      () =>
        wilayas.find(
          (item) =>
            item.id === cityId,
        ) || null,
      [wilayas, cityId],
    );

  const selectedCommune =
    useMemo(
      () =>
        communes.find(
          (item) =>
            item.id === districtId,
        ) || null,
      [communes, districtId],
    );

  const grandTotal =
    subtotal +
    Number(deliveryFee || 0);

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!items.length) {
      setError(
        "Votre panier est vide. / سلة التسوق فارغة.",
      );
      return;
    }

    if (
      zrConfigured &&
      (
        !cityId ||
        !districtId ||
        deliveryFee === null
      )
    ) {
      setError(
        "Sélectionnez une destination ZR Express avec un tarif valide. / اختر وجهة ZR Express بسعر صالح.",
      );
      return;
    }

    if (
      zrConfigured &&
      deliveryType ===
        "STOP_DESK" &&
      !destinationHubId
    ) {
      setError(
        "Sélectionnez un bureau Stop Desk ZR Express. / اختر مكتب استلام Stop Desk من ZR Express.",
      );
      return;
    }

    setLoading(true);
    setError("");

    const form =
      new FormData(
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
              zrConfigured
                ? selectedWilaya?.name ||
                  ""
                : String(
                    form.get(
                      "wilaya",
                    ) || "",
                  ).trim(),

            commune:
              zrConfigured
                ? selectedCommune?.name ||
                  ""
                : String(
                    form.get(
                      "commune",
                    ) || "",
                  ).trim(),

            zrCityId:
              zrConfigured
                ? cityId
                : "",

            zrDistrictId:
              zrConfigured
                ? districtId
                : "",

            zrDeliveryType:
              zrConfigured
                ? deliveryType
                : "HOME",

            zrDestinationHubId:
              zrConfigured
                ? destinationHubId
                : "",

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

            items:
              items.map(
                (item) =>
                  item.item_type ===
                  "PACK"
                    ? {
                        packId:
                          item.id,
                        type: "pack",
                        quantity:
                          item.quantity,
                      }
                    : {
                        articleId:
                          item.id,
                        type: "article",
                        quantity:
                          item.quantity,
                      },
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
          : "Une erreur est survenue pendant l’enregistrement de la commande. / حدث خطأ أثناء تسجيل الطلب.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!loaded) {
    return <CheckoutLoading />;
  }

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#f7f7f8]"
      dir="ltr"
    >
      {/* HEADER */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-24 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-orange-200/25 blur-3xl" />

          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.022)_1px,transparent_1px)] bg-[size:55px_55px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <Link
            href="/panier"
            className="group inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-3.5 py-2 text-xs font-bold text-zinc-600 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:text-orange-500 hover:shadow-md sm:px-4 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />

            <span className="truncate">
              Retour au panier / العودة إلى السلة
            </span>
          </Link>

          <div className="mt-5 grid gap-6 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0 max-w-2xl">
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-orange-200 bg-gradient-to-r from-orange-50 to-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-orange-600 shadow-sm sm:px-4 sm:text-xs sm:tracking-[0.16em]">
                <ClipboardList className="h-4 w-4 shrink-0" />

                <span className="truncate">
                  Dernière étape / الخطوة الأخيرة
                </span>
              </span>

              <h1 className="mt-4 text-[34px] font-black leading-[1.05] tracking-[-0.035em] text-zinc-950 min-[420px]:text-[38px] sm:text-5xl lg:text-[58px]">
                Finaliser votre / إتمام

                <span className="block text-orange-500">
                  commande / الطلب
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7">
                Renseignez vos informations de
                livraison puis confirmez votre
                commande. / أدخل معلومات التوصيل ثم
                أكد طلبك. Le paiement s’effectue à
                la livraison. / الدفع عند الاستلام.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:w-auto lg:min-w-[450px]">
              <CheckoutStat
                value={items.length}
                label="Produits / المنتجات"
              />

              <CheckoutStat
                value={
                  totalQuantity
                }
                label="Quantité / الكمية"
              />

              <CheckoutStat
                value={`${formatPrice(
                  grandTotal,
                )} DA`}
                label="Total / المجموع"
                className="col-span-2 sm:col-span-1"
              />
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl overflow-x-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="grid min-w-[500px] grid-cols-3 items-center gap-2 sm:min-w-0 sm:gap-3">
            <CheckoutStep
              number="1"
              title="Informations"
              arabic="المعلومات"
              active
            />

            <CheckoutStep
              number="2"
              title="Livraison"
              arabic="التوصيل"
            />

            <CheckoutStep
              number="3"
              title="Paiement"
              arabic="الدفع"
            />
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto grid max-w-7xl items-start gap-5 px-3 py-5 min-[400px]:px-4 sm:gap-7 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8 lg:py-10 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* FORM */}
        <div className="min-w-0 overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-[0_14px_45px_rgba(24,24,27,0.07)] sm:rounded-[30px] sm:shadow-[0_18px_55px_rgba(24,24,27,0.08)]">
          <div className="border-b border-zinc-100 bg-white px-4 py-5 sm:px-7 sm:py-6 lg:px-8">
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-[0_10px_26px_rgba(249,115,22,0.28)] sm:h-12 sm:w-12 sm:rounded-2xl">
                <UserRound className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>

              <div className="min-w-0">
                <h2 className="text-lg font-black leading-tight text-zinc-950 sm:text-2xl">
                  Informations de livraison

                  <span
                    className="mt-1 block text-base sm:inline sm:text-2xl"
                    dir="rtl"
                  >
                    {" "}
                    / معلومات التوصيل
                  </span>
                </h2>

                <p className="mt-2 text-xs leading-5 text-zinc-500 sm:text-sm sm:leading-6">
                  Vérifiez vos informations avant
                  de confirmer. / تحقق من معلوماتك
                  قبل التأكيد.
                </p>
              </div>
            </div>
          </div>

          <form
            id="checkout-form"
            onSubmit={submit}
            className="p-4 sm:p-7 lg:p-8"
          >
            <div className="mb-5 flex items-center gap-2 text-orange-600">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                <UserRound className="h-4 w-4" />
              </span>

              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-black">
                  Informations personnelles
                </span>

                <span
                  className="text-sm font-black"
                  dir="rtl"
                >
                  / المعلومات الشخصية
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              <FormField
                label="Nom et prénom / الاسم واللقب"
                name="name"
                placeholder="Ex. Amine Benali / مثال: أمين بن علي"
                icon={UserRound}
                autoComplete="name"
                required
              />

              <FormField
                label="Téléphone / الهاتف"
                name="phone"
                type="tel"
                placeholder="Ex. 0550 00 00 00"
                icon={Phone}
                autoComplete="tel"
                required
              />

              {zrConfigured ? (
                <>
                  <ZrSelect
                    label="Wilaya / الولاية"
                    value={cityId}
                    onChange={setCityId}
                    items={wilayas.map(
                      (item) => ({
                        value:
                          item.id,
                        label:
                          item.name,
                      }),
                    )}
                    placeholder={
                      zrLoading
                        ? "Chargement... / جارٍ التحميل..."
                        : "Sélectionner une wilaya / اختر الولاية"
                    }
                    disabled={
                      zrLoading
                    }
                  />

                  <ZrSelect
                    label="Commune / البلدية"
                    value={
                      districtId
                    }
                    onChange={
                      setDistrictId
                    }
                    items={communes.map(
                      (item) => ({
                        value:
                          item.id,
                        label:
                          item.name,
                      }),
                    )}
                    placeholder={
                      cityId
                        ? "Sélectionner une commune / اختر البلدية"
                        : "Choisissez d’abord la wilaya / اختر الولاية أولاً"
                    }
                    disabled={
                      !cityId
                    }
                  />
                </>
              ) : (
                <>
                  <FormField
                    label="Wilaya / الولاية"
                    name="wilaya"
                    placeholder="Ex. Oran / مثال: وهران"
                    icon={MapPin}
                    autoComplete="address-level1"
                    required
                  />

                  <FormField
                    label="Commune / البلدية"
                    name="commune"
                    placeholder="Ex. Bir El Djir / مثال: بئر الجير"
                    icon={MapPin}
                    autoComplete="address-level2"
                    required
                  />
                </>
              )}
            </div>

            {zrConfigured && (
              <div className="mt-6 rounded-[20px] border border-orange-200 bg-gradient-to-br from-orange-50/90 via-white to-orange-50/70 p-4 shadow-[0_12px_32px_rgba(249,115,22,0.07)] sm:rounded-[24px] sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-600">
                      Livraison ZR Express / توصيل ZR Express
                    </span>

                    <p className="mt-1 text-xs font-semibold leading-5 text-zinc-600 sm:text-sm">
                      Choisissez le mode de
                      livraison. / اختر طريقة التوصيل.
                    </p>
                  </div>

                  <div className="grid w-full grid-cols-1 gap-2 rounded-2xl border border-orange-100 bg-white p-1.5 shadow-sm min-[440px]:grid-cols-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={() =>
                        setDeliveryType(
                          "HOME",
                        )
                      }
                      className={`min-h-[44px] rounded-xl px-3 py-2 text-xs font-black leading-4 transition ${
                        deliveryType ===
                        "HOME"
                          ? "bg-orange-500 text-white shadow-sm"
                          : "text-zinc-500 hover:bg-orange-50"
                      }`}
                    >
                      À domicile / إلى المنزل
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDeliveryType(
                          "STOP_DESK",
                        )
                      }
                      className={`min-h-[44px] rounded-xl px-3 py-2 text-xs font-black leading-4 transition ${
                        deliveryType ===
                        "STOP_DESK"
                          ? "bg-orange-500 text-white shadow-sm"
                          : "text-zinc-500 hover:bg-orange-50"
                      }`}
                    >
                      Stop Desk / مكتب الاستلام
                    </button>
                  </div>
                </div>

                {deliveryType ===
                  "STOP_DESK" &&
                  districtId && (
                    <div className="mt-4">
                      <ZrSelect
                        label="Bureau ZR Express / مكتب ZR Express"
                        value={
                          destinationHubId
                        }
                        onChange={
                          setDestinationHubId
                        }
                        items={hubs.map(
                          (hub) => ({
                            value:
                              hub.id,
                            label:
                              [
                                hub.name,
                                hub.address,
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  " — ",
                                ) ||
                              "Bureau ZR / مكتب ZR",
                          }),
                        )}
                        placeholder={
                          quoteLoading
                            ? "Chargement des bureaux... / جارٍ تحميل المكاتب..."
                            : hubs.length
                              ? "Choisir un bureau / اختر مكتبًا"
                              : "Aucun bureau disponible / لا يوجد مكتب متاح"
                        }
                        disabled={
                          quoteLoading ||
                          !hubs.length
                        }
                      />
                    </div>
                  )}

                <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-orange-100 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                  <span className="text-xs font-bold text-zinc-500">
                    Tarif ZR / سعر ZR
                  </span>

                  <strong className="break-words text-sm font-black text-zinc-950 min-[420px]:text-right">
                    {quoteLoading
                      ? "Calcul... / جارٍ الحساب..."
                      : deliveryFee !==
                          null
                        ? `${formatPrice(
                            deliveryFee,
                          )} DA`
                        : "Sélectionnez la destination / اختر الوجهة"}
                  </strong>
                </div>
              </div>
            )}

            {zrError && (
              <div className="mt-5 break-words rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800 sm:text-sm">
                ZR Express :{" "}
                {zrError}
              </div>
            )}

            <div className="mt-5">
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-black text-zinc-800"
              >
                Adresse complète / العنوان الكامل
              </label>

              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-zinc-400" />

                <textarea
                  id="address"
                  name="address"
                  required
                  rows={4}
                  placeholder="Quartier, rue, numéro, point de repère... / الحي، الشارع، الرقم، معلم قريب..."
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-white py-4 pl-12 pr-4 text-[13px] font-medium text-zinc-900 outline-none transition-all placeholder:text-[12px] placeholder:text-zinc-400 hover:border-zinc-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 sm:rounded-2xl sm:text-sm sm:placeholder:text-sm"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="note"
                className="mb-2 block text-sm font-black text-zinc-800"
              >
                Remarque / ملاحظة

                <span className="ml-2 font-normal text-zinc-400">
                  facultatif / اختياري
                </span>
              </label>

              <textarea
                id="note"
                name="note"
                rows={3}
                placeholder="Instructions supplémentaires pour la livraison... / تعليمات إضافية للتوصيل..."
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-4 text-[13px] font-medium text-zinc-900 outline-none transition-all placeholder:text-[12px] placeholder:text-zinc-400 hover:border-zinc-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 sm:rounded-2xl sm:text-sm sm:placeholder:text-sm"
              />
            </div>

            {error && (
              <div className="mt-5 break-words rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700 sm:text-sm">
                {error}
              </div>
            )}

            <div className="mt-7 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                <p className="text-xs leading-5 text-emerald-700 sm:text-sm sm:leading-6">
                  En confirmant, votre commande sera
                  enregistrée et un numéro de suivi
                  vous sera attribué. / عند التأكيد،
                  سيتم تسجيل طلبك ومنحك رقم تتبع.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* SUMMARY */}
        <aside className="min-w-0 lg:sticky lg:top-28">
          <div className="overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-[0_14px_45px_rgba(24,24,27,0.08)] sm:rounded-[30px] lg:shadow-[0_20px_60px_rgba(24,24,27,0.10)]">
            <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.34),transparent_42%),linear-gradient(135deg,#09090b,#18181b_58%,#27272a)] px-5 py-6 text-white sm:px-6 sm:py-7">
              <div className="absolute -right-12 -top-14 h-48 w-48 rounded-full bg-orange-500/25 blur-3xl" />

              <div className="relative">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/25 sm:h-12 sm:w-12 sm:rounded-2xl">
                  <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>

                <h2 className="mt-5 text-xl font-black sm:text-2xl">
                  Votre commande / طلبك
                </h2>

                <p className="mt-2 text-xs leading-5 text-zinc-400 sm:text-sm">
                  Vérifiez les articles et les
                  quantités. / تحقق من المنتجات
                  والكميات.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-7">
              {items.length > 0 ? (
                <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
                  {items.map(
                    (item) => (
                      <OrderItem
                        key={`${item.item_type}-${item.id}`}
                        item={item}
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-zinc-50 px-4 py-8 text-center">
                  <ShoppingBag className="mx-auto h-10 w-10 text-zinc-300" />

                  <p className="mt-3 text-sm font-semibold text-zinc-500">
                    Votre panier est vide. / سلة
                    التسوق فارغة.
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-4 border-t border-zinc-200 pt-6">
                <SummaryLine
                  label={`Sous-total / المجموع الفرعي (${totalQuantity} article${
                    totalQuantity > 1
                      ? "s"
                      : ""
                  })`}
                  value={`${formatPrice(
                    subtotal,
                  )} DA`}
                />

                <SummaryLine
                  label="Livraison ZR / توصيل ZR"
                  value={
                    quoteLoading
                      ? "Calcul... / جارٍ الحساب..."
                      : deliveryFee !==
                          null
                        ? `${formatPrice(
                            deliveryFee,
                          )} DA`
                        : "À confirmer / للتأكيد"
                  }
                  valueClassName="text-emerald-600"
                />

                <SummaryLine
                  label="Mode de paiement / طريقة الدفع"
                  value="À la livraison / عند الاستلام"
                />
              </div>

              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50/70 p-4 min-[430px]:flex-row min-[430px]:items-end min-[430px]:justify-between">
                <div>
                  <span className="block text-sm font-bold text-zinc-500">
                    Total / المجموع
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-zinc-400">
                    Produits + livraison ZR /
                    المنتجات + توصيل ZR
                  </span>
                </div>

                <strong className="break-words text-2xl font-black text-zinc-950 min-[430px]:text-right sm:text-3xl">
                  {formatPrice(
                    grandTotal,
                  )}

                  <span className="ml-1 text-sm text-orange-500 sm:text-base">
                    DA
                  </span>
                </strong>
              </div>

              <div className="mt-6 grid gap-3">
                <CheckoutInfo
                  icon={CreditCard}
                  title="Paiement / الدفع"
                  description="À la livraison / عند الاستلام"
                />

                <CheckoutInfo
                  icon={Truck}
                  title="Livraison / التوصيل"
                  description="Dans toute l’Algérie / في جميع أنحاء الجزائر"
                />

                <CheckoutInfo
                  icon={ShieldCheck}
                  title="Commande / الطلب"
                  description="Données sécurisées / بيانات آمنة"
                />
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={
                  loading ||
                  !items.length
                }
                className="group mt-6 flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-center text-xs font-black leading-5 text-white shadow-[0_14px_30px_rgba(249,115,22,0.30)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(249,115,22,0.36)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:px-6 sm:text-sm"
              >
                {loading ? (
                  <>
                    <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" />

                    <span>
                      Enregistrement... / جارٍ التسجيل...
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5 shrink-0" />

                    <span>
                      Confirmer la commande / تأكيد الطلب
                    </span>

                    <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <Link
                href="/panier"
                className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-center text-xs font-bold text-zinc-700 transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 sm:px-5 sm:text-sm"
              >
                Modifier le panier / تعديل السلة
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
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-black text-zinc-800">
        {label}
      </span>

      <span className="relative block min-w-0">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

        <input
          name={name}
          type={type}
          required={required}
          autoComplete={
            autoComplete
          }
          placeholder={
            placeholder
          }
          className="min-h-[54px] w-full min-w-0 rounded-xl border border-zinc-200 bg-white pl-11 pr-3 text-[13px] font-medium text-zinc-900 outline-none transition-all placeholder:text-[12px] placeholder:text-zinc-400 hover:border-zinc-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 sm:min-h-[56px] sm:rounded-2xl sm:pl-12 sm:pr-4 sm:text-sm sm:placeholder:text-sm"
        />
      </span>
    </label>
  );
}

interface ZrSelectProps {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;

  items: Array<{
    value: string;
    label: string;
  }>;

  placeholder: string;
  disabled?: boolean;
}

function ZrSelect({
  label,
  value,
  onChange,
  items,
  placeholder,
  disabled = false,
}: ZrSelectProps) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-black text-zinc-800">
        {label}
      </span>

      <span className="relative block min-w-0">
        <MapPin className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-zinc-400" />

        <select
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          disabled={disabled}
          required
          className="min-h-[54px] w-full min-w-0 appearance-none truncate rounded-xl border border-zinc-200 bg-white pl-11 pr-9 text-[13px] font-semibold text-zinc-900 outline-none transition-all hover:border-zinc-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[56px] sm:rounded-2xl sm:pl-12 sm:pr-10 sm:text-sm"
        >
          <option value="">
            {placeholder}
          </option>

          {items.map(
            (item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ),
          )}
        </select>
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
    <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 transition-all hover:border-orange-100 hover:bg-orange-50/40 hover:shadow-sm sm:gap-3 sm:p-3.5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200 shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl">
        {"image" in item &&
        typeof item.image ===
          "string" &&
        item.image ? (
          <img
            src={item.image}
            alt={
              item.designation
            }
            className="h-full w-full object-cover"
          />
        ) : (
          <PackageCheck className="h-6 w-6 text-zinc-300" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-xs font-black leading-5 text-zinc-900 sm:text-sm">
          {item.designation}
        </h3>

        <p className="mt-1 text-[10px] text-zinc-500 sm:text-xs">
          {formatPrice(
            item.price,
          )}{" "}
          DA × {item.quantity}
        </p>
      </div>

      <strong className="shrink-0 whitespace-nowrap text-xs font-black text-zinc-950 sm:text-sm">
        {formatPrice(
          total,
        )}{" "}
        DA
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
    <div className="flex flex-col gap-1.5 text-sm min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between min-[430px]:gap-4">
      <span className="leading-5 text-zinc-500">
        {label}
      </span>

      <strong
        className={`break-words text-zinc-950 min-[430px]:max-w-[48%] min-[430px]:text-right ${valueClassName}`}
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
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-3.5 shadow-sm transition hover:border-orange-100 hover:bg-orange-50/30">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0">
        <strong className="block text-xs font-black text-zinc-900">
          {title}
        </strong>

        <span className="mt-1 block text-[10px] leading-4 text-zinc-500">
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
      className={`min-w-0 rounded-2xl border border-zinc-200 bg-white/90 p-3 shadow-[0_10px_30px_rgba(24,24,27,0.06)] backdrop-blur transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md sm:p-4 ${className}`}
    >
      <strong className="block break-words text-lg font-black text-zinc-950 sm:text-xl">
        {value}
      </strong>

      <span className="mt-1 block text-[9px] font-bold uppercase leading-4 tracking-wider text-zinc-400 sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}

interface CheckoutStepProps {
  number: string;
  title: string;
  arabic: string;
  active?: boolean;
}

function CheckoutStep({
  number,
  title,
  arabic,
  active = false,
}: CheckoutStepProps) {
  return (
    <div className="relative flex min-w-0 items-center justify-center">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black transition sm:h-10 sm:w-10 sm:text-sm ${
            active
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-zinc-100 text-zinc-400"
          }`}
        >
          {number}
        </span>

        <div className="block min-w-0">
          <strong
            className={`block truncate text-[11px] font-black sm:text-sm ${
              active
                ? "text-orange-600"
                : "text-zinc-500"
            }`}
          >
            {title}
          </strong>

          <span
            dir="rtl"
            className={`mt-0.5 block truncate text-[10px] sm:text-xs ${
              active
                ? "text-orange-500"
                : "text-zinc-400"
            }`}
          >
            {arabic}
          </span>
        </div>
      </div>

      {number !== "3" && (
        <span className="absolute left-[calc(50%+48px)] right-[-35px] top-5 hidden border-t-2 border-dashed border-zinc-200 md:block" />
      )}
    </div>
  );
}

function CheckoutLoading() {
  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#f7f7f8]"
      dir="ltr"
    >
      <div className="mx-auto grid max-w-7xl gap-5 px-3 py-8 min-[400px]:px-4 sm:gap-8 sm:px-6 sm:py-14 lg:grid-cols-[1fr_390px] lg:px-8">
        <div className="h-[600px] animate-pulse rounded-[22px] bg-zinc-200 sm:h-[650px] sm:rounded-[32px]" />

        <div className="h-[520px] animate-pulse rounded-[22px] bg-zinc-200 sm:h-[620px] sm:rounded-[32px]" />
      </div>
    </main>
  );
}

