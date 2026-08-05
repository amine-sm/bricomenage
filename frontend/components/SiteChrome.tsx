"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
export default function SiteChrome({children}:{children:ReactNode}){const pathname=usePathname();const admin=pathname.startsWith("/admin");return <>{!admin&&<Header/>}{children}{!admin&&<Footer/>}</>}
