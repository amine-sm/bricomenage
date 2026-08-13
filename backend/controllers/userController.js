const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const HttpError = require("../utils/httpError");
const {
  PERMISSION_GROUPS,
  normalizePermissions,
} = require("../middlewares/permissions");

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}


function disconnectAdminSockets(req, adminId) {
  const io = req.app?.get?.("io");
  if (!io?.sockets?.sockets) return;

  for (const socket of io.sockets.sockets.values()) {
    if (Number(socket.data?.admin?.id) === Number(adminId)) {
      socket.disconnect(true);
    }
  }
}

function publicUser(row, permissions = []) {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    is_active: Boolean(Number(row.is_active)),
    role: String(row.role || "USER").toUpperCase(),
    permissions,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function getUser(id, connection = pool) {
  const [rows] = await connection.query(
    `
      SELECT id, name, email, is_active, role, created_at, updated_at
      FROM admins
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  const row = rows[0];
  if (!row) return null;

  const [permissionRows] = await connection.query(
    `
      SELECT permission_key
      FROM admin_permissions
      WHERE admin_id = ?
      ORDER BY permission_key ASC
    `,
    [id],
  );

  return publicUser(
    row,
    permissionRows.map((item) => item.permission_key),
  );
}

async function listUsers(req, res) {
  const [rows] = await pool.query(
    `
      SELECT id, name, email, is_active, role, created_at, updated_at
      FROM admins
      ORDER BY
        CASE WHEN role = 'SUPER_ADMIN' THEN 0 ELSE 1 END,
        name ASC,
        id ASC
    `,
  );

  const [permissionRows] = await pool.query(
    `
      SELECT admin_id, permission_key
      FROM admin_permissions
      ORDER BY permission_key ASC
    `,
  );

  const permissionMap = new Map();

  for (const permission of permissionRows) {
    const adminId = Number(permission.admin_id);
    const current = permissionMap.get(adminId) || [];
    current.push(permission.permission_key);
    permissionMap.set(adminId, current);
  }

  return res.json({
    success: true,
    users: rows.map((row) =>
      publicUser(row, permissionMap.get(Number(row.id)) || []),
    ),
  });
}

async function permissionCatalog(req, res) {
  return res.json({
    success: true,
    groups: PERMISSION_GROUPS.map((group) => ({
      key: group.key,
      label: group.label,
      permissions: group.permissions.map(([key, label]) => ({ key, label })),
    })),
  });
}

async function createUser(req, res) {
  const name = clean(req.body.name);
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");
  const permissions = normalizePermissions(req.body.permissions);
  const isActive = req.body.is_active === undefined ? 1 : req.body.is_active ? 1 : 0;

  if (!name) {
    throw new HttpError(400, "Le nom est obligatoire.");
  }

  if (!email || !email.includes("@")) {
    throw new HttpError(400, "Une adresse e-mail valide est obligatoire.");
  }

  if (password.length < 8) {
    throw new HttpError(400, "Le mot de passe doit contenir au moins 8 caractères.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const cn = await pool.getConnection();

  try {
    await cn.beginTransaction();

    const [result] = await cn.query(
      `
        INSERT INTO admins (
          name, email, password_hash, is_active, role
        )
        VALUES (?, ?, ?, ?, 'USER')
      `,
      [name, email, passwordHash, isActive],
    );

    if (permissions.length) {
      await cn.query(
        `INSERT INTO admin_permissions (admin_id, permission_key) VALUES ?`,
        [permissions.map((permission) => [result.insertId, permission])],
      );
    }

    await cn.commit();
    const user = await getUser(result.insertId);

    return res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès.",
      user,
    });
  } catch (error) {
    await cn.rollback();

    if (error?.code === "ER_DUP_ENTRY") {
      throw new HttpError(409, "Cette adresse e-mail est déjà utilisée.");
    }

    throw error;
  } finally {
    cn.release();
  }
}

async function updateUser(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Utilisateur invalide.");
  }

  const existing = await getUser(id);
  if (!existing) {
    throw new HttpError(404, "Utilisateur introuvable.");
  }

  if (existing.role === "SUPER_ADMIN") {
    throw new HttpError(
      403,
      "Le compte Super Administrateur principal ne peut pas être modifié depuis cette page.",
    );
  }

  const name = req.body.name !== undefined ? clean(req.body.name) : existing.name;
  const email = req.body.email !== undefined ? normalizeEmail(req.body.email) : existing.email;
  const permissions = req.body.permissions !== undefined
    ? normalizePermissions(req.body.permissions)
    : existing.permissions;
  const isActive = req.body.is_active !== undefined
    ? (req.body.is_active ? 1 : 0)
    : (existing.is_active ? 1 : 0);
  const password = req.body.password !== undefined ? String(req.body.password || "") : "";

  if (!name) throw new HttpError(400, "Le nom est obligatoire.");
  if (!email || !email.includes("@")) {
    throw new HttpError(400, "Une adresse e-mail valide est obligatoire.");
  }
  if (password && password.length < 8) {
    throw new HttpError(400, "Le nouveau mot de passe doit contenir au moins 8 caractères.");
  }

  const cn = await pool.getConnection();

  try {
    await cn.beginTransaction();

    if (password) {
      const passwordHash = await bcrypt.hash(password, 12);
      await cn.query(
        `
          UPDATE admins
          SET name = ?, email = ?, is_active = ?, password_hash = ?
          WHERE id = ? AND role <> 'SUPER_ADMIN'
        `,
        [name, email, isActive, passwordHash, id],
      );
    } else {
      await cn.query(
        `
          UPDATE admins
          SET name = ?, email = ?, is_active = ?
          WHERE id = ? AND role <> 'SUPER_ADMIN'
        `,
        [name, email, isActive, id],
      );
    }

    await cn.query("DELETE FROM admin_permissions WHERE admin_id = ?", [id]);

    if (permissions.length) {
      await cn.query(
        `INSERT INTO admin_permissions (admin_id, permission_key) VALUES ?`,
        [permissions.map((permission) => [id, permission])],
      );
    }

    await cn.commit();
    const user = await getUser(id);
    disconnectAdminSockets(req, id);

    return res.json({
      success: true,
      message: "Utilisateur et autorisations mis à jour.",
      user,
    });
  } catch (error) {
    await cn.rollback();

    if (error?.code === "ER_DUP_ENTRY") {
      throw new HttpError(409, "Cette adresse e-mail est déjà utilisée.");
    }

    throw error;
  } finally {
    cn.release();
  }
}

async function deleteUser(req, res) {
  const id = Number(req.params.id);

  if (id === Number(req.admin.id)) {
    throw new HttpError(400, "Vous ne pouvez pas supprimer votre propre compte.");
  }

  const existing = await getUser(id);
  if (!existing) throw new HttpError(404, "Utilisateur introuvable.");

  if (existing.role === "SUPER_ADMIN") {
    throw new HttpError(403, "Le Super Administrateur principal ne peut pas être supprimé.");
  }

  await pool.query("DELETE FROM admins WHERE id = ? AND role <> 'SUPER_ADMIN'", [id]);
  disconnectAdminSockets(req, id);

  return res.json({
    success: true,
    message: "Utilisateur supprimé.",
  });
}

module.exports = {
  listUsers,
  permissionCatalog,
  createUser,
  updateUser,
  deleteUser,
};
