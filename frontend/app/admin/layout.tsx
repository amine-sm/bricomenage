"use client";

import type {
  ReactNode,
} from "react";

import {
  usePathname,
} from "next/navigation";

import AdminShell from "@/components/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname =
    usePathname();

  if (
    pathname === "/admin/connexion" ||
    pathname.startsWith(
      "/admin/connexion/",
    )
  ) {
    return children;
  }

  return (
    <AdminShell>
      {children}
    </AdminShell>
  );
}
