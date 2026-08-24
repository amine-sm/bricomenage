import {
  adminHeaders,
  apiFetch,
} from "@/lib/api";

export type ZrTerritory = {
  id: string;
  code?: string;
  name: string;
  nameAr?: string;
  parentId?: string | null;
  level?: string;
  isDeliverable?: boolean;
  hasHomeDelivery?: boolean | null;
  hasPickupPoint?: boolean | null;
};

export type ZrHub = {
  id: string;
  name?: string;
  address?: string;
  cityId?: string | null;
  districtId?: string | null;
};

export type ZrQuote = {
  success: boolean;
  fee: number;
  deliveryType: "HOME" | "STOP_DESK";
  rate?: unknown;
};

export type ZrConfig = {
  success: boolean;
  enabled: boolean;
  configured: boolean;
  baseUrl: string;
  tenantId?: string | null;
  sourceHub?: unknown;
  connection?: {
    ok?: boolean;
    error?: string;
  } | null;
};

export const zrApi = {
  status: () =>
    apiFetch<ZrConfig>(
      "/zr/status",
    ),

  wilayas: () =>
    apiFetch<{
      success: boolean;
      wilayas: ZrTerritory[];
    }>("/zr/wilayas"),

  communes: (
    cityId: string,
    options: {
      stopDeskOnly?: boolean;
    } = {},
  ) => {
    const query = new URLSearchParams({
      cityId,
    });

    if (options.stopDeskOnly) {
      query.set(
        "stopDeskOnly",
        "1",
      );
    }

    return apiFetch<{
      success: boolean;
      communes: ZrTerritory[];
    }>(`/zr/communes?${query.toString()}`);
  },

  hubs: (
    params: {
      cityId?: string;
      districtId?: string;
    } = {},
  ) => {
    const query =
      new URLSearchParams();

    if (params.cityId) {
      query.set(
        "cityId",
        params.cityId,
      );
    }

    if (params.districtId) {
      query.set(
        "districtId",
        params.districtId,
      );
    }

    return apiFetch<{
      success: boolean;
      hubs: ZrHub[];
    }>(
      `/zr/hubs${
        query.toString()
          ? `?${query}`
          : ""
      }`,
    );
  },

  quote: (payload: {
    cityId: string;
    districtId: string;
    deliveryType:
      | "HOME"
      | "STOP_DESK";
  }) =>
    apiFetch<ZrQuote>(
      "/zr/quote",
      {
        method: "POST",
        body: JSON.stringify(
          payload,
        ),
      },
    ),

  adminConfig: () =>
    apiFetch<ZrConfig>(
      "/admin/zr/config",
      {
        headers:
          adminHeaders(),
      },
    ),

  createParcel: (
    orderId: number,
  ) =>
    apiFetch<{
      success: boolean;
      message: string;
      data: {
        parcelId?: string;
        trackingNumber?: string;
        status?: string;
        statusLabel?: string;
      };
    }>(
      `/admin/orders/${orderId}/zr`,
      {
        method: "POST",
        headers:
          adminHeaders(),
      },
    ),

  syncParcel: (
    orderId: number,
  ) =>
    apiFetch<{
      success: boolean;
      message: string;
      data: {
        parcelId?: string;
        trackingNumber?: string;
        status?: string;
        statusLabel?: string;
      };
    }>(
      `/admin/orders/${orderId}/zr/sync`,
      {
        method: "POST",
        headers:
          adminHeaders(),
      },
    ),

  cancelParcel: (
    orderId: number,
  ) =>
    apiFetch<{
      success: boolean;
      message: string;
    }>(
      `/admin/orders/${orderId}/zr`,
      {
        method: "DELETE",
        headers:
          adminHeaders(),
      },
    ),

  label: (
    orderId: number,
  ) =>
    apiFetch<{
      success: boolean;
      data: {
        trackingNumber: string;
        url?: string;
        type?: string;
      };
    }>(
      `/admin/orders/${orderId}/zr/label`,
      {
        headers:
          adminHeaders(),
      },
    ),
};
