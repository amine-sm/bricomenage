import {
  io,
  type Socket,
} from "socket.io-client";

import {
  API_URL,
  getAdminToken,
} from "@/lib/api";

let socket: Socket | null = null;

function defaultSocketUrl() {
  return API_URL.replace(
    /\/api\/?$/,
    "",
  );
}

export function getAdminSocket() {
  if (typeof window === "undefined") {
    return null;
  }

  const token = getAdminToken();

  if (!token) {
    return null;
  }

  if (!socket) {
    socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL ||
        defaultSocketUrl(),
      {
        autoConnect: false,
        transports: [
          "websocket",
          "polling",
        ],
        auth: {
          token,
        },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 800,
        reconnectionDelayMax: 5000,
      },
    );
  }

  socket.auth = {
    token,
  };

  return socket;
}

export function disconnectAdminSocket() {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
}
