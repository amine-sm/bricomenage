"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Eye,
  ImagePlus,
  LayoutGrid,
  List,
  LoaderCircle,
  PackageCheck,
  PackageSearch,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

import {
  adminHeaders,
  apiFetch,
} from "@/lib/api";

type Article = {
  id: number;
  designation: string;
  slug: string;
  reference?: string;
  price: number;
  old_price?: number;
  stock_quantity: number;
  min_stock?: number;
  category_id: number;
  category: string;
  brand?: string;
  description?: string;
  image?: string;
  images?: string[];
  supplier_id?: number;
  supplier?: string;
  rating?: number;
  reviews?: number;
  is_active?: boolean | number;
};

type Category = {
  id: number;
  name: string;
};

type Supplier = {
  id: number;
  name: string;
};

type StockFilter =
  | "all"
  | "available"
  | "low"
  | "out";

type ViewMode = "cards" | "table";

type SortOption =
  | "newest"
  | "name-asc"
  | "price-asc"
  | "price-desc"
  | "stock-asc"
  | "stock-desc";

const PAGE_SIZE_OPTIONS = [
  5,
  10,
  20,
  50,
];

function formatPrice(
  value: number,
) {
  return new Intl.NumberFormat(
    "fr-DZ",
  ).format(Number(value || 0));
}

