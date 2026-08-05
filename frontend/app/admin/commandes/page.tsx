"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Eye,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import AdminShell from "@/components/AdminShell";
import {
  adminHeaders,
  apiFetch,
} from "@/lib/api";

type OrderStatus =
  | "NOUVELLE"
  | "CONFIRMEE"
  | "EN_PREPARATION"
  | "EXPEDIEE"
  | "EN_LIVRAISON"
  | "LIVREE"
  | "ANNULEE";

type Order = {
  id: number;
  tracking_number: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  commune: string;
  address?: string;
  note?: string;
  subtotal?: number;
  delivery_fee?: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
};

type OrderItem = {
  id: number;
  designation: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type OrderHistory = {
  id: number;
  status?: string;
  label: string;
  description?: string;
  created_at: string;
};

type Detail = {
  order: Order;
  items: OrderItem[];
  history: OrderHistory[];
};

type SortOption =
  | "newest"
  | "oldest"
  | "total-desc"
  | "total-asc"
  | "client-asc";

const STATUSES: OrderStatus[] = [
  "NOUVELLE",
  "CONFIRMEE",
  "EN_PREPARATION",
  "EXPEDIEE",
  "EN_LIVRAISON",
  "LIVREE",
  "ANNULEE",
];

const PAGE_SIZE_OPTIONS = [
  5,
  10,
  20,
  50,
];

const STATUS_LABELS: Record<
  OrderStatus,
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
  OrderStatus,
  string
> = {
  NOUVELLE:
    "bg-blue-50 text-blue-700 ring-blue-200",
  CONFIRMEE:
    "bg-violet-50 text-violet-700 ring-violet-200",
  EN_PREPARATION:
    "bg-amber-50 text-amber-700 ring-amber-200",
  EXPEDIEE:
    "bg-cyan-50 text-cyan-700 ring-cyan-200",
  EN_LIVRAISON:
    "bg-orange-50 text-orange-700 ring-orange-200",
  LIVREE:
    "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ANNULEE:
    "bg-red-50 text-red-700 ring-red-200",
};

const STATUS_DOTS: Record<
  OrderStatus,
  string
> = {
  NOUVELLE: "bg-blue-500",
  CONFIRMEE: "bg-violet-500",
  EN_PREPARATION:
    "bg-amber-500",
  EXPEDIEE: "bg-cyan-500",
  EN_LIVRAISON:
    "bg-orange-500",
  LIVREE: "bg-emerald-500",
  ANNULEE: "bg-red-500",
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
  if (!value) {
    return "-";
  }

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

function normalizeStatus(
  value: string,
): OrderStatus {
  const status =
    value as OrderStatus;

  return STATUSES.includes(status)
    ? status
    : "NOUVELLE";
}

export default function OrdersPage() {
  const [
    items,
    setItems,
  ] = useState<Order[]>([]);

  const [
    detail,
    setDetail,
  ] = useState<Detail | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    changingId,
    setChangingId,
  ] = useState<number | null>(
    null,
  );

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "all" | OrderStatus
  >("all");

  const [
    dateFilter,
    setDateFilter,
  ] = useState("");

  const [
    sortBy,
    setSortBy,
  ] = useState<SortOption>(
    "newest",
  );

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(10);

  const load = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await apiFetch<{
            orders: Order[];
          }>("/admin/orders", {
            headers:
              adminHeaders(),
          });

        setItems(
          response.orders || [],
        );
      } catch (requestError) {
        setError(
          requestError instanceof
            Error
            ? requestError.message
            : "Impossible de charger les commandes.",
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

  useEffect(() => {
    setCurrentPage(1);
  }, [
    query,
    statusFilter,
    dateFilter,
    sortBy,
    pageSize,
  ]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setSuccess("");
      }, 5000);

    return () =>
      window.clearTimeout(timer);
  }, [success]);

  const stats = useMemo(() => {
    const totalOrders =
      items.length;

    const pending =
      items.filter(
        (order) =>
          ![
            "LIVREE",
            "ANNULEE",
          ].includes(order.status),
      ).length;

    const delivered =
      items.filter(
        (order) =>
          order.status ===
          "LIVREE",
      ).length;

    const revenue =
      items
        .filter(
          (order) =>
            order.status !==
            "ANNULEE",
        )
        .reduce(
          (sum, order) =>
            sum +
            Number(
              order.total || 0,
            ),
          0,
        );

    return {
      totalOrders,
      pending,
      delivered,
      revenue,
    };
  }, [items]);

  const filteredItems =
    useMemo(() => {
      const normalizedQuery =
        query
          .trim()
          .toLowerCase();

      const filtered =
        items.filter(
          (order) => {
            const matchesQuery =
              !normalizedQuery ||
              [
                order.tracking_number,
                order.customer_name,
                order.phone,
                order.wilaya,
                order.commune,
              ]
                .filter(Boolean)
                .some((value) =>
                  String(value)
                    .toLowerCase()
                    .includes(
                      normalizedQuery,
                    ),
                );

            const matchesStatus =
              statusFilter ===
                "all" ||
              order.status ===
                statusFilter;

            const matchesDate =
              !dateFilter ||
              new Date(
                order.created_at,
              )
                .toISOString()
                .slice(0, 10) ===
                dateFilter;

            return (
              matchesQuery &&
              matchesStatus &&
              matchesDate
            );
          },
        );

      return [...filtered].sort(
        (a, b) => {
          switch (sortBy) {
            case "oldest":
              return (
                new Date(
                  a.created_at,
                ).getTime() -
                new Date(
                  b.created_at,
                ).getTime()
              );

            case "total-desc":
              return (
                Number(b.total) -
                Number(a.total)
              );

            case "total-asc":
              return (
                Number(a.total) -
                Number(b.total)
              );

            case "client-asc":
              return a.customer_name.localeCompare(
                b.customer_name,
                "fr",
              );

            default:
              return (
                new Date(
                  b.created_at,
                ).getTime() -
                new Date(
                  a.created_at,
                ).getTime()
              );
          }
        },
      );
    }, [
      items,
      query,
      statusFilter,
      dateFilter,
      sortBy,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredItems.length /
          pageSize,
      ),
    );

  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages,
    );

  const paginatedItems =
    useMemo(() => {
      const start =
        (safeCurrentPage - 1) *
        pageSize;

      return filteredItems.slice(
        start,
        start + pageSize,
      );
    }, [
      filteredItems,
      safeCurrentPage,
      pageSize,
    ]);

  const firstVisible =
    filteredItems.length === 0
      ? 0
      : (safeCurrentPage - 1) *
          pageSize +
        1;

  const lastVisible =
    Math.min(
      safeCurrentPage *
        pageSize,
      filteredItems.length,
    );

  async function openDetail(
    id: number,
  ) {
    setDetailLoading(true);
    setError("");

    try {
      const response =
        await apiFetch<Detail>(
          `/admin/orders/${id}`,
          {
            headers:
              adminHeaders(),
          },
        );

      setDetail(response);
    } catch (requestError) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Impossible de charger le détail.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function changeStatus(
    order: Order,
    status: OrderStatus,
  ) {
    setChangingId(order.id);
    setError("");
    setSuccess("");

    try {
      await apiFetch(
        `/admin/orders/${order.id}/status`,
        {
          method: "PATCH",

          headers: {
            ...adminHeaders(),
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status,
            label:
              STATUS_LABELS[
                status
              ],
            description: `Statut mis à jour : ${
              STATUS_LABELS[
                status
              ]
            }.`,
          }),
        },
      );

      setItems((current) =>
        current.map((item) =>
          item.id === order.id
            ? {
                ...item,
                status,
              }
            : item,
        ),
      );

      setSuccess(
        `La commande ${order.tracking_number} est maintenant « ${STATUS_LABELS[status]} ».`,
      );

      if (
        detail?.order.id ===
        order.id
      ) {
        await openDetail(
          order.id,
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Impossible de modifier le statut.",
      );
    } finally {
      setChangingId(null);
    }
  }

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setDateFilter("");
    setSortBy("newest");
  }

  return (
    <AdminShell>
      <div className="space-y-7">
        <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-orange-600">
              <ClipboardList className="h-4 w-4" />
              Gestion des ventes
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Commandes
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
              Consultez les commandes, mettez à jour leur statut et suivez leur historique.
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

        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={ClipboardList}
            label="Commandes"
            value={String(
              stats.totalOrders,
            )}
            description="Commandes enregistrées"
            iconClassName="bg-orange-50 text-orange-600"
          />

          <StatCard
            icon={Clock3}
            label="En cours"
            value={String(
              stats.pending,
            )}
            description="À traiter ou livrer"
            iconClassName="bg-amber-50 text-amber-600"
          />

          <StatCard
            icon={PackageCheck}
            label="Livrées"
            value={String(
              stats.delivered,
            )}
            description="Commandes terminées"
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            icon={CircleDollarSign}
            label="Chiffre d’affaires"
            value={`${formatPrice(
              stats.revenue,
            )} DA`}
            description="Hors commandes annulées"
            iconClassName="bg-blue-50 text-blue-600"
          />
        </section>

        <section className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_200px_190px_210px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

              <input
                value={query}
                onChange={(
                  event,
                ) =>
                  setQuery(
                    event.target
                      .value,
                  )
                }
                placeholder="Rechercher un numéro, client, téléphone..."
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-10 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
              />

              {query && (
                <button
                  type="button"
                  onClick={() =>
                    setQuery("")
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-orange-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as
                    | "all"
                    | OrderStatus,
                )
              }
              className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
            >
              <option value="all">
                Tous les statuts
              </option>

              {STATUSES.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {
                      STATUS_LABELS[
                        status
                      ]
                    }
                  </option>
                ),
              )}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(
                  event.target
                    .value,
                )
              }
              className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
            />

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target
                    .value as SortOption,
                )
              }
              className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
            >
              <option value="newest">
                Plus récentes
              </option>

              <option value="oldest">
                Plus anciennes
              </option>

              <option value="total-desc">
                Total décroissant
              </option>

              <option value="total-asc">
                Total croissant
              </option>

              <option value="client-asc">
                Client A à Z
              </option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <SlidersHorizontal className="h-4 w-4 text-orange-500" />

              <span>
                {
                  filteredItems.length
                }{" "}
                résultat
                {filteredItems.length >
                1
                  ? "s"
                  : ""}
              </span>
            </div>

            <button
              type="button"
              onClick={
                resetFilters
              }
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-zinc-500 transition hover:bg-orange-50 hover:text-orange-600"
            >
              <X className="h-4 w-4" />
              Réinitialiser les filtres
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
              <LoaderCircle className="h-10 w-10 animate-spin text-orange-500" />

              <p className="font-semibold text-zinc-500">
                Chargement des commandes...
              </p>
            </div>
          ) : paginatedItems.length ===
            0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-orange-500">
                <ClipboardList className="h-10 w-10" />
              </span>

              <h2 className="mt-5 text-xl font-black text-zinc-950">
                Aucune commande trouvée
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Modifiez les filtres pour afficher d’autres commandes.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50/80">
                  <tr className="text-xs font-black uppercase tracking-[0.08em] text-zinc-500">
                    <th className="px-5 py-4">
                      Commande
                    </th>

                    <th className="px-5 py-4">
                      Client
                    </th>

                    <th className="px-5 py-4">
                      Destination
                    </th>

                    <th className="px-5 py-4">
                      Date
                    </th>

                    <th className="px-5 py-4">
                      Total
                    </th>

                    <th className="px-5 py-4">
                      Statut
                    </th>

                    <th className="px-5 py-4 text-right">
                      Détail
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedItems.map(
                    (order) => (
                      <OrderTableRow
                        key={order.id}
                        order={order}
                        changing={
                          changingId ===
                          order.id
                        }
                        onOpen={() =>
                          openDetail(
                            order.id,
                          )
                        }
                        onChangeStatus={(
                          status,
                        ) =>
                          changeStatus(
                            order,
                            status,
                          )
                        }
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading &&
            filteredItems.length >
              0 && (
              <Pagination
                currentPage={
                  safeCurrentPage
                }
                totalPages={
                  totalPages
                }
                pageSize={
                  pageSize
                }
                firstVisible={
                  firstVisible
                }
                lastVisible={
                  lastVisible
                }
                totalItems={
                  filteredItems.length
                }
                onPageChange={
                  setCurrentPage
                }
                onPageSizeChange={
                  setPageSize
                }
              />
            )}
        </section>
      </div>

      {detailLoading && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/45 backdrop-blur-sm">
          <div className="rounded-3xl bg-white p-7 text-center shadow-2xl">
            <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-orange-500" />

            <p className="mt-3 font-bold text-zinc-600">
              Chargement du détail...
            </p>
          </div>
        </div>
      )}

      {detail && (
        <OrderDetailModal
          detail={detail}
          changing={
            changingId ===
            detail.order.id
          }
          onClose={() =>
            setDetail(null)
          }
          onChangeStatus={(
            status,
          ) =>
            changeStatus(
              detail.order,
              status,
            )
          }
        />
      )}
    </AdminShell>
  );
}

