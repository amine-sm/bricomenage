const articleService = require("../services/articleService");
const HttpError = require("../utils/httpError");

async function getArticles(req, res) {
  const result = await articleService.listArticles({
    search: String(req.query.search || "").trim(),
    category: String(req.query.category || "").trim(),
    promotion:
      String(req.query.promotion || "") === "1" ||
      String(req.query.promotion || "").toLowerCase() === "true",
    limit: req.query.limit,
    offset: req.query.offset,
  });

  return res.status(200).json({
    success: true,
    ...result,
  });
}

async function getArticleBySlug(req, res) {
  const article = await articleService.getArticleBySlug(
    String(req.params.slug || "").trim()
  );

  if (!article) {
    throw new HttpError(404, "Article introuvable.");
  }

  return res.status(200).json({
    success: true,
    article,
  });
}

module.exports = {
  getArticles,
  getArticleBySlug,
};
