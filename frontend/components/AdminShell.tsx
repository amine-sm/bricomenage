"use client";

import {
  type ReactNode,
  useEffect,
  useState,
} from "react";

import {
  LoaderCircle,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import AdminNav from "@/components/AdminNav";
import AdminRealtimeOrders from "@/components/AdminRealtimeOrders";

import {
  adminHeaders,
  apiFetch,
} from "@/lib/api";

let sessionValidated = false;

export default function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const [
    ready,
    setReady,
  ] = useState(
    sessionValidated,
  );

  useEffect(() => {
    if (sessionValidated) {
      setReady(true);
      return;
    }

    const token =
      window.localStorage.getItem(
        "admin_token",
      );

    if (!token) {
      router.replace(
        "/admin/connexion",
      );
      return;
    }

    let mounted = true;

    apiFetch("/auth/me", {
      headers:
        adminHeaders(),
    })
      .then(() => {
        sessionValidated = true;

        if (mounted) {
          setReady(true);
        }
      })
      .catch(() => {
        sessionValidated = false;

        window.localStorage.removeItem(
          "admin_token",
        );

        window.localStorage.removeItem(
          "admin_user",
        );

        router.replace(
          "/admin/connexion",
        );
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) {
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

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* NAVBAR ADMIN */}
      <AdminNav />

      {/* 
        IMPORTANT :
        Sur desktop la navbar fait w-72.
        On réserve donc exactement 72 à gauche.
      */}
      <div className="min-w-0 lg:pl-72">
        <main className="min-w-0 w-full p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Notifications commandes */}
      <AdminRealtimeOrders />
    </div>
  );
}