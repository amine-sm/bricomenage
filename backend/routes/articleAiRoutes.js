const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/articleAiController");

const router = express.Router();

// IMPORTANT : montez cette route derrière le même middleware d’authentification admin
// que les routes /admin/articles existantes.
router.post("/articles/ai-generate", asyncHandler(controller.generateArticleContent));

module.exports = router;
