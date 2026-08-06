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

  /*
   * Séparation stricte :
   * - promotion=true  : uniquement les articles liés à une promotion active ;
   * - promotion=false : uniquement les articles sans promotion active.
   */
  if (promotion) {
    where.push("p.id IS NOT NULL");
  } else {
    where.push("p.id IS NULL");
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const [articles] = await pool.query(
    `
      SELECT
        a.id,
        a.slug,
        a.designation,
        ROUND(CASE
          WHEN p.id IS NULL THEN a.price
          WHEN p.discount_type = 'PERCENT' THEN GREATEST(0, a.price - (a.price * p.discount_value / 100))
          ELSE GREATEST(0, a.price - p.discount_value)
        END, 2) AS price,
        CASE
          WHEN p.id IS NULL THEN NULL
          ELSE a.price
        END AS old_price,
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
      LEFT JOIN promotion_articles pa ON pa.article_id = a.id
      LEFT JOIN promotions p ON p.id = pa.promotion_id
        AND p.is_active = 1
        AND (p.starts_at IS NULL OR p.starts_at <= NOW())
        AND (p.ends_at IS NULL OR p.ends_at >= NOW())
      WHERE ${where.join(" AND ")}
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...values, safeLimit, safeOffset]
  );

  const [countRows] = await pool.query(
    `
      SELECT COUNT(DISTINCT a.id) AS total
      FROM articles a
      INNER JOIN categories c ON c.id = a.category_id
      LEFT JOIN promotion_articles pa ON pa.article_id = a.id
      LEFT JOIN promotions p ON p.id = pa.promotion_id
        AND p.is_active = 1
        AND (p.starts_at IS NULL OR p.starts_at <= NOW())
        AND (p.ends_at IS NULL OR p.ends_at >= NOW())
      WHERE ${where.join(" AND ")}
    `,
    values
  );

  return {
    articles: articles.map((article) => ({
      ...article,
      images: (() => {
        if (!article.images) {
          return [];
        }

        if (Array.isArray(article.images)) {
          return article.images;
        }

        try {
          const parsed =
            JSON.parse(article.images);

          return Array.isArray(parsed)
            ? parsed
            : [];
        } catch {
          return [];
        }
      })(),
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
        ROUND(CASE
          WHEN p.id IS NULL THEN a.price
          WHEN p.discount_type = 'PERCENT' THEN GREATEST(0, a.price - (a.price * p.discount_value / 100))
          ELSE GREATEST(0, a.price - p.discount_value)
        END, 2) AS price,
        CASE
          WHEN p.id IS NULL THEN NULL
          ELSE a.price
        END AS old_price,
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
      LEFT JOIN promotion_articles pa ON pa.article_id = a.id
      LEFT JOIN promotions p ON p.id = pa.promotion_id
        AND p.is_active = 1
        AND (p.starts_at IS NULL OR p.starts_at <= NOW())
        AND (p.ends_at IS NULL OR p.ends_at >= NOW())
      WHERE a.slug = ?
        AND a.is_active = 1
      GROUP BY a.id
      LIMIT 1
    `,
    [slug]
  );

  if (!rows[0]) {
    return null;
  }

  return {
    ...rows[0],
    images: (() => {
      if (!rows[0].images) {
        return [];
      }

      if (
        Array.isArray(
          rows[0].images,
        )
      ) {
        return rows[0].images;
      }

      try {
        const parsed =
          JSON.parse(
            rows[0].images,
          );

        return Array.isArray(parsed)
          ? parsed
          : [];
      } catch {
        return [];
      }
    })(),
    inStock: Boolean(rows[0].inStock),
  };
}

module.exports = { listArticles, findBySlug };
