"use client";

import { usePathname } from "next/navigation";
import FloatingSocials from "./FloatingSocials";

export default function ConditionalFloatingButton() {
  const pathname = usePathname();

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return null;
  }

  return <FloatingSocials />;
}