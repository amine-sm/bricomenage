import {
  adminHeaders,
  apiFetch,
} from "@/lib/api";

export type DashboardStats = {
  articles: number;
  categories: number;
  orders: number;
  revenue: number;
  suppliers: number;
  lowStock: number;
  pendingOrders: number;
  deliveredOrders: number;
};

export type DashboardRecentOrder = {
  id: number;
  tracking_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};

export type DashboardSalesPoint = {
  label: string;
  revenue: number;
  orders: number;
};

export type DashboardResponse = {
  success: boolean;
  stats: DashboardStats;
  recentOrders: DashboardRecentOrder[];
  salesChart: DashboardSalesPoint[];
};

export async function getAdminDashboard(): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>("/admin/dashboard", {
    method: "GET",
    headers: adminHeaders(),
  });
}
