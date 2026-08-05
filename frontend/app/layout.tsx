import type { Metadata } from "next";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
export const metadata: Metadata = {title:"BricoMénage | Bricolage, maison et jardin",description:"Matériel de bricolage, mobilier, jardinage, peinture, plomberie et électricité."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body className="bg-[#fafafa] font-sans antialiased"><SiteChrome>{children}</SiteChrome></body></html>}
