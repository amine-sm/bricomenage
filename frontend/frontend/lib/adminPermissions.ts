export type AdminAccountRole = "SUPER_ADMIN" | "USER";

export type AdminSession = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN";
  accountRole: AdminAccountRole | string;
  permissions: string[];
  created_at?: string;
  updated_at?: string;
};

export function isSuperAdmin(admin?: AdminSession | null) {
  return String(admin?.accountRole || "").toUpperCase() === "SUPER_ADMIN";
}

export function hasAdminPermission(
  admin: AdminSession | null | undefined,
  permission: string,
) {
  if (!admin) return false;
  if (isSuperAdmin(admin)) return true;
  return Array.isArray(admin.permissions) && admin.permissions.includes(permission);
}

export const ADMIN_ROUTES = [
  { href: "/admin/dashboard", permission: "dashboard.view" },
  { href: "/admin/articles", permission: "articles.view" },
  { href: "/admin/promotions", permission: "promotions.view" },
  { href: "/admin/packs", permission: "packs.view" },
  { href: "/admin/categories", permission: "categories.view" },
  { href: "/admin/fournisseurs", permission: "suppliers.view" },
  { href: "/admin/achats", permission: "stock.view" },
  { href: "/admin/commandes", permission: "orders.view" },
] as const;

export function requiredPermissionForPath(pathname: string) {
  if (
    pathname === "/admin/utilisateurs" ||
    pathname.startsWith("/admin/utilisateurs/")
  ) {
    return "SUPER_ADMIN";
  }

  if (
    pathname === "/admin/commandes/bon-zr" ||
    pathname.startsWith("/admin/commandes/bon-zr/")
  ) {
    return "orders.zr";
  }

  const match = ADMIN_ROUTES.find(
    (route) => pathname === route.href || pathname.startsWith(`${route.href}/`),
  );

  return match?.permission || null;
}

export function canAccessAdminPath(admin: AdminSession | null, pathname: string) {
  const required = requiredPermissionForPath(pathname);
  if (!required) return true;
  if (required === "SUPER_ADMIN") return isSuperAdmin(admin);
  return hasAdminPermission(admin, required);
}

export function firstAllowedAdminHref(admin: AdminSession | null) {
  if (isSuperAdmin(admin)) return "/admin/dashboard";

  const route = ADMIN_ROUTES.find((item) =>
    hasAdminPermission(admin, item.permission),
  );

  return route?.href || "/admin/connexion";
}
