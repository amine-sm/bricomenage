"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { apiFetch, adminHeaders } from "@/lib/api";
import AdminNav from "@/components/AdminNav";

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/connexion");
      return;
    }
    apiFetch("/auth/me", { headers: adminHeaders() })
      .then(() => setReady(true))
      .catch(() => {
        localStorage.removeItem("admin_token");
        router.replace("/admin/connexion");
      });
  }, [router]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-zinc-100"><LoaderCircle className="h-9 w-9 animate-spin text-orange-500" /></div>;
  }

  return <div className="min-h-screen bg-zinc-100 lg:flex"><AdminNav/><main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main></div>;
}
