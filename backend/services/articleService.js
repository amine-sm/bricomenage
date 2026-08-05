const pool = require("../config/db");

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
    where.push(
      "(a.designation LIKE ? OR a.description LIKE ? OR a.reference LIKE ?)"
    );
    const term = `%${search}%`;
    values.push(term, term, term);
  }

  if (category) {
    where.push("c.name = ?");
    values.push(category);
  }

  if (promotion) {
    where.push("(a.old_price IS NOT NULL AND a.old_price > a.price)");
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const [articles] = await pool.query(
    `
      SELECT
        a.id,
        a.slug,
        a.designation,
        a.price,
        a.old_price,
        c.name AS category,
        a.description,
        a.image,
        a.images,
        a.stock_quantity,
        a.rating,
        a.reviews,
        (a.stock_quantity > 0) AS inStock,
        a.reference,
        a.brand,
        a.created_at,
        a.updated_at
      FROM articles a
      INNER JOIN categories c ON c.id = a.category_id
      WHERE ${where.join(" AND ")}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...values, safeLimit, safeOffset]
  );

  const [countRows] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM articles a
      INNER JOIN categories c ON c.id = a.category_id
      WHERE ${where.join(" AND ")}
    `,
    values
  );

  return {
    articles: articles.map((article) => ({
      ...article,
      images: article.images ? JSON.parse(article.images) : [],
      inStock: Boolean(article.inStock),
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
        a.price,
        a.old_price,
        c.name AS category,
        a.category_id,
        a.supplier_id,
        a.description,
        a.image,
        a.images,
        a.stock_quantity,
        a.rating,
        a.reviews,
        (a.stock_quantity > 0) AS inStock,
        a.reference,
        a.brand,
        a.created_at,
        a.updated_at
      FROM articles a
      INNER JOIN categories c ON c.id = a.category_id
      WHERE a.slug = ?
        AND a.is_active = 1
      LIMIT 1
    `,
    [slug]
  );

  if (!rows[0]) {
    return null;
  }

  return {
    ...rows[0],
    images: rows[0].images ? JSON.parse(rows[0].images) : [],
    inStock: Boolean(rows[0].inStock),
  };
}

module.exports = { listArticles, findBySlug };
