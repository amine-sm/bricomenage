"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  Boxes,
  ChartNoAxesCombined,
  FolderTree,
  LogOut,
  Package,
  ShoppingCart,
  Store,
  Tags,
  Truck,
} from "lucide-react";

import {
  adminHeaders,
  apiFetch,
} from "@/lib/api";

type NavOrder = {
  id: number;
  status: string;
};

const links = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Articles",
    href: "/admin/articles",
    icon: Package,
  },
  {
    label: "Promotions",
    href: "/admin/promotions",
    icon: Tags,
  },
  {
    label: "Packs",
    href: "/admin/packs",
    icon: Boxes,
  },
  {
    label: "Catégories",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    label: "Fournisseurs",
    href: "/admin/fournisseurs",
    icon: Truck,
  },
  {
    label: "Stock",
    href: "/admin/achats",
    icon: Store,
  },
  {
    label: "Commandes",
    href: "/admin/commandes",
    icon: ShoppingCart,
  },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [
    newOrdersCount,
    setNewOrdersCount,
  ] = useState(0);

  const refreshOrdersCount =
    useCallback(async () => {
      try {
        const response =
          await apiFetch<{
            orders: NavOrder[];
          }>("/admin/orders", {
            headers:
              adminHeaders(),
          });

        setNewOrdersCount(
          (response.orders || []).filter(
            (order) =>
              String(order.status) ===
              "NOUVELLE",
          ).length,
        );
      } catch {
        // Le compteur ne doit jamais bloquer la navigation.
      }
    }, []);

  useEffect(() => {
    void refreshOrdersCount();

    function handleNewOrder() {
      setNewOrdersCount(
        (current) =>
          current + 1,
      );
    }

    function handleRefresh() {
      void refreshOrdersCount();
    }

    window.addEventListener(
      "bricomenage:new-order",
      handleNewOrder,
    );

    window.addEventListener(
      "bricomenage:orders-count-refresh",
      handleRefresh,
    );

    return () => {
      window.removeEventListener(
        "bricomenage:new-order",
        handleNewOrder,
      );

      window.removeEventListener(
        "bricomenage:orders-count-refresh",
        handleRefresh,
      );
    };
  }, [refreshOrdersCount]);

  function logout() {
    localStorage.removeItem(
      "admin_token",
    );

    localStorage.removeItem(
      "admin_user",
    );

    router.replace(
      "/admin/connexion",
    );
  }

  return (
    <aside
      className="
        w-full
        border-b
        border-zinc-800
        bg-zinc-950
        p-4
        text-white

        lg:fixed
        lg:inset-y-0
        lg:left-0
        lg:z-50
        lg:flex
        lg:h-screen
        lg:w-72
        lg:flex-col
        lg:overflow-y-auto
        lg:border-b-0
        lg:border-r
        lg:p-6
      "
    >
      {/* =========================
          LOGO
      ========================= */}

      <Link
        href="/admin/dashboard"
        prefetch={false}
        className="flex shrink-0 items-center gap-3"
      >
        <span className="relative flex h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white shadow-lg">
          <Image
            src="/images/logo-bricomenage.jpeg"
            alt="Logo BricoMénage"
            fill
            priority
            sizes="56px"
            className="object-contain p-1"
          />
        </span>

        <span className="min-w-0">
          <strong className="block truncate text-lg font-black">
            BricoMénage
          </strong>

          <small className="block text-zinc-400">
            Administration
          </small>
        </span>
      </Link>

      {/* =========================
          NAVIGATION
      ========================= */}

      <nav
        className="
          mt-6
          grid
          gap-2
          sm:grid-cols-2
          lg:flex
          lg:min-h-0
          lg:flex-1
          lg:flex-col
          lg:grid-cols-none
          lg:overflow-y-auto
          lg:pr-1
        "
      >
        {links.map(
          ({
            label,
            href,
            icon: Icon,
          }) => {
            const active =
              pathname === href ||
              pathname.startsWith(
                `${href}/`,
              );

            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={[
                  "flex",
                  "shrink-0",
                  "items-center",
                  "gap-3",
                  "rounded-2xl",
                  "px-4",
                  "py-3",
                  "text-sm",
                  "font-bold",
                  "transition",
                  active
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-950/20"
                    : "text-zinc-300 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-5 w-5 shrink-0" />

                <span className="min-w-0 flex-1 truncate">
                  {label}
                </span>

                {/* Compteur nouvelles commandes */}
                {label ===
                  "Commandes" &&
                  newOrdersCount >
                    0 && (
                    <span
                      className="
                        inline-flex
                        min-w-6
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-red-500
                        px-2
                        py-0.5
                        text-[11px]
                        font-black
                        leading-5
                        text-white
                        shadow-lg
                        shadow-red-950/30
                        ring-2
                        ring-zinc-950
                      "
                    >
                      {newOrdersCount >
                      99
                        ? "99+"
                        : newOrdersCount}
                    </span>
                  )}
              </Link>
            );
          },
        )}
      </nav>

      {/* =========================
          DÉCONNEXION
      ========================= */}

      <button
        type="button"
        onClick={logout}
        className="
          mt-6
          flex
          w-full
          shrink-0
          items-center
          gap-3
          rounded-2xl
          border
          border-white/10
          px-4
          py-3
          text-sm
          font-bold
          text-zinc-300
          transition

          hover:border-red-500
          hover:bg-red-500
          hover:text-white

          lg:mt-auto
        "
      >
        <LogOut className="h-5 w-5 shrink-0" />

        <span>
          Déconnexion
        </span>
      </button>
    </aside>
  );
}