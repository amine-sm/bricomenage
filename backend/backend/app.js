require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const categoryRoutes = require("./routes/categoryRoutes");
const publicRoutes = require("./routes/publicRoutes");
const articleRoutes = require("./routes/articleRoutes");
const orderRoutes = require("./routes/orderRoutes");
const zrRoutes = require("./routes/zrRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const {
  notFound,
  errorHandler,
} = require("./middlewares/errorHandler");

const app = express();

/* =========================================================
   CPANEL / PROXY
========================================================= */

app.set("trust proxy", 1);

/* =========================================================
   CORS

   Le backend accepte :
   - le frontend en production
   - localhost:3000 / 3001
   - 127.0.0.1:3000 / 3001

   IMPORTANT : ce middleware est placé AVANT toutes les routes,
   y compris les 404 et les erreurs.
========================================================= */

const DEFAULT_ORIGINS = [
  "https://bricomenage.com",
  "https://www.bricomenage.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

function normalizeOrigin(value) {
  return String(value || "")
    .trim()
    .replace(/\/$/, "");
}

const allowedOrigins = Array.from(
  new Set(
    [
      ...DEFAULT_ORIGINS,
      ...String(process.env.FRONTEND_URL || "")
        .split(",")
        .map(normalizeOrigin)
        .filter(Boolean),
    ].map(normalizeOrigin),
  ),
);

console.log("[CORS] Origines autorisées :", allowedOrigins.join(", "));

const corsOptions = {
  origin(origin, callback) {
    // curl, Postman, Capacitor et requêtes serveur peuvent ne pas avoir Origin.
    if (!origin) {
      return callback(null, true);
    }

    const normalized = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Origine refusée : ${origin}`);
    return callback(new Error(`Origine CORS non autorisée : ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
  ],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Express 5 : route preflight globale compatible path-to-regexp v8.
app.options("/{*path}", cors(corsOptions));

/* =========================================================
   SÉCURITÉ / LOGS
========================================================= */

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(morgan("dev"));

/* =========================================================
   BODY
========================================================= */

app.use(express.json({ limit: "3mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "3mb",
  }),
);

/* =========================================================
   UPLOADS

   On expose les deux chemins pour que cela fonctionne :
   - en local : /uploads/...
   - si Apache conserve le préfixe cPanel : /api/uploads/...
========================================================= */

const uploadsMiddleware = express.static(
  path.join(__dirname, "uploads"),
);

app.use("/uploads", uploadsMiddleware);
app.use("/api/uploads", uploadsMiddleware);

/* =========================================================
   HEALTH / TEST

   Les deux variantes sont volontairement disponibles.
   Selon la configuration Passenger, cPanel peut retirer /api
   avant d'envoyer la requête à Express, ou le conserver.
========================================================= */

function healthPayload() {
  return {
    success: true,
    service: "bricomenage-backend-mysql",
    status: "online",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  };
}

app.get("/", (req, res) => {
  return res.status(200).json({
    ...healthPayload(),
    message: "API BricoMénage MySQL opérationnelle.",
  });
});

app.get("/health", (req, res) => {
  return res.status(200).json(healthPayload());
});

app.get("/api", (req, res) => {
  return res.status(200).json({
    ...healthPayload(),
    message: "API BricoMénage MySQL opérationnelle.",
  });
});

app.get("/api/health", (req, res) => {
  return res.status(200).json(healthPayload());
});

/* =========================================================
   ROUTES MÉTIER

   IMPORTANT : chaque route est montée en double :

     /categories       + /api/categories
     /articles         + /api/articles
     /zr               + /api/zr
     /auth             + /api/auth
     /admin            + /api/admin

   Cela rend le même ZIP compatible :
   - avec le backend local sur http://localhost:5000/api
   - avec cPanel/Passenger sur https://bricomenage.com/api
   quel que soit le traitement du préfixe /api par Passenger.
========================================================= */

function mountBoth(pathWithoutApi, router) {
  const normalized = pathWithoutApi === "/" ? "" : pathWithoutApi;

  app.use(normalized || "/", router);
  app.use(`/api${normalized}`, router);
}

mountBoth("/categories", categoryRoutes);
mountBoth("/articles", articleRoutes);
mountBoth("/", publicRoutes);
mountBoth("/", orderRoutes);
mountBoth("/zr", zrRoutes);
mountBoth("/auth", authRoutes);
mountBoth("/admin", adminRoutes);

/* =========================================================
   404 / ERREURS
========================================================= */

app.use(notFound);
app.use(errorHandler);

module.exports = app;
