const express =
  require("express");

const asyncHandler =
  require("../utils/asyncHandler");

const {
  requireAdmin,
} = require("../middlewares/auth");

const {
  uploadArticleImages,
} = require(
  "../middlewares/upload",
);

const controller =
  require("../controllers/adminController");

const promotionController =
  require("../controllers/promotionController");

const packController =
  require("../controllers/packController");

const dashboardController =
  require("../controllers/dashboardController");

const router =
  express.Router();

router.use(requireAdmin);

router.get(
  "/dashboard",
  asyncHandler(
    dashboardController.getDashboard,
  ),
);

router.get(
  "/categories",
  asyncHandler(
    controller.listCategories,
  ),
);

router.post(
  "/categories",
  uploadArticleImages,
  asyncHandler(
    controller.createCategory,
  ),
);

router.put(
  "/categories/:id",
  uploadArticleImages,
  asyncHandler(
    controller.updateCategory,
  ),
);

router.delete(
  "/categories/:id",
  asyncHandler(
    controller.deleteCategory,
  ),
);

/*
 * Cette route doit être placée
 * avant /articles/:id.
 */
router.get(
  "/articles/references",
  asyncHandler(
    controller.articleReferences,
  ),
);

router.get(
  "/articles",
  asyncHandler(
    controller.listArticles,
  ),
);

router.get(
  "/articles/:id",
  asyncHandler(
    controller.getArticle,
  ),
);

router.post(
  "/articles",
  uploadArticleImages,
  asyncHandler(
    controller.createArticle,
  ),
);

router.put(
  "/articles/:id",
  uploadArticleImages,
  asyncHandler(
    controller.updateArticle,
  ),
);

router.patch(
  "/articles/:id",
  uploadArticleImages,
  asyncHandler(
    controller.updateArticle,
  ),
);

router.delete(
  "/articles/:id",
  asyncHandler(
    controller.deleteArticle,
  ),
);

router.get(
  "/suppliers",
  asyncHandler(
    controller.listSuppliers,
  ),
);

router.post(
  "/suppliers",
  asyncHandler(
    controller.createSupplier,
  ),
);

router.put(
  "/suppliers/:id",
  asyncHandler(
    controller.updateSupplier,
  ),
);

router.delete(
  "/suppliers/:id",
  asyncHandler(
    controller.deleteSupplier,
  ),
);

router.get(
  "/orders",
  asyncHandler(
    controller.listOrders,
  ),
);

router.get(
  "/orders/:id",
  asyncHandler(
    controller.getOrder,
  ),
);

router.patch(
  "/orders/:id/status",
  asyncHandler(
    controller.updateOrderStatus,
  ),
);

router.get(
  "/promotions",
  asyncHandler(
    promotionController.listPromotions,
  ),
);

router.get(
  "/promotions/:id",
  asyncHandler(
    promotionController.getPromotion,
  ),
);

router.post(
  "/promotions",
  asyncHandler(
    promotionController.createPromotion,
  ),
);

router.put(
  "/promotions/:id",
  asyncHandler(
    promotionController.updatePromotion,
  ),
);

router.patch(
  "/promotions/:id/status",
  asyncHandler(
    promotionController.updatePromotionStatus,
  ),
);

router.patch(
  "/promotions/:id/toggle",
  asyncHandler(
    promotionController.togglePromotionStatus,
  ),
);

router.delete(
  "/promotions/:id",
  asyncHandler(
    promotionController.deletePromotion,
  ),
);

router.get(
  "/packs",
  asyncHandler(
    packController.listPacks,
  ),
);

router.get(
  "/packs/:id",
  asyncHandler(
    packController.getPack,
  ),
);

router.post(
  "/packs",
  asyncHandler(
    packController.createPack,
  ),
);

router.put(
  "/packs/:id",
  asyncHandler(
    packController.updatePack,
  ),
);

router.patch(
  "/packs/:id/status",
  asyncHandler(
    packController.updatePackStatus,
  ),
);

router.patch(
  "/packs/:id/toggle",
  asyncHandler(
    packController.togglePackStatus,
  ),
);

router.delete(
  "/packs/:id",
  asyncHandler(
    packController.deletePack,
  ),
);

module.exports = router;
