import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";

import AdminLayoutClient from "@/components/AdminLayoutClient";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

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
