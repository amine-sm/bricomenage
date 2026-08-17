"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Home,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import {
  clearDirectCheckout,
  type CartItem,
  getCart,
  getDirectCheckout,
  saveCart,
} from "@/lib/cart";
import {
  zrApi,
  type ZrHub,
  type ZrTerritory,
} from "@/lib/zr";

type CheckoutStepNumber = 1 | 2 | 3;
type DeliveryType = "HOME" | "STOP_DESK";

function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-DZ").format(value);
}

export default function Checkout() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [currentStep, setCurrentStep] =
    useState<CheckoutStepNumber>(1);

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [directMode, setDirectMode] = useState(false);
  const [returnHref, setReturnHref] = useState("/panier");

  const [error, setError] = useState("");

  /*
   * Popup confirmation finale
   *
   * IMPORTANT :
   * Tant que cette popup n'est pas confirmée,
   * aucune commande n'est envoyée au backend.
   */
  const [showConfirmation, setShowConfirmation] =
    useState(false);

  /*
   * ZR EXPRESS
   */
  const [zrConfigured, setZrConfigured] = useState(false);
  const [zrLoading, setZrLoading] = useState(true);
  const [zrError, setZrError] = useState("");

  const [wilayas, setWilayas] = useState<ZrTerritory[]>([]);
  const [communes, setCommunes] = useState<ZrTerritory[]>([]);
  const [communesLoading, setCommunesLoading] =
    useState(false);

  const [hubs, setHubs] = useState<ZrHub[]>([]);

  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");

  const [deliveryType, setDeliveryType] =
    useState<DeliveryType>("STOP_DESK");

  const [destinationHubId, setDestinationHubId] =
    useState("");

  const [deliveryFee, setDeliveryFee] =
    useState<number | null>(null);

  const [quoteLoading, setQuoteLoading] = useState(false);

  /*
   * CHARGEMENT PANIER
   */
  useEffect(() => {
    try {
      const directRequested =
        new URLSearchParams(window.location.search).get(
          "direct",
        ) === "1";

      if (directRequested) {
        const direct = getDirectCheckout();

        if (direct?.items.length) {
          setItems(direct.items);
          setDirectMode(true);
          setReturnHref(
            direct.returnHref || "/articles",
          );
          return;
        }
      }

      setItems(getCart());
      setDirectMode(false);
      setReturnHref("/panier");
    } catch {
      setItems([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  /*
   * CHARGEMENT ZR EXPRESS
   */
  useEffect(() => {
    let active = true;

    async function loadZr() {
      setZrLoading(true);
      setZrError("");

      try {
        const status = await zrApi.status();

        if (!active) return;

        const configured = Boolean(
          status.configured && status.enabled,
        );

        setZrConfigured(configured);

        if (configured) {
          const response = await zrApi.wilayas();

          if (!active) return;

          setWilayas(response.wilayas || []);
        }
      } catch (caughtError) {
        if (!active) return;

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

  /*
   * CHARGEMENT COMMUNES
   *
   * En mode STOP DESK :
   * le backend peut retourner uniquement les communes
   * qui disposent d'un bureau ZR.
   */
  useEffect(() => {
    let active = true;

    async function loadCommunes() {
      setDistrictId("");
      setDestinationHubId("");
      setCommunes([]);
      setHubs([]);
      setDeliveryFee(null);

      if (!cityId) {
        setCommunesLoading(false);
        return;
      }

      setCommunesLoading(true);
      setZrError("");

      try {
        const response = await zrApi.communes(
          cityId,
          {
            stopDeskOnly:
              deliveryType === "STOP_DESK",
          },
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
      } finally {
        if (active) {
          setCommunesLoading(false);
        }
      }
    }

    void loadCommunes();

    return () => {
      active = false;
    };
  }, [cityId, deliveryType]);

  /*
   * TARIF + BUREAU ZR AUTOMATIQUE
   */
  useEffect(() => {
    let active = true;

    async function loadQuoteAndHub() {
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
        const [quote, hubsResponse] =
          await Promise.all([
            zrApi.quote({
              cityId,
              districtId,
              deliveryType,
            }),

            deliveryType === "STOP_DESK"
              ? zrApi.hubs({
                  cityId,
                  districtId,
                })
              : Promise.resolve({
                  success: true,
                  hubs: [] as ZrHub[],
                }),
          ]);

        if (!active) return;

        setDeliveryFee(
          Number(quote.fee),
        );

        const availableHubs =
          hubsResponse.hubs || [];

        setHubs(availableHubs);

        /*
         * IMPORTANT :
         * bureau choisi automatiquement.
         *
         * L'utilisateur ne sélectionne pas
         * manuellement le bureau.
         */
        if (
          deliveryType === "STOP_DESK"
        ) {
          setDestinationHubId(
            availableHubs[0]?.id || "",
          );
        }
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

    void loadQuoteAndHub();

    return () => {
      active = false;
    };
  }, [
    zrConfigured,
    cityId,
    districtId,
    deliveryType,
  ]);

  /*
   * STATISTIQUES
   */
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

  const selectedHub = useMemo(
    () =>
      hubs.find(
        (hub) =>
          hub.id ===
          destinationHubId,
      ) || null,
    [hubs, destinationHubId],
  );

  const grandTotal =
    subtotal +
    Number(deliveryFee || 0);

  /*
   * RÉCUPÉRER VALEUR DU FORMULAIRE
   */
  function getFormValue(
    name: string,
  ) {
    const form = formRef.current;

    if (!form) return "";

    const element =
      form.elements.namedItem(name);

    if (
      !element ||
      !("value" in element)
    ) {
      return "";
    }

    return String(
      element.value || "",
    ).trim();
  }

  /*
   * VALIDATION ÉTAPE 1
   */
  function validateStep1() {
    const name =
      getFormValue("name");

    const phone =
      getFormValue("phone");

    if (!name) {
      setError(
        "Saisissez votre nom et prénom. / أدخل الاسم واللقب.",
      );

      setCurrentStep(1);

      return false;
    }

    if (!phone) {
      setError(
        "Saisissez votre numéro de téléphone. / أدخل رقم الهاتف.",
      );

      setCurrentStep(1);

      return false;
    }

    setError("");

    return true;
  }

  /*
   * VALIDATION ÉTAPE 2
   */
  function validateStep2() {
    if (zrConfigured) {
      if (!cityId) {
        setError(
          "Sélectionnez une wilaya. / اختر الولاية.",
        );

        setCurrentStep(2);

        return false;
      }

      if (!districtId) {
        setError(
          "Sélectionnez une commune. / اختر البلدية.",
        );

        setCurrentStep(2);

        return false;
      }

      if (quoteLoading) {
        setError(
          "Patientez pendant le calcul du tarif. / انتظر حساب سعر التوصيل.",
        );

        setCurrentStep(2);

        return false;
      }

      if (
        deliveryFee === null
      ) {
        setError(
          "Le tarif de livraison n’est pas disponible. / سعر التوصيل غير متوفر.",
        );

        setCurrentStep(2);

        return false;
      }

      if (
        deliveryType ===
          "STOP_DESK" &&
        !destinationHubId
      ) {
        setError(
          "Aucun bureau ZR Express n’est disponible pour cette commune. / لا يوجد مكتب ZR Express متاح لهذه البلدية.",
        );

        setCurrentStep(2);

        return false;
      }
    } else {
      if (
        !getFormValue("wilaya")
      ) {
        setError(
          "Saisissez votre wilaya. / أدخل الولاية.",
        );

        setCurrentStep(2);

        return false;
      }

      if (
        !getFormValue("commune")
      ) {
        setError(
          "Saisissez votre commune. / أدخل البلدية.",
        );

        setCurrentStep(2);

        return false;
      }
    }

    setError("");

    return true;
  }

  /*
   * NAVIGATION ENTRE LES ÉTAPES
   */
  function goToStep(
    step: CheckoutStepNumber,
  ) {
    if (step < currentStep) {
      setError("");
      setCurrentStep(step);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (step === 2) {
      if (!validateStep1()) {
        return;
      }

      setCurrentStep(2);
    }

    if (step === 3) {
      if (!validateStep1()) {
        return;
      }

      if (!validateStep2()) {
        return;
      }

      setCurrentStep(3);
    }

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function nextStep() {
    if (currentStep === 1) {
      goToStep(2);
      return;
    }

    if (currentStep === 2) {
      goToStep(3);
    }
  }

  /*
   * PREMIER CLIC SUR CONFIRMER
   *
   * AUCUNE INSERTION ICI.
   *
   * Cette fonction ouvre uniquement
   * la popup de confirmation.
   */
  function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    /*
     * Entrée clavier étape 1
     */
    if (currentStep === 1) {
      goToStep(2);
      return;
    }

    /*
     * Entrée clavier étape 2
     */
    if (currentStep === 2) {
      goToStep(3);
      return;
    }

    if (
      !validateStep1() ||
      !validateStep2()
    ) {
      return;
    }

    if (!items.length) {
      setError(
        "Votre panier est vide. / سلة التسوق فارغة.",
      );

      return;
    }

    /*
     * IMPORTANT :
     *
     * Pas de POST /orders ici.
     * On ouvre seulement la confirmation.
     */
    setError("");
    setShowConfirmation(true);
  }

  /*
   * DEUXIÈME CLIC :
   * OUI, CONFIRMER
   *
   * C'est uniquement ici que
   * POST /orders est exécuté.
   */
  async function confirmOrder() {
    if (!formRef.current) {
      return;
    }

    if (loading) {
      return;
    }

    if (
      !validateStep1() ||
      !validateStep2()
    ) {
      setShowConfirmation(false);
      return;
    }

    if (!items.length) {
      setShowConfirmation(false);

      setError(
        "Votre panier est vide. / سلة التسوق فارغة.",
      );

      return;
    }

    setLoading(true);
    setError("");

    const form = new FormData(
      formRef.current,
    );

    const typedAddress =
      String(
        form.get("address") || "",
      ).trim();

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

            /*
             * STOP DESK :
             * adresse du bureau ZR automatique.
             *
             * HOME :
             * adresse saisie par le client.
             */
            address:
              zrConfigured &&
              deliveryType ===
                "STOP_DESK"
                ? selectedHub?.address ||
                  typedAddress
                : typedAddress,

            note:
              String(
                form.get("note") ||
                  "",
              ).trim(),

            items: items.map(
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

      setShowConfirmation(false);

      /*
       * Nettoyage panier
       */
      if (directMode) {
        clearDirectCheckout();
      } else {
        saveCart([]);

        window.dispatchEvent(
          new Event(
            "cart-change",
          ),
        );
      }

      /*
       * Redirection confirmation
       */
      router.push(
        `/confirmation/?tracking=${encodeURIComponent(
          response.trackingNumber,
        )}`,
      );
    } catch (caughtError) {
      setShowConfirmation(false);

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
      className="min-h-screen overflow-x-hidden bg-[#f7f7f8] pb-24 lg:pb-12"
      dir="ltr"
    >
      {/* ============================
          HERO
      ============================ */}

      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(249,115,22,0.11),transparent_28%),linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[size:auto,48px_48px,48px_48px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
          <Link
            href={returnHref}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-600 shadow-sm transition hover:border-orange-200 hover:text-orange-600"
          >
            <ArrowLeft className="h-4 w-4" />

            {directMode
              ? "Retour à l’article / العودة إلى المنتج"
              : "Retour au panier / العودة إلى السلة"}
          </Link>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-500">
                Commande sécurisée / طلب آمن
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-zinc-950 sm:text-5xl">
                Finaliser votre commande

                <span
                  className="mt-1 block text-orange-500"
                  dir="rtl"
                >
                  إتمام طلبك
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                Trois étapes simples :
                informations, livraison puis
                confirmation.

                <span
                  className="block"
                  dir="rtl"
                >
                  ثلاث خطوات بسيطة:
                  المعلومات، التوصيل ثم
                  التأكيد.
                </span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <CheckoutStat
                value={items.length}
                label="Produits / المنتجات"
              />

              <CheckoutStat
                value={totalQuantity}
                label="Quantité / الكمية"
              />

              <CheckoutStat
                value={`${formatPrice(
                  grandTotal,
                )} DA`}
                label="Total / المجموع"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================
          STEPPER
      ============================ */}

      <section className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-3 py-3 sm:px-6 sm:py-4">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            <CheckoutStep
              number={1}
              currentStep={
                currentStep
              }
              title="Informations"
              arabic="المعلومات"
              onClick={() =>
                goToStep(1)
              }
            />

            <CheckoutStep
              number={2}
              currentStep={
                currentStep
              }
              title="Livraison"
              arabic="التوصيل"
              onClick={() =>
                goToStep(2)
              }
            />

            <CheckoutStep
              number={3}
              currentStep={
                currentStep
              }
              title="Paiement"
              arabic="الدفع"
              onClick={() =>
                goToStep(3)
              }
            />
          </div>
        </div>
      </section>

      {/* ============================
          CONTENU
      ============================ */}

      <section className="mx-auto grid max-w-7xl items-start gap-5 px-3 py-5 min-[400px]:px-4 sm:gap-7 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0">
          <form
            ref={formRef}
            id="checkout-form"
            onSubmit={submit}
          >
            {/* ============================
                ÉTAPE 1
            ============================ */}

            <div
              className={
                currentStep === 1
                  ? "block"
                  : "hidden"
              }
            >
              <StepCard
                number="01"
                icon={UserRound}
                eyebrow="Étape 1 / الخطوة 1"
                title="Informations personnelles"
                arabic="المعلومات الشخصية"
                description="Renseignez uniquement les informations nécessaires pour votre commande."
                arabicDescription="أدخل المعلومات الضرورية فقط لإتمام طلبك."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    label="Nom et prénom"
                    arabicLabel="الاسم واللقب"
                    name="name"
                    placeholder="Ex. Amine Benali"
                    arabicPlaceholder="مثال: أمين بن علي"
                    icon={UserRound}
                    autoComplete="name"
                    required
                  />

                  <FormField
                    label="Téléphone"
                    arabicLabel="الهاتف"
                    name="phone"
                    type="tel"
                    placeholder="Ex. 0550 00 00 00"
                    arabicPlaceholder="مثال: 0550 00 00 00"
                    icon={Phone}
                    autoComplete="tel"
                    required
                  />
                </div>

                <InfoNote>
                  Votre nom et votre
                  téléphone servent au suivi
                  et à la livraison.

                  <span
                    className="mt-1 block"
                    dir="rtl"
                  >
                    يُستخدم الاسم ورقم الهاتف
                    لمتابعة الطلب والتوصيل.
                  </span>
                </InfoNote>

                {error &&
                  currentStep === 1 && (
                    <ErrorBox
                      message={error}
                    />
                  )}

                <div className="mt-7 flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="group flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition hover:-translate-y-0.5 hover:bg-orange-600 sm:w-auto"
                  >
                    Continuer vers la
                    livraison

                    <span dir="rtl">
                      / متابعة إلى التوصيل
                    </span>

                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                  </button>
                </div>
              </StepCard>
            </div>

            {/* ============================
                ÉTAPE 2
            ============================ */}

            <div
              className={
                currentStep === 2
                  ? "block"
                  : "hidden"
              }
            >
              <StepCard
                number="02"
                icon={Truck}
                eyebrow="Étape 2 / الخطوة 2"
                title="Mode et destination de livraison"
                arabic="طريقة ووجهة التوصيل"
                description="Choisissez Stop Desk ou livraison à domicile, puis votre destination."
                arabicDescription="اختر مكتب الاستلام أو التوصيل إلى المنزل ثم حدد الوجهة."
              >
                {zrConfigured && (
                  <div className="mb-6">
                    <SectionLabel
                      title="Mode de livraison"
                      arabic="طريقة التوصيل"
                    />

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <DeliveryRadioCard
                        checked={
                          deliveryType ===
                          "STOP_DESK"
                        }
                        onClick={() =>
                          setDeliveryType(
                            "STOP_DESK",
                          )
                        }
                        icon={Store}
                        title="Stop Desk"
                        arabic="مكتب الاستلام"
                        description="Retrait automatique dans le bureau ZR de la commune sélectionnée."
                        arabicDescription="استلام الطلب تلقائياً من مكتب ZR في البلدية المختارة."
                        badge="Recommandé / موصى به"
                      />

                      <DeliveryRadioCard
                        checked={
                          deliveryType ===
                          "HOME"
                        }
                        onClick={() =>
                          setDeliveryType(
                            "HOME",
                          )
                        }
                        icon={Home}
                        title="À domicile"
                        arabic="إلى المنزل"
                        description="Livraison directement à votre adresse."
                        arabicDescription="توصيل الطلب مباشرة إلى عنوانك."
                      />
                    </div>
                  </div>
                )}

                <SectionLabel
                  title="Destination"
                  arabic="الوجهة"
                />

                <div className="mt-3 grid gap-5 md:grid-cols-2">
                  {zrConfigured ? (
                    <>
                      <ZrSelect
                        label="Wilaya"
                        arabicLabel="الولاية"
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
                            ? "Chargement..."
                            : "Sélectionner une wilaya"
                        }
                        arabicPlaceholder="اختر الولاية"
                        disabled={zrLoading}
                      />

                      <ZrSelect
                        label="Commune"
                        arabicLabel="البلدية"
                        value={districtId}
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
                          !cityId
                            ? "Choisissez d’abord la wilaya"
                            : communesLoading
                              ? "Chargement des communes..."
                              : deliveryType ===
                                    "STOP_DESK" &&
                                  !communes.length
                                ? "Aucune commune avec bureau ZR"
                                : "Sélectionner une commune"
                        }
                        arabicPlaceholder="اختر البلدية"
                        disabled={
                          !cityId ||
                          communesLoading ||
                          (deliveryType ===
                            "STOP_DESK" &&
                            !communes.length)
                        }
                      />
                    </>
                  ) : (
                    <>
                      <FormField
                        label="Wilaya"
                        arabicLabel="الولاية"
                        name="wilaya"
                        placeholder="Ex. Oran"
                        arabicPlaceholder="مثال: وهران"
                        icon={MapPin}
                        required
                      />

                      <FormField
                        label="Commune"
                        arabicLabel="البلدية"
                        name="commune"
                        placeholder="Ex. Es Sénia"
                        arabicPlaceholder="مثال: السانية"
                        icon={MapPin}
                        required
                      />
                    </>
                  )}
                </div>

                {/* ============================
                    BUREAU ZR AUTOMATIQUE
                ============================ */}

                {zrConfigured &&
                  deliveryType ===
                    "STOP_DESK" &&
                  districtId && (
                    <div className="mt-5">
                      {quoteLoading ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-700">
                          <LoaderCircle className="h-5 w-5 animate-spin" />

                          Recherche
                          automatique du
                          bureau ZR... / جارٍ
                          البحث تلقائياً عن
                          مكتب ZR...
                        </div>
                      ) : selectedHub ? (
                        <div className="overflow-hidden rounded-[22px] border border-emerald-200 bg-emerald-50/70">
                          <div className="flex items-start gap-4 p-4 sm:p-5">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
                              <CheckCircle2 className="h-5 w-5" />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-black text-zinc-950">
                                  Bureau
                                  sélectionné
                                  automatiquement
                                </p>

                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                                  Automatique
                                </span>
                              </div>

                              <p
                                className="mt-0.5 text-sm font-bold text-emerald-700"
                                dir="rtl"
                              >
                                تم اختيار
                                المكتب
                                تلقائياً
                              </p>

                              <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                                <p className="text-sm font-black text-zinc-950">
                                  {selectedHub.name ||
                                    "Bureau ZR Express"}
                                </p>

                                <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-zinc-500 sm:text-sm">
                                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />

                                  <span>
                                    {selectedHub.address ||
                                      "Adresse du bureau non renseignée"}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                          Aucun bureau ZR
                          disponible pour
                          cette commune. / لا
                          يوجد مكتب ZR متاح
                          لهذه البلدية.
                        </div>
                      )}
                    </div>
                  )}

                {/* ============================
                    TARIF
                ============================ */}

                {zrConfigured && (
                  <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 min-[440px]:flex-row min-[440px]:items-center min-[440px]:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
                        <Truck className="h-5 w-5" />
                      </span>

                      <div>
                        <p className="text-sm font-black text-zinc-900">
                          Tarif de
                          livraison
                        </p>

                        <p
                          className="text-xs text-zinc-400"
                          dir="rtl"
                        >
                          سعر التوصيل
                        </p>
                      </div>
                    </div>

                    <div className="text-left min-[440px]:text-right">
                      {quoteLoading ? (
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-orange-500">
                          <LoaderCircle className="h-4 w-4 animate-spin" />

                          Calcul...
                        </span>
                      ) : deliveryFee !==
                        null ? (
                        <strong className="text-xl font-black text-zinc-950">
                          {formatPrice(
                            deliveryFee,
                          )}

                          <span className="ml-1 text-sm text-orange-500">
                            DA
                          </span>
                        </strong>
                      ) : (
                        <span className="text-xs font-bold text-zinc-500">
                          Sélectionnez la
                          destination / اختر
                          الوجهة
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ============================
                    ADRESSE HOME
                ============================ */}

                {deliveryType ===
                  "HOME" && (
                  <div className="mt-5">
                    <TextAreaField
                      label="Adresse complète"
                      arabicLabel="العنوان الكامل"
                      name="address"
                      rows={4}
                      placeholder="Quartier, rue, numéro, point de repère..."
                      arabicPlaceholder="الحي، الشارع، الرقم، معلم قريب..."
                      optional
                      icon={MapPin}
                    />
                  </div>
                )}

                {/* ============================
                    ADRESSE STOP DESK AUTO
                ============================ */}

                {deliveryType ===
                  "STOP_DESK" && (
                  <input
                    type="hidden"
                    name="address"
                    value={
                      selectedHub?.address ||
                      ""
                    }
                    readOnly
                  />
                )}

                {/* ============================
                    REMARQUE
                ============================ */}

                <div className="mt-5">
                  <TextAreaField
                    label="Remarque"
                    arabicLabel="ملاحظة"
                    name="note"
                    rows={3}
                    placeholder="Instructions supplémentaires..."
                    arabicPlaceholder="تعليمات إضافية..."
                    optional
                  />
                </div>

                {zrError && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800 sm:text-sm">
                    ZR Express :{" "}
                    {zrError}
                  </div>
                )}

                {error &&
                  currentStep === 2 && (
                    <ErrorBox
                      message={error}
                    />
                  )}

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      goToStep(1)
                    }
                    className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-black text-zinc-700 transition hover:border-orange-200 hover:text-orange-600"
                  >
                    <ArrowLeft className="h-4 w-4" />

                    Retour / رجوع
                  </button>

                  <button
                    type="button"
                    onClick={nextStep}
                    className="group flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition hover:-translate-y-0.5 hover:bg-orange-600"
                  >
                    Continuer vers le
                    paiement

                    <span dir="rtl">
                      / متابعة إلى الدفع
                    </span>

                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                  </button>
                </div>
              </StepCard>
            </div>

            {/* ============================
                ÉTAPE 3
            ============================ */}

            <div
              className={
                currentStep === 3
                  ? "block"
                  : "hidden"
              }
            >
              <StepCard
                number="03"
                icon={CreditCard}
                eyebrow="Étape 3 / الخطوة 3"
                title="Paiement et confirmation"
                arabic="الدفع والتأكيد"
                description="Vérifiez votre livraison et confirmez la commande."
                arabicDescription="تحقق من معلومات التوصيل ثم أكد الطلب."
              >
                {/* ============================
                    PAIEMENT
                ============================ */}

                <div className="rounded-[22px] border-2 border-orange-400 bg-orange-50/70 p-4 sm:p-5">
                  <label className="flex cursor-default items-start gap-4">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-orange-500 bg-white">
                      <span className="h-3 w-3 rounded-full bg-orange-500" />
                    </span>

                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH_ON_DELIVERY"
                      checked
                      readOnly
                      className="sr-only"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-orange-500" />

                        <p className="font-black text-zinc-950">
                          Paiement à la
                          livraison
                        </p>
                      </div>

                      <p
                        className="mt-1 text-sm font-bold text-orange-700"
                        dir="rtl"
                      >
                        الدفع عند الاستلام
                      </p>

                      <p className="mt-2 text-xs leading-5 text-zinc-500 sm:text-sm">
                        Vous payez votre
                        commande au moment
                        de la réception.

                        <span
                          className="block"
                          dir="rtl"
                        >
                          تدفع قيمة الطلب
                          عند الاستلام.
                        </span>
                      </p>
                    </div>
                  </label>
                </div>

                {/* ============================
                    RÉCAP LIVRAISON
                ============================ */}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ReviewTile
                    icon={Truck}
                    title="Livraison"
                    value={
                      zrConfigured
                        ? deliveryType ===
                          "STOP_DESK"
                          ? "Stop Desk / مكتب الاستلام"
                          : "À domicile / إلى المنزل"
                        : "À domicile / إلى المنزل"
                    }
                  />

                  <ReviewTile
                    icon={MapPin}
                    title="Destination"
                    value={
                      zrConfigured
                        ? `${selectedWilaya?.name || "—"} · ${selectedCommune?.name || "—"}`
                        : `${getFormValue("wilaya") || "—"} · ${getFormValue("commune") || "—"}`
                    }
                  />

                  {zrConfigured &&
                    deliveryType ===
                      "STOP_DESK" &&
                    selectedHub && (
                      <div className="sm:col-span-2">
                        <ReviewTile
                          icon={Store}
                          title="Bureau ZR automatique / مكتب ZR تلقائي"
                          value={`${selectedHub.name || "Bureau ZR"}${
                            selectedHub.address
                              ? ` — ${selectedHub.address}`
                              : ""
                          }`}
                        />
                      </div>
                    )}
                </div>

                {/* ============================
                    TOTAL
                ============================ */}

                <div className="mt-5 rounded-[22px] bg-zinc-950 p-5 text-white">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-zinc-400">
                      Sous-total / المجموع
                      الفرعي
                    </span>

                    <strong>
                      {formatPrice(
                        subtotal,
                      )}{" "}
                      DA
                    </strong>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                    <span className="text-zinc-400">
                      Livraison / التوصيل
                    </span>

                    <strong>
                      {deliveryFee !==
                      null
                        ? `${formatPrice(
                            deliveryFee,
                          )} DA`
                        : "—"}
                    </strong>
                  </div>

                  <div className="my-4 border-t border-zinc-800" />

                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-zinc-400">
                        Total à payer
                      </p>

                      <p
                        className="text-xs text-zinc-500"
                        dir="rtl"
                      >
                        المبلغ الإجمالي
                      </p>
                    </div>

                    <strong className="text-2xl font-black text-orange-400 sm:text-3xl">
                      {formatPrice(
                        grandTotal,
                      )}

                      <span className="ml-1 text-sm">
                        DA
                      </span>
                    </strong>
                  </div>
                </div>

                {error &&
                  currentStep === 3 && (
                    <ErrorBox
                      message={error}
                    />
                  )}

                {/* ============================
                    ACTIONS ÉTAPE 3
                ============================ */}

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      goToStep(2)
                    }
                    className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-black text-zinc-700 transition hover:border-orange-200 hover:text-orange-600"
                  >
                    <ArrowLeft className="h-4 w-4" />

                    Modifier la livraison
                    / تعديل التوصيل
                  </button>

                  {/* 
                    IMPORTANT :
                    CE BOUTON N'INSÈRE PLUS
                    DIRECTEMENT LA COMMANDE.

                    Il déclenche submit(),
                    qui ouvre la popup.
                  */}
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !items.length
                    }
                    className="group flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ShieldCheck className="h-5 w-5" />

                    Confirmer la
                    commande

                    <span dir="rtl">
                      / تأكيد الطلب
                    </span>
                  </button>
                </div>
              </StepCard>
            </div>
          </form>
        </div>

        {/* ============================
            RÉSUMÉ
        ============================ */}

        <aside className="min-w-0 lg:sticky lg:top-28">
          <div className="overflow-hidden rounded-[26px] border border-zinc-200 bg-white shadow-[0_18px_55px_rgba(24,24,27,0.09)]">
            <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.35),transparent_42%),linear-gradient(135deg,#09090b,#18181b_58%,#2a1a12)] px-5 py-6 text-white sm:px-6">
              <div className="relative flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/25">
                  <ShoppingBag className="h-5 w-5" />
                </span>

                <div>
                  <h2 className="text-xl font-black">
                    Votre commande
                  </h2>

                  <p
                    className="text-sm text-zinc-400"
                    dir="rtl"
                  >
                    طلبك
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {items.length ? (
                <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
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
                    Votre panier est
                    vide. / سلة التسوق
                    فارغة.
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-3 border-t border-zinc-200 pt-5">
                <SummaryLine
                  label={`Sous-total / المجموع الفرعي (${totalQuantity})`}
                  value={`${formatPrice(
                    subtotal,
                  )} DA`}
                />

                <SummaryLine
                  label="Livraison / التوصيل"
                  value={
                    quoteLoading
                      ? "Calcul..."
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
                  label="Paiement / الدفع"
                  value="À la livraison / عند الاستلام"
                />
              </div>

              <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-zinc-500">
                      Total
                    </p>

                    <p
                      className="text-xs text-zinc-400"
                      dir="rtl"
                    >
                      المجموع
                    </p>
                  </div>

                  <strong className="text-2xl font-black text-zinc-950">
                    {formatPrice(
                      grandTotal,
                    )}

                    <span className="ml-1 text-sm text-orange-500">
                      DA
                    </span>
                  </strong>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-zinc-50 p-3 text-center text-[11px] font-semibold leading-5 text-zinc-500">
                <ShieldCheck className="mx-auto mb-1.5 h-5 w-5 text-emerald-500" />

                Données sécurisées /
                بيانات آمنة
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* ============================
          BARRE MOBILE
      ============================ */}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_38px_rgba(24,24,27,0.12)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 shrink-0">
            <span className="block text-[9px] font-bold uppercase tracking-wide text-zinc-400">
              {currentStep === 1
                ? "Étape 1/3"
                : currentStep === 2
                  ? "Étape 2/3"
                  : "Total"}
            </span>

            <strong className="mt-0.5 block whitespace-nowrap text-base font-black text-zinc-950">
              {currentStep === 3 ? (
                <>
                  {formatPrice(
                    grandTotal,
                  )}

                  <span className="ml-1 text-xs text-orange-500">
                    DA
                  </span>
                </>
              ) : currentStep === 1 ? (
                "Informations"
              ) : (
                "Livraison"
              )}
            </strong>
          </div>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex min-h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-xs font-black text-white shadow-[0_10px_24px_rgba(249,115,22,0.30)]"
            >
              Continuer / متابعة

              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            /*
             * Ce bouton déclenche également submit()
             * donc ouvre la popup de confirmation.
             */
            <button
              type="submit"
              form="checkout-form"
              disabled={
                loading ||
                !items.length
              }
              className="flex min-h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-xs font-black text-white shadow-[0_10px_24px_rgba(249,115,22,0.30)] disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" />

              Confirmer / تأكيد الطلب
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          POPUP CONFIRMATION FINALE

          AUCUNE COMMANDE N'EST INSÉRÉE AVANT
          LE CLIC SUR "OUI, CONFIRMER".
      ====================================================== */}

      {showConfirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
                event.currentTarget &&
              !loading
            ) {
              setShowConfirmation(
                false,
              );
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-confirmation-title"
            className="w-full overflow-hidden rounded-t-[30px] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:max-w-lg sm:rounded-[30px]"
          >
            {/* ============================
                HEADER POPUP
            ============================ */}

            <div className="relative overflow-hidden bg-zinc-950 px-5 py-6 text-white sm:px-7">
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-500/25 blur-3xl" />

              <div className="relative flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/20">
                  <PackageCheck className="h-6 w-6" />
                </span>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                    Confirmation / تأكيد
                  </p>

                  <h3
                    id="checkout-confirmation-title"
                    className="mt-1 text-xl font-black sm:text-2xl"
                  >
                    Confirmer votre
                    commande ?
                  </h3>

                  <p
                    className="mt-1 text-sm font-bold text-orange-300"
                    dir="rtl"
                  >
                    هل تريد تأكيد الطلب؟
                  </p>
                </div>
              </div>
            </div>

            {/* ============================
                BODY POPUP
            ============================ */}

            <div className="max-h-[72vh] overflow-y-auto p-5 sm:p-7">
              <p className="text-sm leading-6 text-zinc-500">
                Vérifiez les
                informations suivantes
                avant l&apos;enregistrement
                définitif de votre
                commande.

                <span
                  className="mt-1 block"
                  dir="rtl"
                >
                  تحقق من المعلومات
                  التالية قبل تسجيل
                  الطلب نهائياً.
                </span>
              </p>

              {/* ============================
                  INFOS CLIENT
              ============================ */}

              <div className="mt-5 space-y-3">
                <ConfirmationRow
                  icon={UserRound}
                  label="Client / الزبون"
                  value={
                    getFormValue(
                      "name",
                    ) || "—"
                  }
                />

                <ConfirmationRow
                  icon={Phone}
                  label="Téléphone / الهاتف"
                  value={
                    getFormValue(
                      "phone",
                    ) || "—"
                  }
                />

                <ConfirmationRow
                  icon={MapPin}
                  label="Destination / الوجهة"
                  value={
                    zrConfigured
                      ? `${selectedWilaya?.name || "—"} · ${selectedCommune?.name || "—"}`
                      : `${getFormValue("wilaya") || "—"} · ${getFormValue("commune") || "—"}`
                  }
                />

                <ConfirmationRow
                  icon={
                    zrConfigured &&
                    deliveryType ===
                      "STOP_DESK"
                      ? Store
                      : Home
                  }
                  label="Livraison / التوصيل"
                  value={
                    zrConfigured
                      ? deliveryType ===
                        "STOP_DESK"
                        ? "Stop Desk / مكتب الاستلام"
                        : "À domicile / إلى المنزل"
                      : "À domicile / إلى المنزل"
                  }
                />

                {/* ============================
                    BUREAU ZR DANS CONFIRMATION
                ============================ */}

                {zrConfigured &&
                  deliveryType ===
                    "STOP_DESK" &&
                  selectedHub && (
                    <ConfirmationRow
                      icon={Store}
                      label="Bureau ZR / مكتب ZR"
                      value={
                        selectedHub.name ||
                        "Bureau ZR Express"
                      }
                      subValue={
                        selectedHub.address ||
                        undefined
                      }
                    />
                  )}

                {/* ============================
                    ADRESSE HOME
                ============================ */}

                {deliveryType ===
                  "HOME" &&
                  getFormValue(
                    "address",
                  ) && (
                    <ConfirmationRow
                      icon={MapPin}
                      label="Adresse / العنوان"
                      value={getFormValue(
                        "address",
                      )}
                    />
                  )}
              </div>

              {/* ============================
                  TOTAL POPUP
              ============================ */}

              <div className="mt-5 overflow-hidden rounded-[22px] bg-zinc-950 p-5 text-white">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-400">
                    Sous-total / المجموع
                    الفرعي
                  </span>

                  <strong className="text-sm">
                    {formatPrice(
                      subtotal,
                    )}{" "}
                    DA
                  </strong>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-400">
                    Livraison / التوصيل
                  </span>

                  <strong className="text-sm">
                    {deliveryFee !== null
                      ? `${formatPrice(
                          deliveryFee,
                        )} DA`
                      : "—"}
                  </strong>
                </div>

                <div className="my-4 border-t border-zinc-800" />

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-black">
                      Total à payer
                    </p>

                    <p
                      className="text-xs text-zinc-500"
                      dir="rtl"
                    >
                      المبلغ الإجمالي
                    </p>
                  </div>

                  <strong className="text-2xl font-black text-orange-400">
                    {formatPrice(
                      grandTotal,
                    )}

                    <span className="ml-1 text-sm">
                      DA
                    </span>
                  </strong>
                </div>
              </div>

              {/* ============================
                  MESSAGE IMPORTANT
              ============================ */}

              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />

                <div className="text-xs font-semibold leading-5 text-orange-800">
                  La commande sera
                  enregistrée uniquement
                  après votre confirmation.

                  <span
                    className="block"
                    dir="rtl"
                  >
                    لن يتم تسجيل الطلب إلا
                    بعد التأكيد.
                  </span>
                </div>
              </div>

              {/* ============================
                  BOUTONS POPUP
              ============================ */}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    setShowConfirmation(
                      false,
                    )
                  }
                  className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-black text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />

                  Modifier / تعديل
                </button>

                {/* 
                  C'EST CE BOUTON UNIQUEMENT
                  QUI INSÈRE LA COMMANDE.
                */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    void confirmOrder()
                  }
                  className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}

                  {loading
                    ? "Enregistrement..."
                    : "Oui, confirmer"}

                  {!loading && (
                    <span dir="rtl">
                      / نعم، تأكيد
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   STEP CARD
========================================================= */

interface StepCardProps {
  number: string;
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  arabic: string;
  description: string;
  arabicDescription: string;
  children: React.ReactNode;
}

function StepCard({
  number,
  icon: Icon,
  eyebrow,
  title,
  arabic,
  description,
  arabicDescription,
  children,
}: StepCardProps) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-zinc-200 bg-white shadow-[0_16px_50px_rgba(24,24,27,0.08)] sm:rounded-[30px]">
      <div className="border-b border-zinc-100 bg-gradient-to-r from-orange-50/80 via-white to-white px-4 py-5 sm:px-7 sm:py-6">
        <div className="flex items-start gap-4">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.25)]">
            <Icon className="h-5 w-5" />

            <small className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-zinc-950 px-1 text-[9px] font-black text-white">
              {number}
            </small>
          </span>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-500">
              {eyebrow}
            </p>

            <h2 className="mt-1 text-xl font-black leading-tight text-zinc-950 sm:text-2xl">
              {title}
            </h2>

            <p
              className="mt-1 text-base font-black text-orange-600"
              dir="rtl"
            >
              {arabic}
            </p>

            <p className="mt-2 text-xs leading-5 text-zinc-500 sm:text-sm sm:leading-6">
              {description}

              <span
                className="block"
                dir="rtl"
              >
                {arabicDescription}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-7">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   CHECKOUT STEP
========================================================= */

interface CheckoutStepProps {
  number: CheckoutStepNumber;
  currentStep: CheckoutStepNumber;
  title: string;
  arabic: string;
  onClick: () => void;
}

function CheckoutStep({
  number,
  currentStep,
  title,
  arabic,
  onClick,
}: CheckoutStepProps) {
  const active =
    currentStep === number;

  const completed =
    currentStep > number;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-w-0 items-center gap-2 rounded-2xl border px-2 py-2.5 text-left transition sm:gap-3 sm:px-4 sm:py-3 ${
        active
          ? "border-orange-200 bg-orange-50 shadow-sm"
          : completed
            ? "border-emerald-100 bg-emerald-50/60"
            : "border-transparent bg-white hover:border-zinc-200 hover:bg-zinc-50"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition sm:h-10 sm:w-10 sm:text-sm ${
          active
            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
            : completed
              ? "bg-emerald-500 text-white"
              : "bg-zinc-100 text-zinc-400"
        }`}
      >
        {completed ? (
          <Check className="h-4 w-4" />
        ) : (
          number
        )}
      </span>

      <span className="min-w-0">
        <strong
          className={`block truncate text-[10px] font-black sm:text-sm ${
            active
              ? "text-orange-600"
              : completed
                ? "text-emerald-700"
                : "text-zinc-500"
          }`}
        >
          {title}
        </strong>

        <span
          className={`mt-0.5 block truncate text-[9px] sm:text-xs ${
            active
              ? "text-orange-500"
              : completed
                ? "text-emerald-600"
                : "text-zinc-400"
          }`}
          dir="rtl"
        >
          {arabic}
        </span>
      </span>
    </button>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

interface FormFieldProps {
  label: string;
  arabicLabel: string;
  name: string;
  placeholder: string;
  arabicPlaceholder?: string;
  icon: React.ElementType;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}

function FormField({
  label,
  arabicLabel,
  name,
  placeholder,
  arabicPlaceholder,
  icon: Icon,
  type = "text",
  autoComplete,
  required = false,
}: FormFieldProps) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-black text-zinc-800">
        <span>{label}</span>

        <span className="text-zinc-400">
          /
        </span>

        <span dir="rtl">
          {arabicLabel}
        </span>
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
          placeholder={`${placeholder}${
            arabicPlaceholder
              ? ` / ${arabicPlaceholder}`
              : ""
          }`}
          className="min-h-[56px] w-full min-w-0 rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-sm font-semibold text-zinc-900 outline-none transition placeholder:text-xs placeholder:font-medium placeholder:text-zinc-400 hover:border-zinc-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
        />
      </span>
    </label>
  );
}

/* =========================================================
   ZR SELECT
========================================================= */

interface ZrSelectProps {
  label: string;
  arabicLabel: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  items: Array<{
    value: string;
    label: string;
  }>;
  placeholder: string;
  arabicPlaceholder: string;
  disabled?: boolean;
}

function ZrSelect({
  label,
  arabicLabel,
  value,
  onChange,
  items,
  placeholder,
  arabicPlaceholder,
  disabled = false,
}: ZrSelectProps) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 flex flex-wrap items-center gap-x-1.5 text-sm font-black text-zinc-800">
        <span>{label}</span>

        <span className="text-zinc-400">
          /
        </span>

        <span dir="rtl">
          {arabicLabel}
        </span>
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
          className="min-h-[56px] w-full appearance-none truncate rounded-2xl border border-zinc-200 bg-white pl-12 pr-10 text-sm font-semibold text-zinc-900 outline-none transition hover:border-zinc-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
        >
          <option value="">
            {placeholder} /{" "}
            {arabicPlaceholder}
          </option>

          {items.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

/* =========================================================
   DELIVERY RADIO CARD
========================================================= */

interface DeliveryRadioCardProps {
  checked: boolean;
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  arabic: string;
  description: string;
  arabicDescription: string;
  badge?: string;
}

function DeliveryRadioCard({
  checked,
  onClick,
  icon: Icon,
  title,
  arabic,
  description,
  arabicDescription,
  badge,
}: DeliveryRadioCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className={`relative overflow-hidden rounded-[22px] border-2 p-4 text-left transition-all duration-300 sm:p-5 ${
        checked
          ? "border-orange-500 bg-orange-500 text-white shadow-[0_15px_35px_rgba(249,115,22,0.25)]"
          : "border-zinc-200 bg-white text-zinc-900 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
      }`}
    >
      <span
        className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
          checked
            ? "border-white bg-white"
            : "border-zinc-300 bg-white"
        }`}
      >
        {checked && (
          <span className="h-3 w-3 rounded-full bg-orange-500" />
        )}
      </span>

      <span
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          checked
            ? "bg-white/15 text-white"
            : "bg-orange-50 text-orange-500"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>

      <div className="mt-4 pr-6">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-base font-black">
            {title}
          </strong>

          {badge && (
            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${
                checked
                  ? "bg-white text-orange-600"
                  : "bg-orange-100 text-orange-600"
              }`}
            >
              {badge}
            </span>
          )}
        </div>

        <p
          className={`mt-1 text-sm font-bold ${
            checked
              ? "text-orange-50"
              : "text-zinc-700"
          }`}
          dir="rtl"
        >
          {arabic}
        </p>

        <p
          className={`mt-3 text-xs leading-5 ${
            checked
              ? "text-orange-50"
              : "text-zinc-500"
          }`}
        >
          {description}

          <span
            className="mt-1 block"
            dir="rtl"
          >
            {arabicDescription}
          </span>
        </p>
      </div>
    </button>
  );
}

/* =========================================================
   SECTION LABEL
========================================================= */

function SectionLabel({
  title,
  arabic,
}: {
  title: string;
  arabic: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />

      <p className="text-sm font-black text-zinc-900">
        {title}{" "}
        <span className="text-zinc-400">
          /
        </span>{" "}
        <span dir="rtl">
          {arabic}
        </span>
      </p>
    </div>
  );
}

/* =========================================================
   TEXT AREA
========================================================= */

interface TextAreaFieldProps {
  label: string;
  arabicLabel: string;
  name: string;
  rows: number;
  placeholder: string;
  arabicPlaceholder: string;
  optional?: boolean;
  icon?: React.ElementType;
}

function TextAreaField({
  label,
  arabicLabel,
  name,
  rows,
  placeholder,
  arabicPlaceholder,
  optional = false,
  icon: Icon,
}: TextAreaFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 flex flex-wrap items-center gap-1.5 text-sm font-black text-zinc-800">
        {label}

        <span className="text-zinc-400">
          /
        </span>

        <span dir="rtl">
          {arabicLabel}
        </span>

        {optional && (
          <span className="ml-1 text-xs font-medium text-zinc-400">
            facultatif / اختياري
          </span>
        )}
      </span>

      <span className="relative block">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-zinc-400" />
        )}

        <textarea
          name={name}
          rows={rows}
          placeholder={`${placeholder} / ${arabicPlaceholder}`}
          className={`w-full resize-none rounded-2xl border border-zinc-200 bg-white py-4 pr-4 text-sm font-medium text-zinc-900 outline-none transition placeholder:text-xs placeholder:text-zinc-400 hover:border-zinc-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 ${
            Icon
              ? "pl-12"
              : "pl-4"
          }`}
        />
      </span>
    </label>
  );
}

/* =========================================================
   INFO NOTE
========================================================= */

function InfoNote({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-blue-700 sm:text-sm">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />

      <div>{children}</div>
    </div>
  );
}

/* =========================================================
   ERROR BOX
========================================================= */

function ErrorBox({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700 sm:text-sm">
      {message}
    </div>
  );
}

/* =========================================================
   REVIEW TILE
========================================================= */

interface ReviewTileProps {
  icon: React.ElementType;
  title: string;
  value: string;
}

function ReviewTile({
  icon: Icon,
  title,
  value,
}: ReviewTileProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
          {title}
        </p>

        <p className="mt-1 break-words text-sm font-black leading-5 text-zinc-900">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   CONFIRMATION ROW
========================================================= */

interface ConfirmationRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
}

function ConfirmationRow({
  icon: Icon,
  label,
  value,
  subValue,
}: ConfirmationRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm ring-1 ring-zinc-100">
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-black leading-5 text-zinc-950">
          {value}
        </p>

        {subValue && (
          <p className="mt-1 flex items-start gap-1.5 break-words text-xs leading-5 text-zinc-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />

            <span>
              {subValue}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   ORDER ITEM
========================================================= */

function OrderItem({
  item,
}: {
  item: CartItem;
}) {
  const total =
    Number(item.price) *
    Number(item.quantity);

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200">
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
        {formatPrice(total)} DA
      </strong>
    </div>
  );
}

/* =========================================================
   SUMMARY LINE
========================================================= */

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
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="leading-5 text-zinc-500">
        {label}
      </span>

      <strong
        className={`max-w-[48%] break-words text-right text-zinc-950 ${valueClassName}`}
      >
        {value}
      </strong>
    </div>
  );
}

/* =========================================================
   CHECKOUT STAT
========================================================= */

function CheckoutStat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white/90 p-3 shadow-[0_10px_30px_rgba(24,24,27,0.06)] sm:p-4">
      <strong className="block break-words text-base font-black text-zinc-950 sm:text-xl">
        {value}
      </strong>

      <span className="mt-1 block text-[8px] font-bold uppercase leading-4 tracking-wider text-zinc-400 sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function CheckoutLoading() {
  return (
    <main className="min-h-screen bg-[#f7f7f8]">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 sm:py-14 lg:grid-cols-[1fr_390px] lg:px-8">
        <div className="h-[600px] animate-pulse rounded-[26px] bg-zinc-200" />

        <div className="h-[520px] animate-pulse rounded-[26px] bg-zinc-200" />
      </div>
    </main>
  );
}