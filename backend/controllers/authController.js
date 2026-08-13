const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const HttpError = require("../utils/httpError");
const { ALL_PERMISSIONS } = require("../middlewares/permissions");

async function getPermissions(adminId, accountRole) {
  if (String(accountRole || "").toUpperCase() === "SUPER_ADMIN") {
    return [...ALL_PERMISSIONS];
  }

  const [rows] = await pool.query(
    `
      SELECT permission_key
      FROM admin_permissions
      WHERE admin_id = ?
      ORDER BY permission_key ASC
    `,
    [adminId],
  );

  return rows.map((row) => row.permission_key);
}

async function login(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    throw new HttpError(400, "E-mail et mot de passe obligatoires.");
  }

  const [rows] = await pool.query(
    `
      SELECT id, name, email, password_hash, is_active, role
      FROM admins
      WHERE LOWER(email) = ?
      LIMIT 1
    `,
    [email],
  );

  const admin = rows[0];

  if (
    !admin ||
    !admin.is_active ||
    !(await bcrypt.compare(password, admin.password_hash))
  ) {
    throw new HttpError(401, "E-mail ou mot de passe incorrect.");
  }

  const accountRole = String(admin.role || "USER").trim().toUpperCase();
  const permissions = await getPermissions(admin.id, accountRole);

  const token = jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: "ADMIN",
      accountRole,
      permissions,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    },
  );

  return res.status(200).json({
    success: true,
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: "ADMIN",
      accountRole,
      permissions,
    },
  });
}

async function me(req, res) {
  return res.status(200).json({
    success: true,
    admin: {
      id: req.admin.id,
      name: req.admin.name,
      email: req.admin.email,
      role: "ADMIN",
      accountRole: req.admin.accountRole,
      permissions: req.admin.permissions,
      created_at: req.admin.created_at,
      updated_at: req.admin.updated_at,
    },
  });
}

module.exports = { login, me };
