"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Facebook,
  Instagram,
  MessageCircle,
  Music2,
  Share2,
  X,
} from "lucide-react";

const socials = [
  {
    label: "WhatsApp",
    href: "https://wa.me/213667593750",
    color: "bg-[#25D366] hover:bg-[#20bd5b]",
    Icon: MessageCircle,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/18wbQ77V1V/?mibextid=wwXIfr",
    color: "bg-[#1877F2] hover:bg-[#0866dd]",
    Icon: Facebook,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/brico_menagedz?igsh=aTl5dWI5MHBodHBx",
    color: "bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#FCAF45]",
    Icon: Instagram,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@brico.menage.31",
    color: "bg-zinc-950 hover:bg-zinc-800",
    Icon: Music2,
  },
];

export default function FloatingSocials() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Chaque arrivée sur le catalogue replie automatiquement les réseaux.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div
      className="pointer-events-none fixed bottom-[88px] right-4 z-[9100] flex flex-col items-end gap-3 sm:right-6 lg:bottom-8 lg:right-8"
      aria-label="Réseaux sociaux BricoMénage"
    >
      <div
        id="floating-social-links"
        className={`flex flex-col items-end gap-2.5 transition-all duration-300 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
        aria-hidden={!open}
      >
        {socials.map(({ label, href, color, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            tabIndex={open ? 0 : -1}
            className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg ring-2 ring-white transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${color}`}
          >
            <Icon className="h-5 w-5" strokeWidth={2.2} />
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fermer les réseaux sociaux" : "Afficher les réseaux sociaux"}
        aria-expanded={open}
        aria-controls="floating-social-links"
        title={open ? "Fermer" : "Nos réseaux sociaux"}
        className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-zinc-950 text-white shadow-[0_12px_30px_rgba(24,24,27,0.32)] ring-4 ring-white transition-all duration-200 hover:scale-105 hover:bg-orange-500 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <Share2 className="h-6 w-6" />}
        {!open && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-orange-500" />}
      </button>
    </div>
  );
}
