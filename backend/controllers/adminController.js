const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
const pool = require("../config/db");
const HttpError = require("../utils/httpError");

function clean(value) {
  return String(value ?? "").trim();
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildImageUrl(req, filename) {
  if (!filename) return null;
  return `${req.protocol}://${req.get("host")}/uploads/products/${filename}`;
}

async function dashboard(req, res) {
  const [[articles], [categories], [orders], [revenue]] = await Promise.all([
    pool.query("SELECT COUNT(*) AS total FROM articles"),
    pool.query("SELECT COUNT(*) AS total FROM categories"),
    pool.query("SELECT COUNT(*) AS total FROM orders"),
    pool.query(
      "SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status <> 'ANNULEE'"
    ),
  ]);

  return res.json({
    success: true,
    stats: {
      articles: Number(articles[0].total),
      categories: Number(categories[0].total),
      orders: Number(orders[0].total),
      revenue: Number(revenue[0].total),
    },
  });
}

async function listCategories(req, res) {
  const [rows] = await pool.query(
    "SELECT * FROM categories ORDER BY name ASC"
  );
  return res.json({ success: true, categories: rows });
}

async function createCategory(req, res) {
  const name = clean(req.body.name);

  if (!name) {
    throw new HttpError(400, "Le nom est obligatoire.");
  }

  const slug = clean(req.body.slug) || slugify(name, { lower: true, strict: true });

  const [result] = await pool.query(
    `
      INSERT INTO categories (name, slug, description, image)
      VALUES (?, ?, ?, ?)
    `,
    [
      name,
      slug,
      clean(req.body.description) || null,
      clean(req.body.image) || null,
    ]
  );

  return res.status(201).json({
    success: true,
    category: { id: result.insertId, name, slug },
  });
}

async function updateCategory(req, res) {
  const name = clean(req.body.name);

  if (!name) {
    throw new HttpError(400, "Le nom est obligatoire.");
  }

  const slug = clean(req.body.slug) || slugify(name, { lower: true, strict: true });

  await pool.query(
    `
      UPDATE categories
      SET name = ?, slug = ?, description = ?, image = ?, is_active = ?
      WHERE id = ?
    `,
    [
      name,
      slug,
      clean(req.body.description) || null,
      clean(req.body.image) || null,
      req.body.is_active === false || req.body.is_active === "0" ? 0 : 1,
      req.params.id,
    ]
  );

  return res.json({ success: true, message: "Catégorie modifiée." });
}

async function deleteCategory(req, res) {
  await pool.query("DELETE FROM categories WHERE id = ?", [req.params.id]);
  return res.json({ success: true, message: "Catégorie supprimée." });
}

async function listArticles(req, res) {
  const [rows] = await pool.query(
    `
      SELECT a.*, c.name AS category, s.name AS supplier
      FROM articles a
      INNER JOIN categories c ON c.id = a.category_id
      LEFT JOIN suppliers s ON s.id = a.supplier_id
      ORDER BY a.created_at DESC
    `
  );

  return res.json({
    success: true,
    articles: rows.map((row) => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
    })),
  });
}

