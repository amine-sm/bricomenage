const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/authController");
const { requireAdmin } = require("../middlewares/auth");

const router = express.Router();

router.post("/login", asyncHandler(controller.login));
router.get("/me", requireAdmin, asyncHandler(controller.me));

module.exports = router;
