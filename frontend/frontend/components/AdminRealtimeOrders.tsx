"use client";

import {
  BellRing,
  ShoppingCart,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getAdminSocket,
} from "@/lib/realtime";

type RealtimeOrder = {
  id: number;
  tracking_number: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  commune: string;
  address?: string;
  note?: string;
  total: number;
  status: string;
  created_at: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat(
    "fr-DZ",
  ).format(Number(value || 0));
}

function formatOrderTime(
  value: string,
) {
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Maintenant";
  }

  return new Intl.DateTimeFormat(
    "fr-DZ",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  ).format(date);
}

function playOrderSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const context =
      new AudioContextClass();

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      880,
      context.currentTime,
    );

    oscillator.frequency.setValueAtTime(
      1175,
      context.currentTime + 0.14,
    );

    gain.gain.setValueAtTime(
      0.0001,
      context.currentTime,
    );

    gain.gain.exponentialRampToValueAtTime(
      0.16,
      context.currentTime + 0.02,
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.34,
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(
      context.currentTime + 0.36,
    );

    window.setTimeout(
      () => context.close(),
      500,
    );
  } catch {
    // Le navigateur peut bloquer l'audio avant une interaction utilisateur.
  }
}

export default function AdminRealtimeOrders() {
  const [connected, setConnected] =
    useState(false);

  const [order, setOrder] =
    useState<RealtimeOrder | null>(
      null,
    );

  const hideTimer =
    useRef<number | null>(null);

  useEffect(() => {
    const socket =
      getAdminSocket();

    if (!socket) {
      return;
    }

    function onConnect() {
      setConnected(true);
    }

    function onDisconnect() {
      setConnected(false);
    }

    function onNewOrder(
      newOrder: RealtimeOrder,
    ) {
      setOrder(newOrder);
      playOrderSound();

      window.dispatchEvent(
        new CustomEvent(
          "bricomenage:new-order",
          {
            detail: newOrder,
          },
        ),
      );

      window.dispatchEvent(
        new Event(
          "bricomenage:orders-count-refresh",
        ),
      );

      if (
        "Notification" in window &&
        Notification.permission ===
          "granted"
      ) {
        new Notification(
          "Nouvelle commande BricoMénage",
          {
            body: `${newOrder.customer_name} — ${formatPrice(newOrder.total)} DA`,
          },
        );
      }

      if (hideTimer.current) {
        window.clearTimeout(
          hideTimer.current,
        );
      }

      hideTimer.current =
        window.setTimeout(
          () => setOrder(null),
          8000,
        );
    }

    function onStatusUpdated(
      update: {
        id: number;
        status: string;
        updated_at?: string;
      },
    ) {
      window.dispatchEvent(
        new CustomEvent(
          "bricomenage:order-status",
          {
            detail: update,
          },
        ),
      );

      window.dispatchEvent(
        new Event(
          "bricomenage:orders-count-refresh",
        ),
      );
    }

    socket.on(
      "connect",
      onConnect,
    );
    socket.on(
      "disconnect",
      onDisconnect,
    );
    socket.on(
      "order:new",
      onNewOrder,
    );
    socket.on(
      "order:status-updated",
      onStatusUpdated,
    );

    if (!socket.connected) {
      socket.connect();
    } else {
      setConnected(true);
    }

    return () => {
      socket.off(
        "connect",
        onConnect,
      );
      socket.off(
        "disconnect",
        onDisconnect,
      );
      socket.off(
        "order:new",
        onNewOrder,
      );
      socket.off(
        "order:status-updated",
        onStatusUpdated,
      );

      if (hideTimer.current) {
        window.clearTimeout(
          hideTimer.current,
        );
      }
    };
  }, []);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[170] hidden items-center gap-2 rounded-full border border-zinc-200 bg-white/95 px-3 py-2 text-[11px] font-black shadow-lg backdrop-blur sm:flex">
        {connected ? (
          <>
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-zinc-600">
              Temps réel actif
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-zinc-500">
              Reconnexion...
            </span>
          </>
        )}
      </div>

      {order && (
        <div className="fixed right-4 top-4 z-[190] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-[26px] border border-orange-200 bg-white shadow-[0_28px_80px_rgba(24,24,27,0.22)] sm:right-6 sm:top-6">
          <div className="relative bg-gradient-to-r from-zinc-950 via-zinc-900 to-orange-950 px-5 py-5 text-white">
            <button
              type="button"
              onClick={() =>
                setOrder(null)
              }
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 pr-10">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-950/30">
                <BellRing className="h-6 w-6" />
              </span>

              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-300">
                  Nouvelle commande
                </span>
                <h3 className="mt-1 text-lg font-black">
                  {order.tracking_number}
                </h3>

                <span className="mt-1 block text-[11px] font-bold text-zinc-300">
                  Reçue à {formatOrderTime(
                    order.created_at,
                  )} · notification 8 s
                </span>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-zinc-400">
                  Client
                </span>
                <strong className="mt-1 block text-sm font-black text-zinc-950">
                  {order.customer_name}
                </strong>
                <span className="mt-1 block text-xs text-zinc-500">
                  {order.phone}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-zinc-400">
                  Total
                </span>
                <strong className="mt-1 block text-lg font-black text-orange-600">
                  {formatPrice(
                    order.total,
                  )} DA
                </strong>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-orange-50 px-4 py-3 text-xs font-bold text-orange-800">
              <ShoppingCart className="h-4 w-4 shrink-0" />
              {order.commune}, {order.wilaya}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
