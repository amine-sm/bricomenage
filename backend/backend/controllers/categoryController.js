const pool = require("../config/db");

async function listPublicCategories(
  req,
  res,
) {
  const [rows] =
    await pool.query(`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image,
        COUNT(a.id) AS article_count

      FROM categories c

      LEFT JOIN articles a
        ON a.category_id = c.id
        AND a.is_active = 1

      WHERE c.is_active = 1

      GROUP BY
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image

      ORDER BY
        c.name ASC
    `);

  return res.json({
    success: true,

    categories: rows.map(
      (category) => ({
        ...category,
        id: Number(category.id),
        article_count: Number(
          category.article_count ||
            0,
        ),
      }),
    ),
  });
}

module.exports = {
  listPublicCategories,
};
