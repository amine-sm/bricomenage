export const API_URL = String(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  details: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message); this.name = "ApiError"; this.status = status; this.details = details;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
      ...init,
      headers: { Accept: "application/json", ...(!isFormData ? { "Content-Type": "application/json" } : {}), ...(init.headers || {}) },
      cache: "no-store",
      signal: init.signal || controller.signal,
    });
    const text = await response.text();
    let data: any = {};
    if (text) { try { data = JSON.parse(text); } catch { data = { message: text }; } }
    if (!response.ok) throw new ApiError(data.message || data.error || `Erreur du serveur (${response.status}).`, response.status, data.details || data);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("Le serveur ne répond pas. Vérifiez que le backend est démarré.");
    throw new Error(error instanceof Error ? error.message : "Impossible de contacter le backend.");
  } finally { clearTimeout(timeout); }
}

export function getAdminToken() { return typeof window === "undefined" ? "" : localStorage.getItem("admin_token") || ""; }
export function adminHeaders(): Record<string, string> { const token = getAdminToken(); return token ? { Authorization: `Bearer ${token}` } : {}; }
