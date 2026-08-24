const express = require("express");

const { requireAdmin } = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

router.get(
  "/",
  requireAdmin,
  asyncHandler(dashboardController.getDashboard),
);

module.exports = router;
