"use client";

import Image from "next/image";
import Link from "next/link";
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

  function logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");

    router.replace("/admin/connexion");
  }

  return (
    <aside className="w-full border-b border-zinc-800 bg-zinc-950 p-4 text-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:p-6">
      <Link
    
    
        href="/admin/dashboard"
        prefetch
        className="flex items-center gap-3"
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
          <strong className="block truncate text-lg">
            BricoMénage
          </strong>

          <small className="block text-zinc-400">
            Administration
          </small>
        </span>
      </Link>

      <nav className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {links.map(
          ({
            label,
            href,
            icon: Icon,
          }) => {
            const active =
              pathname === href ||
              pathname.startsWith(
                `${href}/`
              );

            return (
              <Link
                key={href}
                href={href}
                prefetch
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-orange-500 text-white"
                    : "text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />

                <span>{label}</span>
              </Link>
            );
          }
        )}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-red-500 hover:bg-red-500 hover:text-white"
      >
        <LogOut className="h-5 w-5" />

        <span>Déconnexion</span>
      </button>
    </aside>
  );
}