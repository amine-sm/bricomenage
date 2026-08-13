"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  KeyRound,
  LoaderCircle,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { adminHeaders, apiFetch } from "@/lib/api";

type PermissionItem = { key: string; label: string };
type PermissionGroup = { key: string; label: string; permissions: PermissionItem[] };

type AdminUser = {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  role: "SUPER_ADMIN" | "USER" | string;
  permissions: string[];
  created_at?: string;
  updated_at?: string;
};

type UserForm = {
  id?: number;
  name: string;
  email: string;
  password: string;
  is_active: boolean;
  permissions: string[];
};

const emptyForm: UserForm = {
  name: "",
  email: "",
  password: "",
  is_active: true,
  permissions: [],
};

function dateLabel(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [usersResponse, permissionsResponse] = await Promise.all([
        apiFetch<{ success: boolean; users: AdminUser[] }>("/admin/users", {
          headers: adminHeaders(),
        }),
        apiFetch<{ success: boolean; groups: PermissionGroup[] }>("/admin/users/permissions", {
          headers: adminHeaders(),
        }),
      ]);
      setUsers(usersResponse.users || []);
      setGroups(permissionsResponse.groups || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 4500);
    return () => window.clearTimeout(timer);
  }, [success]);

  const normalUsers = useMemo(
    () => users.filter((user) => String(user.role).toUpperCase() !== "SUPER_ADMIN"),
    [users],
  );

  function openCreate() {
    setForm({ ...emptyForm, permissions: [] });
    setError("");
    setModalOpen(true);
  }

  function openEdit(user: AdminUser) {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: "",
      is_active: Boolean(user.is_active),
      permissions: [...(user.permissions || [])],
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setForm({ ...emptyForm, permissions: [] });
  }

  function togglePermission(permission: string) {
    setForm((current) => {
      const has = current.permissions.includes(permission);
      return {
        ...current,
        permissions: has
          ? current.permissions.filter((item) => item !== permission)
          : [...current.permissions, permission],
      };
    });
  }

  function toggleGroup(group: PermissionGroup) {
    const keys = group.permissions.map((permission) => permission.key);
    const allSelected = keys.every((key) => form.permissions.includes(key));

    setForm((current) => ({
      ...current,
      permissions: allSelected
        ? current.permissions.filter((permission) => !keys.includes(permission))
        : [...new Set([...current.permissions, ...keys])],
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: form.name,
        email: form.email,
        is_active: form.is_active,
        permissions: form.permissions,
        ...(form.password ? { password: form.password } : {}),
      };

      if (!form.id && !form.password) {
        throw new Error("Le mot de passe est obligatoire pour un nouvel utilisateur.");
      }

      const response = await apiFetch<{ success: boolean; message?: string; user: AdminUser }>(
        form.id ? `/admin/users/${form.id}` : "/admin/users",
        {
          method: form.id ? "PUT" : "POST",
          headers: adminHeaders(),
          body: JSON.stringify(payload),
        },
      );

      setSuccess(response.message || (form.id ? "Utilisateur modifié." : "Utilisateur créé."));
      setModalOpen(false);
      setForm({ ...emptyForm, permissions: [] });
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(user: AdminUser) {
    const confirmed = window.confirm(
      `Supprimer définitivement l’utilisateur « ${user.name} » ?`,
    );
    if (!confirmed) return;

    setDeletingId(user.id);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch<{ success: boolean; message?: string }>(
        `/admin/users/${user.id}`,
        { method: "DELETE", headers: adminHeaders() },
      );
      setSuccess(response.message || "Utilisateur supprimé.");
      setUsers((current) => current.filter((item) => item.id !== user.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Suppression impossible.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-orange-700">
            <ShieldCheck className="h-4 w-4" /> Super Admin
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
            Utilisateurs & autorisations
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-zinc-500">
            Créez des comptes employés et choisissez exactement les rubriques et actions qu’ils peuvent utiliser.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
        >
          <Plus className="h-5 w-5" /> Ajouter un utilisateur
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[26px] border border-zinc-200 bg-white p-5 shadow-sm">
          <UsersRound className="h-6 w-6 text-orange-500" />
          <p className="mt-4 text-3xl font-black text-zinc-950">{users.length}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Comptes admin</p>
        </div>
        <div className="rounded-[26px] border border-zinc-200 bg-white p-5 shadow-sm">
          <UserRound className="h-6 w-6 text-blue-500" />
          <p className="mt-4 text-3xl font-black text-zinc-950">{normalUsers.length}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Utilisateurs normaux</p>
        </div>
        <div className="rounded-[26px] border border-zinc-200 bg-white p-5 shadow-sm">
          <Check className="h-6 w-6 text-emerald-500" />
          <p className="mt-4 text-3xl font-black text-zinc-950">
            {normalUsers.filter((user) => user.is_active).length}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Actifs</p>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {success}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-black text-zinc-500">
            <LoaderCircle className="h-5 w-5 animate-spin text-orange-500" /> Chargement...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-zinc-50 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-400">
                <tr>
                  <th className="px-5 py-4">Utilisateur</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Autorisations</th>
                  <th className="px-5 py-4">Statut</th>
                  <th className="px-5 py-4">Créé le</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {users.map((user) => {
                  const superAdmin = String(user.role).toUpperCase() === "SUPER_ADMIN";
                  return (
                    <tr key={user.id} className="align-top">
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <span className={superAdmin ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600" : "flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600"}>
                            {superAdmin ? <ShieldCheck className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                          </span>
                          <div>
                            <p className="font-black text-zinc-950">{user.name}</p>
                            <p className="mt-1 text-xs font-semibold text-zinc-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <span className={superAdmin ? "inline-flex rounded-full bg-orange-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-orange-700" : "inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-blue-700"}>
                          {superAdmin ? "Super Admin" : "Utilisateur"}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        {superAdmin ? (
                          <span className="text-xs font-black text-emerald-600">Toutes les autorisations</span>
                        ) : user.permissions.length ? (
                          <div className="flex max-w-sm flex-wrap gap-1.5">
                            {user.permissions.slice(0, 6).map((permission) => (
                              <span key={permission} className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600">
                                {permission}
                              </span>
                            ))}
                            {user.permissions.length > 6 && (
                              <span className="rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-black text-white">+{user.permissions.length - 6}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-zinc-400">Aucune</span>
                        )}
                      </td>
                      <td className="px-5 py-5">
                        <span className={user.is_active ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-700" : "inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-black uppercase text-red-700"}>
                          <span className={user.is_active ? "h-2 w-2 rounded-full bg-emerald-500" : "h-2 w-2 rounded-full bg-red-500"} />
                          {user.is_active ? "Actif" : "Désactivé"}
                        </span>
                      </td>
                      <td className="px-5 py-5 text-xs font-semibold text-zinc-500">{dateLabel(user.created_at)}</td>
                      <td className="px-5 py-5">
                        {superAdmin ? (
                          <p className="text-right text-[11px] font-bold text-zinc-400">Compte principal protégé</p>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => openEdit(user)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 transition hover:bg-orange-100 hover:text-orange-600" aria-label="Modifier">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button type="button" disabled={deletingId === user.id} onClick={() => void removeUser(user)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50" aria-label="Supprimer">
                              {deletingId === user.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-zinc-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5">
          <button type="button" aria-label="Fermer" onClick={closeModal} className="absolute inset-0" />
          <form onSubmit={submit} className="relative z-10 max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-t-[32px] bg-white p-5 shadow-2xl sm:rounded-[32px] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                  {form.id ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </span>
                <h2 className="mt-3 text-2xl font-black text-zinc-950">
                  {form.id ? "Modifier l’utilisateur" : "Nouvel utilisateur"}
                </h2>
                <p className="mt-1 text-sm font-semibold text-zinc-500">Choisissez les accès nécessaires à son travail.</p>
              </div>
              <button type="button" onClick={closeModal} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-black text-zinc-700">
                Nom complet
                <input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 h-13 w-full rounded-2xl border border-zinc-200 px-4 font-semibold outline-none transition focus:border-orange-500" placeholder="Ex. Mohamed Benali" />
              </label>
              <label className="text-sm font-black text-zinc-700">
                E-mail de connexion
                <input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="mt-2 h-13 w-full rounded-2xl border border-zinc-200 px-4 font-semibold outline-none transition focus:border-orange-500" placeholder="user@bricomenage.dz" />
              </label>
              <label className="text-sm font-black text-zinc-700 sm:col-span-2">
                <span className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Mot de passe {form.id ? "(laisser vide pour conserver)" : ""}</span>
                <input required={!form.id} minLength={8} type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="mt-2 h-13 w-full rounded-2xl border border-zinc-200 px-4 font-semibold outline-none transition focus:border-orange-500" placeholder={form.id ? "Nouveau mot de passe facultatif" : "8 caractères minimum"} />
              </label>
            </div>

            <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div>
                <p className="text-sm font-black text-zinc-900">Compte actif</p>
                <p className="mt-1 text-xs font-semibold text-zinc-500">Un compte désactivé ne peut plus se connecter.</p>
              </div>
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} className="h-5 w-5 accent-orange-500" />
            </label>

            <div className="mt-7">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-zinc-950">Autorisations</h3>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">Les contrôles sont appliqués au menu et surtout au backend.</p>
                </div>
                <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-600">{form.permissions.length} sélectionnée(s)</span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {groups.map((group) => {
                  const keys = group.permissions.map((permission) => permission.key);
                  const allSelected = keys.every((key) => form.permissions.includes(key));
                  return (
                    <section key={group.key} className="rounded-[24px] border border-zinc-200 p-4">
                      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                        <div>
                          <h4 className="font-black text-zinc-950">{group.label}</h4>
                          <p className="mt-0.5 text-[11px] font-semibold text-zinc-400">{group.permissions.length} autorisation(s)</p>
                        </div>
                        <button type="button" onClick={() => toggleGroup(group)} className={allSelected ? "rounded-xl bg-orange-500 px-3 py-2 text-[10px] font-black uppercase text-white" : "rounded-xl bg-zinc-100 px-3 py-2 text-[10px] font-black uppercase text-zinc-600"}>
                          {allSelected ? "Tout retirer" : "Tout autoriser"}
                        </button>
                      </div>
                      <div className="mt-3 space-y-2">
                        {group.permissions.map((permission) => {
                          const checked = form.permissions.includes(permission.key);
                          return (
                            <label key={permission.key} className={checked ? "flex cursor-pointer items-center gap-3 rounded-xl bg-orange-50 px-3 py-2.5" : "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-zinc-50"}>
                              <input type="checkbox" checked={checked} onChange={() => togglePermission(permission.key)} className="h-4 w-4 accent-orange-500" />
                              <div className="min-w-0">
                                <p className="text-xs font-black text-zinc-800">{permission.label}</p>
                                <p className="mt-0.5 truncate text-[10px] font-semibold text-zinc-400">{permission.key}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-zinc-100 pt-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeModal} className="min-h-12 rounded-2xl bg-zinc-100 px-5 py-3 text-sm font-black text-zinc-700">Annuler</button>
              <button disabled={saving} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 disabled:opacity-60">
                {saving && <LoaderCircle className="h-5 w-5 animate-spin" />}
                {saving ? "Enregistrement..." : form.id ? "Enregistrer les modifications" : "Créer l’utilisateur"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
