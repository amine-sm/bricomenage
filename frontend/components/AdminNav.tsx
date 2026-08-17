"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  ChartNoAxesCombined,
  FolderTree,
  ExternalLink,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Store,
  Tags,
  Truck,
  UsersRound,
  X,
} from "lucide-react";

import { adminHeaders, apiFetch } from "@/lib/api";
import {
  type AdminSession,
  hasAdminPermission,
  isSuperAdmin,
} from "@/lib/adminPermissions";

type NavOrder = {
  id: number;
  status: string;
  created_at?: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  superOnly?: boolean;
};

const allLinks: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: ChartNoAxesCombined, permission: "dashboard.view" },
  { label: "Articles", href: "/admin/articles", icon: Package, permission: "articles.view" },
  { label: "Promotions", href: "/admin/promotions", icon: Tags, permission: "promotions.view" },
  { label: "Packs", href: "/admin/packs", icon: Boxes, permission: "packs.view" },
  { label: "Catégories", href: "/admin/categories", icon: FolderTree, permission: "categories.view" },
  { label: "Fournisseurs", href: "/admin/fournisseurs", icon: Truck, permission: "suppliers.view" },
  { label: "Stock", href: "/admin/achats", icon: Store, permission: "stock.view" },
  { label: "Commandes", href: "/admin/commandes", icon: ShoppingCart, permission: "orders.view" },
  { label: "Utilisateurs", href: "/admin/utilisateurs", icon: UsersRound, superOnly: true },
];

function getOrdersSeenStorageKey(adminId: number) {
  return `bricomenage:orders-last-seen:${adminId}`;
}

function readOrdersLastSeen(adminId: number) {
  if (typeof window === "undefined") return 0;

  const raw = window.localStorage.getItem(
    getOrdersSeenStorageKey(adminId),
  );
  const value = Number(raw || 0);

  return Number.isFinite(value) ? value : 0;
}

function saveOrdersLastSeen(adminId: number, timestamp = Date.now()) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    getOrdersSeenStorageKey(adminId),
    String(timestamp),
  );
}

function OrderBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[9px] font-black text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function AdminNav({ admin }: { admin: AdminSession }) {
  const pathname = usePathname();
  const router = useRouter();
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = useMemo(
    () =>
      allLinks.filter((link) => {
        if (link.superOnly) return isSuperAdmin(admin);
        return !link.permission || hasAdminPermission(admin, link.permission);
      }),
    [admin],
  );

  const primaryLinks = links.slice(0, 4);
  const moreLinks = links.slice(4);

  const markOrdersAsSeen = useCallback(() => {
    saveOrdersLastSeen(admin.id);
    setNewOrdersCount(0);
  }, [admin.id]);

  const refreshOrdersCount = useCallback(async () => {
    if (!hasAdminPermission(admin, "orders.view")) {
      setNewOrdersCount(0);
      return;
    }

    // Ouvrir la rubrique Commandes signifie que les notifications ont été vues.
    // Le badge ne représente donc plus le statut métier "NOUVELLE",
    // mais uniquement les commandes arrivées depuis la dernière consultation.
    if (pathname.startsWith("/admin/commandes")) {
      markOrdersAsSeen();
      return;
    }

    try {
      const response = await apiFetch<{ orders: NavOrder[] }>("/admin/orders", {
        headers: adminHeaders(),
      });

      const lastSeen = readOrdersLastSeen(admin.id);
      const orders = response.orders || [];

      setNewOrdersCount(
        orders.filter((order) => {
          if (String(order.status) !== "NOUVELLE") return false;

          // Première utilisation : on garde le comportement historique
          // et on affiche les commandes actuellement nouvelles.
          if (!lastSeen) return true;

          const createdAt = new Date(order.created_at || "").getTime();
          return Number.isFinite(createdAt) && createdAt > lastSeen;
        }).length,
      );
    } catch {
      // Le compteur ne bloque jamais la navigation.
    }
  }, [admin, pathname, markOrdersAsSeen]);

  useEffect(() => {
    // Dès que l'administrateur ouvre la page Commandes,
    // le badge de notification doit disparaître immédiatement.
    if (pathname.startsWith("/admin/commandes")) {
      markOrdersAsSeen();
    }

    void refreshOrdersCount();

    const handleNewOrder = () => {
      // Si l'admin est déjà sur la page Commandes, la nouvelle commande
      // est considérée comme vue immédiatement : aucun badge rouge.
      if (pathname.startsWith("/admin/commandes")) {
        markOrdersAsSeen();
        return;
      }

      setNewOrdersCount((current) => current + 1);
    };

    const handleRefresh = () => void refreshOrdersCount();

    const handleMarkSeen = () => {
      markOrdersAsSeen();
    };

    const handleSetCount = (event: Event) => {
      const value = Number((event as CustomEvent<number>).detail);

      if (!Number.isFinite(value)) return;

      if (pathname.startsWith("/admin/commandes")) {
        markOrdersAsSeen();
        return;
      }

      setNewOrdersCount(Math.max(0, value));
    };

    window.addEventListener("bricomenage:new-order", handleNewOrder);
    window.addEventListener("bricomenage:orders-count-refresh", handleRefresh);
    window.addEventListener("bricomenage:orders-mark-seen", handleMarkSeen);
    window.addEventListener("bricomenage:orders-count-set", handleSetCount);

    return () => {
      window.removeEventListener("bricomenage:new-order", handleNewOrder);
      window.removeEventListener("bricomenage:orders-count-refresh", handleRefresh);
      window.removeEventListener("bricomenage:orders-mark-seen", handleMarkSeen);
      window.removeEventListener("bricomenage:orders-count-set", handleSetCount);
    };
  }, [markOrdersAsSeen, pathname, refreshOrdersCount]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setMobileMenuOpen(false);
    router.replace("/admin/connexion");
  }

  const moreMenuActive = moreLinks.some((link) => isActive(link.href));

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden h-screen w-72 flex-col overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-6 text-white lg:flex">
        <Link href={links[0]?.href || "/admin/connexion"} prefetch={false} className="flex shrink-0 items-center gap-3">
          <span className="relative flex h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white shadow-lg">
            <Image src="/images/logo-bricomenage-320.webp" alt="Logo BricoMénage" fill priority sizes="56px" className="object-contain p-1" />
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-lg font-black">BricoMénage</strong>
            <small className="block text-zinc-400">
              {isSuperAdmin(admin) ? "Super Administrateur" : "Utilisateur"}
            </small>
          </span>
        </Link>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="truncate text-sm font-black text-white">{admin.name}</p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-zinc-400">{admin.email}</p>
        </div>

        <nav className="mt-5 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {links.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={[
                  "flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
                  active
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-950/20"
                    : "text-zinc-300 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {label === "Commandes" && <OrderBadge count={newOrdersCount} />}
              </Link>
            );
          })}
        </nav>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full shrink-0 items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500 hover:text-white"
        >
          <ExternalLink className="h-5 w-5" />
          Voir le site
        </a>

        <button
          type="button"
          onClick={logout}
          className="mt-3 flex w-full shrink-0 items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-red-500 hover:bg-red-500 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Déconnexion
        </button>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-xl lg:hidden">
        <Link href={links[0]?.href || "/admin/connexion"} prefetch={false} className="flex min-w-0 items-center gap-2.5">
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <Image src="/images/logo-bricomenage-320.webp" alt="BricoMénage" fill priority sizes="40px" className="object-contain p-0.5" />
          </span>
          <div className="min-w-0">
            <strong className="block truncate text-sm font-black text-zinc-950">{admin.name}</strong>
            <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
              {isSuperAdmin(admin) ? "Super Admin" : "Utilisateur"}
            </span>
          </div>
        </Link>

        <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Ouvrir le menu" className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-[90] border-t border-zinc-200 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_35px_rgba(24,24,27,0.08)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-end justify-around gap-1">
          {primaryLinks.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} prefetch={false} className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5">
                <span className={[
                  "relative flex h-9 w-12 items-center justify-center rounded-2xl transition-all",
                  active ? "bg-orange-50 text-orange-600" : "text-zinc-500",
                ].join(" ")}>
                  <Icon className="h-5 w-5" />
                  {label === "Commandes" && newOrdersCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
                      {newOrdersCount > 99 ? "99+" : newOrdersCount}
                    </span>
                  )}
                </span>
                <span className={active ? "max-w-full truncate text-[9px] font-black text-orange-600" : "max-w-full truncate text-[9px] font-black text-zinc-500"}>{label}</span>
              </Link>
            );
          })}

          <button type="button" onClick={() => setMobileMenuOpen(true)} className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5">
            <span className={[
              "flex h-9 w-12 items-center justify-center rounded-2xl",
              moreMenuActive || mobileMenuOpen ? "bg-orange-50 text-orange-600" : "text-zinc-500",
            ].join(" ")}>
              <Menu className="h-5 w-5" />
            </span>
            <span className={moreMenuActive ? "text-[9px] font-black text-orange-600" : "text-[9px] font-black text-zinc-500"}>Plus</span>
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[320] lg:hidden">
          <button type="button" aria-label="Fermer" onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-zinc-950/45" />
          <section className="absolute inset-y-0 right-0 h-[100dvh] w-[min(92vw,390px)] overflow-y-auto overscroll-contain border-l border-zinc-200 bg-white px-4 pb-[max(22px,env(safe-area-inset-bottom))] pt-3 shadow-[-24px_0_70px_rgba(0,0,0,0.20)]">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-orange-500"><Menu className="h-4 w-4" /> Navigation</div>
            <div className="sticky top-0 z-20 -mx-4 flex items-center justify-between border-b border-zinc-100 bg-white/95 px-4 pb-4 pt-1">
              <div>
                <h2 className="text-lg font-black text-zinc-950">Menu administration</h2>
                <p className="mt-0.5 text-xs font-semibold text-zinc-400">Seulement vos rubriques autorisées</p>
              </div>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {links.map(({ label, href, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href} prefetch={false} className={[
                    "flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition active:scale-95",
                    active ? "border-orange-200 bg-orange-50 text-orange-600" : "border-zinc-200 bg-zinc-50 text-zinc-700",
                  ].join(" ")}>
                    <span className={active ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white" : "flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-zinc-700 shadow-sm"}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] font-black">{label}</span>
                  </Link>
                );
              })}
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700"
            >
              <ExternalLink className="h-5 w-5" />
              Voir le site
            </a>

            <button type="button" onClick={logout} className="mt-3 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600">
              <LogOut className="h-5 w-5" />
              Déconnexion
            </button>
          </section>
        </div>
      )}
    </>
  );
}
