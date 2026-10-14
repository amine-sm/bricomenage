const multer = require("multer");
const articleAiController = require("../controllers/articleAiController");
const asyncHandler = require("../utils/asyncHandler");

const aiImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 10,
    fileSize: 8 * 1024 * 1024,
  },
});

router.post(
  "/articles/ai-generate",
  permissionMiddleware, // Conserve ton middleware actuel
  aiImageUpload.array("sourceImages", 10),
  (req, res, next) => {
    console.log("[AI DEBUG] Content-Type :", req.headers["content-type"]);
    console.log("[AI DEBUG] Body :", req.body);
    console.log("[AI DEBUG] Fichiers :", req.files?.length || 0);

    next();
  },
  asyncHandler(articleAiController.generateArticleContent)
);