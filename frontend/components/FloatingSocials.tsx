
import React from "react";

const socials = [
  {
    name: "WhatsApp",
    href: "https://wa.me/213667593750?text=Bonjour%20BricoM%C3%A9nage%2C%20je%20souhaite%20avoir%20plus%20d%27informations.",
    color: "bg-[#25D366]",
    hover: "hover:bg-[#1ebe5d]",
    label: "Contacter BricoMénage sur WhatsApp",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.52 3.48A11.82 11.82 0 0 0 12.08 0C5.5 0 .15 5.34.15 11.92c0 2.1.55 4.15 1.6 5.96L.05 24l6.27-1.64a11.9 11.9 0 0 0 5.75 1.47h.01c6.58 0 11.92-5.35 11.92-11.93 0-3.18-1.24-6.17-3.48-8.42ZM12.08 21.8h-.01a9.88 9.88 0 0 1-5.03-1.37l-.36-.21-3.72.98.99-3.63-.24-.37a9.86 9.86 0 1 1 8.37 4.6Zm5.42-7.39c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.64.07-.3-.15-1.26-.47-2.4-1.48-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.34.45-.5.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.47s1.06 2.87 1.2 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.35.2 1.86.12.57-.09 1.75-.72 2-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://ig.me/m/brico_menagedz",
    color: "bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#FCAF45]",
    hover: "hover:brightness-110",
    label: "Envoyer un message à BricoMénage sur Instagram",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle
          cx="17.5"
          cy="6.5"
          r="1"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/BricoMenage.dz/",
    color: "bg-[#1877F2]",
    hover: "hover:bg-[#0866ff]",
    label: "Visiter la page Facebook BricoMénage",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.093 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.093 24 18.1 24 12.073Z" />
      </svg>
    ),
  },
];

export default function FloatingSocials() {
  return (
    <nav
      aria-label="Réseaux sociaux BricoMénage"
      className="pointer-events-none fixed bottom-5 right-4 z-[9999] flex flex-col items-center gap-3 sm:bottom-7 sm:right-6"
    >
      {socials.map((social) => (
        <a
          key={social.name}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
          title={social.name}
          className={[
            "pointer-events-auto group flex h-12 w-12 items-center justify-center",
            "rounded-full text-white shadow-lg",
            "transition-all duration-300",
            "hover:scale-110 hover:shadow-xl active:scale-95",
            "focus-visible:outline-none focus-visible:ring-4",
            "focus-visible:ring-gray-300",
            "sm:h-14 sm:w-14",
            social.color,
            social.hover,
          ].join(" ")}
        >
          <span className="h-6 w-6 transition-transform duration-300 group-hover:scale-110 sm:h-7 sm:w-7">
            {social.icon}
          </span>
        </a>
      ))}
    </nav>
  );
}
