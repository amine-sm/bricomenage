import { adminHeaders, apiFetch } from "@/lib/api";

export const purchasesApi = {
  list: () => apiFetch<{ purchases: unknown[] }>("/admin/purchases", { headers: adminHeaders() }),
  create: (payload: { article_id: number; supplier_id?: number; quantity: number; unit_cost?: number; reference?: string; note?: string }) => apiFetch<{ success: boolean; purchase: unknown; article: unknown }>("/admin/purchases", { method: "POST", headers: adminHeaders(), body: JSON.stringify(payload) }),
};
