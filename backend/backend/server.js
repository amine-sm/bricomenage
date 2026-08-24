require("dotenv").config();

const http = require("http");
const jwt = require("jsonwebtoken");
const {
  Server,
} = require("socket.io");

const app = require("./app");
const pool = require("./config/db");

const ensureSchema = require(
  "./scripts/ensureSchema",
);

const PORT = Number(
  process.env.PORT || 5000,
);

const SOCKET_PATH = String(
  process.env.SOCKET_IO_PATH || "/api/socket.io",
).trim() || "/api/socket.io";

/* =========================================================
   CORS SOCKET.IO
========================================================= */

function allowedOrigins() {
  return String(
    process.env.FRONTEND_URL ||
      "http://localhost:3000,http://127.0.0.1:3000",
  )
    .split(",")
    .map((value) =>
      value
        .trim()
        .replace(/\/$/, ""),
    )
    .filter(Boolean);
}

/* =========================================================
   START
========================================================= */

async function startServer() {
  try {
    if (
      !process.env.JWT_SECRET
    ) {
      throw new Error(
        "JWT_SECRET est absent du fichier .env.",
      );
    }

    /* =====================================================
       MYSQL
    ===================================================== */

    await pool.query(
      "SELECT 1",
    );

    console.log(
      "[DB] Connexion MySQL OK.",
    );

    await ensureSchema();

    console.log(
      "[DB] Schéma vérifié.",
    );

    /* =====================================================
       HTTP
    ===================================================== */

    const httpServer =
      http.createServer(
        app,
      );

    /* =====================================================
       SOCKET.IO
    ===================================================== */

    const io =
      new Server(
        httpServer,
        {
          path: SOCKET_PATH,
          addTrailingSlash: true,

          cors: {
            origin:
              allowedOrigins(),

            credentials:
              true,

            methods: [
              "GET",
              "POST",
            ],

            allowedHeaders: [
              "Authorization",
              "Content-Type",
            ],
          },

          transports: [
            "polling",
            "websocket",
          ],

          allowEIO3: true,
        },
      );

    /* =====================================================
       SOCKET AUTH
    ===================================================== */

    io.use(
      (
        socket,
        next,
      ) => {
        let token =
          String(
            socket.handshake
              .auth?.token ||
              "",
          ).trim();

        if (!token) {
          const authorization =
            String(
              socket.handshake
                .headers
                ?.authorization ||
                "",
            ).trim();

          if (
            authorization
              .toLowerCase()
              .startsWith(
                "bearer ",
              )
          ) {
            token =
              authorization
                .slice(7)
                .trim();
          }
        }

        if (!token) {
          return next(
            new Error(
              "Authentification Socket requise.",
            ),
          );
        }

        try {
          const admin =
            jwt.verify(
              token,
              process.env.JWT_SECRET,
            );

          const role = String(
            admin?.role || admin?.role_code || "",
          ).trim().toUpperCase();

          const accountRole = String(
            admin?.accountRole || "USER",
          ).trim().toUpperCase();

          const permissions = Array.isArray(admin?.permissions)
            ? admin.permissions
            : [];

          const canReceiveOrders =
            accountRole === "SUPER_ADMIN" || permissions.includes("orders.view");

          if (role !== "ADMIN" || !canReceiveOrders) {
            return next(
              new Error(
                "Accès Socket interdit.",
              ),
            );
          }

          socket.data.admin = admin;

          return next();
        } catch (error) {
          return next(
            new Error(
              "Session Socket invalide ou expirée.",
            ),
          );
        }
      },
    );

    /* =====================================================
       SOCKET CONNECTION
    ===================================================== */

    io.on(
      "connection",
      (socket) => {
        socket.join(
          "admins",
        );

        console.log(
          `[Socket] Admin connecté : ${
            socket.data.admin
              ?.email ||
            socket.id
          }`,
        );

        socket.emit(
          "socket:ready",
          {
            connected: true,
          },
        );

        socket.on(
          "disconnect",
          () => {
            console.log(
              `[Socket] Admin déconnecté : ${socket.id}`,
            );
          },
        );
      },
    );

    app.set(
      "io",
      io,
    );

    /* =====================================================
       LISTEN
    ===================================================== */

    httpServer.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          "====================================",
        );

        console.log(
          "BRICOMÉNAGE BACKEND",
        );

        console.log(
          `Port : ${PORT}`,
        );

        console.log(
          `Base MySQL : ${process.env.DB_NAME}`,
        );

        console.log(
          `CORS : ${allowedOrigins().join(
            ", ",
          )}`,
        );

        console.log(
          `Socket.IO : actif (${SOCKET_PATH})`,
        );

        console.log(
          "====================================",
        );
      },
    );
  } catch (error) {
    console.error(
      "Impossible de démarrer le backend :",
      error?.message ||
        error,
    );

    process.exit(1);
  }
}

startServer();