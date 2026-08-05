const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/publicController");

const router = express.Router();

router.get("/articles", asyncHandler(controller.getArticles));
router.get(
  "/articles/slug/:slug",
  asyncHandler(controller.getArticleBySlug)
);

module.exports = router;
