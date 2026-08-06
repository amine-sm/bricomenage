const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require(
  "express-rate-limit",
);
const categoryRoutes =
  require("./routes/categoryRoutes");

const publicRoutes = require(
  "./routes/publicRoutes",
);

const articleRoutes = require(
  "./routes/articleRoutes",
);

const orderRoutes = require(
  "./routes/orderRoutes",
);

const authRoutes = require(
  "./routes/authRoutes",
);

const adminRoutes = require(
  "./routes/adminRoutes",
);

const {
  notFound,
  errorHandler,
} = require(
  "./middlewares/errorHandler",
);

const app = express();

const allowedOrigins = String(
  process.env.FRONTEND_URL ||
    [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ].join(","),
)
  .split(",")
  .map((origin) =>
    origin
      .trim()
      .replace(/\/$/, ""),
  )
  .filter(Boolean);

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      /*
       * Autorise Postman, navigateur direct
       * et les requêtes serveur sans origine.
       */
      if (!origin) {
        return callback(
          null,
          true,
        );
      }

      const normalized =
        origin.replace(/\/$/, "");

      if (
        allowedOrigins.includes(
          normalized,
        )
      ) {
        return callback(
          null,
          true,
        );
      }

      return callback(
        new Error(
          "Origine non autorisée par CORS.",
        ),
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
    ],
  }),
);

app.use(
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 600,

    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(morgan("dev"));

app.use(
  express.json({
    limit: "3mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads",
    ),
  ),
);

/*
 * Route principale de test.
 */
app.get("/", (req, res) => {
  return res.json({
    success: true,
    message:
      "API BricoMénage MySQL opérationnelle.",
  });
});

/*
 * Vérification de l’état de l’API.
 */
app.get(
  "/api/health",
  (req, res) => {
    return res.json({
      success: true,
      service:
        "bricomenage-backend-mysql",
      timestamp:
        new Date().toISOString(),
    });
  },
);

app.use(
  "/api/categories",
  categoryRoutes,
);
/*
 * Routes publiques des articles.
 *
 * URL finales :
 * GET /api/articles
 * GET /api/articles/latest
 * GET /api/articles/slug/:slug
 */
app.use(
  "/api/articles",
  articleRoutes,
);

/*
 * Routes publiques supplémentaires.
 *
 * URL finales :
 * GET /api/packs
 * GET /api/packs/slug/:slug
 * GET /api/promotions
 */
app.use(
  "/api",
  publicRoutes,
);

/*
 * Commandes et suivi.
 */
app.use(
  "/api",
  orderRoutes,
);

/*
 * Authentification administrateur.
 */
app.use(
  "/api/auth",
  authRoutes,
);

/*
 * Administration.
 *
 * Cette route contient déjà :
 * /api/admin/dashboard
 * /api/admin/articles
 * /api/admin/categories
 * /api/admin/packs
 * /api/admin/promotions
 * etc.
 */
app.use(
  "/api/admin",
  adminRoutes,
);

/*
 * Toujours à la fin.
 */
app.use(notFound);
app.use(errorHandler);

module.exports = app;