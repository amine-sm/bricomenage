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
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  LayoutGrid,
  List,
  LoaderCircle,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import {
  adminHeaders,
  apiFetch,
} from "@/lib/api";

type Supplier = {
  id: number;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  wilaya?: string;
  address?: string;
  nif?: string;
  nis?: string;
  registre_commerce?: string;
  is_active?: number | boolean;
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
  | "name-desc"
  | "wilaya-asc";

const PAGE_SIZE_OPTIONS = [
  6,
  12,
  24,
  48,
];

function isSupplierActive(
  supplier: Supplier,
) {
  return (
    supplier.is_active ===
      undefined ||
    supplier.is_active === true ||
    Number(
      supplier.is_active,
    ) === 1
  );
}

export default function SuppliersPage() {
  const [
    items,
    setItems,
  ] = useState<Supplier[]>([]);

  const [
    editing,
    setEditing,
  ] = useState<Supplier | null>(
    null,
  );

  const [
    previewSupplier,
    setPreviewSupplier,
  ] = useState<Supplier | null>(
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
    supplierToDelete,
    setSupplierToDelete,
  ] = useState<Supplier | null>(
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
    wilayaFilter,
    setWilayaFilter,
  ] = useState("all");

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
  ] = useState(12);

  const [
    viewMode,
    setViewMode,
  ] = useState<ViewMode>("table");

  const load = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await apiFetch<{
            suppliers:
              Supplier[];
          }>("/admin/suppliers", {
            headers:
              adminHeaders(),
          });

        setItems(
          response.suppliers ||
            [],
        );
      } catch (requestError) {
        setError(
          requestError instanceof
            Error
            ? requestError.message
            : "Impossible de charger les fournisseurs.",
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
    wilayaFilter,
    statusFilter,
    sortBy,
    pageSize,
  ]);

  useEffect(() => {
    /*
     * Toujours afficher le tableau au premier chargement.
     * Cela évite qu'une ancienne valeur "cards" enregistrée
     * dans localStorage remplace le mode par défaut.
     */
    setViewMode("table");

    window.localStorage.setItem(
      "admin-suppliers-view",
      "table",
    );
  }, []);

  function changeViewMode(
    mode: ViewMode,
  ) {
    setViewMode(mode);

    window.localStorage.setItem(
      "admin-suppliers-view",
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

  const wilayas = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map(
              (supplier) =>
                supplier.wilaya?.trim(),
            )
            .filter(
              (
                value,
              ): value is string =>
                Boolean(value),
            ),
        ),
      ).sort((a, b) =>
        a.localeCompare(b, "fr"),
      ),
    [items],
  );

  const stats = useMemo(() => {
    const total =
      items.length;

    const active =
      items.filter(
        isSupplierActive,
      ).length;

    const withPhone =
      items.filter(
        (supplier) =>
          Boolean(
            supplier.phone?.trim(),
          ),
      ).length;

    const withEmail =
      items.filter(
        (supplier) =>
          Boolean(
            supplier.email?.trim(),
          ),
      ).length;

    return {
      total,
      active,
      withPhone,
      withEmail,
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
          (supplier) => {
            const matchesQuery =
              !normalizedQuery ||
              [
                supplier.name,
                supplier.contact_name,
                supplier.phone,
                supplier.email,
                supplier.wilaya,
                supplier.address,
                supplier.nif,
                supplier.nis,
                supplier.registre_commerce,
              ]
                .filter(Boolean)
                .some((value) =>
                  String(value)
                    .toLowerCase()
                    .includes(
                      normalizedQuery,
                    ),
                );

            const matchesWilaya =
              wilayaFilter ===
                "all" ||
              supplier.wilaya ===
                wilayaFilter;

            const active =
              isSupplierActive(
                supplier,
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
              matchesWilaya &&
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

            case "wilaya-asc":
              return String(
                a.wilaya || "",
              ).localeCompare(
                String(
                  b.wilaya || "",
                ),
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
      wilayaFilter,
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
    setError("");
    setModalOpen(true);
  }

  function openEditModal(
    supplier: Supplier,
  ) {
    setEditing(supplier);
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditing(null);
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

      const body = {
        name: String(
          form.get("name") ||
            "",
        ).trim(),

        contact_name: String(
          form.get(
            "contact_name",
          ) || "",
        ).trim(),

        phone: String(
          form.get("phone") ||
            "",
        ).trim(),

        email: String(
          form.get("email") ||
            "",
        ).trim(),

        wilaya: String(
          form.get("wilaya") ||
            "",
        ).trim(),

        address: String(
          form.get("address") ||
            "",
        ).trim(),

        nif: String(
          form.get("nif") ||
            "",
        ).trim(),

        nis: String(
          form.get("nis") ||
            "",
        ).trim(),

        registre_commerce:
          String(
            form.get(
              "registre_commerce",
            ) || "",
          ).trim(),

        is_active:
          form.get(
            "is_active",
          ) === "1",
      };

      await apiFetch(
        editing
          ? `/admin/suppliers/${editing.id}`
          : "/admin/suppliers",
        {
          method: editing
            ? "PUT"
            : "POST",

          headers: {
            ...adminHeaders(),
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            body,
          ),
        },
      );

      setSuccess(
        editing
          ? "Fournisseur modifié avec succès."
          : "Fournisseur ajouté avec succès.",
      );

      closeModal();

      await load();
    } catch (requestError) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Impossible d’enregistrer le fournisseur.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmRemove() {
    if (!supplierToDelete) {
      return;
    }

    const supplier =
      supplierToDelete;

    setDeletingId(
      supplier.id,
    );

    setError("");
    setSuccess("");

    try {
      await apiFetch(
        `/admin/suppliers/${supplier.id}`,
        {
          method: "DELETE",
          headers:
            adminHeaders(),
        },
      );

      setSuccess(
        `Le fournisseur « ${supplier.name} » a été supprimé avec succès.`,
      );

      setSupplierToDelete(
        null,
      );

      await load();
    } catch (requestError) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Impossible de supprimer le fournisseur.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function resetFilters() {
    setQuery("");
    setWilayaFilter("all");
    setStatusFilter("all");
    setSortBy("newest");
  }

  return (
    <>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[30px] border border-zinc-200 bg-gradient-to-br from-white via-white to-orange-50/60 p-6 shadow-sm sm:p-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-orange-600 shadow-sm">
              <Truck className="h-4 w-4" />
              Gestion des partenaires
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Fournisseurs
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
              Centralisez les coordonnées, informations fiscales et contacts de vos partenaires.
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
              Ajouter un fournisseur
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
            icon={Building2}
            label="Fournisseurs"
            value={String(
              stats.total,
            )}
            description="Partenaires enregistrés"
            iconClassName="bg-orange-50 text-orange-600"
          />

          <StatCard
            icon={
              CheckCircle2
            }
            label="Actifs"
            value={String(
              stats.active,
            )}
            description="Disponibles pour les achats"
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            icon={Phone}
            label="Avec téléphone"
            value={String(
              stats.withPhone,
            )}
            description="Contacts téléphoniques"
            iconClassName="bg-blue-50 text-blue-600"
          />

          <StatCard
            icon={Mail}
            label="Avec e-mail"
            value={String(
              stats.withEmail,
            )}
            description="Contacts par messagerie"
            iconClassName="bg-violet-50 text-violet-600"
          />
        </section>

        <section className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-gradient-to-br from-white to-orange-50/20 p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_210px_210px_210px]">
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
                placeholder="Rechercher un fournisseur, contact, téléphone..."
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
                wilayaFilter
              }
              onChange={
                setWilayaFilter
              }
              ariaLabel="Filtrer par wilaya"
            >
              <option value="all">
                Toutes les wilayas
              </option>

              {wilayas.map(
                (wilaya) => (
                  <option
                    key={wilaya}
                    value={wilaya}
                  >
                    {wilaya}
                  </option>
                ),
              )}
            </FilterSelect>

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
                Actifs
              </option>

              <option value="inactive">
                Inactifs
              </option>
            </FilterSelect>

            <FilterSelect
              value={sortBy}
              onChange={(value) =>
                setSortBy(
                  value as SortOption,
                )
              }
              ariaLabel="Trier les fournisseurs"
            >
              <option value="newest">
                Plus récents
              </option>

              <option value="oldest">
                Plus anciens
              </option>

              <option value="name-asc">
                Nom A à Z
              </option>

              <option value="name-desc">
                Nom Z à A
              </option>

              <option value="wilaya-asc">
                Wilaya A à Z
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

        {loading ? (
          <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-zinc-200 bg-white shadow-sm">
            <LoaderCircle className="h-10 w-10 animate-spin text-orange-500" />

            <p className="mt-4 font-semibold text-zinc-500">
              Chargement des fournisseurs...
            </p>
          </section>
        ) : paginatedItems.length ===
          0 ? (
          <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-zinc-200 bg-white px-6 text-center shadow-sm">
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-orange-400">
              <Building2 className="h-10 w-10" />
            </span>

            <h2 className="mt-5 text-xl font-black text-zinc-950">
              Aucun fournisseur trouvé
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Modifiez les filtres ou ajoutez votre premier partenaire.
            </p>

            <button
              type="button"
              onClick={
                openCreateModal
              }
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white"
            >
              <Plus className="h-4 w-4" />
              Ajouter un fournisseur
            </button>
          </section>
        ) : (
          <>
            {viewMode ===
            "cards" ? (
              <section className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {paginatedItems.map(
                  (supplier) => (
                    <SupplierCard
                      key={supplier.id}
                      supplier={
                        supplier
                      }
                      deleting={
                        deletingId ===
                        supplier.id
                      }
                      onPreview={() =>
                        setPreviewSupplier(
                          supplier,
                        )
                      }
                      onEdit={() =>
                        openEditModal(
                          supplier,
                        )
                      }
                      onDelete={() =>
                        setSupplierToDelete(
                          supplier,
                        )
                      }
                    />
                  ),
                )}
              </section>
            ) : (
              <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] text-left text-sm">
                    <thead className="border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-orange-50/50">
                      <tr className="text-xs font-black uppercase tracking-[0.08em] text-zinc-500">
                        <th className="px-5 py-4">
                          Fournisseur
                        </th>

                        <th className="px-5 py-4">
                          Contact
                        </th>

                        <th className="px-5 py-4">
                          Téléphone
                        </th>

                        <th className="px-5 py-4">
                          E-mail
                        </th>

                        <th className="px-5 py-4">
                          Wilaya
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
                        (supplier) => (
                          <SupplierTableRow
                            key={
                              supplier.id
                            }
                            supplier={
                              supplier
                            }
                            deleting={
                              deletingId ===
                              supplier.id
                            }
                            onPreview={() =>
                              setPreviewSupplier(
                                supplier,
                              )
                            }
                            onEdit={() =>
                              openEditModal(
                                supplier,
                              )
                            }
                            onDelete={() =>
                              setSupplierToDelete(
                                supplier,
                              )
                            }
                          />
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
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
            </section>
          </>
        )}
      </div>

      {modalOpen && (
        <SupplierModal
          editing={editing}
          saving={saving}
          error={error}
          onClose={closeModal}
          onSubmit={submit}
        />
      )}

      {previewSupplier && (
        <SupplierPreviewModal
          supplier={
            previewSupplier
          }
          onClose={() =>
            setPreviewSupplier(
              null,
            )
          }
          onEdit={() => {
            const supplier =
              previewSupplier;

            setPreviewSupplier(
              null,
            );

            openEditModal(
              supplier,
            );
          }}
        />
      )}

      {supplierToDelete && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer la confirmation de suppression"
            onClick={() => {
              if (
                deletingId === null
              ) {
                setSupplierToDelete(
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
                    Supprimer ce fournisseur ?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-red-100">
                    Cette action peut être définitive selon son utilisation dans les articles.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 ring-1 ring-orange-100">
                    <Building2 className="h-7 w-7" />
                  </span>

                  <div className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
                      Fournisseur concerné
                    </span>

                    <strong className="mt-1 block truncate text-base font-black text-zinc-950">
                      {
                        supplierToDelete.name
                      }
                    </strong>

                    <span className="mt-1 block truncate text-xs font-semibold text-zinc-500">
                      {
                        supplierToDelete.contact_name ||
                        supplierToDelete.wilaya ||
                        `ID #${supplierToDelete.id}`
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-100 bg-white p-3.5 shadow-sm">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Téléphone
                  </span>

                  <strong className="mt-1 block truncate text-sm text-zinc-700">
                    {
                      supplierToDelete.phone ||
                      "Non renseigné"
                    }
                  </strong>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-white p-3.5 shadow-sm">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Wilaya
                  </span>

                  <strong className="mt-1 block truncate text-sm text-zinc-700">
                    {
                      supplierToDelete.wilaya ||
                      "Non renseignée"
                    }
                  </strong>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />

                <div>
                  <strong className="font-black">
                    Attention
                  </strong>

                  <p className="mt-1 leading-6">
                    Si ce fournisseur est déjà relié à des articles, le serveur peut le désactiver au lieu de le supprimer définitivement afin de conserver l’historique.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 bg-zinc-50 p-4 sm:p-5">
              <button
                type="button"
                disabled={
                  deletingId !== null
                }
                onClick={() =>
                  setSupplierToDelete(
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

interface SupplierCardProps {
  supplier: Supplier;
  deleting: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SupplierCard({
  supplier,
  deleting,
  onPreview,
  onEdit,
  onDelete,
}: SupplierCardProps) {
  const active =
    isSupplierActive(
      supplier,
    );

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-orange-200 hover:shadow-[0_22px_55px_rgba(24,24,27,0.12)]">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-zinc-100">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-200/50 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-zinc-200/60 blur-3xl" />

        <div className="relative flex h-28 w-28 items-center justify-center rounded-[32px] bg-white text-orange-500 shadow-xl ring-1 ring-zinc-200 transition duration-500 group-hover:scale-105 group-hover:rotate-2">
          <Building2 className="h-14 w-14" />
        </div>

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
            ? "Actif"
            : "Inactif"}
        </span>

        <button
          type="button"
          onClick={onPreview}
          title="Voir"
          aria-label={`Voir ${supplier.name}`}
          className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-xl transition hover:scale-105 hover:bg-orange-500"
        >
          <Eye className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-400">
          Fournisseur #{supplier.id}
        </span>

        <h2 className="mt-2 line-clamp-2 min-h-14 text-lg font-black leading-7 text-zinc-950 transition-colors group-hover:text-orange-600">
          {supplier.name}
        </h2>

        <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
          <UserRound className="h-4 w-4 shrink-0 text-orange-500" />
          <span className="truncate">
            {supplier.contact_name ||
              "Aucun contact principal"}
          </span>
        </p>

        <div className="mt-5 space-y-3">
          <InfoLine
            icon={Phone}
            label="Téléphone"
            value={
              supplier.phone ||
              "Non renseigné"
            }
          />

          <InfoLine
            icon={Mail}
            label="E-mail"
            value={
              supplier.email ||
              "Non renseigné"
            }
          />

          <InfoLine
            icon={MapPin}
            label="Wilaya"
            value={
              supplier.wilaya ||
              "Non renseignée"
            }
          />
        </div>

        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-zinc-100 pt-4">
          <CardActionButton
            label="Voir"
            icon={Eye}
            className="border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
            onClick={onPreview}
          />

          <CardActionButton
            label="Modifier"
            icon={Pencil}
            className="border border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-600 hover:bg-blue-600 hover:text-white"
            onClick={onEdit}
          />

          <CardActionButton
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

      <span className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500 group-hover:w-full" />
    </article>
  );
}

function InfoLine({
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
    <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">
          {label}
        </span>

        <strong className="mt-1 block truncate text-sm text-zinc-700">
          {value}
        </strong>
      </div>
    </div>
  );
}

interface CardActionButtonProps {
  label: string;
  icon:
    React.ElementType;
  className: string;
  onClick: () => void;
  disabled?: boolean;
  spin?: boolean;
}

function CardActionButton({
  label,
  icon: Icon,
  className,
  onClick,
  disabled = false,
  spin = false,
}: CardActionButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-11 w-full items-center justify-center rounded-xl shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
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


function SupplierTableRow({
  supplier,
  deleting,
  onPreview,
  onEdit,
  onDelete,
}: SupplierCardProps) {
  const active =
    isSupplierActive(
      supplier,
    );

  return (
    <tr className="border-b border-zinc-100 transition last:border-b-0 hover:bg-orange-50/40">
      <td className="px-5 py-4">
        <div className="flex min-w-[240px] items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-400">
            <Building2 className="h-6 w-6" />
          </span>

          <div className="min-w-0">
            <strong className="block truncate font-black text-zinc-950">
              {supplier.name}
            </strong>

            <span className="mt-1 block text-xs text-zinc-400">
              Fournisseur #{supplier.id}
            </span>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="flex min-w-[180px] items-center gap-2 text-zinc-700">
          <UserRound className="h-4 w-4 text-orange-500" />
          {supplier.contact_name ||
            "Non renseigné"}
        </span>
      </td>

      <td className="px-5 py-4">
        <span className="whitespace-nowrap text-zinc-600">
          {supplier.phone ||
            "Non renseigné"}
        </span>
      </td>

      <td className="px-5 py-4">
        <span className="block max-w-[220px] truncate text-zinc-600">
          {supplier.email ||
            "Non renseigné"}
        </span>
      </td>

      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-2 whitespace-nowrap text-zinc-700">
          <MapPin className="h-4 w-4 text-orange-500" />
          {supplier.wilaya ||
            "Non renseignée"}
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
            ? "Actif"
            : "Inactif"}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            title="Voir"
            aria-label="Voir"
            onClick={onPreview}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition hover:bg-orange-500 hover:text-white"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            type="button"
            title="Modifier"
            aria-label="Modifier"
            onClick={onEdit}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            title="Supprimer"
            aria-label="Supprimer"
            onClick={onDelete}
            disabled={deleting}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
          >
            {deleting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
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
    <div className="flex flex-col justify-between gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
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

interface SupplierModalProps {
  editing: Supplier | null;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
}

function SupplierModal({
  editing,
  saving,
  error,
  onClose,
  onSubmit,
}: SupplierModalProps) {
  return (
    <div className="fixed inset-0 z-[130] overflow-y-auto bg-zinc-950/65 p-4 backdrop-blur-md">
      <form
        onSubmit={onSubmit}
        className="mx-auto my-6 w-full max-w-3xl overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl"
      >
        <div className="relative flex items-start justify-between gap-4 overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900 to-orange-950 px-5 py-6 text-white sm:px-7">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.16em] text-orange-400">
              Partenaires
            </span>

            <h2 className="mt-2 text-2xl font-black text-zinc-950">
              {editing
                ? "Modifier le fournisseur"
                : "Ajouter un fournisseur"}
            </h2>

            <p className="mt-1 text-sm text-zinc-300">
              Renseignez ses coordonnées et informations fiscales.
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
              name="name"
              label="Nom du fournisseur"
              value={editing?.name}
              placeholder="Ex. Matériel Pro SARL"
              required
            />

            <Field
              name="contact_name"
              label="Nom du contact"
              value={
                editing?.contact_name
              }
              placeholder="Ex. Ahmed Benali"
            />

            <Field
              name="phone"
              label="Téléphone"
              value={editing?.phone}
              type="tel"
              placeholder="0550 00 00 00"
            />

            <Field
              name="email"
              label="E-mail"
              value={editing?.email}
              type="email"
              placeholder="contact@fournisseur.dz"
            />

            <Field
              name="wilaya"
              label="Wilaya"
              value={editing?.wilaya}
              placeholder="Ex. Oran"
            />

            <Field
              name="registre_commerce"
              label="Registre de commerce"
              value={
                editing?.registre_commerce
              }
              placeholder="N° RC"
            />

            <Field
              name="nif"
              label="NIF"
              value={editing?.nif}
              placeholder="Numéro d’identification fiscale"
            />

            <Field
              name="nis"
              label="NIS"
              value={editing?.nis}
              placeholder="Numéro d’identification statistique"
            />

            <label className="sm:col-span-2 block text-sm font-black text-zinc-700">
              Adresse

              <textarea
                name="address"
                defaultValue={
                  editing?.address ||
                  ""
                }
                placeholder="Adresse complète du fournisseur..."
                className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-zinc-200 p-4 text-sm outline-none transition transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
              />
            </label>

            <label className="sm:col-span-2 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div>
                <strong className="block text-sm font-black text-zinc-800">
                  Fournisseur actif
                </strong>

                <span className="mt-1 block text-xs text-zinc-500">
                  Disponible dans les formulaires d’achat et d’article.
                </span>
              </div>

              <input
                name="is_active"
                type="checkbox"
                value="1"
                defaultChecked={
                  editing
                    ? isSupplierActive(
                        editing,
                      )
                    : true
                }
                className="h-5 w-5 accent-orange-500"
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

interface FieldProps {
  name: string;
  label: string;
  value?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

function Field({
  name,
  label,
  value,
  type = "text",
  required = false,
  placeholder,
}: FieldProps) {
  return (
    <label className="block text-sm font-black text-zinc-700">
      {label}

      <input
        name={name}
        type={type}
        required={required}
        defaultValue={
          value || ""
        }
        placeholder={
          placeholder
        }
        className="mt-2 h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none transition transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
      />
    </label>
  );
}

interface SupplierPreviewModalProps {
  supplier: Supplier;
  onClose: () => void;
  onEdit: () => void;
}

function SupplierPreviewModal({
  supplier,
  onClose,
  onEdit,
}: SupplierPreviewModalProps) {
  const active =
    isSupplierActive(
      supplier,
    );

  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-zinc-950/65 p-4 backdrop-blur-md">
      <div className="mx-auto my-8 w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-orange-950 p-7 text-white">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative">
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500 shadow-xl shadow-orange-500/20">
              <Building2 className="h-10 w-10" />
            </span>

            <span
              className={`mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${
                active
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-white/10 text-zinc-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  active
                    ? "bg-emerald-400"
                    : "bg-zinc-400"
                }`}
              />

              {active
                ? "Fournisseur actif"
                : "Fournisseur inactif"}
            </span>

            <h2 className="mt-4 text-3xl font-black">
              {supplier.name}
            </h2>

            <p className="mt-2 flex items-center gap-2 text-zinc-300">
              <UserRound className="h-4 w-4 text-orange-400" />

              {supplier.contact_name ||
                "Aucun contact principal"}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <PreviewValue
              icon={Phone}
              label="Téléphone"
              value={
                supplier.phone ||
                "Non renseigné"
              }
            />

            <PreviewValue
              icon={Mail}
              label="E-mail"
              value={
                supplier.email ||
                "Non renseigné"
              }
            />

            <PreviewValue
              icon={MapPin}
              label="Wilaya"
              value={
                supplier.wilaya ||
                "Non renseignée"
              }
            />

            <PreviewValue
              icon={Building2}
              label="Adresse"
              value={
                supplier.address ||
                "Non renseignée"
              }
            />

            <PreviewValue
              icon={Building2}
              label="NIF"
              value={
                supplier.nif ||
                "Non renseigné"
              }
            />

            <PreviewValue
              icon={Building2}
              label="NIS"
              value={
                supplier.nis ||
                "Non renseigné"
              }
            />

            <div className="sm:col-span-2">
              <PreviewValue
                icon={Building2}
                label="Registre de commerce"
                value={
                  supplier.registre_commerce ||
                  "Non renseigné"
                }
              />
            </div>
          </div>

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

function PreviewValue({
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
    <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0">
        <span className="text-xs font-bold text-zinc-400">
          {label}
        </span>

        <strong className="mt-1 block break-words text-sm font-black text-zinc-800">
          {value}
        </strong>
      </div>
    </div>
  );
}
