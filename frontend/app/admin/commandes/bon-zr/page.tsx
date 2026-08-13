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
        className="thermal-barcode-svg h-[74px] w-full"
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

      <div className="thermal-barcode-text mt-1 text-center font-mono text-[11px] font-black tracking-[0.18em] text-black">
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
    <main className="thermal-page min-h-screen bg-zinc-100 px-4 py-6 print:bg-white print:p-0">
      <style jsx global>{`
        /*
         * =====================================================
         * FORMAT THERMIQUE A6
         * 105 mm × 148 mm - portrait
         * =====================================================
         */
        @page {
          size: 105mm 148mm;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 105mm !important;
            min-width: 105mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          html {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            overflow: visible !important;
          }

          *,
          *::before,
          *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-hidden {
            display: none !important;
          }

          /*
           * Une page physique A6.
           * 3 mm de marge interne, mais aucune marge navigateur.
           */
          .thermal-page {
            width: 105mm !important;
            min-height: 148mm !important;
            margin: 0 !important;
            padding: 3mm !important;
            background: #fff !important;
          }

          .print-sheet {
            width: 99mm !important;
            max-width: 99mm !important;
            min-height: 142mm !important;
            margin: 0 auto !important;
            overflow: visible !important;
            border: 0.35mm solid #000 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
          }

          /*
           * Évite autant que possible les coupures au milieu
           * d'un bloc si une commande nécessite une 2e page A6.
           */
          .thermal-tracking,
          .thermal-info-grid,
          .thermal-recipient,
          .thermal-note,
          .thermal-footer {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .thermal-header {
            min-height: 17mm !important;
            gap: 2mm !important;
            padding: 2.5mm 3mm !important;
            border-bottom: 0.45mm solid #000 !important;
            background: #000 !important;
            color: #fff !important;
          }

          .thermal-logo {
            width: 10.5mm !important;
            height: 10.5mm !important;
            border-radius: 1.5mm !important;
          }

          .thermal-brand {
            font-size: 12pt !important;
            line-height: 1.05 !important;
          }

          .thermal-subtitle {
            font-size: 6.2pt !important;
            line-height: 1.1 !important;
            letter-spacing: 0.08em !important;
            color: #fff !important;
          }

          .thermal-zr-badge {
            padding: 1mm 2mm !important;
            border-radius: 1.5mm !important;
            background: #fff !important;
            color: #000 !important;
            font-size: 6pt !important;
            line-height: 1 !important;
          }

          .thermal-date {
            margin-top: 1.2mm !important;
            color: #fff !important;
            font-size: 5.8pt !important;
            line-height: 1.1 !important;
          }

          .thermal-body {
            display: flex !important;
            flex-direction: column !important;
            gap: 2mm !important;
            padding: 2.5mm 3mm 2.8mm !important;
          }

          /*
           * Tailwind space-y ne doit pas ajouter d'espace
           * supplémentaire pendant l'impression.
           */
          .thermal-body > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0 !important;
          }

          .thermal-tracking {
            padding: 2mm !important;
            border: 0.45mm solid #000 !important;
            border-radius: 1.8mm !important;
          }

          .thermal-tracking-head {
            margin-bottom: 1mm !important;
          }

          .thermal-small-label {
            font-size: 5.8pt !important;
            line-height: 1.05 !important;
            letter-spacing: 0.06em !important;
            color: #222 !important;
          }

          .thermal-mode-badge {
            padding: 0.8mm 1.8mm !important;
            border-radius: 1.2mm !important;
            background: #000 !important;
            color: #fff !important;
            font-size: 5.8pt !important;
            line-height: 1 !important;
          }

          .thermal-barcode-svg {
            display: block !important;
            width: 100% !important;
            height: 13mm !important;
            shape-rendering: crispEdges !important;
          }

          .thermal-barcode-text {
            margin-top: 0.5mm !important;
            font-size: 7pt !important;
            line-height: 1 !important;
            letter-spacing: 0.10em !important;
          }

          .thermal-info-grid {
            gap: 1.6mm !important;
          }

          .thermal-info-box {
            padding: 1.8mm 2mm !important;
            border: 0.28mm solid #555 !important;
            border-radius: 1.5mm !important;
          }

          .thermal-info-label {
            font-size: 5.4pt !important;
            line-height: 1.05 !important;
            letter-spacing: 0.05em !important;
            color: #333 !important;
          }

          .thermal-info-value {
            margin-top: 0.6mm !important;
            font-size: 7pt !important;
            line-height: 1.15 !important;
          }

          .thermal-info-value-strong {
            font-size: 10pt !important;
            line-height: 1.05 !important;
          }

          .thermal-recipient,
          .thermal-parcel {
            border: 0.28mm solid #666 !important;
            border-radius: 1.5mm !important;
          }

          .thermal-section-title {
            padding: 1.3mm 2mm !important;
            border-bottom: 0.28mm solid #777 !important;
            background: #f3f3f3 !important;
          }

          .thermal-section-title span {
            color: #222 !important;
            font-size: 5.6pt !important;
            line-height: 1 !important;
            letter-spacing: 0.06em !important;
          }

          .thermal-recipient-body {
            padding: 1.8mm 2.2mm !important;
          }

          .thermal-recipient-body > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.8mm !important;
          }

          .thermal-customer-name {
            font-size: 10pt !important;
            line-height: 1.05 !important;
          }

          .thermal-phone {
            font-size: 9pt !important;
            line-height: 1.05 !important;
          }

          .thermal-address {
            font-size: 7pt !important;
            line-height: 1.25 !important;
          }

          .thermal-location {
            font-size: 7.5pt !important;
            line-height: 1.1 !important;
          }

          .thermal-item-count {
            font-size: 5.5pt !important;
            line-height: 1 !important;
            color: #222 !important;
          }

          .thermal-item-row {
            gap: 1.5mm !important;
            padding: 1.2mm 2mm !important;
          }

          .thermal-item-name {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
            font-size: 6.5pt !important;
            line-height: 1.15 !important;
          }

          .thermal-item-type {
            font-size: 5pt !important;
            line-height: 1 !important;
            color: #444 !important;
          }

          .thermal-quantity {
            padding: 0.7mm 1.6mm !important;
            border-radius: 1mm !important;
            background: #000 !important;
            color: #fff !important;
            font-size: 6.5pt !important;
            line-height: 1 !important;
          }

          .thermal-note {
            padding: 1.6mm 2mm !important;
            border-color: #555 !important;
            border-radius: 1.5mm !important;
          }

          .thermal-note-label {
            font-size: 5.2pt !important;
            color: #333 !important;
          }

          .thermal-note-text {
            margin-top: 0.6mm !important;
            font-size: 6.3pt !important;
            line-height: 1.2 !important;
            color: #111 !important;
          }

          .thermal-footer {
            padding-top: 1.5mm !important;
            border-top: 0.4mm solid #000 !important;
          }

          .thermal-footer strong {
            font-size: 6.5pt !important;
            line-height: 1 !important;
          }

          .thermal-footer span {
            margin-top: 0.6mm !important;
            font-size: 5pt !important;
            line-height: 1.1 !important;
            color: #333 !important;
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

      <section className="print-sheet mx-auto w-full max-w-[520px] overflow-hidden rounded-3xl border-2 border-zinc-950 bg-white shadow-2xl">
        <header className="thermal-header flex items-center justify-between gap-4 border-b-2 border-zinc-950 bg-zinc-950 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-bricomenage.jpeg"
              alt="BricoMénage"
              className="thermal-logo h-12 w-12 rounded-xl bg-white object-cover"
            />

            <div>
              <strong className="thermal-brand block text-xl font-black">
                BricoMénage
              </strong>

              <span className="thermal-subtitle text-[10px] font-bold uppercase tracking-[0.16em] text-orange-400">
                Bon d’expédition
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="thermal-zr-badge inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase">
              <Truck className="h-3 w-3" />
              ZR Express
            </span>

            <span className="thermal-date mt-2 block text-[10px] text-zinc-400">
              {formatDate(
                order.created_at,
              )}
            </span>
          </div>
        </header>

        <div className="thermal-body space-y-4 p-5">
          <div className="thermal-tracking rounded-2xl border-2 border-black p-3">
            <div className="thermal-tracking-head mb-2 flex items-center justify-between gap-3">
              <span className="thermal-small-label text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                Tracking ZR
              </span>

              <span className="thermal-mode-badge rounded-lg bg-black px-3 py-1 text-[10px] font-black text-white">
                {deliveryMode}
              </span>
            </div>

            <Code39Barcode
              value={zrTracking}
            />
          </div>

          <div className="thermal-info-grid grid grid-cols-2 gap-3">
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

          <section className="thermal-recipient rounded-2xl border border-zinc-300">
            <div className="thermal-section-title border-b border-zinc-300 bg-zinc-50 px-4 py-2">
              <span className="thermal-small-label text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                Destinataire
              </span>
            </div>

            <div className="thermal-recipient-body space-y-2 p-4">
              <h1 className="thermal-customer-name text-xl font-black uppercase leading-tight text-black">
                {order.customer_name}
              </h1>

              <p className="thermal-phone text-lg font-black text-black">
                {order.phone}
              </p>

              <p className="thermal-address text-sm font-bold leading-5 text-zinc-800">
                {order.address || "-"}
              </p>

              <p className="thermal-location text-sm font-black text-black">
                {order.commune} — {order.wilaya}
              </p>
            </div>
          </section>

          <section className="thermal-parcel rounded-2xl border border-zinc-300">
            <div className="thermal-section-title flex items-center justify-between border-b border-zinc-300 bg-zinc-50 px-4 py-2">
              <span className="thermal-small-label text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                Contenu du colis
              </span>

              <span className="thermal-item-count text-[10px] font-black text-zinc-500">
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
                  className="thermal-item-row flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <strong className="thermal-item-name block truncate text-xs font-black text-black">
                      {item.designation}
                    </strong>

                    <span className="thermal-item-type text-[9px] font-bold uppercase text-zinc-400">
                      {item.item_type ===
                      "PACK"
                        ? "Pack"
                        : "Article"}
                    </span>
                  </div>

                  <span className="thermal-quantity shrink-0 rounded-lg bg-zinc-950 px-3 py-1 text-xs font-black text-white">
                    × {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="thermal-info-grid grid grid-cols-2 gap-3">
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
            <section className="thermal-note rounded-2xl border border-dashed border-zinc-400 p-3">
              <span className="thermal-note-label text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400">
                Remarque
              </span>

              <p className="thermal-note-text mt-1 text-xs font-bold leading-5 text-zinc-700">
                {order.note}
              </p>
            </section>
          )}

          <footer className="thermal-footer border-t-2 border-black pt-3 text-center">
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
    <div className="thermal-info-box rounded-2xl border border-zinc-300 p-3">
      <span className="thermal-info-label block text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </span>

      <strong
        className={`thermal-info-value mt-1 block break-words text-black ${
          strong
            ? "thermal-info-value-strong text-lg font-black"
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
