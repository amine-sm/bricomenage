const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const HttpError = require("../utils/httpError");
const { ALL_PERMISSIONS } = require("./permissions");

async function requireAdmin(req, res, next) {
  const authorization = String(req.headers.authorization || "");

  if (!authorization.startsWith("Bearer ")) {
    return next(new HttpError(401, "Authentification requise."));
  }

  try {
    const decoded = jwt.verify(
      authorization.slice(7).trim(),
      process.env.JWT_SECRET,
    );

    const [rows] = await pool.query(
      `
        SELECT id, name, email, is_active, role, created_at, updated_at
        FROM admins
        WHERE id = ?
        LIMIT 1
      `,
      [decoded.id],
    );

    const admin = rows[0];

    if (!admin || !Number(admin.is_active)) {
      return next(new HttpError(401, "Compte administrateur indisponible."));
    }

    const accountRole = String(admin.role || "USER").trim().toUpperCase();
    let permissions = [];

    if (accountRole === "SUPER_ADMIN") {
      permissions = [...ALL_PERMISSIONS];
    } else {
      const [permissionRows] = await pool.query(
        `
          SELECT permission_key
          FROM admin_permissions
          WHERE admin_id = ?
          ORDER BY permission_key ASC
        `,
        [admin.id],
      );

      permissions = permissionRows.map((row) => row.permission_key);
    }

    req.admin = {
      ...decoded,
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: "ADMIN",
      accountRole,
      permissions,
      created_at: admin.created_at,
      updated_at: admin.updated_at,
    };

    return next();
  } catch (error) {
    if (error instanceof HttpError) {
      return next(error);
    }

    return next(new HttpError(401, "Session invalide ou expirée."));
  }
}

module.exports = { requireAdmin };
