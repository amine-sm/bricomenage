const pool = require("../config/db");

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

function normalizeHexColor(value) {
  const raw = String(value || "").trim().toUpperCase();

  if (/^#[0-9A-F]{6}$/.test(raw)) return raw;

  if (/^#[0-9A-F]{3}$/.test(raw)) {
    return `#${raw
      .slice(1)
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`;
  }

  return null;
}

function normalizeColors(value) {
  if (!value) return [];

  let parsed = value;

  if (!Array.isArray(parsed)) {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  const colors = [];
  const used = new Set();

  for (const item of parsed) {
    const source =
      item && typeof item === "object"
        ? item
        : { hex: item };
    const hex = normalizeHexColor(source.hex);

    if (!hex || used.has(hex)) continue;

    used.add(hex);
    const red = parseInt(hex.slice(1, 3), 16);
    const green = parseInt(hex.slice(3, 5), 16);
    const blue = parseInt(hex.slice(5, 7), 16);

    colors.push({
      name: String(source.name || "").trim() || null,
      hex,
      rgb: `rgb(${red}, ${green}, ${blue})`,
    });
  }

  return colors.slice(0, 20);
}

const ACTIVE_PROMO_JOIN = `
  LEFT JOIN (
    SELECT ranked.*
    FROM (
      SELECT
        pa.article_id,
        p.id AS promotion_id,
        p.name AS promotion_name,
        p.discount_type,
        p.discount_value,
        p.starts_at,
        p.ends_at,
        ROUND(
          CASE
            WHEN p.discount_type = 'PERCENT'
              THEN GREATEST(0, a2.price - (a2.price * p.discount_value / 100))
            ELSE GREATEST(0, a2.price - p.discount_value)
          END,
          2
        ) AS promotional_price,
        ROW_NUMBER() OVER (
          PARTITION BY pa.article_id
          ORDER BY
            ROUND(
              CASE
                WHEN p.discount_type = 'PERCENT'
                  THEN GREATEST(0, a2.price - (a2.price * p.discount_value / 100))
                ELSE GREATEST(0, a2.price - p.discount_value)
              END,
              2
            ) ASC,
            p.id DESC
        ) AS rn
      FROM promotion_articles pa
      INNER JOIN promotions p ON p.id = pa.promotion_id
      INNER JOIN articles a2 ON a2.id = pa.article_id
      WHERE p.is_active = 1
        AND (p.starts_at IS NULL OR p.starts_at <= NOW())
        AND (p.ends_at IS NULL OR p.ends_at >= NOW())
    ) ranked
    WHERE ranked.rn = 1
  ) promo ON promo.article_id = a.id
`;

async function listArticles({
  search = "",
  category = "",
  promotion = false,
  limit = 24,
  offset = 0,
}) {
  const where = ["a.is_active = 1"];
  const values = [];

  if (search) {
    where.push("(a.designation LIKE ? OR a.description LIKE ? OR a.reference LIKE ?)");
    const term = `%${search}%`;
    values.push(term, term, term);
  }

  if (category) {
    where.push("c.name = ?");
    values.push(category);
  }

  // Catalogue normal = tous les articles actifs.
  // promotion=true = uniquement ceux qui ont une promotion réellement active.
  if (promotion) {
    where.push("promo.promotion_id IS NOT NULL");
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const [articles] = await pool.query(
    `
      SELECT
        a.id,
        a.slug,
        a.designation,
        COALESCE(promo.promotional_price, a.price) AS price,
        CASE WHEN promo.promotion_id IS NULL THEN a.old_price ELSE a.price END AS old_price,
        c.name AS category,
        a.description,
        a.image,
        a.images,
        a.colors,
        a.stock_quantity,
        a.stock_managed,
        a.rating,
        a.reviews,
        (a.stock_managed = 0 OR a.stock_quantity > 0) AS inStock,
        a.reference,
        a.brand,
        a.created_at,
        a.updated_at,
        promo.promotion_id,
        promo.promotion_name,
        promo.discount_type,
        promo.discount_value,
        promo.starts_at,
        promo.ends_at
      FROM articles a
      INNER JOIN categories c ON c.id = a.category_id
      ${ACTIVE_PROMO_JOIN}
      WHERE ${where.join(" AND ")}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...values, safeLimit, safeOffset],
  );

  const [countRows] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM articles a
      INNER JOIN categories c ON c.id = a.category_id
      ${ACTIVE_PROMO_JOIN}
      WHERE ${where.join(" AND ")}
    `,
    values,
  );

  return {
    articles: articles.map((article) => ({
      ...article,
      id: Number(article.id),
      price: Number(article.price || 0),
      old_price: article.old_price == null ? null : Number(article.old_price),
      stock_quantity: Number(article.stock_quantity || 0),
      stock_managed: article.stock_managed === undefined ? true : Boolean(Number(article.stock_managed)),
      rating: Number(article.rating || 0),
      reviews: Number(article.reviews || 0),
      images: normalizeImages(article.images),
      colors: normalizeColors(article.colors),
      inStock: Boolean(article.inStock),
      promotion_id: article.promotion_id == null ? undefined : Number(article.promotion_id),
      discount_value: article.discount_value == null ? undefined : Number(article.discount_value),
      item_type: "ARTICLE",
    })),
    total: Number(countRows[0]?.total || 0),
  };
}

async function findBySlug(slug) {
  const [rows] = await pool.query(
    `
      SELECT
        a.id,
        a.slug,
        a.designation,
        COALESCE(promo.promotional_price, a.price) AS price,
        CASE WHEN promo.promotion_id IS NULL THEN a.old_price ELSE a.price END AS old_price,
        c.name AS category,
        a.category_id,
        a.supplier_id,
        a.description,
        a.image,
        a.images,
        a.colors,
        a.stock_quantity,
        a.stock_managed,
        a.rating,
        a.reviews,
        (a.stock_managed = 0 OR a.stock_quantity > 0) AS inStock,
        a.reference,
        a.brand,
        a.created_at,
        a.updated_at,
        promo.promotion_id,
        promo.promotion_name,
        promo.discount_type,
        promo.discount_value,
        promo.starts_at,
        promo.ends_at
      FROM articles a
      INNER JOIN categories c ON c.id = a.category_id
      ${ACTIVE_PROMO_JOIN}
      WHERE a.slug = ? AND a.is_active = 1
      LIMIT 1
    `,
    [slug],
  );

  if (!rows[0]) return null;
  const row = rows[0];
  return {
    ...row,
    id: Number(row.id),
    price: Number(row.price || 0),
    old_price: row.old_price == null ? null : Number(row.old_price),
    stock_quantity: Number(row.stock_quantity || 0),
    stock_managed: row.stock_managed === undefined ? true : Boolean(Number(row.stock_managed)),
    rating: Number(row.rating || 0),
    reviews: Number(row.reviews || 0),
    images: normalizeImages(row.images),
    colors: normalizeColors(row.colors),
    inStock: Boolean(row.inStock),
    promotion_id: row.promotion_id == null ? undefined : Number(row.promotion_id),
    discount_value: row.discount_value == null ? undefined : Number(row.discount_value),
    item_type: "ARTICLE",
  };
}

module.exports = { listArticles, findBySlug };
