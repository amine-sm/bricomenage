"use client";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FolderTree,
  LoaderCircle,
  PackagePlus,
  RefreshCcw,
  ShoppingCart,
  Tags,
  Truck,
  TrendingUp,
  Sparkles,
  WalletCards,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  adminHeaders,
  apiFetch,
} from "@/lib/api";

type DashboardStats = {
  articles: number;
  categories: number;
  orders: number;
  revenue: number;
  purchaseCost: number;
  profit: number;
  suppliers?: number;
  lowStock?: number;
  pendingOrders?: number;
  deliveredOrders?: number;
};

type RecentOrder = {
  id: number;
  tracking_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};

type SalesChartPoint = {
  label: string;
  revenue: number;
  purchaseCost: number;
  profit: number;
  orders: number;
};

type DashboardPeriod = {
  type: DashboardFilter;
  startDate: string;
  endDate: string;
  label: string;
};

type DashboardFilter =
  | "day"
  | "week"
  | "month"
  | "custom";

type DashboardResponse = {
  stats: DashboardStats;
  recentOrders?: RecentOrder[];
  salesChart?: SalesChartPoint[];
  period?: DashboardPeriod;
};

const STATUS_LABELS: Record<
  string,
  string
> = {
  NOUVELLE: "Nouvelle",
  CONFIRMEE: "Confirmée",
  EN_PREPARATION:
    "En préparation",
  EXPEDIEE: "Expédiée",
  EN_LIVRAISON:
    "En livraison",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
};

const STATUS_CLASSES: Record<
  string,
  string
> = {
  NOUVELLE:
    "bg-blue-50 text-blue-700",
  CONFIRMEE:
    "bg-violet-50 text-violet-700",
  EN_PREPARATION:
    "bg-amber-50 text-amber-700",
  EXPEDIEE:
    "bg-cyan-50 text-cyan-700",
  EN_LIVRAISON:
    "bg-orange-50 text-orange-700",
  LIVREE:
    "bg-emerald-50 text-emerald-700",
  ANNULEE:
    "bg-red-50 text-red-700",
};

function formatPrice(
  value: number,
) {
  return new Intl.NumberFormat(
    "fr-DZ",
  ).format(Number(value || 0));
}

