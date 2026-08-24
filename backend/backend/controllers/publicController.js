const catalogService = require("../services/catalogService");
const HttpError = require("../utils/httpError");

async function getPacks(req, res) {
  const data = await catalogService.listPacks({
    search: String(req.query.search || "").trim(),
    limit: req.query.limit,
    offset: req.query.offset,
  });

  return res.status(200).json({
    success: true,
    ...data,
  });
}

async function getPackBySlug(req, res) {
  const pack = await catalogService.findPackBySlug(
    String(req.params.slug || "").trim(),
  );

  if (!pack) {
    throw new HttpError(404, "Pack introuvable.");
  }

  return res.status(200).json({
    success: true,
    pack,
  });
}

async function getPromotions(req, res) {
  const data = await catalogService.listPromotions({
    search: String(req.query.search || "").trim(),
    limit: req.query.limit,
    offset: req.query.offset,
  });

  return res.status(200).json({
    success: true,
    ...data,
  });
}

module.exports = {
  getPacks,
  getPackBySlug,
  getPromotions,
};