interface StatCardProps {
  icon:
    React.ElementType;
  label: string;
  value: string;
  description: string;
  iconClassName: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClassName,
}: StatCardProps) {
  return (
    <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClassName}`}
      >
        <Icon className="h-6 w-6" />
      </span>

      <strong className="mt-5 block text-2xl font-black leading-tight text-zinc-950">
        {value}
      </strong>

      <span className="mt-1 block text-sm font-black text-zinc-700">
        {label}
      </span>

      <p className="mt-1 text-xs leading-5 text-zinc-400">
        {description}
      </p>
    </div>
  );
}

function OrderTableRow({
  order,
  changing,
  onOpen,
  onChangeStatus,
}: {
  order: Order;
  changing: boolean;
  onOpen: () => void;
  onChangeStatus: (
    status: OrderStatus,
  ) => void;
}) {
  const status =
    normalizeStatus(
      order.status,
    );

  return (
    <tr className="border-b border-zinc-100 transition last:border-b-0 hover:bg-orange-50/25">
      <td className="px-5 py-4">
        <div className="min-w-[170px]">
          <code className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-700">
            {
              order.tracking_number
            }
          </code>

          <span className="mt-2 block text-xs text-zinc-400">
            Commande #{order.id}
          </span>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="min-w-[190px]">
          <strong className="block font-black text-zinc-950">
            {
              order.customer_name
            }
          </strong>

          <span className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
            <Phone className="h-3.5 w-3.5" />
            {order.phone}
          </span>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="min-w-[180px]">
          <span className="flex items-center gap-2 font-semibold text-zinc-700">
            <MapPin className="h-4 w-4 text-orange-500" />
            {order.commune},{" "}
            {order.wilaya}
          </span>
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-zinc-500">
        <span className="flex min-w-[170px] items-center gap-2">
          <CalendarDays className="h-4 w-4 text-zinc-400" />
          {formatDate(
            order.created_at,
          )}
        </span>
      </td>

      <td className="px-5 py-4">
        <strong className="whitespace-nowrap text-base font-black text-zinc-950">
          {formatPrice(
            order.total,
          )}{" "}
          <span className="text-sm text-orange-500">
            DA
          </span>
        </strong>
      </td>

      <td className="px-5 py-4">
        <div className="relative min-w-[200px]">
          <select
            value={status}
            disabled={changing}
            onChange={(event) =>
              onChangeStatus(
                event.target
                  .value as OrderStatus,
              )
            }
            className={`h-11 w-full rounded-xl border border-zinc-200 px-3 pr-9 text-xs font-black outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 ${STATUS_CLASSES[status]}`}
          >
            {STATUSES.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {
                    STATUS_LABELS[
                      item
                    ]
                  }
                </option>
              ),
            )}
          </select>

          {changing && (
            <LoaderCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-orange-500" />
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition hover:bg-orange-500 hover:text-white"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function OrderDetailModal({
  detail,
  changing,
  onClose,
  onChangeStatus,
}: {
  detail: Detail;
  changing: boolean;
  onClose: () => void;
  onChangeStatus: (
    status: OrderStatus,
  ) => void;
}) {
  const status =
    normalizeStatus(
      detail.order.status,
    );

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-zinc-950/55 p-4 backdrop-blur-sm">
      <div className="mx-auto my-5 w-full max-w-5xl overflow-hidden rounded-[30px] bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-orange-950 p-6 text-white sm:p-7">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-black">
              <Truck className="h-4 w-4" />
              Détail de commande
            </span>

            <h2 className="mt-4 text-2xl font-black sm:text-3xl">
              {
                detail.order
                  .tracking_number
              }
            </h2>

            <p className="mt-2 text-sm text-zinc-300">
              Créée le{" "}
              {formatDate(
                detail.order
                  .created_at,
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <InfoCard
                icon={UserRound}
                label="Client"
                value={
                  detail.order
                    .customer_name
                }
              />

              <InfoCard
                icon={Phone}
                label="Téléphone"
                value={
                  detail.order
                    .phone
                }
              />

              <InfoCard
                icon={MapPin}
                label="Destination"
                value={`${detail.order.commune}, ${detail.order.wilaya}`}
              />

              <InfoCard
                icon={CircleDollarSign}
                label="Total"
                value={`${formatPrice(
                  detail.order
                    .total,
                )} DA`}
              />
            </section>

            {(detail.order
              .address ||
              detail.order
                .note) && (
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                    Adresse
                  </span>

                  <p className="mt-2 text-sm leading-6 text-zinc-700">
                    {detail.order
                      .address ||
                      "Non renseignée"}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4">
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                    Remarque
                  </span>

                  <p className="mt-2 text-sm leading-6 text-zinc-700">
                    {detail.order
                      .note ||
                      "Aucune remarque"}
                  </p>
                </div>
              </section>
            )}

            <section className="overflow-hidden rounded-2xl border border-zinc-200">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-4">
                <h3 className="font-black text-zinc-950">
                  Articles commandés
                </h3>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-500">
                  {
                    detail.items
                      .length
                  }{" "}
                  article
                  {detail.items
                    .length > 1
                    ? "s"
                    : ""}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-white text-xs uppercase text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">
                        Article
                      </th>

                      <th className="px-4 py-3">
                        Prix unitaire
                      </th>

                      <th className="px-4 py-3">
                        Qté
                      </th>

                      <th className="px-4 py-3 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {detail.items.map(
                      (item) => (
                        <tr
                          key={
                            item.id
                          }
                          className="border-t border-zinc-100"
                        >
                          <td className="px-4 py-3 font-bold text-zinc-800">
                            {
                              item.designation
                            }
                          </td>

                          <td className="px-4 py-3 text-zinc-500">
                            {formatPrice(
                              item.unit_price,
                            )}{" "}
                            DA
                          </td>

                          <td className="px-4 py-3 font-bold text-zinc-700">
                            {
                              item.quantity
                            }
                          </td>

                          <td className="px-4 py-3 text-right font-black text-zinc-950">
                            {formatPrice(
                              item.line_total,
                            )}{" "}
                            DA
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-zinc-200 p-4">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                Statut actuel
              </span>

              <span
                className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1 ring-inset ${STATUS_CLASSES[status]}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${STATUS_DOTS[status]}`}
                />

                {
                  STATUS_LABELS[
                    status
                  ]
                }
              </span>

              <select
                value={status}
                disabled={changing}
                onChange={(event) =>
                  onChangeStatus(
                    event.target
                      .value as OrderStatus,
                  )
                }
                className="mt-4 h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm font-black outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 disabled:opacity-60"
              >
                {STATUSES.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {
                        STATUS_LABELS[
                          item
                        ]
                      }
                    </option>
                  ),
                )}
              </select>
            </section>

            <section className="rounded-2xl border border-zinc-200 p-4">
              <h3 className="font-black text-zinc-950">
                Historique
              </h3>

              <div className="mt-4 space-y-4">
                {detail.history.map(
                  (
                    history,
                    index,
                  ) => (
                    <div
                      key={
                        history.id
                      }
                      className="relative pl-7"
                    >
                      {index <
                        detail
                          .history
                          .length -
                          1 && (
                        <span className="absolute left-[7px] top-5 h-[calc(100%+10px)] w-px bg-zinc-200" />
                      )}

                      <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 border-white bg-orange-500 shadow ring-1 ring-orange-200" />

                      <strong className="block text-sm text-zinc-800">
                        {
                          history.label
                        }
                      </strong>

                      <small className="mt-1 block text-xs text-zinc-400">
                        {formatDate(
                          history.created_at,
                        )}
                      </small>

                      {history.description && (
                        <p className="mt-2 text-xs leading-5 text-zinc-500">
                          {
                            history.description
                          }
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-zinc-950 p-5 text-white">
              <div className="flex items-center justify-between text-sm text-zinc-400">
                <span>
                  Sous-total
                </span>

                <strong className="text-white">
                  {formatPrice(
                    detail.order
                      .subtotal ??
                      detail.order
                        .total,
                  )}{" "}
                  DA
                </strong>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm text-zinc-400">
                <span>
                  Livraison
                </span>

                <strong className="text-white">
                  {formatPrice(
                    detail.order
                      .delivery_fee ??
                      0,
                  )}{" "}
                  DA
                </strong>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="font-bold">
                  Total
                </span>

                <strong className="text-xl font-black text-orange-400">
                  {formatPrice(
                    detail.order
                      .total,
                  )}{" "}
                  DA
                </strong>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon:
    React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
        <Icon className="h-5 w-5" />
      </span>

      <span className="mt-3 block text-xs font-black uppercase tracking-wider text-zinc-400">
        {label}
      </span>

      <strong className="mt-1 block break-words text-sm text-zinc-800">
        {value}
      </strong>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  pageSize,
  firstVisible,
  lastVisible,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  firstVisible: number;
  lastVisible: number;
  totalItems: number;
  onPageChange: (
    page: number,
  ) => void;
  onPageSizeChange: (
    size: number,
  ) => void;
}) {
  const pages =
    useMemo(() => {
      const result: number[] =
        [];

      const start =
        Math.max(
          1,
          currentPage - 2,
        );

      const end =
        Math.min(
          totalPages,
          start + 4,
        );

      for (
        let page = start;
        page <= end;
        page += 1
      ) {
        result.push(page);
      }

      return result;
    }, [
      currentPage,
      totalPages,
    ]);

  return (
    <div className="flex flex-col justify-between gap-4 border-t border-zinc-200 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
        <span>
          Affichage de{" "}
          <strong className="text-zinc-800">
            {firstVisible}
          </strong>{" "}
          à{" "}
          <strong className="text-zinc-800">
            {lastVisible}
          </strong>{" "}
          sur{" "}
          <strong className="text-zinc-800">
            {totalItems}
          </strong>
        </span>

        <select
          value={pageSize}
          onChange={(event) =>
            onPageSizeChange(
              Number(
                event.target
                  .value,
              ),
            )
          }
          className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold outline-none"
        >
          {PAGE_SIZE_OPTIONS.map(
            (size) => (
              <option
                key={size}
                value={size}
              >
                {size} par page
              </option>
            ),
          )}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Page précédente"
          disabled={
            currentPage <= 1
          }
          onClick={() =>
            onPageChange(
              currentPage - 1,
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map(
          (page) => (
            <button
              key={page}
              type="button"
              onClick={() =>
                onPageChange(
                  page,
                )
              }
              className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-black transition ${
                page ===
                currentPage
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-orange-300 hover:text-orange-600"
              }`}
            >
              {page}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Page suivante"
          disabled={
            currentPage >=
            totalPages
          }
          onClick={() =>
            onPageChange(
              currentPage + 1,
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
