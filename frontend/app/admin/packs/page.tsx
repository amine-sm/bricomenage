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
  Boxes,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  ImagePlus,
  LayoutGrid,
  List,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShoppingCart,
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
  stock_quantity: number;
  category?: string;
};

type PackArticle = {
  id: number;
  designation: string;
  reference?: string;
  image?: string;
  price: number;
  quantity: number;
  line_total: number;
};

type Pack = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  old_price?: number;
  stock_quantity: number;
  calculated_stock?: number;
  image?: string;
  is_active?: number | boolean;
  article_count?: number;
  articles?: PackArticle[];
  created_at?: string;
};

type PackItemForm = {
  articleId: number;
  quantity: number;
};

type PackFormState = {
  id?: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  old_price: string;
  image: string;
  is_active: boolean;
  items: PackItemForm[];
};

const EMPTY_FORM: PackFormState = {
  name: "",
  slug: "",
  description: "",
  price: "",
  old_price: "",
  image: "",
  is_active: true,
  items: [],
};

const PAGE_SIZE = 9;

type ViewMode = "cards" | "table";

function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-DZ").format(Number(value || 0));
}

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isPackActive(pack: Pack) {
  return (
    pack.is_active === undefined ||
    pack.is_active === true ||
    Number(pack.is_active) === 1
  );
}

