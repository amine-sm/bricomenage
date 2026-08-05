const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const controller = require("../controllers/adminController");

const router = express.Router();

router.use(requireAdmin);

router.get("/dashboard", asyncHandler(controller.dashboard));

router.get("/categories", asyncHandler(controller.listCategories));
router.post("/categories", asyncHandler(controller.createCategory));
router.put("/categories/:id", asyncHandler(controller.updateCategory));
router.delete("/categories/:id", asyncHandler(controller.deleteCategory));

router.get("/articles", asyncHandler(controller.listArticles));
router.post(
  "/articles",
  upload.array("images", 6),
  asyncHandler(controller.createArticle)
);
router.put(
  "/articles/:id",
  upload.array("images", 6),
  asyncHandler(controller.updateArticle)
);
router.delete("/articles/:id", asyncHandler(controller.deleteArticle));

router.get("/suppliers", asyncHandler(controller.listSuppliers));
router.post("/suppliers", asyncHandler(controller.createSupplier));
router.put("/suppliers/:id", asyncHandler(controller.updateSupplier));
router.delete("/suppliers/:id", asyncHandler(controller.deleteSupplier));

router.get("/orders", asyncHandler(controller.listOrders));
router.get("/orders/:id", asyncHandler(controller.getOrder));
router.patch(
  "/orders/:id/status",
  asyncHandler(controller.updateOrderStatus)
);

router.get("/promotions", asyncHandler(controller.listPromotions));
router.post("/promotions", asyncHandler(controller.createPromotion));

router.get("/packs", asyncHandler(controller.listPacks));
router.post("/packs", asyncHandler(controller.createPack));

module.exports = router;
