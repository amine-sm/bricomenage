require("dotenv").config();

const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const app = require("./app");
const pool = require("./config/db");
const ensureSchema = require("./scripts/ensureSchema");

const PORT = Number(
  process.env.PORT || 5000,
);

function allowedOrigins() {
  return String(
    process.env.FRONTEND_URL ||
      "http://localhost:3000,http://127.0.0.1:3000",
  )
    .split(",")
    .map((value) =>
      value.trim().replace(/\/$/, ""),
    )
    .filter(Boolean);
}

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET est absent du fichier .env.",
      );
    }

    await pool.query("SELECT 1");
    await ensureSchema();

    const httpServer =
      http.createServer(app);

    const io = new Server(
      httpServer,
      {
        cors: {
          origin: allowedOrigins(),
          credentials: true,
          methods: [
            "GET",
            "POST",
          ],
        },
        transports: [
          "websocket",
          "polling",
        ],
      },
    );

    /*
     * Seul un administrateur connecté peut
     * recevoir les commandes en temps réel.
     */
    io.use((socket, next) => {
      const token = String(
        socket.handshake.auth?.token ||
          "",
      ).trim();

      if (!token) {
        return next(
          new Error(
            "Authentification Socket requise.",
          ),
        );
      }

      try {
        const admin = jwt.verify(
          token,
          process.env.JWT_SECRET,
        );

        if (admin.role !== "ADMIN") {
          return next(
            new Error(
              "Accès Socket interdit.",
            ),
          );
        }

        socket.data.admin = admin;
        return next();
      } catch {
        return next(
          new Error(
            "Session Socket invalide ou expirée.",
          ),
        );
      }
    });

    io.on(
      "connection",
      (socket) => {
        socket.join("admins");

        console.log(
          `[Socket] Admin connecté : ${socket.data.admin?.email || socket.id}`,
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

    app.set("io", io);

    httpServer.listen(
      PORT,
      () => {
        console.log(
          `API BricoMénage démarrée sur http://localhost:${PORT}`,
        );
        console.log(
          `Socket.IO actif sur le port ${PORT}`,
        );
        console.log(
          `Base MySQL : ${process.env.DB_NAME}`,
        );
      },
    );
  } catch (error) {
    console.error(
      "Impossible de démarrer le backend :",
      error.message,
    );
    process.exit(1);
  }
}

startServer();
