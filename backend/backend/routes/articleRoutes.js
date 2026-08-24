const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/articleController");

const router = express.Router();

router.get(
  "/latest",
  asyncHandler(controller.getLatestArticles),
);

router.get(
  "/",
  asyncHandler(controller.getArticles),
);

router.get(
  "/slug/:slug",
  asyncHandler(controller.getArticleBySlug),
);

module.exports = router;
