"use client";

import { type ReactNode, useEffect, useState } from "react";
import { LoaderCircle, ShieldX } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import AdminNav from "@/components/AdminNav";
import AdminRealtimeOrders from "@/components/AdminRealtimeOrders";
import { adminHeaders, apiFetch } from "@/lib/api";
import {
  type AdminSession,
  canAccessAdminPath,
  hasAdminPermission,
} from "@/lib/adminPermissions";

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("admin_token");

    if (!token) {
      router.replace("/admin/connexion");
      return;
    }

    let mounted = true;
    setReady(false);

    apiFetch<{ success: boolean; admin: AdminSession }>("/auth/me", {
      headers: adminHeaders(),
    })
      .then((response) => {
        if (!mounted) return;
        setAdmin(response.admin);
        window.localStorage.setItem("admin_user", JSON.stringify(response.admin));
        setReady(true);
      })
      .catch(() => {
        if (!mounted) return;
        window.localStorage.removeItem("admin_token");
        window.localStorage.removeItem("admin_user");
        router.replace("/admin/connexion");
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
          <LoaderCircle className="h-5 w-5 animate-spin text-orange-500" />
          <span className="text-sm font-black text-zinc-600">
            Ouverture de l’administration...
          </span>
        </div>
      </div>
    );
  }

  const allowed = canAccessAdminPath(admin, pathname);
  const ordersEnabled = hasAdminPermission(admin, "orders.view");

  return (
    <div className="min-h-screen bg-zinc-100">
      <AdminNav admin={admin} />

      <div className="min-w-0 lg:pl-72">
        <main className="min-w-0 w-full p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          {allowed ? (
            children
          ) : (
            <div className="mx-auto mt-10 max-w-xl rounded-[30px] border border-red-100 bg-white p-8 text-center shadow-sm">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <ShieldX className="h-8 w-8" />
              </span>
              <h1 className="mt-5 text-2xl font-black text-zinc-950">Accès non autorisé</h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-zinc-500">
                Votre compte n’a pas l’autorisation nécessaire pour ouvrir cette rubrique.
              </p>
            </div>
          )}
        </main>
      </div>

      {ordersEnabled && <AdminRealtimeOrders />}
    </div>
  );
}
