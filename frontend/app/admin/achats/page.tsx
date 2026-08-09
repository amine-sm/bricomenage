"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  PackagePlus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  adminHeaders,
  apiFetch,
} from "@/lib/api";

type Article = {
  id: number;
  designation: string;
  reference?: string;
  category?: string;
  stock_quantity: number;
  min_stock: number;
  category_id: number;
  price: number;
  purchase_price?: number | null;
  image?: string;
};

type StockFilter =
  | "all"
  | "available"
  | "low"
  | "out";

const PAGE_SIZE_OPTIONS = [
  5,
  10,
  20,
  50,
];

function getStockStatus(
  article: Article,
) {
  const stock = Number(
    article.stock_quantity || 0,
  );

  const minStock = Number(
    article.min_stock || 0,
  );

  if (stock <= 0) {
    return {
      label: "Rupture",
      className:
        "bg-red-50 text-red-700 ring-red-200",
      dotClassName:
        "bg-red-500",
    };
  }

  if (stock <= minStock) {
    return {
      label: "Stock faible",
      className:
        "bg-amber-50 text-amber-700 ring-amber-200",
      dotClassName:
        "bg-amber-500",
    };
  }

  return {
    label: "Disponible",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dotClassName:
      "bg-emerald-500",
  };
}

export default function StockPage() {
  const [
    mounted,
    setMounted,
  ] = useState(false);

  const [
    items,
    setItems,
  ] = useState<Article[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    updatingId,
    setUpdatingId,
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
    stockFilter,
    setStockFilter,
  ] = useState<StockFilter>(
    "all",
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
            articles: Article[];
          }>("/admin/articles", {
            headers:
              adminHeaders(),
          });

        setItems(
          response.articles ||
            [],
        );
      } catch (requestError) {
        setError(
          requestError instanceof
            Error
            ? requestError.message
            : "Impossible de charger les articles.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    load();
  }, [
    load,
    mounted,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    query,
    stockFilter,
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
    const totalArticles =
      items.length;

    const totalStock =
      items.reduce(
        (sum, article) =>
          sum +
          Number(
            article.stock_quantity ||
              0,
          ),
        0,
      );

    const lowStock =
      items.filter(
        (article) => {
          const stock =
            Number(
              article.stock_quantity ||
                0,
            );

          return (
            stock > 0 &&
            stock <=
              Number(
                article.min_stock ||
                  0,
              )
          );
        },
      ).length;

    const outOfStock =
      items.filter(
        (article) =>
          Number(
            article.stock_quantity ||
              0,
          ) <= 0,
      ).length;

    return {
      totalArticles,
      totalStock,
      lowStock,
      outOfStock,
    };
  }, [items]);

  const filteredItems =
    useMemo(() => {
      const normalizedQuery =
        query
          .trim()
          .toLowerCase();

      return items.filter(
        (article) => {
          const matchesQuery =
            !normalizedQuery ||
            [
              article.designation,
              article.reference,
              article.category,
            ]
              .filter(Boolean)
              .some((value) =>
                String(value)
                  .toLowerCase()
                  .includes(
                    normalizedQuery,
                  ),
              );

          const stock =
            Number(
              article.stock_quantity ||
                0,
            );

          const minStock =
            Number(
              article.min_stock ||
                0,
            );

          const matchesStock =
            stockFilter ===
              "all" ||
            (stockFilter ===
              "available" &&
              stock > minStock) ||
            (stockFilter ===
              "low" &&
              stock > 0 &&
              stock <= minStock) ||
            (stockFilter ===
              "out" &&
              stock <= 0);

          return (
            matchesQuery &&
            matchesStock
          );
        },
      );
    }, [
      items,
      query,
      stockFilter,
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

  async function update(
    event: FormEvent<HTMLFormElement>,
    article: Article,
  ) {
    event.preventDefault();

    setUpdatingId(
      article.id,
    );

    setError("");
    setSuccess("");

    try {
      const form =
        new FormData(
          event.currentTarget,
        );

      const newStock = Number(
        form.get(
          "stock_quantity",
        ),
      );

      const minStock = Number(
        form.get("min_stock"),
      );

      const purchasePrice = Number(
        form.get(
          "purchase_price",
        ),
      );

      await apiFetch(
        `/admin/articles/${article.id}`,
        {
          method: "PUT",

          headers: {
            ...adminHeaders(),
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            category_id:
              article.category_id,

            designation:
              article.designation,

            price:
              article.price,

            purchase_price:
              purchasePrice,

            stock_quantity:
              newStock,

            min_stock:
              minStock,
          }),
        },
      );

      setItems((current) =>
        current.map((item) =>
          item.id ===
          article.id
            ? {
                ...item,
                stock_quantity:
                  newStock,
                min_stock:
                  minStock,
                purchase_price:
                  purchasePrice,
              }
            : item,
        ),
      );

      setSuccess(
        `Stock et prix d’achat de « ${article.designation} » mis à jour.`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Impossible de mettre à jour le stock.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function resetFilters() {
    setQuery("");
    setStockFilter("all");
  }

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50">
        <LoaderCircle className="h-10 w-10 animate-spin text-orange-500" />
      </main>
    );
  }

  return (
    <>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[30px] border border-zinc-200 bg-gradient-to-br from-white via-white to-orange-50/60 p-6 shadow-sm sm:p-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-orange-600 shadow-sm">
              <PackagePlus className="h-4 w-4" />
              Gestion des quantités
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Achats et stock
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
              Mettez à jour les quantités reçues, le prix d’achat et le seuil minimum de chaque article.
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
            label="Articles"
            value={String(
              stats.totalArticles,
            )}
            description="Articles suivis"
            className="bg-orange-50 text-orange-600"
          />

          <StatCard
            label="Stock total"
            value={String(
              stats.totalStock,
            )}
            description="Unités disponibles"
            className="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            label="Stock faible"
            value={String(
              stats.lowStock,
            )}
            description="À réapprovisionner"
            className="bg-amber-50 text-amber-600"
          />

          <StatCard
            label="Ruptures"
            value={String(
              stats.outOfStock,
            )}
            description="Articles indisponibles"
            className="bg-red-50 text-red-600"
          />
        </section>

        <section className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-gradient-to-br from-white to-orange-50/20 p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_220px]">
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
                placeholder="Rechercher un article, une référence..."
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
              value={stockFilter}
              onChange={(event) =>
                setStockFilter(
                  event.target
                    .value as StockFilter,
                )
              }
              className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 outline-none transition transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
            >
              <option value="all">
                Tous les stocks
              </option>

              <option value="available">
                Disponible
              </option>

              <option value="low">
                Stock faible
              </option>

              <option value="out">
                Rupture
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
              Réinitialiser
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
          {loading ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
              <LoaderCircle className="h-10 w-10 animate-spin text-orange-500" />

              <p className="font-semibold text-zinc-500">
                Chargement du stock...
              </p>
            </div>
          ) : paginatedItems.length ===
            0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-orange-400">
                <PackagePlus className="h-10 w-10" />
              </span>

              <h2 className="mt-5 text-xl font-black text-zinc-950">
                Aucun article trouvé
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Modifiez vos filtres pour afficher d’autres articles.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left text-sm">
                <thead className="border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-orange-50/50">
                  <tr className="text-xs font-black uppercase tracking-[0.08em] text-zinc-500">
                    <th className="px-5 py-4">
                      Article
                    </th>

                    <th className="px-5 py-4">
                      Catégorie
                    </th>

                    <th className="px-5 py-4">
                      Prix d’achat
                    </th>

                    <th className="px-5 py-4">
                      Stock actuel
                    </th>

                    <th className="px-5 py-4">
                      Nouveau stock
                    </th>

                    <th className="px-5 py-4">
                      Stock minimum
                    </th>

                    <th className="px-5 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedItems.map(
                    (article) => (
                      <StockTableRow
                        key={article.id}
                        article={article}
                        updating={
                          updatingId ===
                          article.id
                        }
                        onSubmit={
                          update
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
    </>
  );
}

function StatCard({
  label,
  value,
  description,
  className,
}: {
  label: string;
  value: string;
  description: string;
  className: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <span
        className={`inline-flex rounded-2xl px-3 py-2 text-xs font-black ${className}`}
      >
        {label}
      </span>

      <strong className="mt-5 block text-3xl font-black text-zinc-950">
        {value}
      </strong>

      <p className="mt-1 text-xs text-zinc-400">
        {description}
      </p>
    </div>
  );
}

function StockTableRow({
  article,
  updating,
  onSubmit,
}: {
  article: Article;
  updating: boolean;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
    article: Article,
  ) => void;
}) {
  const status =
    getStockStatus(article);

  return (
    <tr className="border-b border-zinc-100 transition last:border-b-0 hover:bg-orange-50/40">
      <td className="px-5 py-4">
        <div className="flex min-w-[260px] items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
            {article.image ? (
              <img
                src={article.image}
                alt={
                  article.designation
                }
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <PackagePlus className="h-6 w-6 text-zinc-300" />
            )}
          </div>

          <div className="min-w-0">
            <strong className="line-clamp-1 block font-black text-zinc-950">
              {
                article.designation
              }
            </strong>

            <span className="mt-1 block text-xs text-zinc-400">
              {article.reference ||
                `Article #${article.id}`}
            </span>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
          {article.category ||
            "Non définie"}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="min-w-[120px]">
          <strong className="block text-sm font-black text-zinc-950">
            {new Intl.NumberFormat(
              "fr-DZ",
            ).format(
              Number(
                article.purchase_price ||
                  0,
              ),
            )}{" "}
            <span className="text-xs text-orange-500">
              DA
            </span>
          </strong>

          <span className="mt-1 block text-[10px] font-semibold text-zinc-400">
            Coût unitaire
          </span>
        </div>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1 ring-inset ${status.className}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${status.dotClassName}`}
          />

          {
            article.stock_quantity
          }{" "}
          · {status.label}
        </span>
      </td>

      <td
        className="px-5 py-4"
        colSpan={3}
      >
        <form
          onSubmit={(event) =>
            onSubmit(
              event,
              article,
            )
          }
          className="grid min-w-[590px] grid-cols-[150px_140px_140px_1fr] items-center gap-3"
        >
          <div className="relative">
            <input
              name="purchase_price"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={
                article.purchase_price ??
                0
              }
              placeholder="Prix d’achat"
              className="h-11 w-full rounded-xl border border-zinc-200 px-3 pr-10 text-sm font-bold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
            />

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-orange-500">
              DA
            </span>
          </div>

          <input
            name="stock_quantity"
            type="number"
            min="0"
            defaultValue={
              article.stock_quantity
            }
            className="h-11 rounded-xl border border-zinc-200 px-3 text-sm font-bold outline-none transition transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
          />

          <input
            name="min_stock"
            type="number"
            min="0"
            defaultValue={
              article.min_stock ||
              0
            }
            className="h-11 rounded-xl border border-zinc-200 px-3 text-sm font-bold outline-none transition transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
          />

          <button
            type="submit"
            disabled={updating}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-xs font-black text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updating ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Mise à jour...
              </>
            ) : (
              <>
                <PackagePlus className="h-4 w-4" />
                Mettre à jour
              </>
            )}
          </button>
        </form>
      </td>
    </tr>
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
