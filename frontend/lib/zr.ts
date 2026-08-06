import { adminHeaders, apiFetch } from "@/lib/api";
export type ZrConfig = { success: boolean; configured: boolean; baseUrl: string | null; paths: Record<string, boolean> };
export const zrApi = {
  config: () => apiFetch<ZrConfig>("/zr/config", { headers: adminHeaders() }),
  test: () => apiFetch<{success:boolean;data:unknown}>("/zr/test", { headers: adminHeaders() }),
  listParcels: (params?: Record<string,string>) => apiFetch<{success:boolean;data:unknown}>(`/zr/parcels${params ? `?${new URLSearchParams(params)}` : ""}`, { headers: adminHeaders() }),
  createParcel: (payload: Record<string,unknown>) => apiFetch<{success:boolean;data:unknown}>("/zr/parcels", { method:"POST", headers:adminHeaders(), body:JSON.stringify(payload) }),
  markReady: (payload: Record<string,unknown>) => apiFetch<{success:boolean;data:unknown}>("/zr/parcels/ready", { method:"PATCH", headers:adminHeaders(), body:JSON.stringify(payload) }),
};
