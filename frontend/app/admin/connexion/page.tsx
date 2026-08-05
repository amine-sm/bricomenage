"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, LoaderCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await apiFetch<{ token: string; admin: unknown }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      localStorage.setItem("admin_token", response.token);
      localStorage.setItem("admin_user", JSON.stringify(response.admin));
      router.replace("/admin/dashboard");
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur de connexion."); }
    finally { setLoading(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
    <form onSubmit={submit} className="w-full max-w-md rounded-[32px] bg-white p-7 shadow-2xl sm:p-9">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-xl font-black text-white">BM</span>
      <h1 className="mt-6 text-3xl font-black">Administration</h1><p className="mt-2 text-sm text-zinc-500">Connectez-vous pour gérer BricoMénage.</p>
      <label className="mt-7 block text-sm font-bold">E-mail<div className="relative mt-2"><Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"/><input name="email" type="email" required defaultValue="admin@bricomenage.dz" className="h-14 w-full rounded-2xl border border-zinc-200 pl-12 pr-4 outline-none focus:border-orange-500"/></div></label>
      <label className="mt-4 block text-sm font-bold">Mot de passe<div className="relative mt-2"><LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"/><input name="password" type="password" required defaultValue="Admin@123" className="h-14 w-full rounded-2xl border border-zinc-200 pl-12 pr-4 outline-none focus:border-orange-500"/></div></label>
      {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
      <button disabled={loading} className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 font-black text-white hover:bg-orange-600 disabled:opacity-60">{loading && <LoaderCircle className="h-5 w-5 animate-spin"/>}{loading ? "Connexion..." : "Connexion"}</button>
    </form>
  </main>;
}
