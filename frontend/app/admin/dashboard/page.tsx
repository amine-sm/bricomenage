"use client";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
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
  WalletCards,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminShell from "@/components/AdminShell";

import {
  adminHeaders,
  apiFetch,
} from "@/lib/api";

type DashboardStats = {
  articles: number;
  categories: number;
  orders: number;
  revenue: number;
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
  orders: number;
};

type DashboardResponse = {
  stats: DashboardStats;
  recentOrders?: RecentOrder[];
  salesChart?: SalesChartPoint[];
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

  const load = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await apiFetch<DashboardResponse>(
            "/admin/dashboard",
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
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

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
    <AdminShell>
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
              Consultez les indicateurs principaux de votre boutique BricoMénage.
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
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

            <SalesChart
              data={chartData}
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
    </AdminShell>
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
}: {
  data: SalesChartPoint[];
}) {
  const [
    metric,
    setMetric,
  ] = useState<
    "revenue" | "orders"
  >("revenue");

  const values =
    data.map((point) =>
      metric === "revenue"
        ? Number(
            point.revenue ||
              0,
          )
        : Number(
            point.orders ||
              0,
          ),
    );

  const maxValue =
    Math.max(
      1,
      ...values,
    );

  const total =
    values.reduce(
      (sum, value) =>
        sum + value,
      0,
    );

  const average =
    data.length > 0
      ? total / data.length
      : 0;

  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-orange-500">
            <BarChart3 className="h-4 w-4" />
            Évolution sur 6 mois
          </span>

          <h2 className="mt-2 text-xl font-black text-zinc-950">
            Activité commerciale
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Comparez le chiffre d’affaires et le volume des commandes.
          </p>
        </div>

        <div className="inline-flex rounded-2xl bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() =>
              setMetric(
                "revenue",
              )
            }
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              metric ===
              "revenue"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Chiffre d’affaires
          </button>

          <button
            type="button"
            onClick={() =>
              setMetric(
                "orders",
              )
            }
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              metric ===
              "orders"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Commandes
          </button>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_220px]">
        <div>
          <div className="flex h-[300px] items-end gap-3 overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-50 to-white px-4 pb-4 pt-8 sm:gap-5 sm:px-6">
            {data.map(
              (point, index) => {
                const value =
                  metric ===
                  "revenue"
                    ? Number(
                        point.revenue ||
                          0,
                      )
                    : Number(
                        point.orders ||
                          0,
                      );

                const height =
                  Math.max(
                    5,
                    Math.round(
                      (value /
                        maxValue) *
                        100,
                    ),
                  );

                return (
                  <div
                    key={`${point.label}-${index}`}
                    className="group flex min-w-0 flex-1 flex-col items-center justify-end"
                  >
                    <div className="relative flex h-[225px] w-full items-end justify-center">
                      <span className="pointer-events-none absolute bottom-[calc(var(--bar-height)+10px)] z-10 hidden whitespace-nowrap rounded-xl bg-zinc-950 px-3 py-2 text-[11px] font-black text-white shadow-xl group-hover:block">
                        {metric ===
                        "revenue"
                          ? `${formatPrice(
                              value,
                            )} DA`
                          : `${value} commande${
                              value >
                              1
                                ? "s"
                                : ""
                            }`}
                      </span>

                      <div
                        className="relative w-full max-w-16 overflow-hidden rounded-t-2xl bg-gradient-to-t from-orange-600 via-orange-500 to-orange-300 shadow-lg shadow-orange-500/15 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-xl"
                        style={
                          {
                            height: `${height}%`,
                            "--bar-height": `${height}%`,
                          } as React.CSSProperties
                        }
                      >
                        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent" />
                      </div>
                    </div>

                    <strong className="mt-3 truncate text-xs font-black capitalize text-zinc-600 sm:text-sm">
                      {
                        point.label
                      }
                    </strong>
                  </div>
                );
              },
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-400">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              {metric ===
              "revenue"
                ? "Chiffre d’affaires mensuel"
                : "Nombre de commandes"}
            </span>

            <span>
              Passez la souris sur une barre pour afficher la valeur.
            </span>
          </div>
        </div>

        <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl bg-zinc-950 p-5 text-white">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Total sur la période
            </span>

            <strong className="mt-3 block text-2xl font-black text-orange-400">
              {metric ===
              "revenue"
                ? `${formatPrice(
                    total,
                  )} DA`
                : `${formatPrice(
                    total,
                  )}`}
            </strong>

            <p className="mt-2 text-xs leading-5 text-zinc-400">
              {metric ===
              "revenue"
                ? "Somme du chiffre d’affaires affiché."
                : "Nombre total de commandes affichées."}
            </p>
          </div>

          <div className="rounded-2xl bg-orange-50 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
              Moyenne mensuelle
            </span>

            <strong className="mt-3 block text-2xl font-black text-zinc-950">
              {metric ===
              "revenue"
                ? `${formatPrice(
                    Math.round(
                      average,
                    ),
                  )} DA`
                : average.toFixed(
                    1,
                  )}
            </strong>

            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Calculée sur les six mois du graphique.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