function formatDate(
  value: string,
) {
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
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

export default function DashboardPage() {
  const [
    stats,
    setStats,
  ] = useState<DashboardStats>({
    articles: 0,
    categories: 0,
    orders: 0,
    revenue: 0,
    purchaseCost: 0,
    profit: 0,
    suppliers: 0,
    lowStock: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
  });

  const [
    recentOrders,
    setRecentOrders,
  ] = useState<RecentOrder[]>([]);

  const [
    salesChart,
    setSalesChart,
  ] = useState<SalesChartPoint[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [period, setPeriod] =
    useState<DashboardFilter>("month");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [periodLabel, setPeriodLabel] =
    useState("Ce mois");

  const load = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const params =
          new URLSearchParams({
            period,
          });

        if (period === "custom") {
          if (!startDate || !endDate) {
            throw new Error(
              "Sélectionnez une date de début et une date de fin.",
            );
          }

          params.set(
            "startDate",
            startDate,
          );

          params.set(
            "endDate",
            endDate,
          );
        }

        const response =
          await apiFetch<DashboardResponse>(
            `/admin/dashboard?${params.toString()}`,
            {
              headers:
                adminHeaders(),
            },
          );

        setStats(
          response.stats || {
            articles: 0,
            categories: 0,
            orders: 0,
            revenue: 0,
          },
        );

        setRecentOrders(
          response.recentOrders ||
            [],
        );

        setSalesChart(
          response.salesChart ||
            [],
        );

        setPeriodLabel(
          response.period?.label ||
            "Période sélectionnée",
        );
      } catch (requestError) {
        setError(
          requestError instanceof
            Error
            ? requestError.message
            : "Impossible de charger le tableau de bord.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      period,
      startDate,
      endDate,
    ],
  );

  useEffect(() => {
    if (
      period === "custom" &&
      (!startDate || !endDate)
    ) {
      return;
    }

    load();
  }, [load, period, startDate, endDate]);

  const completionRate =
    useMemo(() => {
      const delivered =
        Number(
          stats.deliveredOrders ||
            0,
        );

      const orders =
        Number(stats.orders || 0);

      if (orders <= 0) {
        return 0;
      }

      return Math.min(
        100,
        Math.round(
          (delivered / orders) *
            100,
        ),
      );
    }, [stats]);

  const chartData =
    useMemo(() => {
      if (
        salesChart.length > 0
      ) {
        return salesChart.map(
          (point) => ({
            label:
              point.label,
            revenue:
              Number(
                point.revenue ||
                  0,
              ),
            orders:
              Number(
                point.orders ||
                  0,
              ),
          }),
        );
      }

      const formatter =
        new Intl.DateTimeFormat(
          "fr-DZ",
          {
            month: "short",
          },
        );

      const months =
        Array.from(
          { length: 6 },
          (_, index) => {
            const date =
              new Date();

            date.setDate(1);

            date.setMonth(
              date.getMonth() -
                (5 - index),
            );

            return {
              key: `${date.getFullYear()}-${String(
                date.getMonth() +
                  1,
              ).padStart(
                2,
                "0",
              )}`,
              label:
                formatter.format(
                  date,
                ),
              revenue: 0,
              orders: 0,
            };
          },
        );

      const byMonth =
        new Map(
          months.map(
            (month) => [
              month.key,
              month,
            ],
          ),
        );

      recentOrders.forEach(
        (order) => {
          const date =
            new Date(
              order.created_at,
            );

          if (
            Number.isNaN(
              date.getTime(),
            )
          ) {
            return;
          }

          const key = `${date.getFullYear()}-${String(
            date.getMonth() + 1,
          ).padStart(2, "0")}`;

          const month =
            byMonth.get(key);

          if (!month) {
            return;
          }

          month.orders += 1;

          if (
            order.status !==
            "ANNULEE"
          ) {
            month.revenue +=
              Number(
                order.total ||
                  0,
              );
          }
        },
      );

      return months;
    }, [
      salesChart,
      recentOrders,
    ]);

  const cards = [
    {
      label: "Articles",
      value: stats.articles,
      description:
        "Produits dans le catalogue",
      icon: Boxes,
      href: "/admin/articles",
      iconClassName:
        "bg-orange-50 text-orange-600",
    },
    {
      label: "Catégories",
      value: stats.categories,
      description:
        "Univers organisés",
      icon: FolderTree,
      href: "/admin/categories",
      iconClassName:
        "bg-blue-50 text-blue-600",
    },
    {
      label: "Commandes",
      value: stats.orders,
      description:
        "Commandes enregistrées",
      icon: ShoppingCart,
      href: "/admin/commandes",
      iconClassName:
        "bg-violet-50 text-violet-600",
    },
    {
      label:
        "Chiffre d’affaires",
      value: `${formatPrice(
        stats.revenue,
      )} DA`,
      description:
        "Hors commandes annulées",
      icon: WalletCards,
      href: "/admin/commandes",
      iconClassName:
        "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Bénéfice brut",
      value: `${formatPrice(
        stats.profit,
      )} DA`,
      description:
        "CA − coût d’achat",
      icon: TrendingUp,
      href: "/admin/commandes",
      iconClassName:
        "bg-amber-50 text-amber-600",
    },
  ];

  const quickActions = [
    {
      label:
        "Ajouter un article",
      description:
        "Créer un nouveau produit",
      href: "/admin/articles",
      icon: PackagePlus,
      className:
        "bg-orange-500 text-white",
    },
    {
      label:
        "Gérer le stock",
      description:
        "Mettre à jour les quantités",
      href: "/admin/achats",
      icon: Boxes,
      className:
        "bg-zinc-950 text-white",
    },
    {
      label:
        "Voir les commandes",
      description:
        "Suivre les ventes",
      href: "/admin/commandes",
      icon: ShoppingCart,
      className:
        "bg-blue-600 text-white",
    },
    {
      label:
        "Créer une promotion",
      description:
        "Sélectionner des produits",
      href: "/admin/promotions",
      icon: Tags,
      className:
        "bg-violet-600 text-white",
    },
  ];

  return (
    <>
      <div className="space-y-7">
        <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-orange-600">
              <CircleDollarSign className="h-4 w-4" />
              Vue globale
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Tableau de bord
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
              Pilotez votre activité, analysez vos ventes et suivez les performances de votre boutique en temps réel.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-black text-zinc-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
          >
            <RefreshCcw
              className={`h-4 w-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />
            Actualiser
          </button>
        </section>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <section className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-zinc-200 bg-white shadow-sm">
            <LoaderCircle className="h-10 w-10 animate-spin text-orange-500" />

            <p className="mt-4 font-semibold text-zinc-500">
              Chargement du tableau de bord...
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {cards.map(
                ({
                  label,
                  value,
                  description,
                  icon: Icon,
                  href,
                  iconClassName,
                }) => (
                  <Link
                    key={label}
                    href={href}
                    className="group rounded-[26px] border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClassName}`}
                      >
                        <Icon className="h-6 w-6" />
                      </span>

                      <ArrowRight className="h-5 w-5 text-zinc-300 transition group-hover:translate-x-1 group-hover:text-orange-500" />
                    </div>

                    <p className="mt-5 text-sm font-black text-zinc-500">
                      {label}
                    </p>

                    <strong className="mt-1 block text-2xl font-black leading-tight text-zinc-950">
                      {value}
                    </strong>

                    <span className="mt-2 block text-xs text-zinc-400">
                      {description}
                    </span>
                  </Link>
                ),
              )}
            </section>

            <section className="rounded-[26px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-orange-500">
                    <CalendarDays className="h-4 w-4" />
                    Période d’analyse
                  </span>

                  <p className="mt-2 text-sm text-zinc-500">
                    Choisissez une période pour analyser précisément les commandes, le chiffre d’affaires et leur évolution.
                  </p>
                </div>

                <div className="w-full xl:w-auto">
                  <div className="flex flex-wrap gap-3">
                    {[
                      {
                        value: "day",
                        label: "Aujourd’hui",
                      },
                      {
                        value: "week",
                        label: "Semaine",
                      },
                      {
                        value: "month",
                        label: "Mois",
                      },
                      {
                        value: "custom",
                        label: "Intervalle",
                      },
                    ].map((option) => {
                      const active =
                        period === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setPeriod(
                              option.value as DashboardFilter,
                            )
                          }
                          className={`inline-flex min-h-12 min-w-[118px] flex-1 items-center justify-center rounded-2xl px-5 text-sm font-black transition duration-200 sm:flex-none ${
                            active
                              ? "border border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                              : "border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  {period === "custom" && (
                    <div className="mt-4 grid gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-4 sm:grid-cols-2">
                      <label className="grid gap-2 text-xs font-black text-zinc-600">
                        <span className="uppercase tracking-[0.08em] text-zinc-500">
                          Date de début
                        </span>

                        <input
                          type="date"
                          value={startDate}
                          onChange={(event) =>
                            setStartDate(
                              event.target.value,
                            )
                          }
                          max={endDate || undefined}
                          className="min-h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 shadow-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                        />
                      </label>

                      <label className="grid gap-2 text-xs font-black text-zinc-600">
                        <span className="uppercase tracking-[0.08em] text-zinc-500">
                          Date de fin
                        </span>

                        <input
                          type="date"
                          value={endDate}
                          onChange={(event) =>
                            setEndDate(
                              event.target.value,
                            )
                          }
                          min={startDate || undefined}
                          className="min-h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 shadow-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <SalesChart
              data={chartData}
              periodLabel={periodLabel}
              stats={stats}
            />

            <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                  <div>
                    <h2 className="text-xl font-black text-zinc-950">
                      Commandes récentes
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Les dernières commandes enregistrées.
                    </p>
                  </div>

                  <Link
                    href="/admin/commandes"
                    className="inline-flex items-center gap-2 text-sm font-black text-orange-600"
                  >
                    Tout voir
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {recentOrders.length ===
                0 ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                    <ShoppingCart className="h-12 w-12 text-zinc-300" />

                    <h3 className="mt-4 font-black text-zinc-800">
                      Aucune commande récente
                    </h3>

                    <p className="mt-2 text-sm text-zinc-500">
                      Les nouvelles commandes apparaîtront ici.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
                        <tr>
                          <th className="px-5 py-4">
                            N° suivi
                          </th>

                          <th className="px-5 py-4">
                            Client
                          </th>

                          <th className="px-5 py-4">
                            Total
                          </th>

                          <th className="px-5 py-4">
                            Statut
                          </th>

                          <th className="px-5 py-4">
                            Date
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {recentOrders.map(
                          (order) => (
                            <tr
                              key={
                                order.id
                              }
                              className="border-t border-zinc-100 transition hover:bg-orange-50/30"
                            >
                              <td className="px-5 py-4">
                                <code className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-700">
                                  {
                                    order.tracking_number
                                  }
                                </code>
                              </td>

                              <td className="px-5 py-4 font-bold text-zinc-800">
                                {
                                  order.customer_name
                                }
                              </td>

                              <td className="px-5 py-4 font-black text-zinc-950">
                                {formatPrice(
                                  order.total,
                                )}{" "}
                                DA
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${
                                    STATUS_CLASSES[
                                      order
                                        .status
                                    ] ||
                                    "bg-zinc-100 text-zinc-600"
                                  }`}
                                >
                                  {STATUS_LABELS[
                                    order
                                      .status
                                  ] ||
                                    order.status}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-zinc-500">
                                {formatDate(
                                  order.created_at,
                                )}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                        Performance
                      </span>

                      <h2 className="mt-2 text-xl font-black text-zinc-950">
                        Taux de livraison
                      </h2>
                    </div>

                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>

                  <strong className="mt-6 block text-4xl font-black text-zinc-950">
                    {completionRate}%
                  </strong>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-all duration-500"
                      style={{
                        width: `${completionRate}%`,
                      }}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <MiniStat
                      label="En cours"
                      value={String(
                        stats.pendingOrders ||
                          0,
                      )}
                      icon={Clock3}
                      className="bg-amber-50 text-amber-600"
                    />

                    <MiniStat
                      label="Livrées"
                      value={String(
                        stats.deliveredOrders ||
                          0,
                      )}
                      icon={CheckCircle2}
                      className="bg-emerald-50 text-emerald-600"
                    />
                  </div>
                </section>

                <section className="rounded-[28px] bg-gradient-to-br from-zinc-950 via-zinc-900 to-orange-950 p-6 text-white shadow-xl">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500">
                    <Truck className="h-6 w-6" />
                  </span>

                  <h2 className="mt-5 text-xl font-black">
                    Stock à surveiller
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Certains articles peuvent avoir atteint leur seuil minimum.
                  </p>

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <strong className="block text-4xl font-black text-orange-400">
                        {stats.lowStock ||
                          0}
                      </strong>

                      <span className="text-xs text-zinc-400">
                        article(s) à réapprovisionner
                      </span>
                    </div>

                    <Link
                      href="/admin/achats"
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 transition hover:bg-orange-500"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>
                </section>
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-black text-zinc-950">
                  Actions rapides
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Accédez rapidement aux principales fonctions.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {quickActions.map(
                  ({
                    label,
                    description,
                    href,
                    icon: Icon,
                    className,
                  }) => (
                    <Link
                      key={label}
                      href={href}
                      className={`group rounded-[24px] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${className}`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                          <Icon className="h-5 w-5" />
                        </span>

                        <ArrowRight className="h-5 w-5 opacity-50 transition group-hover:translate-x-1 group-hover:opacity-100" />
                      </div>

                      <strong className="mt-5 block text-base font-black">
                        {label}
                      </strong>

                      <span className="mt-1 block text-xs opacity-75">
                        {description}
                      </span>
                    </Link>
                  ),
                )}
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[30px] border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-orange-50 p-7 shadow-sm">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-200/40 blur-3xl" />

              <div className="relative max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-600 shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Administration BricoMénage
                </span>

                <h2 className="mt-5 text-2xl font-black text-zinc-950 sm:text-3xl">
                  Bienvenue dans votre espace de gestion.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
                  Utilisez le menu pour gérer les articles, catégories,
                  fournisseurs, stocks, commandes, promotions et packs.
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  icon:
    React.ElementType;
  className: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-4">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${className}`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <strong className="mt-3 block text-xl font-black text-zinc-950">
        {value}
      </strong>

      <span className="text-xs font-bold text-zinc-500">
        {label}
      </span>
    </div>
  );
}

function SalesChart({
  data,
  periodLabel,
  stats,
}: {
  data: SalesChartPoint[];
  periodLabel: string;
  stats: DashboardStats;
}) {
  const [metric, setMetric] = useState<
    "revenue" | "profit" | "orders"
  >("revenue");

  const [
    hoveredIndex,
    setHoveredIndex,
  ] = useState<number | null>(
    null,
  );

  const values = data.map(
    (point) => {
      if (metric !== "orders") {
        return Number(
          point.revenue || 0,
        );
      }

      if (metric === "profit") {
        return Number(
          point.profit || 0,
        );
      }

      return Number(
        point.orders || 0,
      );
    },
  );

  const total = values.reduce(
    (sum, value) => sum + value,
    0,
  );

  const hasValues = values.some(
    (value) => value > 0,
  );

  const maxRaw = Math.max(
    0,
    ...values,
  );

  const maxValue =
    maxRaw <= 0
      ? 1
      : maxRaw;

  const chartWidth = 1100;
  const chartHeight = 410;

  const paddingLeft = 78;
  const paddingRight = 34;
  const paddingTop = 48;
  const paddingBottom = 72;

  const innerWidth =
    chartWidth -
    paddingLeft -
    paddingRight;

  const innerHeight =
    chartHeight -
    paddingTop -
    paddingBottom;

  const points = data.map(
    (point, index) => {
      const value =
        values[index] || 0;

      const x =
        data.length <= 1
          ? paddingLeft +
            innerWidth / 2
          : paddingLeft +
            (index /
              (data.length - 1)) *
              innerWidth;

      const y =
        paddingTop +
        innerHeight -
        (value / maxValue) *
          innerHeight;

      return {
        x,
        y,
        value,
        label: point.label,
      };
    },
  );

  function createSmoothPath(
    chartPoints: typeof points,
  ) {
    if (
      chartPoints.length === 0
    ) {
      return "";
    }

    if (
      chartPoints.length === 1
    ) {
      return `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    }

    let path =
      `M ${chartPoints[0].x} ${chartPoints[0].y}`;

    for (
      let index = 0;
      index <
      chartPoints.length - 1;
      index += 1
    ) {
      const current =
        chartPoints[index];

      const next =
        chartPoints[index + 1];

      const control =
        (next.x - current.x) *
        0.34;

      path +=
        ` C ${current.x + control} ${current.y}` +
        ` ${next.x - control} ${next.y}` +
        ` ${next.x} ${next.y}`;
    }

    return path;
  }

  const linePath =
    createSmoothPath(points);

  const areaPath =
    points.length > 0 &&
    linePath
      ? `${linePath} L ${
          points[
            points.length - 1
          ].x
        } ${
          paddingTop +
          innerHeight
        } L ${points[0].x} ${
          paddingTop +
          innerHeight
        } Z`
      : "";

  const gridLines =
    Array.from(
      { length: 5 },
      (_, index) => {
        const ratio =
          index / 4;

        return {
          y:
            paddingTop +
            ratio *
              innerHeight,
          value:
            Math.round(
              maxValue *
                (1 - ratio),
            ),
        };
      },
    );

  /*
   * Évite de serrer 28/30/31
   * libellés sur un seul mois.
   */
  const labelStep =
    data.length > 24
      ? 4
      : data.length > 16
        ? 3
        : data.length > 10
          ? 2
          : 1;

  const summaryCards = [
    {
      label: "Commandes",
      value: formatPrice(
        Number(
          stats.orders || 0,
        ),
      ),
      helper: `${formatPrice(
        Number(
          stats.pendingOrders ||
            0,
        ),
      )} en cours`,
      icon: ShoppingCart,
    },
    {
      label: "En cours",
      value: formatPrice(
        Number(
          stats.pendingOrders ||
            0,
        ),
      ),
      helper:
        "À traiter ou à livrer",
      icon: Clock3,
    },
    {
      label:
        "Chiffre d’affaires",
      value: `${formatPrice(
        Number(
          stats.revenue || 0,
        ),
      )} DA`,
      helper:
        "Hors commandes annulées",
      icon: CircleDollarSign,
    },
    {
      label: "Coût d’achat",
      value: `${formatPrice(
        Number(
          stats.purchaseCost ||
            0,
        ),
      )} DA`,
      helper:
        "Coût des produits vendus",
      icon: WalletCards,
    },
    {
      label: "Bénéfice brut",
      value: `${formatPrice(
        Number(
          stats.profit || 0,
        ),
      )} DA`,
      helper:
        "CA − coût d’achat",
      icon: TrendingUp,
    },
    {
      label: "Livrées",
      value: formatPrice(
        Number(
          stats.deliveredOrders ||
            0,
        ),
      ),
      helper: `${Math.round(
        Number(
          stats.orders || 0,
        ) > 0
          ? (Number(
              stats.deliveredOrders ||
                0,
            ) /
              Number(
                stats.orders || 1,
              )) *
              100
          : 0,
      )}% du total`,
      icon: PackagePlus,
    },
  ];

  return (
    <section className="overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-sm">
      <div className="grid border-b border-zinc-200 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map(
          ({
            label,
            value,
            helper,
            icon: Icon,
          }) => (
            <div
              key={label}
              className="group relative min-h-[142px] overflow-hidden border-b border-zinc-100 p-5 transition hover:bg-orange-50/30 sm:border-r xl:border-b-0"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-100/50 blur-2xl opacity-0 transition duration-300 group-hover:opacity-100" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.1em] text-zinc-400">
                    {label}
                  </span>

                  <strong className="mt-3 block text-2xl font-black tracking-tight text-zinc-950">
                    {value}
                  </strong>

                  <span className="mt-2 block text-xs font-semibold text-zinc-400">
                    {helper}
                  </span>
                </div>

                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 ring-1 ring-orange-100 transition group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="flex flex-col gap-5 border-b border-zinc-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-orange-600 ring-1 ring-orange-100">
              <TrendingUp className="h-3.5 w-3.5" />
              {periodLabel}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-black text-zinc-500">
              {data.length} point
              {data.length > 1
                ? "s"
                : ""}
            </span>
          </div>

          <h2 className="mt-3 text-xl font-black text-zinc-950 sm:text-2xl">
            Évolution commerciale
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
            Visualisez clairement vos ventes et le volume de commandes sur la période sélectionnée.
          </p>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-1.5 sm:w-auto sm:min-w-[470px]">
          <button
            type="button"
            onClick={() =>
              setMetric(
                "revenue",
              )
            }
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black transition ${
              metric ===
              "revenue"
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                : "text-zinc-500 hover:bg-white hover:text-zinc-900"
            }`}
          >
            <CircleDollarSign className="h-4 w-4" />
            Chiffre d’affaires
          </button>

          <button
            type="button"
            onClick={() =>
              setMetric(
                "profit",
              )
            }
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black transition ${
              metric ===
              "profit"
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                : "text-zinc-500 hover:bg-white hover:text-zinc-900"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Bénéfice
          </button>

          <button
            type="button"
            onClick={() =>
              setMetric(
                "orders",
              )
            }
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black transition ${
              metric === "orders"
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                : "text-zinc-500 hover:bg-white hover:text-zinc-900"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            Commandes
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="relative overflow-hidden rounded-[26px] border border-zinc-200 bg-gradient-to-b from-orange-50/40 via-white to-white shadow-inner">
          <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-400">
                Valeur affichée
              </span>

              <strong className="mt-1 block text-xl font-black text-zinc-950">
                {metric ===
                "orders"
                  ? `${formatPrice(
                      total,
                    )} commande${
                      total > 1
                        ? "s"
                        : ""
                    }`
                  : `${formatPrice(
                      total,
                    )} DA`}
              </strong>
            </div>

            <span className="inline-flex items-center gap-2 self-start rounded-full bg-white px-3 py-2 text-[11px] font-bold text-zinc-500 shadow-sm ring-1 ring-zinc-200 sm:self-auto">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
              Survolez un point pour voir le détail
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[760px] px-2 py-2 sm:min-w-0 sm:px-3">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="h-[330px] w-full sm:h-[410px]"
                role="img"
                aria-label="Évolution des performances commerciales"
                onMouseLeave={() =>
                  setHoveredIndex(
                    null,
                  )
                }
              >
                <defs>
                  <linearGradient
                    id="orangeArea"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#f97316"
                      stopOpacity="0.22"
                    />

                    <stop
                      offset="75%"
                      stopColor="#f97316"
                      stopOpacity="0.04"
                    />

                    <stop
                      offset="100%"
                      stopColor="#f97316"
                      stopOpacity="0"
                    />
                  </linearGradient>

                  <filter
                    id="orangeGlow"
                    x="-20%"
                    y="-30%"
                    width="140%"
                    height="160%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="4"
                      stdDeviation="5"
                      floodColor="#f97316"
                      floodOpacity="0.16"
                    />
                  </filter>
                </defs>

                {gridLines.map(
                  (
                    line,
                    index,
                  ) => (
                    <g
                      key={`${line.y}-${index}`}
                    >
                      <line
                        x1={
                          paddingLeft
                        }
                        y1={line.y}
                        x2={
                          paddingLeft +
                          innerWidth
                        }
                        y2={line.y}
                        stroke="#e4e4e7"
                        strokeWidth="1"
                        strokeDasharray="5 7"
                      />

                      <text
                        x={
                          paddingLeft -
                          14
                        }
                        y={
                          line.y + 4
                        }
                        textAnchor="end"
                        fontSize="11"
                        fontWeight="700"
                        fill="#71717a"
                      >
                        {metric ===
                        "revenue"
                          ? formatPrice(
                              line.value,
                            )
                          : line.value}
                      </text>
                    </g>
                  ),
                )}

                {areaPath &&
                  hasValues && (
                    <path
                      d={areaPath}
                      fill="url(#orangeArea)"
                    />
                  )}

                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#orangeGlow)"
                  />
                )}

                {points.map(
                  (
                    point,
                    index,
                  ) => {
                    const isHovered =
                      hoveredIndex ===
                      index;

                    const showLabel =
                      index %
                        labelStep ===
                        0 ||
                      index ===
                        points.length -
                          1;

                    return (
                      <g
                        key={`${point.label}-${index}`}
                        onMouseEnter={() =>
                          setHoveredIndex(
                            index,
                          )
                        }
                        className="cursor-pointer"
                      >
                        <rect
                          x={
                            point.x -
                            innerWidth /
                              Math.max(
                                data.length,
                                1,
                              ) /
                              2
                          }
                          y={
                            paddingTop
                          }
                          width={
                            innerWidth /
                            Math.max(
                              data.length,
                              1,
                            )
                          }
                          height={
                            innerHeight +
                            54
                          }
                          fill="transparent"
                        />

                        {isHovered && (
                          <line
                            x1={
                              point.x
                            }
                            y1={
                              paddingTop
                            }
                            x2={
                              point.x
                            }
                            y2={
                              paddingTop +
                              innerHeight
                            }
                            stroke="#fdba74"
                            strokeWidth="2"
                            strokeDasharray="4 5"
                          />
                        )}

                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={
                            isHovered
                              ? 7
                              : 4.5
                          }
                          fill="#ffffff"
                          stroke="#f97316"
                          strokeWidth={
                            isHovered
                              ? 4
                              : 3
                          }
                        />

                        {showLabel && (
                          <text
                            x={
                              point.x
                            }
                            y={
                              chartHeight -
                              20
                            }
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill="#71717a"
                          >
                            {
                              point.label
                            }
                          </text>
                        )}

                        {isHovered && (
                          <g>
                            <rect
                              x={Math.min(
                                chartWidth -
                                  170,
                                Math.max(
                                  6,
                                  point.x -
                                    78,
                                ),
                              )}
                              y={Math.max(
                                8,
                                point.y -
                                  70,
                              )}
                              width="156"
                              height="48"
                              rx="14"
                              fill="#18181b"
                            />

                            <text
                              x={Math.min(
                                chartWidth -
                                  92,
                                Math.max(
                                  84,
                                  point.x,
                                ),
                              )}
                              y={Math.max(
                                28,
                                point.y -
                                  50,
                              )}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="700"
                              fill="#a1a1aa"
                            >
                              {
                                point.label
                              }
                            </text>

                            <text
                              x={Math.min(
                                chartWidth -
                                  92,
                                Math.max(
                                  84,
                                  point.x,
                                ),
                              )}
                              y={Math.max(
                                43,
                                point.y -
                                  35,
                              )}
                              textAnchor="middle"
                              fontSize="12"
                              fontWeight="900"
                              fill="#ffffff"
                            >
                              {metric !==
                              "orders"
                                ? `${formatPrice(
                                    point.value,
                                  )} DA`
                                : `${point.value} commande${
                                    point.value >
                                    1
                                      ? "s"
                                      : ""
                                  }`}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  },
                )}

                {!hasValues && (
                  <g>
                    <rect
                      x={
                        chartWidth /
                          2 -
                        135
                      }
                      y={
                        chartHeight /
                          2 -
                        38
                      }
                      width="270"
                      height="76"
                      rx="20"
                      fill="#ffffff"
                      stroke="#fed7aa"
                    />

                    <text
                      x={
                        chartWidth /
                        2
                      }
                      y={
                        chartHeight /
                          2 -
                        6
                      }
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight="900"
                      fill="#18181b"
                    >
                      Aucune vente sur cette période
                    </text>

                    <text
                      x={
                        chartWidth /
                        2
                      }
                      y={
                        chartHeight /
                          2 +
                        18
                      }
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#71717a"
                    >
                      Les données apparaîtront automatiquement.
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
