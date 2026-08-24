const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/publicController");

const router = express.Router();

router.get(
  "/packs",
  asyncHandler(controller.getPacks),
);

router.get(
  "/packs/slug/:slug",
  asyncHandler(controller.getPackBySlug),
);

router.get(
  "/promotions",
  asyncHandler(controller.getPromotions),
);

module.exports = router;
