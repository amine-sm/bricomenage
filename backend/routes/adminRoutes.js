const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middlewares/auth");
const {
  requirePermission,
  requireSuperAdmin,
} = require("../middlewares/permissions");
const { uploadArticleImages } = require("../middlewares/upload");

const controller = require("../controllers/adminController");
const promotionController = require("../controllers/promotionController");
const packController = require("../controllers/packController");
const dashboardController = require("../controllers/dashboardController");
const zrController = require("../controllers/zrController");
const userController = require("../controllers/userController");

const router = express.Router();

router.use(requireAdmin);

/* =========================================================
   UTILISATEURS - SUPER ADMIN UNIQUEMENT
========================================================= */

router.get(
  "/users/permissions",
  requireSuperAdmin,
  asyncHandler(userController.permissionCatalog),
);

router.get(
  "/users",
  requireSuperAdmin,
  asyncHandler(userController.listUsers),
);

router.post(
  "/users",
  requireSuperAdmin,
  asyncHandler(userController.createUser),
);

router.put(
  "/users/:id",
  requireSuperAdmin,
  asyncHandler(userController.updateUser),
);

router.patch(
  "/users/:id",
  requireSuperAdmin,
  asyncHandler(userController.updateUser),
);

router.delete(
  "/users/:id",
  requireSuperAdmin,
  asyncHandler(userController.deleteUser),
);

/* =========================================================
   DASHBOARD
========================================================= */

router.get(
  "/dashboard",
  requirePermission("dashboard.view"),
  asyncHandler(dashboardController.getDashboard),
);

/* =========================================================
   CATEGORIES
========================================================= */

router.get(
  "/categories",
  requirePermission("categories.view", "articles.view"),
  asyncHandler(controller.listCategories),
);

router.post(
  "/categories",
  requirePermission("categories.create"),
  uploadArticleImages,
  asyncHandler(controller.createCategory),
);

router.put(
  "/categories/:id",
  requirePermission("categories.update"),
  uploadArticleImages,
  asyncHandler(controller.updateCategory),
);

router.delete(
  "/categories/:id",
  requirePermission("categories.delete"),
  asyncHandler(controller.deleteCategory),
);

/* =========================================================
   ARTICLES
========================================================= */

const canReadArticles = requirePermission(
  "articles.view",
  "promotions.view",
  "packs.view",
);

router.get(
  "/articles/references",
  canReadArticles,
  asyncHandler(controller.articleReferences),
);

router.get(
  "/articles",
  canReadArticles,
  asyncHandler(controller.listArticles),
);

router.get(
  "/articles/:id",
  canReadArticles,
  asyncHandler(controller.getArticle),
);

router.post(
  "/articles",
  requirePermission("articles.create"),
  uploadArticleImages,
  asyncHandler(controller.createArticle),
);

router.put(
  "/articles/:id",
  requirePermission("articles.update"),
  uploadArticleImages,
  asyncHandler(controller.updateArticle),
);

router.patch(
  "/articles/:id",
  requirePermission("articles.update"),
  uploadArticleImages,
  asyncHandler(controller.updateArticle),
);

router.delete(
  "/articles/:id",
  requirePermission("articles.delete"),
  asyncHandler(controller.deleteArticle),
);

/* =========================================================
   STOCK - ENDPOINTS DEDIES POUR EVITER DE DONNER LE DROIT
   DE MODIFIER TOUTE LA FICHE ARTICLE
========================================================= */

router.get(
  "/stock",
  requirePermission("stock.view"),
  asyncHandler(controller.listArticles),
);

router.put(
  "/stock/:id",
  requirePermission("stock.update"),
  asyncHandler(controller.updateArticleStock),
);

router.patch(
  "/stock/:id",
  requirePermission("stock.update"),
  asyncHandler(controller.updateArticleStock),
);

/* =========================================================
   FOURNISSEURS
========================================================= */

router.get(
  "/suppliers",
  requirePermission("suppliers.view", "articles.view"),
  asyncHandler(controller.listSuppliers),
);

router.post(
  "/suppliers",
  requirePermission("suppliers.create"),
  asyncHandler(controller.createSupplier),
);

router.put(
  "/suppliers/:id",
  requirePermission("suppliers.update"),
  asyncHandler(controller.updateSupplier),
);

router.delete(
  "/suppliers/:id",
  requirePermission("suppliers.delete"),
  asyncHandler(controller.deleteSupplier),
);

/* =========================================================
   COMMANDES
========================================================= */

router.get(
  "/orders",
  requirePermission("orders.view"),
  asyncHandler(controller.listOrders),
);

router.get(
  "/orders/:id",
  requirePermission("orders.view"),
  asyncHandler(controller.getOrder),
);

router.patch(
  "/orders/:id/status",
  requirePermission("orders.update"),
  asyncHandler(controller.updateOrderStatus),
);

router.get(
  "/zr/config",
  requirePermission("orders.view", "orders.zr"),
  asyncHandler(zrController.adminConfig),
);

router.post(
  "/orders/:id/zr",
  requirePermission("orders.zr"),
  asyncHandler(zrController.createForOrder),
);

router.post(
  "/orders/:id/zr/sync",
  requirePermission("orders.zr"),
  asyncHandler(zrController.syncOrder),
);

router.delete(
  "/orders/:id/zr",
  requirePermission("orders.zr"),
  asyncHandler(zrController.cancelOrder),
);

router.get(
  "/orders/:id/zr/label",
  requirePermission("orders.zr"),
  asyncHandler(zrController.label),
);

/* =========================================================
   PROMOTIONS
========================================================= */

router.get(
  "/promotions",
  requirePermission("promotions.view"),
  asyncHandler(promotionController.listPromotions),
);

router.get(
  "/promotions/:id",
  requirePermission("promotions.view"),
  asyncHandler(promotionController.getPromotion),
);

router.post(
  "/promotions",
  requirePermission("promotions.create"),
  asyncHandler(promotionController.createPromotion),
);

router.put(
  "/promotions/:id",
  requirePermission("promotions.update"),
  asyncHandler(promotionController.updatePromotion),
);

router.patch(
  "/promotions/:id/status",
  requirePermission("promotions.update"),
  asyncHandler(promotionController.updatePromotionStatus),
);

router.patch(
  "/promotions/:id/toggle",
  requirePermission("promotions.update"),
  asyncHandler(promotionController.togglePromotionStatus),
);

router.delete(
  "/promotions/:id",
  requirePermission("promotions.delete"),
  asyncHandler(promotionController.deletePromotion),
);

/* =========================================================
   PACKS
========================================================= */

router.get(
  "/packs",
  requirePermission("packs.view"),
  asyncHandler(packController.listPacks),
);

router.get(
  "/packs/:id",
  requirePermission("packs.view"),
  asyncHandler(packController.getPack),
);

router.post(
  "/packs",
  requirePermission("packs.create"),
  asyncHandler(packController.createPack),
);

router.put(
  "/packs/:id",
  requirePermission("packs.update"),
  asyncHandler(packController.updatePack),
);

router.patch(
  "/packs/:id/status",
  requirePermission("packs.update"),
  asyncHandler(packController.updatePackStatus),
);

router.patch(
  "/packs/:id/toggle",
  requirePermission("packs.update"),
  asyncHandler(packController.togglePackStatus),
);

router.delete(
  "/packs/:id",
  requirePermission("packs.delete"),
  asyncHandler(packController.deletePack),
);

module.exports = router;
