const dashboardService = require("../services/dashboardService");
const HttpError = require("../utils/httpError");

const ALLOWED_PERIODS = new Set([
  "day",
  "week",
  "month",
  "custom",
]);

async function getDashboard(req, res) {
  const period = String(
    req.query.period || "month",
  ).toLowerCase();

  if (!ALLOWED_PERIODS.has(period)) {
    throw new HttpError(
      400,
      "Période invalide. Utilisez day, week, month ou custom.",
    );
  }

  const startDate = String(
    req.query.startDate || "",
  ).trim();

  const endDate = String(
    req.query.endDate || "",
  ).trim();

  if (
    period === "custom" &&
    (!startDate || !endDate)
  ) {
    throw new HttpError(
      400,
      "La date de début et la date de fin sont obligatoires.",
    );
  }

  const dashboard =
    await dashboardService.getDashboardStats({
      period,
      startDate,
      endDate,
    });

  return res.status(200).json({
    success: true,
    ...dashboard,
  });
}

module.exports = {
  getDashboard,
};
