export const API_URL = String(
  process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api",
).replace(/\/+$/, "");

function getApiOrigin() {
  try {
    return new URL(API_URL).origin;
  } catch {
    return "";
  }
}

const API_ORIGIN = getApiOrigin();

/**
 * Normalise les fichiers envoyés par le backend.
 *
 * Exemples pris en charge :
 * - uploads/products/photo.jpg
 * - /uploads/products/photo.jpg
 * - /api/uploads/products/photo.jpg
 * - https://bricomenage.com/uploads/products/photo.jpg
 * - https://bricomenage.com/api/uploads/products/photo.jpg
 *
 * Les images locales du frontend (/images/...), blob:, data: et les
 * images hébergées sur un autre domaine restent inchangées.
 */
export function mediaUrl(
  value?: string | null,
): string {
  if (!value) {
    return "";
  }

  const original = String(value).trim();

  if (!original) {
    return "";
  }

  if (
    original.startsWith("blob:") ||
    original.startsWith("data:")
  ) {
    return original;
  }

  const normalized = original.replace(/\\/g, "/");

  // Ressources statiques du frontend Next.js.
  if (
    normalized.startsWith("/images/") ||
    normalized.startsWith("/_next/")
  ) {
    return normalized;
  }

  // Ancien format absolu : https://bricomenage.com/uploads/...
  if (/^https?:\/\//i.test(normalized)) {
    try {
      const url = new URL(normalized);

      if (
        API_ORIGIN &&
        url.origin === API_ORIGIN &&
        url.pathname.startsWith("/uploads/")
      ) {
        return `${API_URL}${url.pathname}${url.search}${url.hash}`;
      }

      // Déjà au bon format : https://.../api/uploads/...
      if (
        API_ORIGIN &&
        url.origin === API_ORIGIN &&
        url.pathname.startsWith("/api/uploads/")
      ) {
        return `${API_ORIGIN}${url.pathname}${url.search}${url.hash}`;
      }

      return normalized;
    } catch {
      return normalized;
    }
  }

  // Le backend peut parfois renvoyer /api/uploads/... directement.
  if (normalized.startsWith("/api/uploads/")) {
    return API_ORIGIN
      ? `${API_ORIGIN}${normalized}`
      : normalized;
  }

  // Formats relatifs historiques enregistrés en base.
  if (normalized.startsWith("/uploads/")) {
    return `${API_URL}${normalized}`;
  }

  if (normalized.startsWith("uploads/")) {
    return `${API_URL}/${normalized}`;
  }

  return normalized;
}

function normalizeApiValue(
  value: unknown,
): unknown {
  if (typeof value === "string") {
    return mediaUrl(value);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeApiValue);
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const result: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(
      value as Record<string, unknown>,
    )) {
      result[key] = normalizeApiValue(child);
    }

    return result;
  }

  return value;
}

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" &&
    init.body instanceof FormData;

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    25_000,
  );

  try {
    const response = await fetch(
      `${API_URL}${
        path.startsWith("/")
          ? path
          : `/${path}`
      }`,
      {
        ...init,
        headers: {
          Accept: "application/json",
          ...(!isFormData
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),
          ...(init.headers || {}),
        },
        cache: "no-store",
        signal:
          init.signal || controller.signal,
      },
    );

    const text = await response.text();
    let data: any = {};

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          message: text,
        };
      }
    }

    if (!response.ok) {
      throw new ApiError(
        data.message ||
          data.error ||
          `Erreur du serveur (${response.status}).`,
        response.status,
        data.details || data,
      );
    }

    // Corrige automatiquement les anciennes et nouvelles URLs /uploads.
    return normalizeApiValue(data) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw new Error(
        "Le serveur ne répond pas. Vérifiez que le backend est démarré.",
      );
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Impossible de contacter le backend.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function getAdminToken() {
  return typeof window === "undefined"
    ? ""
    : localStorage.getItem("admin_token") || "";
}

export function adminHeaders(): Record<
  string,
  string
> {
  const token = getAdminToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}
