const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const HttpError = require("../utils/httpError");

async function login(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    throw new HttpError(400, "E-mail et mot de passe obligatoires.");
  }

  const [rows] = await pool.query(
    `
      SELECT id, name, email, password_hash, is_active
      FROM admins
      WHERE LOWER(email) = ?
      LIMIT 1
    `,
    [email]
  );

  const admin = rows[0];

  if (
    !admin ||
    !admin.is_active ||
    !(await bcrypt.compare(password, admin.password_hash))
  ) {
    throw new HttpError(401, "E-mail ou mot de passe incorrect.");
  }

  const token = jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: "ADMIN",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    }
  );

  return res.status(200).json({
    success: true,
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: "ADMIN",
    },
  });
}

async function me(req, res) {
  const [rows] = await pool.query(
    `
      SELECT id, name, email, is_active, created_at
      FROM admins
      WHERE id = ?
      LIMIT 1
    `,
    [req.admin.id]
  );

  if (!rows[0] || !rows[0].is_active) {
    throw new HttpError(401, "Compte administrateur indisponible.");
  }

  return res.status(200).json({
    success: true,
    admin: {
      ...rows[0],
      role: "ADMIN",
    },
  });
}

module.exports = { login, me };
