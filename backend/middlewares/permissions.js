const HttpError = require("../utils/httpError");

const PERMISSION_GROUPS = [
  {
    key: "dashboard",
    label: "Dashboard",
    permissions: [
      ["dashboard.view", "Voir le dashboard"],
    ],
  },
  {
    key: "articles",
    label: "Articles",
    permissions: [
      ["articles.view", "Voir les articles"],
      ["articles.create", "Ajouter des articles"],
      ["articles.update", "Modifier les articles"],
      ["articles.delete", "Supprimer les articles"],
    ],
  },
  {
    key: "promotions",
    label: "Promotions",
    permissions: [
      ["promotions.view", "Voir les promotions"],
      ["promotions.create", "Ajouter des promotions"],
      ["promotions.update", "Modifier / activer les promotions"],
      ["promotions.delete", "Supprimer les promotions"],
    ],
  },
  {
    key: "packs",
    label: "Packs",
    permissions: [
      ["packs.view", "Voir les packs"],
      ["packs.create", "Ajouter des packs"],
      ["packs.update", "Modifier / activer les packs"],
      ["packs.delete", "Supprimer les packs"],
    ],
  },
  {
    key: "categories",
    label: "Catégories",
    permissions: [
      ["categories.view", "Voir les catégories"],
      ["categories.create", "Ajouter des catégories"],
      ["categories.update", "Modifier les catégories"],
      ["categories.delete", "Supprimer les catégories"],
    ],
  },
  {
    key: "suppliers",
    label: "Fournisseurs",
    permissions: [
      ["suppliers.view", "Voir les fournisseurs"],
      ["suppliers.create", "Ajouter des fournisseurs"],
      ["suppliers.update", "Modifier les fournisseurs"],
      ["suppliers.delete", "Supprimer les fournisseurs"],
    ],
  },
  {
    key: "stock",
    label: "Stock",
    permissions: [
      ["stock.view", "Voir le stock"],
      ["stock.update", "Modifier stock / seuil / prix d’achat"],
    ],
  },
  {
    key: "orders",
    label: "Commandes",
    permissions: [
      ["orders.view", "Voir les commandes"],
      ["orders.update", "Modifier le statut des commandes"],
      ["orders.delete", "Supprimer les commandes"],
      ["orders.zr", "Gérer ZR Express"],
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map(([key]) => key),
);

const PERMISSION_SET = new Set(ALL_PERMISSIONS);

function normalizePermissions(values) {
  if (!Array.isArray(values)) return [];

  const selected = new Set(
    values
      .map((value) => String(value || "").trim())
      .filter((value) => PERMISSION_SET.has(value)),
  );

  // Une action implique toujours le droit d’ouvrir le module correspondant.
  for (const permission of [...selected]) {
    const [moduleName, action] = permission.split(".");
    if (action && action !== "view") {
      const viewPermission = `${moduleName}.view`;
      if (PERMISSION_SET.has(viewPermission)) selected.add(viewPermission);
    }
  }

  return [...selected].sort();
}

function hasPermission(admin, permission) {
  if (!admin) return false;
  if (String(admin.accountRole || "").toUpperCase() === "SUPER_ADMIN") {
    return true;
  }

  return Array.isArray(admin.permissions) && admin.permissions.includes(permission);
}

function requirePermission(...permissions) {
  return function permissionMiddleware(req, res, next) {
    const allowed = permissions.some((permission) => hasPermission(req.admin, permission));

    if (!allowed) {
      return next(
        new HttpError(
          403,
          "Vous n’avez pas l’autorisation d’effectuer cette action.",
        ),
      );
    }

    return next();
  };
}

function requireSuperAdmin(req, res, next) {
  if (String(req.admin?.accountRole || "").toUpperCase() !== "SUPER_ADMIN") {
    return next(
      new HttpError(
        403,
        "Cette action est réservée au Super Administrateur.",
      ),
    );
  }

  return next();
}

module.exports = {
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
  normalizePermissions,
  hasPermission,
  requirePermission,
  requireSuperAdmin,
};
