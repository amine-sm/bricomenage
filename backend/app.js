const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const publicRoutes = require("./routes/publicRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const {
  notFound,
  errorHandler,
} = require("./middlewares/errorHandler");

const app = express();

const allowedOrigins = String(
  process.env.FRONTEND_URL ||
    "http://localhost:3000,http://127.0.0.1:3000"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const normalized = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }

      return callback(new Error("Origine non autorisée par CORS."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "API BricoMénage MySQL opérationnelle.",
  });
});

app.get("/api/health", (req, res) => {
  return res.json({
    success: true,
    service: "bricomenage-backend-mysql",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", publicRoutes);
app.use("/api", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