async function createArticle(req, res) {
  const designation = clean(req.body.designation);

  if (!designation) {
    throw new HttpError(400, "La désignation est obligatoire.");
  }

  const slug =
    clean(req.body.slug) ||
    slugify(designation, { lower: true, strict: true });

  const uploaded = Array.isArray(req.files)
    ? req.files.map((file) => buildImageUrl(req, file.filename))
    : [];

  const externalImages = clean(req.body.images)
    ? JSON.parse(req.body.images)
    : [];

  const images = [...uploaded, ...externalImages].filter(Boolean);
  const image = buildImageUrl(req, req.files?.[0]?.filename) ||
    clean(req.body.image) ||
    images[0] ||
    null;

  const [result] = await pool.query(
    `
      INSERT INTO articles (
        category_id,
        supplier_id,
        slug,
        designation,
        reference,
        brand,
        description,
        price,
        old_price,
        purchase_price,
        stock_quantity,
        min_stock,
        image,
        images,
        rating,
        reviews,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      req.body.category_id,
      req.body.supplier_id || null,
      slug,
      designation,
      clean(req.body.reference) || null,
      clean(req.body.brand) || null,
      clean(req.body.description) || null,
      number(req.body.price),
      req.body.old_price ? number(req.body.old_price) : null,
      req.body.purchase_price ? number(req.body.purchase_price) : null,
      Math.max(0, Math.trunc(number(req.body.stock_quantity))),
      Math.max(0, Math.trunc(number(req.body.min_stock))),
      image,
      JSON.stringify(images),
      Math.min(5, Math.max(0, number(req.body.rating))),
      Math.max(0, Math.trunc(number(req.body.reviews))),
      req.body.is_active === false || req.body.is_active === "0" ? 0 : 1,
    ]
  );

  return res.status(201).json({
    success: true,
    article: { id: result.insertId, slug, designation, image, images },
  });
}

async function updateArticle(req, res) {
  const [existingRows] = await pool.query(
    "SELECT * FROM articles WHERE id = ? LIMIT 1",
    [req.params.id]
  );

  const existing = existingRows[0];

  if (!existing) {
    throw new HttpError(404, "Article introuvable.");
  }

  const designation = clean(req.body.designation) || existing.designation;
  const slug =
    clean(req.body.slug) ||
    existing.slug ||
    slugify(designation, { lower: true, strict: true });

  const uploaded = Array.isArray(req.files)
    ? req.files.map((file) => buildImageUrl(req, file.filename))
    : [];

  let requestedImages = [];
  if (clean(req.body.images)) {
    requestedImages = JSON.parse(req.body.images);
  } else if (existing.images) {
    requestedImages = JSON.parse(existing.images);
  }

  const images = [...uploaded, ...requestedImages].filter(Boolean);
  const image =
    buildImageUrl(req, req.files?.[0]?.filename) ||
    clean(req.body.image) ||
    existing.image ||
    images[0] ||
    null;

  await pool.query(
    `
      UPDATE articles
      SET
        category_id = ?,
        supplier_id = ?,
        slug = ?,
        designation = ?,
        reference = ?,
        brand = ?,
        description = ?,
        price = ?,
        old_price = ?,
        purchase_price = ?,
        stock_quantity = ?,
        min_stock = ?,
        image = ?,
        images = ?,
        rating = ?,
        reviews = ?,
        is_active = ?
      WHERE id = ?
    `,
    [
      req.body.category_id || existing.category_id,
      req.body.supplier_id || existing.supplier_id || null,
      slug,
      designation,
      clean(req.body.reference) || existing.reference || null,
      clean(req.body.brand) || existing.brand || null,
      clean(req.body.description) || existing.description || null,
      req.body.price !== undefined ? number(req.body.price) : existing.price,
      req.body.old_price !== undefined
        ? (req.body.old_price ? number(req.body.old_price) : null)
        : existing.old_price,
      req.body.purchase_price !== undefined
        ? (req.body.purchase_price ? number(req.body.purchase_price) : null)
        : existing.purchase_price,
      req.body.stock_quantity !== undefined
        ? Math.max(0, Math.trunc(number(req.body.stock_quantity)))
        : existing.stock_quantity,
      req.body.min_stock !== undefined
        ? Math.max(0, Math.trunc(number(req.body.min_stock)))
        : existing.min_stock,
      image,
      JSON.stringify(images),
      req.body.rating !== undefined
        ? Math.min(5, Math.max(0, number(req.body.rating)))
        : existing.rating,
      req.body.reviews !== undefined
        ? Math.max(0, Math.trunc(number(req.body.reviews)))
        : existing.reviews,
      req.body.is_active === false || req.body.is_active === "0" ? 0 : 1,
      req.params.id,
    ]
  );

  return res.json({ success: true, message: "Article modifié." });
}

async function deleteArticle(req, res) {
  await pool.query("DELETE FROM articles WHERE id = ?", [req.params.id]);
  return res.json({ success: true, message: "Article supprimé." });
}

async function listSuppliers(req, res) {
  const [rows] = await pool.query(
    "SELECT * FROM suppliers ORDER BY created_at DESC"
  );
  return res.json({ success: true, suppliers: rows });
}

async function createSupplier(req, res) {
  const name = clean(req.body.name);

  if (!name) {
    throw new HttpError(400, "Le nom du fournisseur est obligatoire.");
  }

  const [result] = await pool.query(
    `
      INSERT INTO suppliers (
        name, contact_name, phone, email, address, wilaya,
        nif, nis, registre_commerce, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      clean(req.body.contact_name) || null,
      clean(req.body.phone) || null,
      clean(req.body.email) || null,
      clean(req.body.address) || null,
      clean(req.body.wilaya) || null,
      clean(req.body.nif) || null,
      clean(req.body.nis) || null,
      clean(req.body.registre_commerce) || null,
      1,
    ]
  );

  return res.status(201).json({
    success: true,
    supplier: { id: result.insertId, name },
  });
}

