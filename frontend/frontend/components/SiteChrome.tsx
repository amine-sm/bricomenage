"use client";

import { ReactNode, Suspense } from "react";
import { usePathname } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SiteChrome({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");

  return (
    <>
      {!admin && (
        <Suspense
          fallback={
            <div className="h-20 border-b border-zinc-200 bg-white" />
          }
        >
          <Header />
        </Suspense>
      )}

      {children}

      {!admin && <Footer />}
    </>
  );
}
