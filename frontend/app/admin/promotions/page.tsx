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
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CirclePercent,
  Eye,
  LayoutGrid,
  List,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Tags,
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
  reference?: string;
  image?: string;
  price: number;
  old_price?: number;
  category?: string;
  stock_quantity?: number;
};

type PromotionArticle = {
  id: number;
  designation: string;
  reference?: string;
  image?: string;
  original_price: number;
  promotional_price: number;
};

type Promotion = {
  id: number;
  name: string;
  description?: string;
  discount_type: "PERCENT" | "FIXED";
  discount_value: number;
  starts_at?: string;
  ends_at?: string;
  is_active: number | boolean;
  is_effective_active?: number | boolean;
  article_count?: number;
  articles?: PromotionArticle[];
  created_at?: string;
};

type PromotionFormState = {
  id?: number;
  name: string;
  description: string;
  discount_type: "PERCENT" | "FIXED";
  discount_value: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  articleIds: number[];
};

const EMPTY_FORM: PromotionFormState = {
  name: "",
  description: "",
  discount_type: "PERCENT",
  discount_value: "",
  starts_at: "",
  ends_at: "",
  is_active: true,
  articleIds: [],
};

const PAGE_SIZE = 9;

type ViewMode = "cards" | "table";

function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-DZ").format(Number(value || 0));
}

function toLocalInputValue(
  value?: string,
) {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(" ", "T")
    .replace(/Z$/i, "")
    .slice(0, 16);
}

function systemDateTimeLocal() {
  const now =
    new Date();

  const local =
    new Date(
      now.getTime() -
        now.getTimezoneOffset() *
          60_000,
    );

  return local
    .toISOString()
    .slice(0, 16);
}

function toApiDateTime(
  value: string,
) {
  if (!value) {
    return null;
  }

  const normalized =
    value.replace("T", " ");

  return normalized.length === 16
    ? `${normalized}:00`
    : normalized.slice(0, 19);
}

