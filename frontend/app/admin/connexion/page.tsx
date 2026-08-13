"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LockKeyhole,
  Mail,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import {
  type AdminSession,
  firstAllowedAdminHref,
} from "@/lib/adminPermissions";

export default function Login() {
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);

    try {
      const response = await apiFetch<{
        token: string;
        admin: AdminSession;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      localStorage.setItem(
        "admin_token",
        response.token,
      );

      localStorage.setItem(
        "admin_user",
        JSON.stringify(response.admin),
      );

      router.replace(
        firstAllowedAdminHref(
          response.admin,
        ),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur de connexion.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#111111] px-4 py-10">
      {/* Décoration arrière-plan */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-orange-500/10 blur-[100px]" />

        <div className="absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "45px 45px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[460px]">
        {/* Bloc connexion */}
        <form
          onSubmit={submit}
          className="overflow-hidden rounded-[34px] border border-white/10 bg-white shadow-[0_35px_100px_rgba(0,0,0,0.45)]"
        >
          {/* Partie haute */}
          <div className="px-7 pb-5 pt-8 text-center sm:px-10 sm:pt-10">
            {/* Logo */}
            <div className="mx-auto flex h-[105px] w-[180px] items-center justify-center">
              <Image
                src="/images/logo-bricomenage.jpeg"
                alt="BricoMénage"
                width={180}
                height={105}
                priority
                className="max-h-[105px] w-auto object-contain"
              />
            </div>

            {/* Badge sécurité */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-orange-600">
              <ShieldCheck className="h-4 w-4" />
              Espace sécurisé
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-zinc-950 sm:text-[34px]">
              Administration
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
              Connectez-vous pour accéder à votre espace
              de gestion BricoMénage.
            </p>
          </div>

          {/* Formulaire */}
          <div className="px-7 pb-8 sm:px-10 sm:pb-10">
            {/* E-mail */}
            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-zinc-800">
                Adresse e-mail
              </span>

              <div className="group relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-orange-500" />

                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="Adresse e-mail"
                  className="h-[58px] w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-4 text-[15px] font-semibold text-zinc-900 outline-none transition-all placeholder:font-normal placeholder:text-zinc-400 hover:border-zinc-300 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </label>

            {/* Mot de passe */}
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-extrabold text-zinc-800">
                Mot de passe
              </span>

              <div className="group relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-orange-500" />

                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="off"
                  placeholder="Mot de passe"
                  className="h-[58px] w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-4 text-[15px] font-semibold text-zinc-900 outline-none transition-all placeholder:font-normal placeholder:text-zinc-400 hover:border-zinc-300 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </label>

            {/* Message erreur */}
            {error && (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5">
                <p className="text-sm font-bold leading-5 text-red-600">
                  {error}
                </p>
              </div>
            )}

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-[15px] font-black text-white shadow-[0_12px_30px_rgba(249,115,22,0.3)] transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-[0_16px_35px_rgba(249,115,22,0.35)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
            >
              {loading && (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              )}

              {loading
                ? "Connexion en cours..."
                : "Se connecter"}
            </button>

            {/* Footer formulaire */}
            <div className="mt-7 flex items-center justify-center gap-2 border-t border-zinc-100 pt-6 text-center text-xs font-medium text-zinc-400">
              <LockKeyhole className="h-3.5 w-3.5" />
              Accès réservé aux utilisateurs autorisés
            </div>
          </div>
        </form>

        {/* Copyright */}
        <p className="mt-6 text-center text-xs font-medium text-white/40">
          © {new Date().getFullYear()} BricoMénage —
          Administration
        </p>
      </div>
    </main>
  );
}