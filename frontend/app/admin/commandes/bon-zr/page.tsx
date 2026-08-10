"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  LoaderCircle,
  Printer,
  Truck,
} from "lucide-react";

import {
  useSearchParams,
} from "next/navigation";

import {
  adminHeaders,
  apiFetch,
} from "@/lib/api";

type OrderItem = {
  id: number;
  designation: string;
  quantity: number;
  item_type?: "ARTICLE" | "PACK";
};

type Order = {
  id: number;
  tracking_number: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  commune: string;
  address?: string | null;
  note?: string | null;
  subtotal?: number | null;
  delivery_fee?: number | null;
  total: number;
  created_at: string;
  zr_tracking_number?: string | null;
  zr_delivery_type?: string | null;
  zr_status?: string | null;
  zr_status_label?: string | null;
};

type DetailResponse = {
  order: Order;
  items: OrderItem[];
};

const CODE39: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  "$": "nwnwnwnnn",
  "/": "nwnwnnnwn",
  "+": "nwnnnwnwn",
  "%": "nnnwnwnwn",
  "*": "nwnnwnwnn",
};

function formatPrice(
  value?: number | null,
) {
  return new Intl.NumberFormat(
    "fr-DZ",
  ).format(
    Number(value || 0),
  );
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "fr-DZ",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function Code39Barcode({
  value,
}: {
  value: string;
}) {
  const encoded = useMemo(
    () => {
      const normalized = value
        .toUpperCase()
        .replace(
          /[^0-9A-Z. \-$\/+%]/g,
          "",
        );

      const source = `*${normalized}*`;
      const narrow = 2;
      const wide = 5;
      const gap = 2;
      let x = 0;
      const bars: Array<{
        x: number;
        width: number;
      }> = [];

      for (
        let charIndex = 0;
        charIndex < source.length;
        charIndex += 1
      ) {
        const pattern =
          CODE39[source[charIndex]] ||
          CODE39["-"];

        for (
          let index = 0;
          index < pattern.length;
          index += 1
        ) {
          const width =
            pattern[index] === "w"
              ? wide
              : narrow;

          if (index % 2 === 0) {
            bars.push({
              x,
              width,
            });
          }

          x += width;
        }

        x += gap;
      }

      return {
        bars,
        width: Math.max(x, 1),
        normalized,
      };
    },
    [value],
  );

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${encoded.width} 58`}
        role="img"
        aria-label={`Code-barres ${encoded.normalized}`}
        className="h-[74px] w-full"
        preserveAspectRatio="none"
      >
        <rect
          x="0"
          y="0"
          width={encoded.width}
          height="58"
          fill="white"
        />

        {encoded.bars.map(
          (bar, index) => (
            <rect
              key={`${bar.x}-${index}`}
              x={bar.x}
              y="2"
              width={bar.width}
              height="54"
              fill="black"
            />
          ),
        )}
      </svg>

      <div className="mt-1 text-center font-mono text-[11px] font-black tracking-[0.18em] text-black">
        {encoded.normalized}
      </div>
    </div>
  );
}

function LabelContent() {
  const params =
    useSearchParams();

  const orderId = Number(
    params.get("id") || 0,
  );

  const [detail, setDetail] =
    useState<DetailResponse | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!orderId) {
        setError(
          "Identifiant de commande manquant.",
        );
        setLoading(false);
        return;
      }

      try {
        const response =
          await apiFetch<DetailResponse>(
            `/admin/orders/${orderId}`,
            {
              headers:
                adminHeaders(),
            },
          );

        if (active) {
          setDetail(response);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Impossible de charger le bon ZR.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <LoaderCircle className="h-9 w-9 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <strong className="text-red-600">
            {error ||
              "Commande introuvable."}
          </strong>
        </div>
      </div>
    );
  }

  const { order, items } = detail;
  const zrTracking =
    order.zr_tracking_number ||
    order.tracking_number;

  const deliveryMode =
    order.zr_delivery_type ===
    "STOP_DESK"
      ? "STOP DESK"
      : "DOMICILE";

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 print:bg-white print:p-0">
      <style jsx global>{`
        @page {
          size: A6 portrait;
          margin: 5mm;
        }

        @media print {
          html,
          body {
            background: #fff !important;
          }

          .print-hidden {
            display: none !important;
          }

          .print-sheet {
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="print-hidden mx-auto mb-4 flex max-w-[520px] items-center justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            window.history.back()
          }
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-700 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <button
          type="button"
          onClick={() =>
            window.print()
          }
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-black text-white shadow-lg shadow-orange-500/20"
        >
          <Printer className="h-4 w-4" />
          Imprimer le bon
        </button>
      </div>

      <section className="print-sheet mx-auto min-h-[700px] w-full max-w-[520px] overflow-hidden rounded-3xl border-2 border-zinc-950 bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b-2 border-zinc-950 bg-zinc-950 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-bricomenage.jpeg"
              alt="BricoMénage"
              className="h-12 w-12 rounded-xl bg-white object-cover"
            />

            <div>
              <strong className="block text-xl font-black">
                BricoMénage
              </strong>

              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-400">
                Bon d’expédition
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase">
              <Truck className="h-3 w-3" />
              ZR Express
            </span>

            <span className="mt-2 block text-[10px] text-zinc-400">
              {formatDate(
                order.created_at,
              )}
            </span>
          </div>
        </header>

        <div className="space-y-4 p-5">
          <div className="rounded-2xl border-2 border-black p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                Tracking ZR
              </span>

              <span className="rounded-lg bg-black px-3 py-1 text-[10px] font-black text-white">
                {deliveryMode}
              </span>
            </div>

            <Code39Barcode
              value={zrTracking}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoBox
              label="Référence commande"
              value={
                order.tracking_number
              }
            />

            <InfoBox
              label="Montant à encaisser"
              value={`${formatPrice(
                order.total,
              )} DA`}
              strong
            />
          </div>

          <section className="rounded-2xl border border-zinc-300">
            <div className="border-b border-zinc-300 bg-zinc-50 px-4 py-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                Destinataire
              </span>
            </div>

            <div className="space-y-2 p-4">
              <h1 className="text-xl font-black uppercase leading-tight text-black">
                {order.customer_name}
              </h1>

              <p className="text-lg font-black text-black">
                {order.phone}
              </p>

              <p className="text-sm font-bold leading-5 text-zinc-800">
                {order.address || "-"}
              </p>

              <p className="text-sm font-black text-black">
                {order.commune} — {order.wilaya}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-300">
            <div className="flex items-center justify-between border-b border-zinc-300 bg-zinc-50 px-4 py-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                Contenu du colis
              </span>

              <span className="text-[10px] font-black text-zinc-500">
                {items.reduce(
                  (sum, item) =>
                    sum +
                    Number(
                      item.quantity || 0,
                    ),
                  0,
                )}{" "}
                unité(s)
              </span>
            </div>

            <div className="divide-y divide-zinc-200">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <strong className="block truncate text-xs font-black text-black">
                      {item.designation}
                    </strong>

                    <span className="text-[9px] font-bold uppercase text-zinc-400">
                      {item.item_type ===
                      "PACK"
                        ? "Pack"
                        : "Article"}
                    </span>
                  </div>

                  <span className="shrink-0 rounded-lg bg-zinc-950 px-3 py-1 text-xs font-black text-white">
                    × {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <InfoBox
              label="Frais livraison"
              value={`${formatPrice(
                order.delivery_fee,
              )} DA`}
            />

            <InfoBox
              label="Statut ZR"
              value={
                order.zr_status_label ||
                order.zr_status ||
                "Créé"
              }
            />
          </div>

          {order.note && (
            <section className="rounded-2xl border border-dashed border-zinc-400 p-3">
              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400">
                Remarque
              </span>

              <p className="mt-1 text-xs font-bold leading-5 text-zinc-700">
                {order.note}
              </p>
            </section>
          )}

          <footer className="border-t-2 border-black pt-3 text-center">
            <strong className="block text-xs font-black uppercase text-black">
              BricoMénage × ZR Express
            </strong>

            <span className="mt-1 block text-[9px] font-semibold text-zinc-400">
              Bon généré depuis l’administration BricoMénage
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}

function InfoBox({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-300 p-3">
      <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </span>

      <strong
        className={`mt-1 block break-words text-black ${
          strong
            ? "text-lg font-black"
            : "text-xs font-black"
        }`}
      >
        {value}
      </strong>
    </div>
  );
}

function ZrPrintPageContent() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-100">
          <LoaderCircle className="h-9 w-9 animate-spin text-orange-500" />
        </div>
      }
    >
      <LabelContent />
    </Suspense>
  );
}

export default function ZrPrintPage() {
  return (
    <Suspense fallback={<PageSearchParamsLoading />}>
      <ZrPrintPageContent />
    </Suspense>
  );
}

function PageSearchParamsLoading() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-zinc-200" />
        <div className="mt-6 h-64 animate-pulse rounded-[28px] bg-zinc-100" />
      </div>
    </main>
  );
}
