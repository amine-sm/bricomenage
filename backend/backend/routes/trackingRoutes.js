const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/orderController");

const router = express.Router();

router.post(
  "/check",
  asyncHandler(controller.checkTracking)
);

module.exports = router;