export default function PacksPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  const [form, setForm] = useState<PackFormState>(EMPTY_FORM);
  const [modalOpen, setModalOpen] = useState(false);
  const [detail, setDetail] = useState<Pack | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [
    packToDelete,
    setPackToDelete,
  ] = useState<Pack | null>(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [articleQuery, setArticleQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [packsResponse, articlesResponse] = await Promise.all([
        apiFetch<{ packs: Pack[] }>("/admin/packs", {
          headers: adminHeaders(),
        }),
        apiFetch<{ articles: Article[] }>("/admin/articles", {
          headers: adminHeaders(),
        }),
      ]);

      setPacks(packsResponse.packs || []);
      setArticles(articlesResponse.articles || []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de charger les packs.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => setSuccess(""), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter]);

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

      if (packToDelete) {
        setPackToDelete(null);
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
    packToDelete,
    saving,
  ]);

  useEffect(() => {
    const savedView = window.localStorage.getItem("admin-packs-view");

    if (savedView === "cards" || savedView === "table") {
      setViewMode(savedView);
    } else {
      setViewMode("table");
    }
  }, []);

  function changeViewMode(mode: ViewMode) {
    setViewMode(mode);
    window.localStorage.setItem("admin-packs-view", mode);
  }

  const stats = useMemo(() => {
    const active = packs.filter(isPackActive).length;
    const unavailable = packs.filter(
      (pack) => Number(pack.calculated_stock ?? pack.stock_quantity ?? 0) <= 0,
    ).length;
    const linkedProducts = packs.reduce(
      (sum, pack) => sum + Number(pack.article_count || 0),
      0,
    );

    return {
      total: packs.length,
      active,
      unavailable,
      linkedProducts,
    };
  }, [packs]);

  const filteredPacks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return packs.filter((pack) => {
      const matchesQuery =
        !normalizedQuery ||
        [pack.name, pack.slug, pack.description]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedQuery),
          );

      const active = isPackActive(pack);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);

      return matchesQuery && matchesStatus;
    });
  }, [packs, query, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPacks.length / PAGE_SIZE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedPacks = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredPacks.slice(start, start + PAGE_SIZE);
  }, [filteredPacks, safePage]);

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
        .some((value) =>
          String(value).toLowerCase().includes(normalized),
        ),
    );
  }, [articles, articleQuery]);

  const selectedArticles = useMemo(() => {
    return form.items
      .map((item) => {
        const article = articles.find(
          (candidate) => candidate.id === item.articleId,
        );

        if (!article) return null;

        return {
          ...article,
          quantity: item.quantity,
          lineTotal: Number(article.price) * item.quantity,
        };
      })
      .filter(Boolean) as Array<
      Article & {
        quantity: number;
        lineTotal: number;
      }
    >;
  }, [form.items, articles]);

  const normalTotal = useMemo(
    () =>
      selectedArticles.reduce(
        (sum, article) => sum + article.lineTotal,
        0,
      ),
    [selectedArticles],
  );

  const savingAmount = Math.max(
    0,
    normalTotal - Number(form.price || 0),
  );

  function openCreateModal() {
    setForm(EMPTY_FORM);
    setArticleQuery("");
    setError("");
    setModalOpen(true);
  }

  async function openEditModal(pack: Pack) {
    setError("");

    try {
      const response = await apiFetch<Pack>(
        `/admin/packs/${pack.id}`,
        {
          headers: adminHeaders(),
        },
      );

      setForm({
        id: response.id,
        name: response.name || "",
        slug: response.slug || "",
        description: response.description || "",
        price: String(response.price ?? ""),
        old_price: String(
          response.old_price ??
            (response.articles || []).reduce(
              (sum, article) =>
                sum + Number(article.price) * Number(article.quantity),
              0,
            ),
        ),
        image: response.image || "",
        is_active: isPackActive(response),
        items: (response.articles || []).map((article) => ({
          articleId: article.id,
          quantity: Number(article.quantity || 1),
        })),
      });

      setArticleQuery("");
      setModalOpen(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de charger le pack.",
      );
    }
  }

  async function openDetail(pack: Pack) {
    setError("");

    try {
      const response = await apiFetch<Pack>(
        `/admin/packs/${pack.id}`,
        {
          headers: adminHeaders(),
        },
      );

      setDetail(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de charger le détail du pack.",
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

  function toggleArticle(articleId: number) {
    setForm((current) => {
      const existing = current.items.find(
        (item) => item.articleId === articleId,
      );

      return {
        ...current,
        items: existing
          ? current.items.filter(
              (item) => item.articleId !== articleId,
            )
          : [...current.items, { articleId, quantity: 1 }],
      };
    });
  }

  function changeItemQuantity(articleId: number, quantity: number) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.articleId === articleId
          ? {
              ...item,
              quantity: Math.max(1, quantity || 1),
            }
          : item,
      ),
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.items.length < 2) {
      setError("Un pack doit contenir au moins deux articles.");
      return;
    }

    const price = Number(form.price);

    if (!Number.isFinite(price) || price <= 0) {
      setError("Le prix du pack doit être supérieur à zéro.");
      return;
    }

    if (price >= normalTotal) {
      setError(
        "Le prix du pack doit être inférieur au total normal des articles.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const name = form.name.trim();

      await apiFetch(
        form.id
          ? `/admin/packs/${form.id}`
          : "/admin/packs",
        {
          method: form.id ? "PUT" : "POST",
          headers: {
            ...adminHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            slug: form.slug.trim() || createSlug(name),
            description: form.description.trim(),
            price,
            old_price: Number(form.old_price || normalTotal),
            image: form.image.trim() || null,
            is_active: form.is_active,
            items: form.items,
          }),
        },
      );

      setSuccess(
        form.id
          ? "Pack modifié avec succès."
          : "Pack créé avec les produits sélectionnés.",
      );

      closeModal(true);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d’enregistrer le pack.",
      );
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(
    pack: Pack,
  ) {
    setPackToDelete(pack);
  }

  async function confirmDelete() {
    if (!packToDelete) {
      return;
    }

    setDeletingId(
      packToDelete.id,
    );
    setError("");
    setSuccess("");

    try {
      await apiFetch(
        `/admin/packs/${packToDelete.id}`,
        {
          method: "DELETE",
          headers:
            adminHeaders(),
        },
      );

      setSuccess(
        "Pack supprimé avec succès.",
      );
      setPackToDelete(null);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de supprimer le pack.",
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
                <Boxes className="h-4 w-4" />
                Gestion des offres groupées
              </span>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
                Packs
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                Composez vos packs, gérez les quantités, les prix, le stock réel et leur visibilité.
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
              Nouveau pack
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
            icon={Boxes}
            label="Packs"
            value={String(stats.total)}
            description="Offres enregistrées"
            className="bg-orange-50 text-orange-600"
          />

          <StatCard
            icon={CheckCircle2}
            label="Actifs"
            value={String(stats.active)}
            description="Visibles dans le catalogue"
            className="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            icon={ShoppingCart}
            label="Produits liés"
            value={String(stats.linkedProducts)}
            description="Articles intégrés aux packs"
            className="bg-blue-50 text-blue-600"
          />

          <StatCard
            icon={AlertTriangle}
            label="Indisponibles"
            value={String(stats.unavailable)}
            description="Stock réel égal à zéro"
            className="bg-red-50 text-red-600"
          />
        </section>

        <section className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un pack..."
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
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>

            <div className="inline-flex h-12 items-center rounded-2xl border border-zinc-200 bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => changeViewMode("cards")}
                aria-label="Affichage en cartes"
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
                aria-label="Affichage en tableau"
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
              Chargement des packs...
            </p>
          </section>
        ) : paginatedPacks.length === 0 ? (
          <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-zinc-200 bg-white px-6 text-center">
            <Boxes className="h-14 w-14 text-orange-400" />
            <h2 className="mt-5 text-xl font-black">Aucun pack</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Créez un pack composé de plusieurs articles.
            </p>
          </section>
        ) : (
          <>
            {viewMode === "cards" ? (
              <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {paginatedPacks.map((pack) => {
                  const active = isPackActive(pack);
                  const stock = Number(
                    pack.calculated_stock ?? pack.stock_quantity ?? 0,
                  );
                  const economy = Math.max(
                    0,
                    Number(pack.old_price || 0) - Number(pack.price || 0),
                  );

                  return (
                    <article
                      key={pack.id}
                      className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100">
                        {pack.image ? (
                          <img
                            src={pack.image}
                            alt={pack.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-zinc-100">
                            <Boxes className="h-16 w-16 text-orange-300" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-transparent to-transparent" />

                        <span
                          className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-black ${
                            active
                              ? "bg-emerald-500 text-white"
                              : "bg-zinc-700 text-white"
                          }`}
                        >
                          {active ? "Actif" : "Inactif"}
                        </span>

                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <h2 className="text-xl font-black">{pack.name}</h2>
                          <span className="mt-1 block text-xs text-zinc-300">
                            {pack.article_count || 0} produit(s)
                          </span>
                        </div>
                      </div>

                      <div className="p-5">
                        <p className="line-clamp-2 min-h-12 text-sm leading-6 text-zinc-500">
                          {pack.description || "Aucune description."}
                        </p>

                        <div className="mt-5 flex items-end justify-between gap-4">
                          <div>
                            {pack.old_price &&
                              Number(pack.old_price) > Number(pack.price) && (
                                <span className="block text-xs text-zinc-400 line-through">
                                  {formatPrice(pack.old_price)} DA
                                </span>
                              )}

                            <strong className="text-2xl font-black text-zinc-950">
                              {formatPrice(pack.price)}{" "}
                              <span className="text-sm text-orange-500">DA</span>
                            </strong>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-black ${
                              stock > 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            Stock : {stock}
                          </span>
                        </div>

                        {economy > 0 && (
                          <div className="mt-4 rounded-2xl bg-orange-50 p-3 text-sm font-black text-orange-700">
                            Économie : {formatPrice(economy)} DA
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 bg-zinc-50 p-4">
                        <ActionButton
                          label="Voir"
                          icon={Eye}
                          className="bg-white text-zinc-700 hover:bg-zinc-950 hover:text-white"
                          onClick={() => openDetail(pack)}
                        />

                        <ActionButton
                          label="Modifier"
                          icon={Pencil}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white"
                          onClick={() => openEditModal(pack)}
                        />

                        <ActionButton
                          label="Supprimer"
                          icon={deletingId === pack.id ? LoaderCircle : Trash2}
                          className="bg-red-50 text-red-700 hover:bg-red-600 hover:text-white"
                          onClick={() => requestDelete(pack)}
                          disabled={deletingId === pack.id}
                          spin={deletingId === pack.id}
                        />
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
                        <th className="px-5 py-4">Pack</th>
                        <th className="px-5 py-4">Produits</th>
                        <th className="px-5 py-4">Prix</th>
                        <th className="px-5 py-4">Économie</th>
                        <th className="px-5 py-4">Stock</th>
                        <th className="px-5 py-4">Statut</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedPacks.map((pack) => {
                        const active = isPackActive(pack);
                        const stock = Number(
                          pack.calculated_stock ?? pack.stock_quantity ?? 0,
                        );
                        const economy = Math.max(
                          0,
                          Number(pack.old_price || 0) - Number(pack.price || 0),
                        );

                        return (
                          <tr
                            key={pack.id}
                            className="border-b border-zinc-100 transition last:border-b-0 hover:bg-orange-50/25"
                          >
                            <td className="px-5 py-4">
                              <div className="flex min-w-[260px] items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
                                  {pack.image ? (
                                    <img
                                      src={pack.image}
                                      alt={pack.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Boxes className="h-7 w-7 text-orange-300" />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <strong className="line-clamp-1 block font-black text-zinc-950">
                                    {pack.name}
                                  </strong>

                                  <span className="mt-1 block text-xs text-zinc-400">
                                    {pack.slug}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                                {pack.article_count || 0} produit(s)
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="whitespace-nowrap">
                                {pack.old_price &&
                                  Number(pack.old_price) > Number(pack.price) && (
                                    <span className="block text-xs text-zinc-400 line-through">
                                      {formatPrice(pack.old_price)} DA
                                    </span>
                                  )}

                                <strong className="text-base font-black text-zinc-950">
                                  {formatPrice(pack.price)}{" "}
                                  <span className="text-sm text-orange-500">DA</span>
                                </strong>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`whitespace-nowrap font-black ${
                                  economy > 0
                                    ? "text-emerald-600"
                                    : "text-zinc-400"
                                }`}
                              >
                                {formatPrice(economy)} DA
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${
                                  stock > 0
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {stock}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${
                                  active
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-zinc-100 text-zinc-600"
                                }`}
                              >
                                {active ? "Actif" : "Inactif"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openDetail(pack)}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition hover:bg-orange-500 hover:text-white"
                                  aria-label="Voir le pack"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openEditModal(pack)}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white"
                                  aria-label="Modifier le pack"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => requestDelete(pack)}
                                  disabled={deletingId === pack.id}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
                                  aria-label="Supprimer le pack"
                                >
                                  {deletingId === pack.id ? (
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
                  Composition du pack
                </span>

                <h2 className="relative mt-2 text-2xl font-black">
                  {form.id ? "Modifier le pack" : "Nouveau pack"}
                </h2>

                <p className="relative mt-1 text-sm text-zinc-300">
                  Sélectionnez plusieurs articles et définissez leur quantité.
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
                    label="Nom du pack"
                    required
                    value={form.name}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        name: value,
                        slug:
                          current.slug || createSlug(value),
                      }))
                    }
                    placeholder="Ex. Pack jardin complet"
                  />

                  <Field
                    label="Slug"
                    value={form.slug}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        slug: createSlug(value),
                      }))
                    }
                    placeholder="pack-jardin-complet"
                  />

                  <Field
                    label="Prix du pack"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        price: value,
                      }))
                    }
                    placeholder="39900"
                  />

                  <Field
                    label="Ancien prix"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.old_price || String(normalTotal || "")}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        old_price: value,
                      }))
                    }
                    placeholder={String(normalTotal || 0)}
                  />

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
                      <strong className="text-sm">Pack actif</strong>
                      <span className="mt-1 block text-xs text-zinc-500">
                        Visible dans le catalogue public.
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

                  <div className="rounded-2xl bg-zinc-950 p-5 text-white">
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Total normal</span>
                      <strong className="text-white">
                        {formatPrice(normalTotal)} DA
                      </strong>
                    </div>

                    <div className="mt-3 flex justify-between text-sm text-zinc-400">
                      <span>Prix du pack</span>
                      <strong className="text-orange-400">
                        {formatPrice(Number(form.price || 0))} DA
                      </strong>
                    </div>

                    <div className="mt-4 flex justify-between border-t border-white/10 pt-4">
                      <span className="font-bold">Économie client</span>
                      <strong className="text-emerald-400">
                        {formatPrice(savingAmount)} DA
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div>
                  <h3 className="text-lg font-black">
                    Sélectionner les produits
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {form.items.length} produit(s) sélectionné(s)
                  </p>
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
                    const selectedItem = form.items.find(
                      (item) => item.articleId === article.id,
                    );
                    const selected = Boolean(selectedItem);

                    return (
                      <div
                        key={article.id}
                        className={`relative overflow-hidden rounded-2xl border p-3 transition ${
                          selected
                            ? "border-orange-500 bg-orange-50 ring-2 ring-orange-500/15"
                            : "border-zinc-200 bg-white hover:border-orange-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleArticle(article.id)}
                          className="block w-full text-left"
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
                        </button>

                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3">
                          <strong className="text-sm text-zinc-800">
                            {formatPrice(article.price)} DA
                          </strong>

                          {selected && (
                            <label className="flex items-center gap-2 text-xs font-black text-zinc-600">
                              Qté
                              <input
                                type="number"
                                min="1"
                                max={Math.max(1, Number(article.stock_quantity))}
                                value={selectedItem?.quantity || 1}
                                onChange={(event) =>
                                  changeItemQuantity(
                                    article.id,
                                    Number(event.target.value),
                                  )
                                }
                                onClick={(event) => event.stopPropagation()}
                                className="h-9 w-16 rounded-xl border border-zinc-200 bg-white px-2 text-center outline-none focus:border-orange-400"
                              />
                            </label>
                          )}
                        </div>

                        <span className="mt-2 block text-[10px] font-bold text-zinc-400">
                          Stock disponible : {article.stock_quantity}
                        </span>
                      </div>
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
                    Enregistrer le pack
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}


      {packToDelete && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-zinc-950/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPackToDelete(null);
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
                Supprimer le pack ?
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Le pack «{" "}
                <strong className="text-white">
                  {packToDelete.name}
                </strong>
                {" "}» et sa composition seront supprimés.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setPackToDelete(null)
                }
                disabled={
                  deletingId ===
                  packToDelete.id
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
                  packToDelete.id
                }
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 text-sm font-black text-white shadow-lg shadow-red-600/20 disabled:opacity-60"
              >
                {deletingId ===
                packToDelete.id ? (
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
            <div className="relative overflow-hidden bg-zinc-950 p-6 text-white">
              {detail.image && (
                <img
                  src={detail.image}
                  alt={detail.name}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-orange-950/70" />

              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Fermer"
                className="absolute right-4 top-4 z-30 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/10 transition hover:scale-105 hover:bg-orange-500 active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative z-10">
                <span className="inline-flex rounded-full bg-orange-500 px-3 py-1.5 text-xs font-black">
                  Pack composé
                </span>

                <h2 className="mt-4 text-3xl font-black">{detail.name}</h2>

                <div className="mt-4 flex flex-wrap items-end gap-4">
                  <strong className="text-4xl font-black text-orange-400">
                    {formatPrice(detail.price)} DA
                  </strong>

                  {detail.old_price &&
                    Number(detail.old_price) > Number(detail.price) && (
                      <span className="text-zinc-400 line-through">
                        {formatPrice(detail.old_price)} DA
                      </span>
                    )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoBox
                  label="Produits"
                  value={`${detail.articles?.length || 0} article(s)`}
                />

                <InfoBox
                  label="Stock réel"
                  value={`${detail.calculated_stock ?? detail.stock_quantity ?? 0}`}
                />

                <InfoBox
                  label="Économie"
                  value={`${formatPrice(
                    Math.max(
                      0,
                      Number(detail.old_price || 0) -
                        Number(detail.price || 0),
                    ),
                  )} DA`}
                />
              </div>

              <p className="mt-5 text-sm leading-7 text-zinc-600">
                {detail.description || "Aucune description."}
              </p>

              <h3 className="mt-7 font-black">Composition du pack</h3>

              <div className="mt-4 grid gap-3">
                {(detail.articles || []).map(
                  (article) => (
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
                          <span className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-bold text-zinc-600">
                            {formatPrice(article.price)} DA / unité
                          </span>

                          <span className="rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs font-black text-orange-700">
                            Quantité : {article.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-zinc-950 px-4 py-3 text-white sm:min-w-[140px] sm:text-right">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">
                          Total
                        </span>

                        <strong className="mt-1 block whitespace-nowrap text-lg font-black text-orange-400">
                          {formatPrice(article.line_total)} DA
                        </strong>
                      </div>
                    </article>
                  ),
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