function formatDate(value?: string) {
  if (!value) return "Sans limite";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isActivePromotion(
  promotion: Promotion,
) {
  if (
    promotion.is_effective_active !==
      undefined
  ) {
    return (
      promotion.is_effective_active ===
        true ||
      Number(
        promotion.is_effective_active,
      ) === 1
    );
  }

  return (
    promotion.is_active === true ||
    Number(
      promotion.is_active,
    ) === 1
  );
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [form, setForm] = useState<PromotionFormState>(EMPTY_FORM);
  const [modalOpen, setModalOpen] = useState(false);
  const [detail, setDetail] = useState<Promotion | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [
    promotionToDelete,
    setPromotionToDelete,
  ] = useState<Promotion | null>(
    null,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [query, setQuery] = useState("");
  const [articleQuery, setArticleQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [promotionResponse, articleResponse] = await Promise.all([
        apiFetch<{ promotions: Promotion[] }>("/admin/promotions", {
          headers: adminHeaders(),
        }),
        apiFetch<{ articles: Article[] }>("/admin/articles", {
          headers: adminHeaders(),
        }),
      ]);

      setPromotions(promotionResponse.promotions || []);
      setArticles(articleResponse.articles || []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de charger les promotions.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    /*
     * Le tableau est toujours l'affichage initial.
     * Une ancienne préférence "cards" ne doit pas remplacer ce choix.
     */
    setViewMode("table");

    window.localStorage.setItem(
      "admin-promotions-view",
      "table",
    );
  }, []);

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key !== "Escape") {
        return;
      }

      if (detail) {
        setDetail(null);
        return;
      }

      if (promotionToDelete) {
        setPromotionToDelete(null);
        return;
      }

      if (modalOpen && !saving) {
        closeModal();
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [
    detail,
    modalOpen,
    promotionToDelete,
    saving,
  ]);

  function changeViewMode(mode: ViewMode) {
    setViewMode(mode);

    window.localStorage.setItem(
      "admin-promotions-view",
      mode,
    );
  }

  const stats = useMemo(() => {
    const active = promotions.filter(isActivePromotion).length;
    const inactive = promotions.length - active;
    const linkedProducts = promotions.reduce(
      (sum, promotion) => sum + Number(promotion.article_count || 0),
      0,
    );

    return {
      total: promotions.length,
      active,
      inactive,
      linkedProducts,
    };
  }, [promotions]);

  const filteredPromotions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return promotions.filter((promotion) => {
      const matchesQuery =
        !normalizedQuery ||
        [promotion.name, promotion.description]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedQuery),
          );

      const active = isActivePromotion(promotion);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);

      return matchesQuery && matchesStatus;
    });
  }, [promotions, query, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPromotions.length / PAGE_SIZE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedPromotions = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredPromotions.slice(start, start + PAGE_SIZE);
  }, [filteredPromotions, safePage]);

  const filteredArticles = useMemo(() => {
    const normalized = articleQuery.trim().toLowerCase();

    if (!normalized) return articles;

    return articles.filter((article) =>
      [
        article.designation,
        article.reference,
        article.category,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [articles, articleQuery]);

  function calculatePromotionalPrice(article: Article) {
    const value = Number(form.discount_value || 0);
    const original = Number(article.price || 0);

    if (form.discount_type === "PERCENT") {
      return Math.max(0, original - (original * value) / 100);
    }

    return Math.max(0, original - value);
  }

  function openCreateModal() {
    setForm({
      ...EMPTY_FORM,

      /*
       * La date de début prend
       * automatiquement la date et
       * l'heure du système du PC.
       */
      starts_at:
        systemDateTimeLocal(),
    });

    setArticleQuery("");
    setError("");
    setModalOpen(true);
  }

  async function openEditModal(promotion: Promotion) {
    setError("");

    try {
      const response = await apiFetch<Promotion>(
        `/admin/promotions/${promotion.id}`,
        {
          headers: adminHeaders(),
        },
      );

      setForm({
        id: response.id,
        name: response.name || "",
        description: response.description || "",
        discount_type: response.discount_type,
        discount_value: String(response.discount_value ?? ""),
        starts_at: toLocalInputValue(response.starts_at),
        ends_at: toLocalInputValue(response.ends_at),
        is_active:
          response.is_active === true || Number(response.is_active) === 1,
        articleIds: (response.articles || []).map((article) => article.id),
      });

      setArticleQuery("");
      setModalOpen(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de charger la promotion.",
      );
    }
  }

  async function openDetail(promotion: Promotion) {
    setError("");

    try {
      const response = await apiFetch<Promotion>(
        `/admin/promotions/${promotion.id}`,
        {
          headers: adminHeaders(),
        },
      );

      setDetail(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de charger le détail.",
      );
    }
  }

  function closeModal(
    force = false,
  ) {
    if (saving && !force) {
      return;
    }

    setModalOpen(false);
    setForm(EMPTY_FORM);
    setArticleQuery("");
  }

  function toggleArticle(id: number) {
    setForm((current) => ({
      ...current,
      articleIds: current.articleIds.includes(id)
        ? current.articleIds.filter((articleId) => articleId !== id)
        : [...current.articleIds, id],
    }));
  }

  function selectAllVisibleArticles() {
    const visibleIds = filteredArticles.map((article) => article.id);

    setForm((current) => {
      const allSelected = visibleIds.every((id) =>
        current.articleIds.includes(id),
      );

      return {
        ...current,
        articleIds: allSelected
          ? current.articleIds.filter((id) => !visibleIds.includes(id))
          : Array.from(new Set([...current.articleIds, ...visibleIds])),
      };
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.articleIds.length === 0) {
      setError("Sélectionnez au moins un article pour cette promotion.");
      return;
    }

    const discount = Number(form.discount_value);

    if (!Number.isFinite(discount) || discount <= 0) {
      setError("La valeur de la réduction doit être supérieure à zéro.");
      return;
    }

    if (form.discount_type === "PERCENT" && discount > 100) {
      setError("Le pourcentage ne peut pas dépasser 100 %.");
      return;
    }

    if (
      form.starts_at &&
      form.ends_at &&
      new Date(form.ends_at).getTime() <= new Date(form.starts_at).getTime()
    ) {
      setError("La date de fin doit être postérieure à la date de début.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiFetch(
        form.id
          ? `/admin/promotions/${form.id}`
          : "/admin/promotions",
        {
          method: form.id ? "PUT" : "POST",
          headers: {
            ...adminHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
            discount_type: form.discount_type,
            discount_value: discount,
            starts_at:
              toApiDateTime(
                form.starts_at,
              ),
            ends_at:
              toApiDateTime(
                form.ends_at,
              ),
            is_active: form.is_active,
            articleIds: form.articleIds,
          }),
        },
      );

      setSuccess(
        form.id
          ? "Promotion modifiée avec succès."
          : "Promotion créée et appliquée aux articles sélectionnés.",
      );

      closeModal(true);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d’enregistrer la promotion.",
      );
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(
    promotion: Promotion,
  ) {
    setPromotionToDelete(
      promotion,
    );
  }

  async function confirmDelete() {
    if (!promotionToDelete) {
      return;
    }

    setDeletingId(
      promotionToDelete.id,
    );
    setError("");
    setSuccess("");

    try {
      await apiFetch(
        `/admin/promotions/${promotionToDelete.id}`,
        {
          method: "DELETE",
          headers:
            adminHeaders(),
        },
      );

      setSuccess(
        "Promotion supprimée avec succès.",
      );

      setPromotionToDelete(
        null,
      );

      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de supprimer la promotion.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[30px] border border-zinc-200 bg-gradient-to-br from-white via-white to-orange-50/60 p-6 shadow-sm sm:p-7">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-orange-300/35 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-orange-600">
                <CirclePercent className="h-4 w-4" />
                Gestion des campagnes
              </span>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
                Promotions
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                Gérez les réductions, les périodes d’activation et les produits concernés.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-black text-zinc-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Actualiser
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
            >
              <Plus className="h-5 w-5" />
              Nouvelle promotion
            </button>
            </div>
          </div>
        </section>

        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            {success}
          </div>
        )}

        {error && !modalOpen && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Tags}
            label="Promotions"
            value={String(stats.total)}
            description="Campagnes enregistrées"
            className="bg-orange-50 text-orange-600"
          />

          <StatCard
            icon={CheckCircle2}
            label="Actives"
            value={String(stats.active)}
            description="Actuellement applicables"
            className="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            icon={CalendarDays}
            label="Inactives"
            value={String(stats.inactive)}
            description="Expirées ou désactivées"
            className="bg-zinc-100 text-zinc-600"
          />

          <StatCard
            icon={Package}
            label="Produits liés"
            value={String(stats.linkedProducts)}
            description="Associations promotionnelles"
            className="bg-blue-50 text-blue-600"
          />
        </section>

        <section className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une promotion..."
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-10 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-orange-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | "active" | "inactive",
                )
              }
              className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>

            <div className="inline-flex h-12 items-center rounded-2xl border border-zinc-200 bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => changeViewMode("cards")}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black transition ${
                  viewMode === "cards"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Cartes
              </button>

              <button
                type="button"
                onClick={() => changeViewMode("table")}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black transition ${
                  viewMode === "table"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <List className="h-4 w-4" />
                Tableau
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-zinc-200 bg-white">
            <LoaderCircle className="h-10 w-10 animate-spin text-orange-500" />
            <p className="mt-4 font-semibold text-zinc-500">
              Chargement des promotions...
            </p>
          </section>
        ) : paginatedPromotions.length === 0 ? (
          <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-zinc-200 bg-white px-6 text-center">
            <CirclePercent className="h-14 w-14 text-orange-400" />
            <h2 className="mt-5 text-xl font-black">Aucune promotion</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Créez une promotion et associez-la à vos articles.
            </p>
          </section>
        ) : (
          <>
            {viewMode === "cards" ? (
              <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {paginatedPromotions.map((promotion) => {
                  const active = isActivePromotion(promotion);

                  return (
                    <article
                      key={promotion.id}
                      className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="relative bg-gradient-to-br from-zinc-950 to-zinc-800 p-6 text-white">
                        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />

                        <div className="relative flex items-start justify-between">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500">
                            <CirclePercent className="h-6 w-6" />
                          </span>

                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-black ${
                              active
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-white/10 text-zinc-300"
                            }`}
                          >
                            {active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <h2 className="relative mt-5 text-xl font-black">
                          {promotion.name}
                        </h2>

                        <strong className="relative mt-3 block text-4xl font-black text-orange-400">
                          {formatPrice(promotion.discount_value)}
                          {promotion.discount_type === "PERCENT" ? " %" : " DA"}
                        </strong>
                      </div>

                      <div className="p-5">
                        <p className="line-clamp-2 min-h-12 text-sm leading-6 text-zinc-500">
                          {promotion.description || "Aucune description."}
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                          <div className="rounded-2xl bg-zinc-50 p-3">
                            <span className="text-zinc-400">Produits</span>
                            <strong className="mt-1 block text-zinc-800">
                              {promotion.article_count || 0} article(s)
                            </strong>
                          </div>

                          <div className="rounded-2xl bg-zinc-50 p-3">
                            <span className="text-zinc-400">Fin</span>
                            <strong className="mt-1 block text-zinc-800">
                              {promotion.ends_at
                                ? formatDate(promotion.ends_at)
                                : "Sans limite"}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 bg-zinc-50 p-4">
                        <button
                          type="button"
                          onClick={() => openDetail(promotion)}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-zinc-700 transition hover:bg-zinc-950 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                          Voir
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(promotion)}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-50 text-xs font-black text-blue-700 transition hover:bg-blue-600 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </button>

                        <button
                          type="button"
                          onClick={() => requestDelete(promotion)}
                          disabled={deletingId === promotion.id}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-50 text-xs font-black text-red-700 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
                        >
                          {deletingId === promotion.id ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Supprimer
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            ) : (
            <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50/80">
                    <tr className="text-xs font-black uppercase tracking-[0.08em] text-zinc-500">
                      <th className="px-5 py-4">Promotion</th>
                      <th className="px-5 py-4">Réduction</th>
                      <th className="px-5 py-4">Produits</th>
                      <th className="px-5 py-4">Début</th>
                      <th className="px-5 py-4">Fin</th>
                      <th className="px-5 py-4">Statut</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedPromotions.map((promotion) => {
                      const active = isActivePromotion(promotion);

                      return (
                        <tr
                          key={promotion.id}
                          className="border-b border-zinc-100 transition last:border-b-0 hover:bg-orange-50/25"
                        >
                          <td className="px-5 py-4">
                            <div className="min-w-[260px]">
                              <strong className="block font-black text-zinc-950">
                                {promotion.name}
                              </strong>
                              <span className="mt-1 line-clamp-1 block text-xs text-zinc-400">
                                {promotion.description || "Aucune description."}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700">
                              {formatPrice(promotion.discount_value)}
                              {promotion.discount_type === "PERCENT" ? " %" : " DA"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                              {promotion.article_count || 0} article(s)
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-zinc-600">
                            {promotion.starts_at
                              ? formatDate(promotion.starts_at)
                              : "Immédiatement"}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-zinc-600">
                            {promotion.ends_at
                              ? formatDate(promotion.ends_at)
                              : "Sans limite"}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${
                                active
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              {active ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openDetail(promotion)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition hover:bg-orange-500 hover:text-white"
                                aria-label="Voir la promotion"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditModal(promotion)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white"
                                aria-label="Modifier la promotion"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => requestDelete(promotion)}
                                disabled={deletingId === promotion.id}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
                                aria-label="Supprimer la promotion"
                              >
                                {deletingId === promotion.id ? (
                                  <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            )}
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[120] overflow-y-auto bg-zinc-950/60 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <form
            onSubmit={submit}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            className="mx-auto my-4 w-full max-w-6xl overflow-hidden rounded-[30px] bg-white shadow-2xl"
          >
            <div className="relative flex items-start justify-between gap-4 overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900 to-orange-950 px-5 py-6 text-white sm:px-7">
              <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-orange-500/25 blur-3xl" />
              <div>
                <span className="relative text-xs font-black uppercase tracking-[0.16em] text-orange-400">
                  Promotion produits
                </span>

                <h2 className="relative mt-2 text-2xl font-black">
                  {form.id ? "Modifier la promotion" : "Nouvelle promotion"}
                </h2>

                <p className="relative mt-1 text-sm text-zinc-300">
                  Configurez la réduction puis choisissez les produits concernés.
                </p>
              </div>

              <button
                type="button"
                onClick={() => closeModal()}
                disabled={saving}
                aria-label="Fermer"
                className="relative z-30 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:scale-105 hover:bg-orange-500 active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid max-h-[75vh] overflow-y-auto lg:grid-cols-[390px_1fr]">
              <div className="border-b border-zinc-200 p-5 sm:p-7 lg:border-b-0 lg:border-r">
                {error && (
                  <div className="mb-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <Field
                    label="Nom"
                    required
                    value={form.name}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, name: value }))
                    }
                    placeholder="Ex. Promotion été"
                  />

                  <label className="block text-sm font-black text-zinc-700">
                    Type de réduction

                    <select
                      value={form.discount_type}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          discount_type: event.target.value as
                            | "PERCENT"
                            | "FIXED",
                        }))
                      }
                      className="mt-2 h-12 w-full rounded-xl border border-zinc-200 px-4 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                    >
                      <option value="PERCENT">Pourcentage (%)</option>
                      <option value="FIXED">Montant fixe (DA)</option>
                    </select>
                  </label>

                  <Field
                    label={
                      form.discount_type === "PERCENT"
                        ? "Pourcentage"
                        : "Montant à déduire"
                    }
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={form.discount_value}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        discount_value: value,
                      }))
                    }
                    placeholder={
                      form.discount_type === "PERCENT" ? "10" : "1000"
                    }
                  />

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <Field
                      label="Date de début"
                      type="datetime-local"
                      value={form.starts_at}
                      onChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          starts_at: value,
                        }))
                      }
                    />

                    <Field
                      label="Date de fin"
                      type="datetime-local"
                      value={form.ends_at}
                      onChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          ends_at: value,
                        }))
                      }
                    />
                  </div>

                  <label className="block text-sm font-black text-zinc-700">
                    Description

                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      className="mt-2 min-h-28 w-full rounded-2xl border border-zinc-200 p-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div>
                      <strong className="text-sm">Promotion active</strong>
                      <span className="mt-1 block text-xs text-zinc-500">
                        Elle sera appliquée pendant la période choisie.
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          is_active: event.target.checked,
                        }))
                      }
                      className="h-5 w-5 accent-orange-500"
                    />
                  </label>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-black">
                      Sélectionner les produits
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      {form.articleIds.length} produit(s) sélectionné(s)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={selectAllVisibleArticles}
                    className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-black text-zinc-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Tout sélectionner / retirer
                  </button>
                </div>

                <div className="relative mt-5">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

                  <input
                    value={articleQuery}
                    onChange={(event) => setArticleQuery(event.target.value)}
                    placeholder="Rechercher un produit..."
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-4 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredArticles.map((article) => {
                    const selected = form.articleIds.includes(article.id);
                    const promotionalPrice = calculatePromotionalPrice(article);

                    return (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => toggleArticle(article.id)}
                        className={`relative overflow-hidden rounded-2xl border p-3 text-left transition ${
                          selected
                            ? "border-orange-500 bg-orange-50 ring-2 ring-orange-500/15"
                            : "border-zinc-200 bg-white hover:border-orange-300"
                        }`}
                      >
                        <span
                          className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full ${
                            selected
                              ? "bg-orange-500 text-white"
                              : "bg-zinc-100 text-transparent"
                          }`}
                        >
                          <Check className="h-4 w-4" />
                        </span>

                        <div className="flex gap-3 pr-8">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                            {article.image ? (
                              <img
                                src={article.image}
                                alt={article.designation}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-6 w-6 text-zinc-300" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <strong className="line-clamp-2 text-sm text-zinc-900">
                              {article.designation}
                            </strong>

                            <span className="mt-1 block text-xs text-zinc-400">
                              {article.reference || article.category || "-"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-end justify-between gap-3 border-t border-zinc-100 pt-3">
                          <span className="text-xs text-zinc-400 line-through">
                            {formatPrice(article.price)} DA
                          </span>

                          <strong className="text-sm font-black text-orange-600">
                            {formatPrice(promotionalPrice)} DA
                          </strong>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={() => closeModal()}
                disabled={saving}
                className="min-h-12 rounded-2xl border border-zinc-200 bg-white px-6 text-sm font-black text-zinc-600"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-7 text-sm font-black text-white shadow-lg shadow-orange-500/20 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Enregistrer la promotion
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}


      {promotionToDelete && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-zinc-950/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPromotionToDelete(
                null,
              );
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="bg-gradient-to-r from-zinc-950 to-red-950 p-6 text-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500">
                <Trash2 className="h-6 w-6" />
              </span>

              <h2 className="mt-5 text-2xl font-black">
                Supprimer la promotion ?
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-300">
                La promotion «{" "}
                <strong className="text-white">
                  {promotionToDelete.name}
                </strong>
                {" "}» et ses associations aux articles seront supprimées.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setPromotionToDelete(
                    null,
                  )
                }
                disabled={
                  deletingId ===
                  promotionToDelete.id
                }
                className="min-h-12 rounded-2xl border border-zinc-200 bg-white px-6 text-sm font-black text-zinc-600"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={
                  deletingId ===
                  promotionToDelete.id
                }
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 text-sm font-black text-white shadow-lg shadow-red-600/20 disabled:opacity-60"
              >
                {deletingId ===
                promotionToDelete.id ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}

                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div
          className="fixed inset-0 z-[130] overflow-y-auto bg-zinc-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setDetail(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="mx-auto my-6 w-full max-w-5xl overflow-hidden rounded-[30px] bg-white shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="relative flex items-start justify-between overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900 to-orange-950 p-6 text-white">
              <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-orange-500/25 blur-3xl" />
              <div className="relative z-10 pr-14">
                <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                  Détail promotion
                </span>
                <h2 className="mt-2 text-2xl font-black">{detail.name}</h2>
                <strong className="mt-3 block text-4xl text-orange-400">
                  {formatPrice(detail.discount_value)}
                  {detail.discount_type === "PERCENT" ? " %" : " DA"}
                </strong>
              </div>

              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Fermer"
                className="absolute right-4 top-4 z-30 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/10 transition hover:scale-105 hover:bg-orange-500 active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoBox label="Début" value={formatDate(detail.starts_at)} />
                <InfoBox label="Fin" value={formatDate(detail.ends_at)} />
                <InfoBox
                  label="Produits"
                  value={`${detail.articles?.length || 0} article(s)`}
                />
              </div>

              <p className="mt-5 text-sm leading-7 text-zinc-600">
                {detail.description || "Aucune description."}
              </p>

              <h3 className="mt-7 font-black">Produits concernés</h3>

              <div className="mt-4 grid gap-3">
                {(detail.articles || []).map(
                  (article) => {
                    const economy =
                      Number(
                        article.original_price,
                      ) -
                      Number(
                        article.promotional_price,
                      );

                    return (
                      <article
                        key={article.id}
                        className="group grid gap-4 rounded-2xl border border-zinc-200 bg-white p-3 transition hover:border-orange-200 hover:bg-orange-50/20 hover:shadow-md sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center"
                      >
                        <div className="h-24 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 sm:h-[88px]">
                          {article.image ? (
                            <img
                              src={article.image}
                              alt={article.designation}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-8 w-8 text-zinc-300" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="truncate font-black text-zinc-950">
                            {article.designation}
                          </h4>

                          <span className="mt-1 block text-xs text-zinc-400">
                            {article.reference || "Sans référence"}
                          </span>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-bold text-zinc-500 line-through">
                              {formatPrice(article.original_price)} DA
                            </span>

                            <span className="rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs font-black text-orange-700">
                              {formatPrice(article.promotional_price)} DA
                            </span>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-zinc-950 px-4 py-3 text-white sm:min-w-[140px] sm:text-right">
                          <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">
                            Économie
                          </span>

                          <strong className="mt-1 block whitespace-nowrap text-lg font-black text-emerald-400">
                            {formatPrice(economy)} DA
                          </strong>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  className: string;
}) {
  return (
    <div className="group rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${className}`}
      >
        <Icon className="h-6 w-6" />
      </span>

      <strong className="mt-5 block text-3xl font-black">{value}</strong>
      <span className="mt-1 block text-sm font-black text-zinc-700">
        {label}
      </span>
      <p className="mt-1 text-xs text-zinc-400">{description}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
  step?: string;
}) {
  return (
    <label className="block text-sm font-black text-zinc-700">
      {label}

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
        className="mt-2 h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
      />
    </label>
  );
}

function ActionButton({
  label,
  icon: Icon,
  className,
  onClick,
  disabled = false,
  spin = false,
}: {
  label: string;
  icon: React.ElementType;
  className: string;
  onClick: () => void;
  disabled?: boolean;
  spin?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-black transition disabled:opacity-60 ${className}`}
    >
      <Icon className={`h-4 w-4 ${spin ? "animate-spin" : ""}`} />
      {label}
    </button>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="mt-5 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onChange(currentPage - 1)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="rounded-xl bg-white px-4 py-2 text-sm font-black">
        Page {currentPage} / {totalPages}
      </span>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onChange(currentPage + 1)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-4">
      <span className="text-xs font-bold text-zinc-400">{label}</span>
      <strong className="mt-1 block text-sm text-zinc-800">{value}</strong>
    </div>
  );
}
