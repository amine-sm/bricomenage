import type { ReactNode } from "react";
import { Suspense } from "react";

import AdminLayoutClient from "@/components/AdminLayoutClient";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </Suspense>
  );
}
