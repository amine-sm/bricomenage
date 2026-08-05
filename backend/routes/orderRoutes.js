const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/orderController");

const router = express.Router();

router.post("/orders", asyncHandler(controller.createOrder));
router.post("/tracking/check", asyncHandler(controller.checkTracking));

module.exports = router;