function createSlug(
  value: string,
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

function getStockStatus(
  article: Article,
) {
  const stock = Number(
    article.stock_quantity || 0,
  );

  const minimum = Number(
    article.min_stock || 3,
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

  if (stock <= minimum) {
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

export default function ArticlesPage() {
  const [
    items,
    setItems,
  ] = useState<Article[]>([]);

  const [
    categories,
    setCategories,
  ] = useState<Category[]>([]);

  const [
    suppliers,
    setSuppliers,
  ] = useState<Supplier[]>([]);

  const [
    editing,
    setEditing,
  ] = useState<Article | null>(
    null,
  );

  const [
    previewArticle,
    setPreviewArticle,
  ] = useState<Article | null>(
    null,
  );

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<number | null>(
    null,
  );

  const [
    articleToDelete,
    setArticleToDelete,
  ] = useState<Article | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");

  const [
    supplierFilter,
    setSupplierFilter,
  ] = useState("all");

  const [
    stockFilter,
    setStockFilter,
  ] = useState<StockFilter>(
    "all",
  );

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

  const [
    viewMode,
    setViewMode,
  ] = useState<ViewMode>("table");

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState<File[]>([]);

  const [
    selectedFilePreviews,
    setSelectedFilePreviews,
  ] = useState<string[]>([]);

  const [
    existingImages,
    setExistingImages,
  ] = useState<string[]>([]);

  const load = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const [
          articlesResponse,
          categoriesResponse,
          suppliersResponse,
        ] = await Promise.all([
          apiFetch<{
            articles: Article[];
          }>("/admin/articles", {
            headers:
              adminHeaders(),
          }),

          apiFetch<{
            categories:
              Category[];
          }>("/admin/categories", {
            headers:
              adminHeaders(),
          }),

          apiFetch<{
            suppliers:
              Supplier[];
          }>("/admin/suppliers", {
            headers:
              adminHeaders(),
          }),
        ]);

        setItems(
          articlesResponse.articles ||
            [],
        );

        setCategories(
          categoriesResponse.categories ||
            [],
        );

        setSuppliers(
          suppliersResponse.suppliers ||
            [],
        );
      } catch (requestError) {
        setError(
          requestError instanceof
            Error
            ? requestError.message
            : "Impossible de charger les données.",
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
    categoryFilter,
    supplierFilter,
    stockFilter,
    sortBy,
    pageSize,
  ]);

  useEffect(() => {
    const savedView =
      window.localStorage.getItem(
        "admin-articles-view",
      );

    if (
      savedView === "cards" ||
      savedView === "table"
    ) {
      setViewMode(savedView);
    }
  }, []);

  function changeViewMode(
    mode: ViewMode,
  ) {
    setViewMode(mode);

    window.localStorage.setItem(
      "admin-articles-view",
      mode,
    );
  }

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

  useEffect(() => {
    return () => {
      selectedFilePreviews.forEach(
        (url) =>
          URL.revokeObjectURL(
            url,
          ),
      );
    };
  }, [selectedFilePreviews]);

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

          const minimum =
            Number(
              article.min_stock ||
                3,
            );

          return (
            stock > 0 &&
            stock <= minimum
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

    const stockValue =
      items.reduce(
        (sum, article) =>
          sum +
          Number(
            article.price || 0,
          ) *
            Number(
              article.stock_quantity ||
                0,
            ),
        0,
      );

    return {
      totalArticles,
      totalStock,
      lowStock,
      outOfStock,
      stockValue,
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
          (article) => {
            const matchesQuery =
              !normalizedQuery ||
              [
                article.designation,
                article.reference,
                article.slug,
                article.brand,
                article.category,
                article.supplier,
              ]
                .filter(Boolean)
                .some((value) =>
                  String(value)
                    .toLowerCase()
                    .includes(
                      normalizedQuery,
                    ),
                );

            const matchesCategory =
              categoryFilter ===
                "all" ||
              Number(
                article.category_id,
              ) ===
                Number(
                  categoryFilter,
                );

            const matchesSupplier =
              supplierFilter ===
                "all" ||
              Number(
                article.supplier_id ||
                  0,
              ) ===
                Number(
                  supplierFilter,
                );

            const stock =
              Number(
                article.stock_quantity ||
                  0,
              );

            const minimum =
              Number(
                article.min_stock ||
                  3,
              );

            const matchesStock =
              stockFilter ===
                "all" ||
              (stockFilter ===
                "available" &&
                stock > minimum) ||
              (stockFilter ===
                "low" &&
                stock > 0 &&
                stock <= minimum) ||
              (stockFilter ===
                "out" &&
                stock <= 0);

            return (
              matchesQuery &&
              matchesCategory &&
              matchesSupplier &&
              matchesStock
            );
          },
        );

      return [...filtered].sort(
        (a, b) => {
          switch (sortBy) {
            case "name-asc":
              return a.designation.localeCompare(
                b.designation,
                "fr",
              );

            case "price-asc":
              return (
                Number(a.price) -
                Number(b.price)
              );

            case "price-desc":
              return (
                Number(b.price) -
                Number(a.price)
              );

            case "stock-asc":
              return (
                Number(
                  a.stock_quantity,
                ) -
                Number(
                  b.stock_quantity,
                )
              );

            case "stock-desc":
              return (
                Number(
                  b.stock_quantity,
                ) -
                Number(
                  a.stock_quantity,
                )
              );

            default:
              return (
                Number(b.id) -
                Number(a.id)
              );
          }
        },
      );
    }, [
      items,
      query,
      categoryFilter,
      supplierFilter,
      stockFilter,
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

  function openCreateModal() {
    setEditing(null);
    setSelectedFiles([]);
    setSelectedFilePreviews(
      [],
    );
    setExistingImages([]);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(
    article: Article,
  ) {
    const articleImages = [
      ...new Set(
        Array.isArray(
          article.images,
        ) &&
        article.images.length > 0
          ? article.images
          : article.image
            ? [article.image]
            : [],
      ),
    ];

    setEditing(article);
    setSelectedFiles([]);
    setSelectedFilePreviews(
      [],
    );
    setExistingImages(
      articleImages,
    );
    setError("");
    setModalOpen(true);
  }

  function closeModal(
    force = false,
  ) {
    if (saving && !force) {
      return;
    }

    setModalOpen(false);
    setEditing(null);
    setSelectedFiles([]);
    setSelectedFilePreviews(
      [],
    );
    setExistingImages([]);
  }

  function handleFilesChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const incomingFiles =
      Array.from(
        event.target.files ||
          [],
      );

    const availableSlots =
      Math.max(
        0,
        10 -
          existingImages.length -
          selectedFiles.length,
      );

    const filesToAdd =
      incomingFiles.slice(
        0,
        availableSlots,
      );

    if (filesToAdd.length === 0) {
      event.target.value = "";
      return;
    }

    setSelectedFiles(
      (current) => [
        ...current,
        ...filesToAdd,
      ],
    );

    setSelectedFilePreviews(
      (current) => [
        ...current,
        ...filesToAdd.map(
          (file) =>
            URL.createObjectURL(
              file,
            ),
        ),
      ],
    );

    event.target.value = "";
  }

  function removeExistingImage(
    image: string,
  ) {
    setExistingImages(
      (current) =>
        current.filter(
          (value) =>
            value !== image,
        ),
    );
  }

  function removeSelectedImage(
    index: number,
  ) {
    setSelectedFilePreviews(
      (current) => {
        const preview =
          current[index];

        if (preview) {
          URL.revokeObjectURL(
            preview,
          );
        }

        return current.filter(
          (_, itemIndex) =>
            itemIndex !== index,
        );
      },
    );

    setSelectedFiles(
      (current) =>
        current.filter(
          (_, itemIndex) =>
            itemIndex !== index,
        ),
    );
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const form =
        new FormData(
          event.currentTarget,
        );

      const designation =
        String(
          form.get(
            "designation",
          ) || "",
        ).trim();

      if (
        !form.get("slug") &&
        designation
      ) {
        form.set(
          "slug",
          createSlug(
            designation,
          ),
        );
      }

      if (editing) {
        form.set(
          "existing_images",
          JSON.stringify(
            existingImages,
          ),
        );

        form.set(
          "main_image",
          existingImages[0] ||
            "",
        );
      }

      selectedFiles.forEach(
        (file) => {
          form.append(
            "images",
            file,
          );
        },
      );

      await apiFetch(
        editing
          ? `/admin/articles/${editing.id}`
          : "/admin/articles",
        {
          method: editing
            ? "PUT"
            : "POST",

          headers:
            adminHeaders(),

          body: form,
        },
      );

      setSuccess(
        editing
          ? "Article modifié avec succès."
          : "Article ajouté avec succès.",
      );

      closeModal(true);

      await load();
    } catch (requestError) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Impossible d’enregistrer l’article.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmRemove() {
    if (!articleToDelete) {
      return;
    }

    const article = articleToDelete;

    setDeletingId(article.id);
    setError("");
    setSuccess("");

    try {
      await apiFetch(
        `/admin/articles/${article.id}`,
        {
          method: "DELETE",
          headers:
            adminHeaders(),
        },
      );

      setSuccess(
        `L’article « ${article.designation} » a été supprimé avec succès.`,
      );

      setArticleToDelete(null);

      await load();
    } catch (requestError) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Impossible de supprimer l’article.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function resetFilters() {
    setQuery("");
    setCategoryFilter("all");
    setSupplierFilter("all");
    setStockFilter("all");
    setSortBy("newest");
  }

  return (
    <>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[30px] border border-zinc-200 bg-gradient-to-br from-white via-white to-orange-50/60 p-6 shadow-sm sm:p-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-orange-600 shadow-sm">
              <Boxes className="h-4 w-4" />
              Gestion du catalogue
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Articles
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
              Gérez vos articles, leurs prix, leurs images, leurs fournisseurs et leur stock.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-black text-zinc-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
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

            <button
              type="button"
              onClick={
                openCreateModal
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-1 hover:bg-orange-600 hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Ajouter un article
            </button>
          </div>
        </section>

        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            <PackageCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error &&
          !modalOpen && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={Boxes}
            label="Articles"
            value={String(
              stats.totalArticles,
            )}
            description="Références enregistrées"
            iconClassName="bg-orange-50 text-orange-600"
          />

          <StatCard
            icon={
              PackageCheck
            }
            label="Stock total"
            value={String(
              stats.totalStock,
            )}
            description="Unités disponibles"
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            icon={
              AlertTriangle
            }
            label="Stock faible"
            value={String(
              stats.lowStock,
            )}
            description="Articles à réapprovisionner"
            iconClassName="bg-amber-50 text-amber-600"
          />

          <StatCard
            icon={
              PackageSearch
            }
            label="Ruptures"
            value={String(
              stats.outOfStock,
            )}
            description="Articles indisponibles"
            iconClassName="bg-red-50 text-red-600"
          />

          <StatCard
            icon={
              CircleDollarSign
            }
            label="Valeur stock"
            value={`${formatPrice(
              stats.stockValue,
            )} DA`}
            description="Estimation au prix de vente"
            iconClassName="bg-blue-50 text-blue-600"
          />
        </section>

        <section className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-gradient-to-br from-white to-orange-50/20 p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_200px_200px_180px_180px]">
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

            <FilterSelect
              value={
                categoryFilter
              }
              onChange={
                setCategoryFilter
              }
              ariaLabel="Filtrer par catégorie"
            >
              <option value="all">
                Toutes catégories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {category.name}
                  </option>
                ),
              )}
            </FilterSelect>

            <FilterSelect
              value={
                supplierFilter
              }
              onChange={
                setSupplierFilter
              }
              ariaLabel="Filtrer par fournisseur"
            >
              <option value="all">
                Tous fournisseurs
              </option>

              {suppliers.map(
                (supplier) => (
                  <option
                    key={
                      supplier.id
                    }
                    value={
                      supplier.id
                    }
                  >
                    {supplier.name}
                  </option>
                ),
              )}
            </FilterSelect>

            <FilterSelect
              value={stockFilter}
              onChange={(value) =>
                setStockFilter(
                  value as StockFilter,
                )
              }
              ariaLabel="Filtrer par stock"
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
            </FilterSelect>

            <FilterSelect
              value={sortBy}
              onChange={(value) =>
                setSortBy(
                  value as SortOption,
                )
              }
              ariaLabel="Trier les articles"
            >
              <option value="newest">
                Plus récents
              </option>

              <option value="name-asc">
                Nom A à Z
              </option>

              <option value="price-asc">
                Prix croissant
              </option>

              <option value="price-desc">
                Prix décroissant
              </option>

              <option value="stock-asc">
                Stock croissant
              </option>

              <option value="stock-desc">
                Stock décroissant
              </option>
            </FilterSelect>
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

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex h-11 items-center rounded-2xl border border-zinc-200 bg-zinc-100 p-1">
                <button
                  type="button"
                  onClick={() =>
                    changeViewMode(
                      "cards",
                    )
                  }
                  className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition ${
                    viewMode ===
                    "cards"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Cartes
                </button>

                <button
                  type="button"
                  onClick={() =>
                    changeViewMode(
                      "table",
                    )
                  }
                  className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition ${
                    viewMode ===
                    "table"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <List className="h-4 w-4" />
                  Tableau
                </button>
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
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
          {loading ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
              <LoaderCircle className="h-10 w-10 animate-spin text-orange-500" />

              <p className="font-semibold text-zinc-500">
                Chargement des articles...
              </p>
            </div>
          ) : paginatedItems.length ===
            0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-orange-400">
                <PackageSearch className="h-10 w-10" />
              </span>

              <h2 className="mt-5 text-xl font-black text-zinc-950">
                Aucun article trouvé
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Modifiez les filtres ou ajoutez votre premier article.
              </p>

              <button
                type="button"
                onClick={
                  openCreateModal
                }
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white"
              >
                <Plus className="h-4 w-4" />
                Ajouter un article
              </button>
            </div>
          ) : (
            <>
              {viewMode ===
              "table" ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] text-left text-sm">
                    <thead className="border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-orange-50/50">
                      <tr className="text-xs font-black uppercase tracking-[0.08em] text-zinc-500">
                        <th className="px-5 py-4">
                          Article
                        </th>

                        <th className="px-5 py-4">
                          Catégorie
                        </th>

                        <th className="px-5 py-4">
                          Fournisseur
                        </th>

                        <th className="px-5 py-4">
                          Prix
                        </th>

                        <th className="px-5 py-4">
                          Stock
                        </th>

                        <th className="px-5 py-4 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedItems.map(
                        (article) => (
                          <ArticleTableRow
                            key={
                              article.id
                            }
                            article={
                              article
                            }
                            deleting={
                              deletingId ===
                              article.id
                            }
                            onPreview={() =>
                              setPreviewArticle(
                                article,
                              )
                            }
                            onEdit={() =>
                              openEditModal(
                                article,
                              )
                            }
                            onDelete={() =>
                              setArticleToDelete(
                                article,
                              )
                            }
                          />
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid items-stretch gap-5 p-4 sm:p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {paginatedItems.map(
                    (article) => (
                      <ArticleMobileCard
                        key={
                          article.id
                        }
                        article={
                          article
                        }
                        deleting={
                          deletingId ===
                          article.id
                        }
                        onPreview={() =>
                          setPreviewArticle(
                            article,
                          )
                        }
                        onEdit={() =>
                          openEditModal(
                            article,
                          )
                        }
                        onDelete={() =>
                          setArticleToDelete(
                            article,
                          )
                        }
                      />
                    ),
                  )}
                </div>
              )}
            </>
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

      {modalOpen && (
        <ArticleModal
          editing={editing}
          categories={
            categories
          }
          suppliers={
            suppliers
          }
          saving={saving}
          error={error}
          previews={
            selectedFilePreviews
          }
          existingImages={
            existingImages
          }
          onRemoveExistingImage={
            removeExistingImage
          }
          onRemoveSelectedImage={
            removeSelectedImage
          }
          onClose={closeModal}
          onSubmit={submit}
          onFilesChange={
            handleFilesChange
          }
        />
      )}

      {previewArticle && (
        <ArticlePreviewModal
          article={
            previewArticle
          }
          onClose={() =>
            setPreviewArticle(
              null,
            )
          }
          onEdit={() => {
            const article =
              previewArticle;

            setPreviewArticle(
              null,
            );

            openEditModal(
              article,
            );
          }}
        />
      )}

      {articleToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer la confirmation de suppression"
            onClick={() => {
              if (deletingId === null) {
                setArticleToDelete(null);
              }
            }}
            className="absolute inset-0 bg-zinc-950/55 backdrop-blur-sm"
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.30)]">
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
                  <Trash2 className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-black text-zinc-950">
                    Supprimer cet article ?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Cette action supprimera définitivement l’article suivant.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/70 p-4">
                <span className="block text-xs font-bold uppercase tracking-wider text-red-400">
                  Article concerné
                </span>

                <strong className="mt-1 block break-words text-sm font-black text-zinc-900">
                  {articleToDelete.designation}
                </strong>

                {(articleToDelete.reference ||
                  articleToDelete.slug) && (
                  <span className="mt-1 block text-xs text-zinc-500">
                    {articleToDelete.reference ||
                      articleToDelete.slug}
                  </span>
                )}
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />

                <p className="leading-6">
                  Cette action est irréversible. Vérifiez bien l’article avant de continuer.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 bg-zinc-50 p-4 sm:p-5">
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={() =>
                  setArticleToDelete(null)
                }
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-black text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={deletingId !== null}
                onClick={confirmRemove}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId !== null ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
    <div className="group relative overflow-hidden rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          <Icon className="h-6 w-6" />
        </span>
      </div>

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

interface FilterSelectProps {
  value: string;
  onChange: (
    value: string,
  ) => void;
  ariaLabel: string;
  children:
    React.ReactNode;
}

function FilterSelect({
  value,
  onChange,
  ariaLabel,
  children,
}: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value,
        )
      }
      aria-label={ariaLabel}
      className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 outline-none transition transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
    >
      {children}
    </select>
  );
}

interface ArticleRowProps {
  article: Article;
  deleting: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ArticleTableRow({
  article,
  deleting,
  onPreview,
  onEdit,
  onDelete,
}: ArticleRowProps) {
  const stockStatus =
    getStockStatus(article);

  return (
    <tr className="border-b border-zinc-100 transition last:border-b-0 hover:bg-orange-50/40">
      <td className="px-5 py-4">
        <div className="flex min-w-[280px] items-center gap-4">
          <ArticleImage
            article={article}
            className="h-16 w-16"
          />

          <div className="min-w-0">
            <strong className="line-clamp-1 block text-sm font-black text-zinc-950">
              {
                article.designation
              }
            </strong>

            <span className="mt-1 block text-xs text-zinc-400">
              {article.reference ||
                article.slug}
            </span>

            {article.brand && (
              <span className="mt-1 inline-flex rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-500">
                {article.brand}
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
          {article.category}
        </span>
      </td>

      <td className="px-5 py-4 text-sm font-semibold text-zinc-600">
        {article.supplier ||
          "Non défini"}
      </td>

      <td className="px-5 py-4">
        <strong className="block font-black text-zinc-950">
          {formatPrice(
            article.price,
          )}{" "}
          DA
        </strong>

        {article.old_price &&
          Number(
            article.old_price,
          ) >
            Number(
              article.price,
            ) && (
            <span className="mt-1 block text-xs text-zinc-400 line-through">
              {formatPrice(
                article.old_price,
              )}{" "}
              DA
            </span>
          )}
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1 ring-inset ${stockStatus.className}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${stockStatus.dotClassName}`}
          />

          {
            article.stock_quantity
          }{" "}
          · {stockStatus.label}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <ActionButton
            label="Voir"
            icon={Eye}
            className="bg-zinc-100 text-zinc-600 hover:bg-zinc-950 hover:text-white"
            onClick={onPreview}
          />

          <ActionButton
            label="Modifier"
            icon={Pencil}
            className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
            onClick={onEdit}
          />

          <ActionButton
            label="Supprimer"
            icon={
              deleting
                ? LoaderCircle
                : Trash2
            }
            className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
            onClick={onDelete}
            disabled={deleting}
            spin={deleting}
          />
        </div>
      </td>
    </tr>
  );
}

function ArticleMobileCard({
  article,
  deleting,
  onPreview,
  onEdit,
  onDelete,
}: ArticleRowProps) {
  const stockStatus =
    getStockStatus(article);

  const hasPromotion =
    Boolean(article.old_price) &&
    Number(article.old_price) >
      Number(article.price);

  const discount =
    hasPromotion
      ? Math.round(
          ((Number(
            article.old_price,
          ) -
            Number(
              article.price,
            )) /
            Number(
              article.old_price,
            )) *
            100,
        )
      : 0;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-orange-200 hover:shadow-[0_24px_60px_rgba(24,24,27,0.12)]">
      {/* Grande image du produit */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-orange-50/40">
        {article.image ? (
          <img
            src={article.image}
            alt={article.designation}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-105 sm:p-7"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-zinc-300">
            <span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-white shadow-sm ring-1 ring-zinc-200">
              <ImagePlus className="h-9 w-9" />
            </span>

            <span className="mt-3 text-xs font-bold">
              Aucune image
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/10 via-transparent to-transparent" />

        {/* Catégorie */}
        <span className="absolute left-4 top-4 inline-flex max-w-[55%] truncate rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-orange-600 shadow-sm backdrop-blur">
          {article.category}
        </span>

        {/* Statut stock */}
        <span
          className={`absolute right-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black shadow-sm ring-1 ring-inset backdrop-blur ${stockStatus.className}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${stockStatus.dotClassName}`}
          />
          {stockStatus.label}
        </span>

        {/* Promotion */}
        {hasPromotion && (
          <span className="absolute bottom-4 left-4 rounded-full bg-red-500 px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-red-500/25">
            -{discount} %
          </span>
        )}

        {/* Bouton aperçu flottant */}
        <button
          type="button"
          onClick={onPreview}
          aria-label={`Voir ${article.designation}`}
          className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-zinc-950 text-white shadow-xl transition hover:scale-105 hover:bg-orange-500"
        >
          <Eye className="h-5 w-5" />
        </button>
      </div>

      {/* Informations */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="block truncate text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
              {article.reference ||
                article.slug}
            </span>

            <h3 className="mt-2 line-clamp-2 min-h-14 text-lg font-black leading-7 text-zinc-950 transition-colors group-hover:text-orange-600">
              {article.designation}
            </h3>
          </div>

          {article.brand && (
            <span className="shrink-0 rounded-xl bg-zinc-100 px-3 py-1.5 text-[10px] font-black text-zinc-600">
              {article.brand}
            </span>
          )}
        </div>

        <p className="mt-3 line-clamp-2 min-h-11 text-sm leading-6 text-zinc-500">
          {article.description ||
            "Aucune description disponible pour cet article."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-zinc-50 p-3.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Fournisseur
            </span>

            <strong className="mt-1 block truncate text-xs font-black text-zinc-700">
              {article.supplier ||
                "Non défini"}
            </strong>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-3.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Stock
            </span>

            <strong className="mt-1 block text-xs font-black text-zinc-700">
              {article.stock_quantity} unité
              {Number(
                article.stock_quantity,
              ) > 1
                ? "s"
                : ""}
            </strong>
          </div>
        </div>

        {/* Prix */}
        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div>
            {hasPromotion && (
              <span className="block text-xs font-semibold text-zinc-400 line-through">
                {formatPrice(
                  Number(
                    article.old_price,
                  ),
                )}{" "}
                DA
              </span>
            )}

            <div className="mt-0.5 flex items-baseline gap-1.5">
              <strong className="text-2xl font-black tracking-tight text-zinc-950">
                {formatPrice(
                  article.price,
                )}
              </strong>

              <span className="text-sm font-black text-orange-400">
                DA
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black ring-1 ring-inset ${stockStatus.className}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${stockStatus.dotClassName}`}
            />
            {article.stock_quantity}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 bg-zinc-50/80 p-4">
        <MobileActionButton
          label="Voir"
          icon={Eye}
          className="border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
          onClick={onPreview}
        />

        <MobileActionButton
          label="Modifier"
          icon={Pencil}
          className="border border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-600 hover:bg-blue-600 hover:text-white"
          onClick={onEdit}
        />

        <MobileActionButton
          label="Supprimer"
          icon={
            deleting
              ? LoaderCircle
              : Trash2
          }
          className="border border-red-100 bg-red-50 text-red-700 hover:border-red-600 hover:bg-red-600 hover:text-white"
          onClick={onDelete}
          disabled={deleting}
          spin={deleting}
        />
      </div>

      <span className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500 group-hover:w-full" />
    </article>
  );
}

interface ArticleImageProps {
  article: Article;
  className: string;
}

function ArticleImage({
  article,
  className,
}: ArticleImageProps) {
  const [
    imageError,
    setImageError,
  ] = useState(false);

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 ${className}`}
    >
      {article.image &&
      !imageError ? (
        <img
          src={article.image}
          alt={
            article.designation
          }
          loading="lazy"
          decoding="async"
          onError={() =>
            setImageError(true)
          }
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-300">
          <ImagePlus className="h-7 w-7" />
        </div>
      )}
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  icon:
    React.ElementType;
  className: string;
  onClick: () => void;
  disabled?: boolean;
  spin?: boolean;
}

function ActionButton({
  label,
  icon: Icon,
  className,
  onClick,
  disabled = false,
  spin = false,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <Icon
        className={`h-4 w-4 ${
          spin
            ? "animate-spin"
            : ""
        }`}
      />
    </button>
  );
}

function MobileActionButton({
  label,
  icon: Icon,
  className,
  onClick,
  disabled = false,
  spin = false,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-11 w-full items-center justify-center rounded-xl transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <Icon
        className={`h-4.5 w-4.5 ${
          spin
            ? "animate-spin"
            : ""
        }`}
      />
    </button>
  );
}

interface PaginationProps {
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
}: PaginationProps) {
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

interface ArticleModalProps {
  editing: Article | null;
  categories: Category[];
  suppliers: Supplier[];
  saving: boolean;
  error: string;
  previews: string[];
  existingImages: string[];
  onRemoveExistingImage: (
    image: string,
  ) => void;
  onRemoveSelectedImage: (
    index: number,
  ) => void;
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
  onFilesChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
}

function ArticleModal({
  editing,
  categories,
  suppliers,
  saving,
  error,
  previews,
  existingImages,
  onRemoveExistingImage,
  onRemoveSelectedImage,
  onClose,
  onSubmit,
  onFilesChange,
}: ArticleModalProps) {
  return (
    <div className="fixed inset-0 z-[130] overflow-y-auto bg-zinc-950/65 p-3 backdrop-blur-md sm:p-5">
      <form
        onSubmit={onSubmit}
        className="mx-auto my-4 w-full max-w-4xl overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl"
      >
        <div className="relative flex items-start justify-between gap-4 overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900 to-orange-950 px-5 py-6 text-white sm:px-7">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.16em] text-orange-400">
              Catalogue
            </span>

            <h2 className="mt-2 text-2xl font-black text-zinc-950">
              {editing
                ? "Modifier l’article"
                : "Ajouter un article"}
            </h2>

            <p className="mt-1 text-sm text-zinc-300">
              Complétez les informations ci-dessous.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto px-5 py-6 sm:px-7">
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              name="designation"
              label="Désignation"
              value={
                editing?.designation
              }
              placeholder="Ex. Perceuse 750 W"
              required
            />

            <Field
              name="slug"
              label="Slug"
              value={editing?.slug}
              placeholder="Généré automatiquement si vide"
            />

            <Field
              name="reference"
              label="Référence"
              value={
                editing?.reference
              }
              placeholder="Ex. PER-001"
            />

            <Field
              name="brand"
              label="Marque"
              value={
                editing?.brand
              }
              placeholder="Ex. BricoPro"
            />

            <Field
              name="price"
              label="Prix de vente"
              value={
                editing?.price
              }
              type="number"
              min="0"
              step="0.01"
              required
            />

            <Field
              name="stock_quantity"
              label="Stock actuel"
              value={
                editing?.stock_quantity
              }
              type="number"
              min="0"
              step="1"
              required
            />

            <Field
              name="min_stock"
              label="Seuil stock faible"
              value={
                editing?.min_stock ??
                3
              }
              type="number"
              min="0"
              step="1"
            />

            <label className="text-sm font-black text-zinc-700">
              Catégorie

              <select
                name="category_id"
                defaultValue={
                  editing?.category_id ||
                  ""
                }
                required
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none transition transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
              >
                <option value="">
                  Choisir une catégorie
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {category.name}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="text-sm font-black text-zinc-700">
              Fournisseur

              <select
                name="supplier_id"
                defaultValue={
                  editing?.supplier_id ||
                  ""
                }
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none transition transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
              >
                <option value="">
                  Aucun fournisseur
                </option>

                {suppliers.map(
                  (supplier) => (
                    <option
                      key={
                        supplier.id
                      }
                      value={
                        supplier.id
                      }
                    >
                      {supplier.name}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="sm:col-span-2 text-sm font-black text-zinc-700">
              Télécharger des images

              <span className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-4 text-center transition hover:border-orange-300 hover:bg-orange-50/40">
                <ImagePlus className="h-8 w-8 text-orange-500" />

                <strong className="mt-2 text-sm text-zinc-700">
                  Sélectionner jusqu’à 10 images
                </strong>

                <span className="mt-1 text-xs font-normal text-zinc-400">
                  JPG, PNG ou WEBP
                </span>

                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    onFilesChange
                  }
                  className="hidden"
                />
              </span>
            </label>
            {(existingImages.length > 0 ||
              previews.length > 0) && (
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-black text-zinc-700">
                    Aperçu des images
                  </span>

                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">
                    {existingImages.length +
                      previews.length}
                    /10
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {existingImages.map(
                    (
                      image,
                      index,
                    ) => (
                      <div
                        key={image}
                        className="group relative aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
                      >
                        <img
                          src={image}
                          alt={`Image existante ${
                            index + 1
                          }`}
                          className="h-full w-full object-cover"
                        />

                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 rounded-full bg-zinc-950/80 px-2.5 py-1 text-[9px] font-black uppercase text-white backdrop-blur">
                            Principale
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            onRemoveExistingImage(
                              image,
                            )
                          }
                          aria-label="Supprimer cette image"
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:scale-110 hover:bg-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ),
                  )}

                  {previews.map(
                    (
                      preview,
                      index,
                    ) => (
                      <div
                        key={preview}
                        className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-orange-200 bg-orange-50"
                      >
                        <img
                          src={preview}
                          alt={`Nouvelle image ${
                            index + 1
                          }`}
                          className="h-full w-full object-cover"
                        />

                        <span className="absolute bottom-2 left-2 rounded-full bg-orange-500 px-2.5 py-1 text-[9px] font-black uppercase text-white">
                          Nouvelle
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            onRemoveSelectedImage(
                              index,
                            )
                          }
                          aria-label="Retirer cette nouvelle image"
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:scale-110 hover:bg-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ),
                  )}
                </div>

                <p className="mt-3 text-xs leading-5 text-zinc-400">
                  Cliquez sur le bouton X pour retirer une image. La première image conservée devient l’image principale.
                </p>
              </div>
            )}

            <label className="sm:col-span-2 text-sm font-black text-zinc-700">
              Description

              <textarea
                name="description"
                defaultValue={
                  editing?.description ||
                  ""
                }
                placeholder="Décrivez les caractéristiques principales de l’article..."
                className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-zinc-200 p-4 text-sm outline-none transition transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-12 rounded-2xl border border-zinc-200 bg-white px-6 text-sm font-black text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-7 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <PackageCheck className="h-5 w-5" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

interface FieldProps {
  name: string;
  label: string;
  value?: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
  step?: string;
}

function Field({
  name,
  label,
  value,
  type = "text",
  required = false,
  placeholder,
  min,
  step,
}: FieldProps) {
  return (
    <label className="text-sm font-black text-zinc-700">
      {label}

      <input
        name={name}
        type={type}
        required={required}
        defaultValue={
          value ?? ""
        }
        placeholder={
          placeholder
        }
        min={min}
        step={step}
        className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none transition transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
      />
    </label>
  );
}

interface ArticlePreviewModalProps {
  article: Article;
  onClose: () => void;
  onEdit: () => void;
}

function ArticlePreviewModal({
  article,
  onClose,
  onEdit,
}: ArticlePreviewModalProps) {
  const stockStatus =
    getStockStatus(article);

  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-zinc-950/65 p-4 backdrop-blur-md">
      <div className="mx-auto my-8 w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl">
        <div className="relative aspect-[16/8] bg-zinc-100">
          {article.image ? (
            <img
              src={article.image}
              alt={
                article.designation
              }
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-300">
              <ImagePlus className="h-16 w-16" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/65 via-transparent to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow backdrop-blur"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute bottom-5 left-5 right-5 text-white">
            <span className="inline-flex rounded-full bg-orange-500 px-3 py-1 text-xs font-black">
              {article.category}
            </span>

            <h2 className="mt-3 text-2xl font-black">
              {
                article.designation
              }
            </h2>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <PreviewValue
              label="Prix"
              value={`${formatPrice(
                article.price,
              )} DA`}
            />

            <PreviewValue
              label="Stock"
              value={`${article.stock_quantity} unités`}
            />

            <PreviewValue
              label="Fournisseur"
              value={
                article.supplier ||
                "Non défini"
              }
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1 ring-inset ${stockStatus.className}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${stockStatus.dotClassName}`}
              />
              {stockStatus.label}
            </span>

            {article.brand && (
              <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-600">
                {article.brand}
              </span>
            )}

            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-600">
              {article.reference ||
                article.slug}
            </span>
          </div>

          <p className="mt-6 text-sm leading-7 text-zinc-600">
            {article.description ||
              "Aucune description disponible pour cet article."}
          </p>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-2xl border border-zinc-200 px-6 text-sm font-black text-zinc-600"
            >
              Fermer
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-sm font-black text-white"
            >
              <Pencil className="h-4 w-4" />
              Modifier l’article
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-4">
      <span className="text-xs font-bold text-zinc-400">
        {label}
      </span>

      <strong className="mt-1 block text-sm font-black text-zinc-800">
        {value}
      </strong>
    </div>
  );
}
