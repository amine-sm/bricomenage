const pool = require("../config/db");

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeImages(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeArticle(row) {
  const images = normalizeImages(row.images);
  const image = row.image || images[0] || null;

  return {
    ...row,
    id: Number(row.id),
    category_id: Number(row.category_id),
    supplier_id:
      row.supplier_id === null || row.supplier_id === undefined
        ? null
        : Number(row.supplier_id),
    price: numberValue(row.price),
    old_price:
      row.old_price === null || row.old_price === undefined
        ? null
        : numberValue(row.old_price),
    stock_quantity: numberValue(row.stock_quantity),
    rating: numberValue(row.rating),
    reviews: numberValue(row.reviews),
    image,
    images: images.length > 0 ? images : image ? [image] : [],
    inStock: numberValue(row.stock_quantity) > 0,
    item_type: "ARTICLE",
  };
}

function normalizePack(row) {
  return {
    ...row,
    id: Number(row.id),
    price: numberValue(row.price),
    old_price:
      row.old_price === null || row.old_price === undefined
        ? null
        : numberValue(row.old_price),
    article_count: numberValue(row.article_count),
    stock_quantity: numberValue(row.calculated_stock),
    calculated_stock: numberValue(row.calculated_stock),
    inStock: numberValue(row.calculated_stock) > 0,
    item_type: "PACK",
  };
}

async function listPacks({
  search = "",
  limit = 50,
  offset = 0,
} = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const values = [];
  const where = ["p.is_active = 1"];

  if (search) {
    where.push("(p.name LIKE ? OR p.description LIKE ?)");
    const term = `%${search}%`;
    values.push(term, term);
  }

  const [rows] = await pool.query(
    `
      SELECT
        p.id,
        p.slug,
        p.name,
        p.description,
        p.price,
        p.old_price,
        p.image,
        p.is_active,
        p.created_at,
        p.updated_at,
        COUNT(DISTINCT pi.article_id) AS article_count,
        COALESCE(
          MIN(
            FLOOR(
              a.stock_quantity /
              NULLIF(pi.quantity, 0)
            )
          ),
          0
        ) AS calculated_stock
      FROM packs p
      LEFT JOIN pack_items pi
        ON pi.pack_id = p.id
      LEFT JOIN articles a
        ON a.id = pi.article_id
        AND a.is_active = 1
      WHERE ${where.join(" AND ")}
      GROUP BY
        p.id,
        p.slug,
        p.name,
        p.description,
        p.price,
        p.old_price,
        p.image,
        p.is_active,
        p.created_at,
        p.updated_at
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...values, safeLimit, safeOffset],
  );

  const [countRows] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM packs p
      WHERE ${where.join(" AND ")}
    `,
    values,
  );

  return {
    packs: rows.map(normalizePack),
    total: numberValue(countRows[0]?.total),
  };
}

async function findPackBySlug(slug) {
  const [rows] = await pool.execute(
    `
      SELECT
        p.id,
        p.slug,
        p.name,
        p.description,
        p.price,
        p.old_price,
        p.image,
        p.is_active,
        p.created_at,
        p.updated_at,
        COUNT(DISTINCT pi.article_id) AS article_count,
        COALESCE(
          MIN(
            FLOOR(
              a.stock_quantity /
              NULLIF(pi.quantity, 0)
            )
          ),
          0
        ) AS calculated_stock
      FROM packs p
      LEFT JOIN pack_items pi
        ON pi.pack_id = p.id
      LEFT JOIN articles a
        ON a.id = pi.article_id
        AND a.is_active = 1
      WHERE p.slug = ?
        AND p.is_active = 1
      GROUP BY p.id
      LIMIT 1
    `,
    [slug],
  );

  if (!rows[0]) return null;

  const pack = normalizePack(rows[0]);

  const [articles] = await pool.execute(
    `
      SELECT
        a.id,
        a.slug,
        a.designation,
        a.reference,
        a.image,
        a.price,
        a.stock_quantity,
        pi.quantity,
        (a.price * pi.quantity) AS line_total
      FROM pack_items pi
      INNER JOIN articles a
        ON a.id = pi.article_id
      WHERE pi.pack_id = ?
        AND a.is_active = 1
      ORDER BY a.designation ASC
    `,
    [pack.id],
  );

  return {
    ...pack,
    articles: articles.map((article) => ({
      ...article,
      id: Number(article.id),
      price: numberValue(article.price),
      stock_quantity: numberValue(article.stock_quantity),
      quantity: numberValue(article.quantity),
      line_total: numberValue(article.line_total),
    })),
  };
}

async function listPromotions({
  search = "",
  limit = 100,
  offset = 0,
} = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const values = [];
  const searchWhere = [];

  if (search) {
    searchWhere.push(
      "(a.designation LIKE ? OR a.description LIKE ? OR p.name LIKE ?)",
    );
    const term = `%${search}%`;
    values.push(term, term, term);
  }

  const [rows] = await pool.query(
    `
      SELECT
        a.id,
        a.slug,
        a.designation,
        a.reference,
        a.brand,
        a.description,
        a.category_id,
        a.supplier_id,
        c.name AS category,
        s.name AS supplier,
        a.image,
        a.images,
        a.stock_quantity,
        a.rating,
        a.reviews,
        a.price AS base_price,
        p.id AS promotion_id,
        p.name AS promotion_name,
        p.description AS promotion_description,
        p.discount_type,
        p.discount_value,
        p.starts_at,
        p.ends_at,

        ROUND(
          CASE
            WHEN p.discount_type = 'PERCENT'
              THEN GREATEST(
                0,
                a.price -
                (a.price * p.discount_value / 100)
              )
            ELSE GREATEST(
              0,
              a.price - p.discount_value
            )
          END,
          2
        ) AS price,

        a.price AS old_price

      FROM promotion_articles pa
      INNER JOIN promotions p
        ON p.id = pa.promotion_id
      INNER JOIN articles a
        ON a.id = pa.article_id
      INNER JOIN categories c
        ON c.id = a.category_id
      LEFT JOIN suppliers s
        ON s.id = a.supplier_id

      WHERE p.is_active = 1
        AND a.is_active = 1
        AND (
          p.starts_at IS NULL
          OR p.starts_at <= NOW()
        )
        AND (
          p.ends_at IS NULL
          OR p.ends_at >= NOW()
        )
        ${searchWhere.length ? `AND ${searchWhere.join(" AND ")}` : ""}

      ORDER BY
        p.created_at DESC,
        a.created_at DESC

      LIMIT ? OFFSET ?
    `,
    [...values, safeLimit, safeOffset],
  );

  return {
    articles: rows.map(normalizeArticle),
    total: rows.length,
  };
}

module.exports = {
  listPacks,
  findPackBySlug,
  listPromotions,
};
