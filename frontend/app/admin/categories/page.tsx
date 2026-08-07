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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderTree,
  ImagePlus,
  LayoutGrid,
  List,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Tags,
  Trash2,
  X,
} from "lucide-react";

import {
  adminHeaders,
  apiFetch,
} from "@/lib/api";

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  is_active: number | boolean;
  article_count: number;
  created_at?: string;
  updated_at?: string;
};

type ViewMode = "cards" | "table";

type StatusFilter =
  | "all"
  | "active"
  | "inactive";

type SortOption =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc";

const PAGE_SIZE_OPTIONS = [
  5,
  10,
  20,
  50,
];

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

function isCategoryActive(
  category: Category,
) {
  return (
    category.is_active === true ||
    Number(category.is_active) === 1
  );
}

export default function CategoriesPage() {
  const [
    items,
    setItems,
  ] = useState<Category[]>([]);

  const [
    editing,
    setEditing,
  ] = useState<Category | null>(
    null,
  );

  const [
    previewCategory,
    setPreviewCategory,
  ] = useState<Category | null>(
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
    categoryToDelete,
    setCategoryToDelete,
  ] = useState<Category | null>(
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
  ] = useState<StatusFilter>(
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
    categoryImageFile,
    setCategoryImageFile,
  ] = useState<File | null>(
    null,
  );

  const [
    categoryImagePreview,
    setCategoryImagePreview,
  ] = useState("");

  const [
    keepExistingImage,
    setKeepExistingImage,
  ] = useState(true);

  const load = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await apiFetch<{
            categories:
              Category[];
          }>("/admin/categories", {
            headers:
              adminHeaders(),
          });

        setItems(
          response.categories ||
            [],
        );
      } catch (requestError) {
        setError(
          requestError instanceof
            Error
            ? requestError.message
            : "Impossible de charger les catégories.",
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
    sortBy,
    pageSize,
  ]);

  useEffect(() => {
    const savedView =
      window.localStorage.getItem(
        "admin-categories-view",
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
      "admin-categories-view",
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

  const stats = useMemo(() => {
    const total =
      items.length;

    const active =
      items.filter(
        isCategoryActive,
      ).length;

    const inactive =
      total - active;

    const withDescription =
      items.filter(
        (category) =>
          Boolean(
            category.description?.trim(),
          ),
      ).length;

    const totalArticles =
      items.reduce(
        (sum, category) =>
          sum +
          Number(
            category.article_count ||
              0,
          ),
        0,
      );

    return {
      total,
      active,
      inactive,
      withDescription,
      totalArticles,
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
          (category) => {
            const matchesQuery =
              !normalizedQuery ||
              [
                category.name,
                category.slug,
                category.description,
              ]
                .filter(Boolean)
                .some((value) =>
                  String(value)
                    .toLowerCase()
                    .includes(
                      normalizedQuery,
                    ),
                );

            const active =
              isCategoryActive(
                category,
              );

            const matchesStatus =
              statusFilter ===
                "all" ||
              (statusFilter ===
                "active" &&
                active) ||
              (statusFilter ===
                "inactive" &&
                !active);

            return (
              matchesQuery &&
              matchesStatus
            );
          },
        );

      return [...filtered].sort(
        (a, b) => {
          switch (sortBy) {
            case "oldest":
              return (
                Number(a.id) -
                Number(b.id)
              );

            case "name-asc":
              return a.name.localeCompare(
                b.name,
                "fr",
              );

            case "name-desc":
              return b.name.localeCompare(
                a.name,
                "fr",
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
      statusFilter,
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
    setCategoryImageFile(null);
    setCategoryImagePreview("");
    setKeepExistingImage(false);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(
    category: Category,
  ) {
    setEditing(category);
    setCategoryImageFile(null);
    setCategoryImagePreview(
      category.image || "",
    );
    setKeepExistingImage(
      Boolean(category.image),
    );
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditing(null);
    setCategoryImageFile(null);
    setCategoryImagePreview("");
    setKeepExistingImage(false);
  }

  function handleCategoryImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0] ||
      null;

    if (!file) {
      return;
    }

    if (categoryImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(
        categoryImagePreview,
      );
    }

    setCategoryImageFile(file);
    setCategoryImagePreview(
      URL.createObjectURL(file),
    );
    setKeepExistingImage(false);

    event.target.value = "";
  }

  function removeCategoryImage() {
    if (categoryImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(
        categoryImagePreview,
      );
    }

    setCategoryImageFile(null);
    setCategoryImagePreview("");
    setKeepExistingImage(false);
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

      const name =
        String(
          form.get("name") ||
            "",
        ).trim();

      const slug =
        String(
          form.get("slug") ||
            "",
        ).trim() ||
        createSlug(name);

      form.set("name", name);
      form.set("slug", slug);

      form.set(
        "is_active",
        form.get("is_active") ===
          "1"
          ? "1"
          : "0",
      );

      form.set(
        "existing_image",
        keepExistingImage &&
        editing?.image
          ? editing.image
          : "",
      );

      if (categoryImageFile) {
        form.append(
          "category_image",
          categoryImageFile,
        );
      }

      await apiFetch(
        editing
          ? `/admin/categories/${editing.id}`
          : "/admin/categories",
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
          ? "Catégorie modifiée avec succès."
          : "Catégorie ajoutée avec succès.",
      );

      closeModal();

      await load();
    } catch (requestError) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Impossible d’enregistrer la catégorie.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmRemove() {
    if (!categoryToDelete) {
      return;
    }

    const category =
      categoryToDelete;

    setDeletingId(
      category.id,
    );

    setError("");
    setSuccess("");

    try {
      await apiFetch(
        `/admin/categories/${category.id}`,
        {
          method: "DELETE",
          headers:
            adminHeaders(),
        },
      );

      setSuccess(
        `La catégorie « ${category.name} » a été supprimée avec succès.`,
      );

      setCategoryToDelete(
        null,
      );

      await load();
    } catch (requestError) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Impossible de supprimer la catégorie.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setSortBy("newest");
  }

  return (
    <>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[30px] border border-zinc-200 bg-gradient-to-br from-white via-white to-orange-50/60 p-6 shadow-sm sm:p-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-orange-600 shadow-sm">
              <FolderTree className="h-4 w-4" />
              Organisation du catalogue
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Catégories
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
              Organisez vos articles par univers pour simplifier la navigation dans le catalogue.
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
              Ajouter une catégorie
            </button>
          </div>
        </section>

        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={FolderTree}
            label="Catégories"
            value={String(
              stats.total,
            )}
            description="Univers enregistrés"
            iconClassName="bg-orange-50 text-orange-600"
          />

          <StatCard
            icon={
              CheckCircle2
            }
            label="Actives"
            value={String(
              stats.active,
            )}
            description="Visibles dans le catalogue"
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            icon={
              AlertTriangle
            }
            label="Inactives"
            value={String(
              stats.inactive,
            )}
            description="Masquées du catalogue"
            iconClassName="bg-red-50 text-red-600"
          />

          <StatCard
            icon={Boxes}
            label="Articles classés"
            value={String(
              stats.totalArticles,
            )}
            description="Articles reliés aux catégories"
            iconClassName="bg-blue-50 text-blue-600"
          />
        </section>

        <section className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-gradient-to-br from-white to-orange-50/20 p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_210px_210px]">
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
                placeholder="Rechercher par nom, slug ou description..."
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
                statusFilter
              }
              onChange={(value) =>
                setStatusFilter(
                  value as StatusFilter,
                )
              }
              ariaLabel="Filtrer par statut"
            >
              <option value="all">
                Tous les statuts
              </option>

              <option value="active">
                Actives
              </option>

              <option value="inactive">
                Inactives
              </option>
            </FilterSelect>

            <FilterSelect
              value={sortBy}
              onChange={(value) =>
                setSortBy(
                  value as SortOption,
                )
              }
              ariaLabel="Trier les catégories"
            >
              <option value="newest">
                Plus récentes
              </option>

              <option value="oldest">
                Plus anciennes
              </option>

              <option value="name-asc">
                Nom A à Z
              </option>

              <option value="name-desc">
                Nom Z à A
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
                Chargement des catégories...
              </p>
            </div>
          ) : paginatedItems.length ===
            0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-orange-400">
                <FolderTree className="h-10 w-10" />
              </span>

              <h2 className="mt-5 text-xl font-black text-zinc-950">
                Aucune catégorie trouvée
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Modifiez vos filtres ou ajoutez votre première catégorie.
              </p>

              <button
                type="button"
                onClick={
                  openCreateModal
                }
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white"
              >
                <Plus className="h-4 w-4" />
                Ajouter une catégorie
              </button>
            </div>
          ) : (
            <>
              {viewMode ===
              "table" ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-orange-50/50">
                      <tr className="text-xs font-black uppercase tracking-[0.08em] text-zinc-500">
                        <th className="px-5 py-4">
                          Catégorie
                        </th>

                        <th className="px-5 py-4">
                          Slug
                        </th>

                        <th className="px-5 py-4">
                          Description
                        </th>

                        <th className="px-5 py-4">
                          Articles
                        </th>

                        <th className="px-5 py-4">
                          Statut
                        </th>

                        <th className="px-5 py-4 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedItems.map(
                        (category) => (
                          <CategoryTableRow
                            key={
                              category.id
                            }
                            category={
                              category
                            }
                            deleting={
                              deletingId ===
                              category.id
                            }
                            onPreview={() =>
                              setPreviewCategory(
                                category,
                              )
                            }
                            onEdit={() =>
                              openEditModal(
                                category,
                              )
                            }
                            onDelete={() =>
                              setCategoryToDelete(
                                category,
                              )
                            }
                          />
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid items-stretch gap-5 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {paginatedItems.map(
                    (category) => (
                      <CategoryMobileCard
                        key={category.id}
                        category={
                          category
                        }
                        deleting={
                          deletingId ===
                          category.id
                        }
                        onPreview={() =>
                          setPreviewCategory(
                            category,
                          )
                        }
                        onEdit={() =>
                          openEditModal(
                            category,
                          )
                        }
                        onDelete={() =>
                          setCategoryToDelete(
                            category,
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
        <CategoryModal
          editing={editing}
          saving={saving}
          error={error}
          imagePreview={
            categoryImagePreview
          }
          onImageChange={
            handleCategoryImageChange
          }
          onRemoveImage={
            removeCategoryImage
          }
          onClose={closeModal}
          onSubmit={submit}
        />
      )}

      {previewCategory && (
        <CategoryPreviewModal
          category={
            previewCategory
          }
          onClose={() =>
            setPreviewCategory(
              null,
            )
          }
          onEdit={() => {
            const category =
              previewCategory;

            setPreviewCategory(
              null,
            );

            openEditModal(
              category,
            );
          }}
        />
      )}

      {categoryToDelete && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer la confirmation de suppression"
            onClick={() => {
              if (
                deletingId === null
              ) {
                setCategoryToDelete(
                  null,
                );
              }
            }}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
            <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-600 to-rose-700 px-6 py-6 text-white sm:px-7">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-black/10" />

              <div className="relative flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/20 backdrop-blur">
                  <Trash2 className="h-7 w-7" />
                </span>

                <div className="min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-red-100">
                    Confirmation
                  </span>

                  <h2 className="mt-1 text-xl font-black sm:text-2xl">
                    Supprimer cette catégorie ?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-red-100">
                    Cette action est définitive et ne pourra pas être annulée.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center gap-4">
                  <CategoryImage
                    category={
                      categoryToDelete
                    }
                    className="h-14 w-14"
                  />

                  <div className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
                      Catégorie concernée
                    </span>

                    <strong className="mt-1 block truncate text-base font-black text-zinc-950">
                      {
                        categoryToDelete.name
                      }
                    </strong>

                    <span className="mt-1 block truncate text-xs font-semibold text-zinc-500">
                      /{
                        categoryToDelete.slug
                      }
                    </span>
                  </div>
                </div>
              </div>

              {Number(
                categoryToDelete.article_count ||
                  0,
              ) > 0 ? (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />

                  <div>
                    <strong className="font-black">
                      Attention
                    </strong>

                    <p className="mt-1 leading-6">
                      Cette catégorie contient{" "}
                      <strong>
                        {
                          categoryToDelete.article_count
                        }{" "}
                        article
                        {Number(
                          categoryToDelete.article_count,
                        ) > 1
                          ? "s"
                          : ""}
                      </strong>
                      . Le serveur peut refuser sa suppression tant qu’elle est utilisée.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                  <p className="leading-6">
                    Vérifiez bien la catégorie avant de confirmer la suppression.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 bg-zinc-50 p-4 sm:p-5">
              <button
                type="button"
                disabled={
                  deletingId !== null
                }
                onClick={() =>
                  setCategoryToDelete(
                    null,
                  )
                }
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-black text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={
                  deletingId !== null
                }
                onClick={
                  confirmRemove
                }
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId !==
                null ? (
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
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClassName}`}
      >
        <Icon className="h-6 w-6" />
      </span>

      <strong className="mt-5 block text-3xl font-black text-zinc-950">
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

interface CategoryRowProps {
  category: Category;
  deleting: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function CategoryTableRow({
  category,
  deleting,
  onPreview,
  onEdit,
  onDelete,
}: CategoryRowProps) {
  const active =
    isCategoryActive(
      category,
    );

  return (
    <tr className="border-b border-zinc-100 transition last:border-b-0 hover:bg-orange-50/40">
      <td className="px-5 py-4">
        <div className="flex min-w-[240px] items-center gap-4">
          <CategoryImage
            category={category}
            className="h-14 w-14"
          />

          <div className="min-w-0">
            <strong className="block truncate text-sm font-black text-zinc-950">
              {category.name}
            </strong>

            <span className="mt-1 block text-xs text-zinc-400">
              ID #{category.id}
            </span>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <code className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600">
          {category.slug}
        </code>
      </td>

      <td className="max-w-[320px] px-5 py-4">
        <p className="line-clamp-2 text-sm leading-6 text-zinc-500">
          {category.description ||
            "Aucune description"}
        </p>
      </td>

      <td className="px-5 py-4">
        <span className="inline-flex min-w-24 items-center justify-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700 ring-1 ring-inset ring-orange-200">
          <Boxes className="h-4 w-4" />
          {Number(
            category.article_count ||
              0,
          )}{" "}
          article
          {Number(
            category.article_count ||
              0,
          ) > 1
            ? "s"
            : ""}
        </span>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1 ring-inset ${
            active
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-zinc-100 text-zinc-600 ring-zinc-200"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              active
                ? "bg-emerald-500"
                : "bg-zinc-400"
            }`}
          />

          {active
            ? "Active"
            : "Inactive"}
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

function CategoryMobileCard({
  category,
  deleting,
  onPreview,
  onEdit,
  onDelete,
}: CategoryRowProps) {
  const active =
    isCategoryActive(
      category,
    );

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-orange-200 hover:shadow-[0_22px_55px_rgba(24,24,27,0.12)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-orange-50 via-white to-zinc-100">
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-orange-300">
            <span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-white shadow-sm ring-1 ring-zinc-200">
              <FolderTree className="h-10 w-10" />
            </span>

            <span className="mt-3 text-xs font-black text-zinc-400">
              Aucune image
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/15 via-transparent to-transparent" />

        <span
          className={`absolute right-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black shadow-sm ring-1 ring-inset ${
            active
              ? "bg-emerald-50/95 text-emerald-700 ring-emerald-200"
              : "bg-zinc-100/95 text-zinc-600 ring-zinc-200"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              active
                ? "bg-emerald-500"
                : "bg-zinc-400"
            }`}
          />

          {active
            ? "Active"
            : "Inactive"}
        </span>

        <button
          type="button"
          onClick={onPreview}
          title="Voir"
          aria-label={`Voir ${category.name}`}
          className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-xl transition hover:scale-105 hover:bg-orange-500"
        >
          <Eye className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-orange-400">
          Catégorie #{category.id}
        </span>

        <h3 className="mt-2 line-clamp-2 min-h-14 text-lg font-black leading-7 text-zinc-950 transition-colors group-hover:text-orange-600">
          {category.name}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="inline-flex w-fit max-w-full truncate rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[10px] font-bold text-zinc-500">
            {category.slug}
          </code>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1.5 text-[10px] font-black text-orange-700 ring-1 ring-inset ring-orange-200">
            <Boxes className="h-3.5 w-3.5" />
            {Number(
              category.article_count ||
                0,
            )}{" "}
            article
            {Number(
              category.article_count ||
                0,
            ) > 1
              ? "s"
              : ""}
          </span>
        </div>

        <p className="mt-4 line-clamp-3 min-h-[72px] text-sm leading-6 text-zinc-500">
          {category.description ||
            "Aucune description disponible pour cette catégorie."}
        </p>

        <div className="mt-auto pt-5">
          <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 pt-4">
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
        </div>
      </div>

      <span className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500 group-hover:w-full" />
    </article>
  );
}

interface CategoryImageProps {
  category: Category;
  className: string;
}

function CategoryImage({
  category,
  className,
}: CategoryImageProps) {
  const [
    imageError,
    setImageError,
  ] = useState(false);

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-orange-50 to-zinc-100 ${className}`}
    >
      {category.image &&
      !imageError ? (
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          decoding="async"
          onError={() =>
            setImageError(true)
          }
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-orange-400">
          <FolderTree className="h-7 w-7" />
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

interface CategoryModalProps {
  editing: Category | null;
  saving: boolean;
  error: string;
  imagePreview: string;
  onImageChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onRemoveImage: () => void;
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
}

function CategoryModal({
  editing,
  saving,
  error,
  imagePreview,
  onImageChange,
  onRemoveImage,
  onClose,
  onSubmit,
}: CategoryModalProps) {
  const [
    liveName,
    setLiveName,
  ] = useState(
    editing?.name || "",
  );

  const [
    liveSlug,
    setLiveSlug,
  ] = useState(
    editing?.slug || "",
  );

  const [
    manualSlug,
    setManualSlug,
  ] = useState(
    Boolean(
      editing?.slug,
    ),
  );

  function handleNameChange(
    value: string,
  ) {
    setLiveName(value);

    if (!manualSlug) {
      setLiveSlug(
        createSlug(value),
      );
    }
  }

  function handleSlugChange(
    value: string,
  ) {
    setManualSlug(true);
    setLiveSlug(
      createSlug(value),
    );
  }

  return (
    <div className="fixed inset-0 z-[130] overflow-y-auto bg-zinc-950/65 p-4 backdrop-blur-md">
      <form
        onSubmit={onSubmit}
        className="mx-auto my-6 w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl"
      >
        <div className="relative flex items-start justify-between gap-4 overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900 to-orange-950 px-5 py-6 text-white sm:px-7">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.16em] text-orange-400">
              Catalogue
            </span>

            <h2 className="mt-2 text-2xl font-black text-white">
              {editing
                ? "Modifier la catégorie"
                : "Ajouter une catégorie"}
            </h2>

            <p className="mt-1 text-sm text-zinc-300">
              Définissez son nom, son adresse et sa visibilité.
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

        <div className="space-y-5 px-5 py-6 sm:px-7">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          <label className="block text-sm font-black text-zinc-700">
            Nom de la catégorie

            <input
              name="name"
              required
              value={liveName}
              onChange={(event) =>
                handleNameChange(
                  event.target
                    .value,
                )
              }
              placeholder="Ex. Outillage"
              className="mt-2 h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none transition transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
            />
          </label>

          <label className="block text-sm font-black text-zinc-700">
            Slug

            <input
              name="slug"
              value={liveSlug}
              onChange={(event) =>
                handleSlugChange(
                  event.target
                    .value,
                )
              }
              placeholder="outillage"
              className="mt-2 h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none transition transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
            />

            <span className="mt-2 block text-xs font-normal text-zinc-400">
              Utilisé dans les liens du catalogue.
            </span>
          </label>

          <div>
            <span className="block text-sm font-black text-zinc-700">
              Photo de la catégorie
            </span>

            <div className="mt-2 grid gap-4 sm:grid-cols-[1fr_170px]">
              <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-5 text-center transition hover:border-orange-300 hover:bg-orange-50/40">
                <ImagePlus className="h-8 w-8 text-orange-500" />

                <strong className="mt-3 text-sm text-zinc-800">
                  Choisir une photo
                </strong>

                <span className="mt-1 text-xs text-zinc-400">
                  JPG, PNG ou WEBP · 5 Mo maximum
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    onImageChange
                  }
                  className="hidden"
                />
              </label>

              <div className="relative min-h-36 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Aperçu catégorie"
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={
                        onRemoveImage
                      }
                      aria-label="Supprimer la photo"
                      className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:scale-110 hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full min-h-36 flex-col items-center justify-center text-zinc-300">
                    <ImagePlus className="h-9 w-9" />
                    <span className="mt-2 text-xs font-bold">
                      Aucun aperçu
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <label className="block text-sm font-black text-zinc-700">
            Description

            <textarea
              name="description"
              defaultValue={
                editing?.description ||
                ""
              }
              placeholder="Décrivez les produits contenus dans cette catégorie..."
              className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-zinc-200 p-4 text-sm outline-none transition transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div>
              <strong className="block text-sm font-black text-zinc-800">
                Catégorie active
              </strong>

              <span className="mt-1 block text-xs text-zinc-500">
                Visible dans le catalogue public.
              </span>
            </div>

            <input
              name="is_active"
              type="checkbox"
              value="1"
              defaultChecked={
                editing
                  ? isCategoryActive(
                      editing,
                    )
                  : true
              }
              className="h-5 w-5 accent-orange-500"
            />
          </label>
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
                <CheckCircle2 className="h-5 w-5" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

interface CategoryPreviewModalProps {
  category: Category;
  onClose: () => void;
  onEdit: () => void;
}

function CategoryPreviewModal({
  category,
  onClose,
  onEdit,
}: CategoryPreviewModalProps) {
  const active =
    isCategoryActive(
      category,
    );

  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-zinc-950/65 p-4 backdrop-blur-md">
      <div className="mx-auto my-8 w-full max-w-xl overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl">
        <div className="relative flex min-h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 p-8">
          {category.image ? (
            <img
              src={category.image}
              alt={category.name}
              className="absolute inset-0 h-full w-full object-cover opacity-35"
            />
          ) : null}

          <div className="absolute inset-0 bg-zinc-950/25" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow backdrop-blur"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative z-10 text-center text-white">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 backdrop-blur">
              <FolderTree className="h-10 w-10" />
            </span>

            <h2 className="mt-5 text-3xl font-black">
              {category.name}
            </h2>

            <code className="mt-3 inline-flex rounded-full bg-zinc-950/35 px-4 py-2 text-xs font-bold">
              {category.slug}
            </code>
          </div>
        </div>

        <div className="p-6">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1 ring-inset ${
              active
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-zinc-100 text-zinc-600 ring-zinc-200"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                active
                  ? "bg-emerald-500"
                  : "bg-zinc-400"
              }`}
            />

            {active
              ? "Catégorie active"
              : "Catégorie inactive"}
          </span>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
              <Boxes className="h-5 w-5" />
            </span>

            <div>
              <strong className="block text-lg font-black text-zinc-950">
                {Number(
                  category.article_count ||
                    0,
                )}{" "}
                article
                {Number(
                  category.article_count ||
                    0,
                ) > 1
                  ? "s"
                  : ""}
              </strong>

              <span className="text-xs font-semibold text-zinc-500">
                Relié(s) à cette catégorie
              </span>
            </div>
          </div>

          <p className="mt-5 text-sm leading-7 text-zinc-600">
            {category.description ||
              "Aucune description disponible pour cette catégorie."}
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
              Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
