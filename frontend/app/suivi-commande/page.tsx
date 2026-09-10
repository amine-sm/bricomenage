"use client";

import {
  type FormEvent,
  Suspense,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import Link from "next/link";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Phone,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  apiFetch,
} from "@/lib/api";

interface TrackingOrder {
  id?: number;
  tracking_number: string;
  status: string;
  customer_name?: string;
  phone?: string;
  wilaya?: string;
  commune?: string;
  address?: string;
  total?: number;
  created_at?: string;
  delivery_fee?: number;
  zr_tracking_number?: string | null;
  zr_status?: string | null;
  zr_status_label?: string | null;
  zr_synced_at?: string | null;
  zr_delivery_type?: string | null;
}

interface TrackingHistory {
  id: string | number;
  label: string;
  description?: string;
  created_at: string;
  status?: string;
}

interface TrackingResponse {
  order: TrackingOrder;
  history: TrackingHistory[];
}

function formatPrice(
  value: number,
) {
  return new Intl.NumberFormat(
    "fr-DZ",
  ).format(value);
}

function formatDate(
  value?: string,
) {
  if (!value) {
    return "Date indisponible";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "fr-DZ",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function normalizeStatus(
  status?: string,
) {
  return String(
    status || "",
  )
    .trim()
    .toUpperCase();
}

function isZrTrackingNumber(value: string) {
  return /^\d+-[A-Z0-9]+-ZR$/i.test(value.trim());
}

function mapZrStatusToLocal(status?: string) {
  switch (normalizeStatus(status)) {
    case "PICKED_UP":
    case "IN_TRANSIT":
      return "EXPEDIEE";
    case "OUT_FOR_DELIVERY":
      return "EN_LIVRAISON";
    case "DELIVERED":
      return "LIVREE";
    case "CANCELLED":
      return "ANNULEE";
    default:
      return "EN_PREPARATION";
  }
}

function getStatusLabel(
  status?: string,
) {
  const normalized =
    normalizeStatus(status);

  const labels: Record<
    string,
    string
  > = {
    NOUVELLE:
      "Commande reçue",
    EN_ATTENTE:
      "En attente",
    CONFIRMEE:
      "Commande confirmée",
    CONFIRMÉE:
      "Commande confirmée",
    EN_PREPARATION:
      "En préparation",
    EN_PRÉPARATION:
      "En préparation",
    PREPAREE:
      "Commande préparée",
    PRÉPARÉE:
      "Commande préparée",
    EXPEDIEE:
      "Commande expédiée",
    EXPÉDIÉE:
      "Commande expédiée",
    EN_LIVRAISON:
      "En cours de livraison",
    LIVREE:
      "Commande livrée",
    LIVRÉE:
      "Commande livrée",
    ANNULEE:
      "Commande annulée",
    ANNULÉE:
      "Commande annulée",
  };

  return (
    labels[normalized] ||
    status ||
    "Statut indisponible"
  );
}

function normalizeZrHistoryForPage(
  history: unknown,
  fallbackStatus: string,
  fallbackLabel: string,
  fallbackDate?: string | null,
): TrackingHistory[] {
  const rows = Array.isArray(history) ? history : [];

  return rows
    .map((event, index) => {
      const item = event && typeof event === "object"
        ? event as Record<string, unknown>
        : {};

      const createdAt = String(
        item.createdAt ??
          item.created_at ??
          item.occurredAt ??
          item.timestamp ??
          item.date ??
          fallbackDate ??
          new Date().toISOString(),
      );

      const label = String(
        item.label ??
          item.statusLabel ??
          item.stateName ??
          item.statusName ??
          item.name ??
          fallbackLabel ??
          "Suivi ZR Express",
      );

      let descriptionValue =
        item.description ??
        item.comment ??
        item.note ??
        item.observation ??
        item.details ??
        null;

      // Nettoyage pour éviter d'afficher des codes techniques bruts (ex: confirmed_in_validation)
      const descStr = descriptionValue ? String(descriptionValue).trim() : "";
      const description = (descStr && !descStr.startsWith("confirmed_in_") && descStr !== label)
        ? descStr
        : undefined;

      return {
        id: String(item.id ?? item.eventId ?? item.stateId ?? `zr-${index}-${createdAt}`),
        status: item.status
          ? String(item.status)
          : fallbackStatus,
        label,
        description,
        created_at: createdAt,
      };
    })
    .sort((a, b) => {
      const ta = Date.parse(a.created_at);
      const tb = Date.parse(b.created_at);
      // Tri antéchronologique : le plus récent en haut (comme sur ZR Express)
      if (Number.isFinite(ta) && Number.isFinite(tb)) return tb - ta;
      return 0;
    });
}

function getStatusStyle(
  status?: string,
) {
  const normalized =
    normalizeStatus(status);

  if (
    normalized.includes(
      "LIVR",
    ) &&
    !normalized.includes(
      "EN_LIVRAISON",
    )
  ) {
    return {
      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon:
        "bg-emerald-500 text-white",
      dot:
        "bg-emerald-500",
    };
  }

  if (
    normalized.includes(
      "ANNU",
    )
  ) {
    return {
      badge:
        "border-red-200 bg-red-50 text-red-700",
      icon:
        "bg-red-500 text-white",
      dot:
        "bg-red-500",
    };
  }

  if (
    normalized.includes(
      "LIVRAISON",
    ) ||
    normalized.includes(
      "EXPED",
    ) ||
    normalized.includes(
      "EXPÉD",
    )
  ) {
    return {
      badge:
        "border-blue-200 bg-blue-50 text-blue-700",
      icon:
        "bg-blue-500 text-white",
      dot:
        "bg-blue-500",
    };
  }

  return {
    badge:
      "border-orange-200 bg-orange-50 text-orange-700",
    icon:
      "bg-orange-500 text-white",
    dot:
      "bg-orange-500",
  };
}

function TrackingContent() {
  const searchParams =
    useSearchParams();

  const preset =
    searchParams.get(
      "tracking",
    ) || "";

  const [data, setData] =
    useState<TrackingResponse | null>(
      null,
    );

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const statusStyle =
    useMemo(
      () =>
        getStatusStyle(
          data?.order.status,
        ),
      [data],
    );

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setData(null);

    const form =
      new FormData(
        event.currentTarget,
      );

    const trackingNumber =
      String(
        form.get(
          "tracking",
        ) || "",
      ).trim();

    const phone =
      String(
        form.get("phone") ||
          "",
      ).trim();

    if (!trackingNumber) {
      setError(
        "Veuillez saisir un numéro de suivi.",
      );
      setLoading(false);
      return;
    }

    const isZr = isZrTrackingNumber(trackingNumber);

    if (!isZr && !phone) {
      setError(
        "Pour un numéro BricoMénage, le téléphone utilisé lors de la commande est obligatoire.",
      );
      setLoading(false);
      return;
    }

    try {
      if (isZr) {
        const response = await apiFetch<{
          success: boolean;
          data: {
            trackingNumber: string;
            status: string;
            statusLabel: string;
            rawStatus?: string | null;
            recipientName?: string | null;
            toCommune?: string | null;
            createdAt?: string | null;
            updatedAt?: string | null;
            history?: Array<{
              id: string | number;
              label: string;
              description?: string | null;
              createdAt?: string | null;
              status?: string | null;
            }>;
          };
        }>(
          "/zr/track",
          {
            method: "POST",
            body: JSON.stringify({
              trackingNumber: trackingNumber.toUpperCase(),
            }),
          },
        );

        if (!response.data) {
          throw new Error(
            "Tracking ZR Express introuvable.",
          );
        }

        const localStatus = mapZrStatusToLocal(
          response.data.status,
        );

        setData({
          order: {
            tracking_number:
              response.data.trackingNumber ||
              trackingNumber.toUpperCase(),
            status: localStatus,
            customer_name:
              response.data.recipientName ||
              undefined,
            commune:
              response.data.toCommune ||
              undefined,
            zr_tracking_number:
              response.data.trackingNumber ||
              trackingNumber.toUpperCase(),
            zr_status:
              response.data.status ||
              null,
            zr_status_label:
              response.data.statusLabel ||
              null,
            zr_synced_at:
              response.data.updatedAt ||
              new Date().toISOString(),
          },
          history: (() => {
            const normalizedHistory = normalizeZrHistoryForPage(
              response.data.history,
              localStatus,
              response.data.statusLabel || "Suivi ZR Express",
              response.data.updatedAt || response.data.createdAt,
            );

            if (normalizedHistory.length) {
              return normalizedHistory;
            }

            return [
              {
                id: `current-${Date.now()}`,
                status: localStatus,
                label:
                  response.data.statusLabel ||
                  "Suivi ZR Express",
                description:
                  response.data.rawStatus ||
                  "Statut récupéré directement depuis ZR Express.",
                created_at:
                  response.data.updatedAt ||
                  response.data.createdAt ||
                  new Date().toISOString(),
              },
            ];
          })(),
        });

        return;
      }

      const response =
        await apiFetch<TrackingResponse>(
          "/tracking/check",
          {
            method: "POST",
            body: JSON.stringify({
              trackingNumber,
              phone,
            }),
          },
        );

      if (
        !response.order
      ) {
        throw new Error(
          "Commande introuvable.",
        );
      }

      setData({
        order:
          response.order,
        history:
          Array.isArray(
            response.history,
          )
            ? response.history
            : [],
      });
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Commande introuvable.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* En-tête */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />

          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.024)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.024)_1px,transparent_1px)] bg-[size:55px_55px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition-colors hover:text-orange-500"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />

            Retour à l’accueil
          </Link>

          <div className="mt-8 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600">
              <Truck className="h-4 w-4" />

              Suivi en temps réel
            </span>

            <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
              Suivez votre
              <span className="block text-orange-500">
                commande
              </span>
            </h1>

         
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Formulaire de recherche */}
        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
          className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(24,24,27,0.07)]"
        >
          <div className="border-b border-zinc-200 px-5 py-6 sm:px-7">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <Search className="h-6 w-6" />
              </span>

              <div>
                <h2 className="text-xl font-black text-zinc-950 sm:text-2xl">
                  Rechercher une commande
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Pour un tracking ZR Express,
                  un seul numéro suffit. Pour une
                  commande BricoMénage, le téléphone
                  protège l’accès aux informations.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="p-5 sm:p-7"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-zinc-800">
                  Numéro de suivi BricoMénage ou ZR Express
                </span>

                <span className="relative block">
                  <PackageCheck className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

                  <input
                    name="tracking"
                    defaultValue={
                      preset
                    }
                    required
                    autoComplete="off"
                    placeholder="Ex. BRICO-2026-02E031B4 ou 16-XXXXXXXXXXXXX-ZR"
                    className="min-h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-4 text-sm font-semibold uppercase tracking-wide text-zinc-900 outline-none transition-all placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-zinc-800">
                  Téléphone
                  <span className="ml-1 font-medium text-zinc-400">(obligatoire uniquement pour une commande BricoMénage)</span>
                </span>

                <span className="relative block">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Ex. 0550 00 00 00"
                    className="min-h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-4 text-sm font-semibold text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                  />
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />

                  Recherche en cours...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />

                  Afficher le suivi
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Erreur */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <strong className="block text-sm font-black text-red-700">
                  Suivi introuvable
                </strong>

                <p className="mt-1 text-sm leading-6 text-red-600">
                  {error}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Résultat */}
        <AnimatePresence>
          {data && (
            <motion.div
              initial={{
                opacity: 0,
                y: 28,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -15,
              }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
              }}
              className="mt-8 grid items-start gap-8 lg:grid-cols-[360px_1fr]"
            >
              {/* Informations commande */}
              <aside className="overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(24,24,27,0.07)] lg:sticky lg:top-28">
                <div className="relative overflow-hidden bg-zinc-950 px-6 py-7 text-white">
                  <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-500/20 blur-3xl" />

                  <div className="relative">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${statusStyle.icon}`}
                    >
                      <Truck className="h-6 w-6" />
                    </span>

                    <h2 className="mt-5 text-2xl font-black">
                      Votre commande
                    </h2>

                    <p className="mt-2 text-sm text-zinc-400">
                      Informations principales
                      du suivi.
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                    Numéro de suivi
                  </span>

                  <code className="mt-2 block break-all font-mono text-xl font-black text-zinc-950">
                    {
                      data.order
                        .tracking_number
                    }
                  </code>

                  <div className="mt-5">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black ${statusStyle.badge}`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${statusStyle.dot}`}
                      />

                      {getStatusLabel(
                        data.order
                          .status,
                      )}
                    </span>
                  </div>

                  <div className="mt-6 space-y-4 border-t border-zinc-200 pt-6">
                    {data.order
                      .customer_name && (
                      <OrderInfo
                        label="Client"
                        value={
                          data.order
                            .customer_name
                        }
                      />
                    )}

                    {data.order
                      .created_at && (
                      <OrderInfo
                        label="Date de commande"
                        value={formatDate(
                          data.order
                            .created_at,
                        )}
                      />
                    )}

                    {data.order
                      .wilaya && (
                      <OrderInfo
                        label="Destination"
                        value={`${data.order.commune ? `${data.order.commune}, ` : ""}${data.order.wilaya}`}
                      />
                    )}

                    {data.order
                      .address && (
                      <OrderInfo
                        label="Adresse"
                        value={
                          data.order
                            .address
                        }
                      />
                    )}

                    {typeof data
                      .order.total ===
                      "number" && (
                      <OrderInfo
                        label="Total"
                        value={`${formatPrice(
                          data.order
                            .total,
                        )} DA`}
                        strong
                      />
                    )}
                  </div>

                  {data.order
                    .zr_tracking_number && (
                    <div className="mt-6 overflow-hidden rounded-2xl border border-orange-200 bg-orange-50/70">
                      <div className="flex items-center gap-3 border-b border-orange-100 px-4 py-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
                          <Truck className="h-4 w-4" />
                        </span>

                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-orange-600">
                            ZR Express
                          </span>

                          <strong className="mt-0.5 block text-sm font-black text-zinc-950">
                            Suivi transporteur
                          </strong>
                        </div>
                      </div>

                      <div className="space-y-3 p-4">
                        <OrderInfo
                          label="Tracking ZR"
                          value={
                            data.order
                              .zr_tracking_number
                          }
                          strong
                        />

                        <OrderInfo
                          label="Statut ZR"
                          value={
                            data.order
                              .zr_status_label ||
                            data.order
                              .zr_status ||
                            "Enregistré chez ZR Express"
                          }
                        />

                        {data.order
                          .zr_synced_at && (
                          <OrderInfo
                            label="Dernière synchronisation"
                            value={formatDate(
                              data.order
                                .zr_synced_at,
                            )}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                    <p className="text-xs leading-5 text-emerald-700">
                      Le paiement sera effectué
                      à la livraison.
                    </p>
                  </div>
                </div>
              </aside>

              {/* Timeline */}
              <div className="rounded-[30px] border border-zinc-200 bg-white p-5 shadow-[0_20px_60px_rgba(24,24,27,0.07)] sm:p-7">
                <div className="flex items-start gap-4 border-b border-zinc-200 pb-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                    <Clock3 className="h-6 w-6" />
                  </span>

                  <div>
                    <h2 className="text-xl font-black text-zinc-950 sm:text-2xl">
                      Historique du suivi
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      Consultez toutes les étapes retournées par ZR Express.
                    </p>
                  </div>
                </div>

                {data.history.length >
                0 ? (
                  <div className="mt-8">
                    {data.history.map(
                      (
                        history,
                        index,
                      ) => {
                        const isLast =
                          index ===
                          data.history
                            .length -
                            1;

                        return (
                          <TimelineItem
                            key={
                              history.id
                            }
                            history={
                              history
                            }
                            active={
                              isLast
                            }
                            isLast={
                              isLast
                            }
                          />
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="mt-8 flex min-h-[260px] flex-col items-center justify-center rounded-[26px] border border-dashed border-zinc-300 bg-zinc-50 px-6 text-center">
                    <Clock3 className="h-12 w-12 text-zinc-300" />

                    <h3 className="mt-5 text-lg font-black text-zinc-900">
                      Aucun historique disponible
                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                      Le suivi sera mis à jour
                      dès qu’une nouvelle étape
                      sera enregistrée.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Informations avant recherche */}
        {!data &&
          !error &&
          !loading && (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <HelpCard
                icon={PackageCheck}
                title="Numéro de suivi"
                description="Disponible après la confirmation de commande."
              />

              <HelpCard
                icon={Phone}
                title="Téléphone"
                description="Obligatoire uniquement pour un numéro BricoMénage."
              />

              <HelpCard
                icon={ShieldCheck}
                title="Accès sécurisé"
                description="ZR Express : tracking seul. BricoMénage : tracking + téléphone."
              />
            </div>
          )}
      </section>
    </main>
  );
}

interface OrderInfoProps {
  label: string;
  value: string;
  strong?: boolean;
}

function OrderInfo({
  label,
  value,
  strong = false,
}: OrderInfoProps) {
  return (
    <div>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        {label}
      </span>

      <span
        className={`mt-1 block text-sm ${
          strong
            ? "font-black text-zinc-950"
            : "font-semibold leading-6 text-zinc-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

interface TimelineItemProps {
  history: TrackingHistory;
  active: boolean;
  isLast: boolean;
}

function TimelineItem({
  history,
  active,
  isLast,
}: TimelineItemProps) {
  const normalized = normalizeStatus(history.status);
  const label = history.label.toLowerCase();

  const isDelivered =
    normalized.includes("LIVR") ||
    label.includes("livré") ||
    label.includes("livree") ||
    label.includes("livrée") ||
    label.includes("encaissé");

  const isCancelled =
    normalized.includes("ANNU") ||
    label.includes("annul");

  const isDelivery =
    normalized.includes("LIVRAISON") ||
    normalized.includes("EXPED") ||
    normalized.includes("EXPÉD") ||
    label.includes("livraison") ||
    label.includes("dispatch") ||
    label.includes("sortie");

  // Style visuel fidèle à ZR Express (point jaune/orange pour l'actif, gris/neutre pour le reste)
  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      {/* Ligne verticale de liaison */}
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute left-[19px] top-10 h-full w-0.5 bg-zinc-200"
        />
      )}

      {/* Point / Icône sur la timeline */}
      <div className="relative z-10 shrink-0">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-sm ${
            active
              ? "bg-[#f59e0b] text-white ring-4 ring-[#f59e0b]/20" // Style actif ZR Express (Jaune/Orange)
              : "bg-zinc-200 text-zinc-600"
          }`}
        >
          <span className={`h-3 w-3 rounded-full ${active ? "bg-white" : "bg-zinc-400"}`} />
        </span>
      </div>

      {/* Contenu de l'étape */}
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <strong className="text-sm font-bold text-zinc-900">
            {history.label}
          </strong>
          <span className="text-xs font-medium text-zinc-400">
            {formatDate(history.created_at)}
          </span>
        </div>

        {history.description && (
          <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
            {history.description}
          </p>
        )}
      </div>
    </div>
  );
}

interface HelpCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function HelpCard({
  icon: Icon,
  title,
  description,
}: HelpCardProps) {
  return (
    <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        <Icon className="h-6 w-6" />
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

function TrackingLoading() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="h-72 animate-pulse rounded-[32px] bg-zinc-200" />

        <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
          <div className="h-[520px] animate-pulse rounded-[30px] bg-zinc-200" />

          <div className="h-[620px] animate-pulse rounded-[30px] bg-zinc-200" />
        </div>
      </div>
    </main>
  );
}

function TrackingPageContent() {
  return (
    <Suspense
      fallback={
        <TrackingLoading />
      }
    >
      <TrackingContent />
    </Suspense>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<PageSearchParamsLoading />}>
      <TrackingPageContent />
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
