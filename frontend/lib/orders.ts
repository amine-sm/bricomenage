import { adminHeaders, apiFetch } from "@/lib/api";

export type OrderProductItem = {
  id: number;
  article_id?: number | null;
  pack_id?: number | null;
  item_type?: "ARTICLE" | "PACK";
  designation: string;
  image?: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type CreateOrderPayload = {
  customerName: string;
  phone: string;
  wilaya?: string;
  commune?: string;
  address?: string;
  note?: string;
  deliveryFee?: number;
  zrCityId?: string;
  zrDistrictId?: string;
  zrDeliveryType?: "HOME" | "STOP_DESK";
  zrDestinationHubId?: string;
  items: Array<{ articleId?: number; packId?: number; id?: number; type?: "article" | "pack"; quantity: number }>;
};

export const ordersApi = {
  create: (payload: CreateOrderPayload) => apiFetch<{ success: boolean; trackingNumber: string; order: unknown }>("/orders", { method: "POST", body: JSON.stringify(payload) }),
  track: (trackingNumber: string, phone: string) => apiFetch<{ order: unknown; items: unknown[]; history: unknown[] }>("/tracking/check", { method: "POST", body: JSON.stringify({ trackingNumber, phone }) }),
  adminList: () => apiFetch<{ orders: unknown[] }>("/admin/orders", { headers: adminHeaders() }),
  adminDetail: (id: number) =>
    apiFetch<{
      order: unknown;
      items: OrderProductItem[];
      history: unknown[];
    }>(
      `/admin/orders/${id}`,
      {
        headers: adminHeaders(),
      },
    ),
  changeStatus: (id: number, status: string, description = "") => apiFetch<{ success: boolean; order: unknown }>(`/admin/orders/${id}/status`, { method: "PATCH", headers: adminHeaders(), body: JSON.stringify({ status, description }) }),
  update: (id: number, payload: Record<string, unknown>) => apiFetch<{ success: boolean; order: unknown }>(`/admin/orders/${id}`, { method: "PATCH", headers: adminHeaders(), body: JSON.stringify(payload) }),
  remove: (id: number) => apiFetch<{ success: boolean }>(`/admin/orders/${id}`, { method: "DELETE", headers: adminHeaders() }),
};
