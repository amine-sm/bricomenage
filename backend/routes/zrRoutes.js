const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/zrController");

const router = express.Router();

router.get("/status", asyncHandler(controller.status));
router.get("/wilayas", asyncHandler(controller.wilayas));
router.get("/communes", asyncHandler(controller.communes));
router.get("/hubs", asyncHandler(controller.hubs));
router.post("/quote", asyncHandler(controller.quote));

module.exports = router;
