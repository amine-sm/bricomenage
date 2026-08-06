const express = require("express");

const asyncHandler = require(
  "../utils/asyncHandler",
);

const {
  listPublicCategories,
} = require(
  "../controllers/categoryController",
);

const router = express.Router();

router.get(
  "/",
  asyncHandler(
    listPublicCategories,
  ),
);

module.exports = router;