async function updateSupplier(req, res) {
  await pool.query(
    `
      UPDATE suppliers
      SET
        name = ?, contact_name = ?, phone = ?, email = ?,
        address = ?, wilaya = ?, nif = ?, nis = ?,
        registre_commerce = ?, is_active = ?
      WHERE id = ?
    `,
    [
      clean(req.body.name),
      clean(req.body.contact_name) || null,
      clean(req.body.phone) || null,
      clean(req.body.email) || null,
      clean(req.body.address) || null,
      clean(req.body.wilaya) || null,
      clean(req.body.nif) || null,
      clean(req.body.nis) || null,
      clean(req.body.registre_commerce) || null,
      req.body.is_active === false || req.body.is_active === "0" ? 0 : 1,
      req.params.id,
    ]
  );

  return res.json({ success: true, message: "Fournisseur modifié." });
}

async function deleteSupplier(req, res) {
  await pool.query("DELETE FROM suppliers WHERE id = ?", [req.params.id]);
  return res.json({ success: true, message: "Fournisseur supprimé." });
}

async function listOrders(req, res) {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM orders
      ORDER BY created_at DESC
    `
  );

  return res.json({ success: true, orders: rows });
}

async function getOrder(req, res) {
  const [orders] = await pool.query(
    "SELECT * FROM orders WHERE id = ? LIMIT 1",
    [req.params.id]
  );

  if (!orders[0]) {
    throw new HttpError(404, "Commande introuvable.");
  }

  const [items] = await pool.query(
    "SELECT * FROM order_items WHERE order_id = ?",
    [req.params.id]
  );

  const [history] = await pool.query(
    `
      SELECT *
      FROM order_history
      WHERE order_id = ?
      ORDER BY created_at ASC, id ASC
    `,
    [req.params.id]
  );

  return res.json({
    success: true,
    order: orders[0],
    items,
    history,
  });
}

async function updateOrderStatus(req, res) {
  const status = clean(req.body.status).toUpperCase();
  const label = clean(req.body.label) || status;
  const description = clean(req.body.description) || null;

  if (!status) {
    throw new HttpError(400, "Le statut est obligatoire.");
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, req.params.id]
    );

    await connection.query(
      `
        INSERT INTO order_history (
          order_id, status, label, description
        )
        VALUES (?, ?, ?, ?)
      `,
      [req.params.id, status, label, description]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: "Statut de la commande modifié.",
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listPromotions(req, res) {
  const [rows] = await pool.query(
    "SELECT * FROM promotions ORDER BY created_at DESC"
  );
  return res.json({ success: true, promotions: rows });
}

async function createPromotion(req, res) {
  const [result] = await pool.query(
    `
      INSERT INTO promotions (
        name, description, discount_type, discount_value,
        starts_at, ends_at, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      clean(req.body.name),
      clean(req.body.description) || null,
      clean(req.body.discount_type) || "PERCENT",
      number(req.body.discount_value),
      req.body.starts_at || null,
      req.body.ends_at || null,
      1,
    ]
  );

  return res.status(201).json({
    success: true,
    promotion: { id: result.insertId },
  });
}

async function listPacks(req, res) {
  const [rows] = await pool.query(
    "SELECT * FROM packs ORDER BY created_at DESC"
  );
  return res.json({ success: true, packs: rows });
}

async function createPack(req, res) {
  const name = clean(req.body.name);
  const slug =
    clean(req.body.slug) ||
    slugify(name, { lower: true, strict: true });

  const [result] = await pool.query(
    `
      INSERT INTO packs (
        slug, name, description, price, old_price,
        image, stock_quantity, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      slug,
      name,
      clean(req.body.description) || null,
      number(req.body.price),
      req.body.old_price ? number(req.body.old_price) : null,
      clean(req.body.image) || null,
      Math.max(0, Math.trunc(number(req.body.stock_quantity))),
      1,
    ]
  );

  return res.status(201).json({
    success: true,
    pack: { id: result.insertId, slug },
  });
}

module.exports = {
  dashboard,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  listOrders,
  getOrder,
  updateOrderStatus,
  listPromotions,
  createPromotion,
  listPacks,
  createPack,
};
