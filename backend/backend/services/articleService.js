const pool = require("../config/db");

function parseImages(images) {
  if (!images) {
    return [];
  }

  if (Array.isArray(images)) {
    return images;
  }

  try {
    const parsed = JSON.parse(images);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function normalizeArticle(article) {
  return {
    ...article,
    images: parseImages(
      article.images,
    ),
    inStock: Boolean(
      article.inStock,
    ),
  };
}

async function listArticles({
  search = "",
  category = "",
  promotion = false,
  limit = 24,
  offset = 0,
}) {
  const where = [
    "a.is_active = 1",
  ];

  const values = [];

  if (search) {
    where.push(
      `(
        a.designation LIKE ?
        OR a.description LIKE ?
        OR a.reference LIKE ?
        OR a.brand LIKE ?
      )`,
    );

    const term = `%${search}%`;

    values.push(
      term,
      term,
      term,
      term,
    );
  }

  if (category) {
    where.push(
      "c.name = ?",
    );

    values.push(category);
  }

  /*
   * IMPORTANT :
   *
   * promotion = true
   * => uniquement articles avec
   * promotion actuellement active.
   *
   * promotion = false
   * => uniquement articles sans
   * promotion actuellement active.
   */
  if (promotion) {
    where.push(
      "p.id IS NOT NULL",
    );
  } else {
    where.push(
      "p.id IS NULL",
    );
  }

  const safeLimit = Math.min(
    Math.max(
      Number(limit) || 24,
      1,
    ),
    100,
  );

  const safeOffset = Math.max(
    Number(offset) || 0,
    0,
  );

  const [articles] =
    await pool.query(
      `
        SELECT
          a.id,
          a.slug,
          a.designation,

          ROUND(
            CASE
              WHEN p.id IS NULL
                THEN a.price

              WHEN p.discount_type = 'PERCENT'
                THEN GREATEST(
                  0,
                  a.price -
                  (
                    a.price *
                    p.discount_value /
                    100
                  )
                )

              ELSE GREATEST(
                0,
                a.price -
                p.discount_value
              )
            END,
            2
          ) AS price,

          CASE
            WHEN p.id IS NULL
              THEN NULL
            ELSE a.price
          END AS old_price,

          c.name AS category,

          a.description,
          a.image,
          a.images,
          a.stock_quantity,
          a.rating,
          a.reviews,

          (
            a.stock_quantity > 0
          ) AS inStock,

          a.reference,
          a.brand,

          p.id AS promotion_id,
          p.name AS promotion_name,
          p.discount_type,
          p.discount_value,

          a.created_at,
          a.updated_at

        FROM articles a

        INNER JOIN categories c
          ON c.id = a.category_id

        LEFT JOIN promotion_articles pa
          ON pa.article_id = a.id

        LEFT JOIN promotions p
          ON p.id = pa.promotion_id
          AND p.is_active = 1
          AND (
            p.starts_at IS NULL
            OR p.starts_at <= NOW()
          )
          AND (
            p.ends_at IS NULL
            OR p.ends_at >= NOW()
          )

        WHERE
          ${where.join(" AND ")}

        GROUP BY
          a.id

        ORDER BY
          a.created_at DESC

        LIMIT ?
        OFFSET ?
      `,
      [
        ...values,
        safeLimit,
        safeOffset,
      ],
    );

  const [countRows] =
    await pool.query(
      `
        SELECT
          COUNT(
            DISTINCT a.id
          ) AS total

        FROM articles a

        INNER JOIN categories c
          ON c.id = a.category_id

        LEFT JOIN promotion_articles pa
          ON pa.article_id = a.id

        LEFT JOIN promotions p
          ON p.id = pa.promotion_id
          AND p.is_active = 1
          AND (
            p.starts_at IS NULL
            OR p.starts_at <= NOW()
          )
          AND (
            p.ends_at IS NULL
            OR p.ends_at >= NOW()
          )

        WHERE
          ${where.join(" AND ")}
      `,
      values,
    );

  return {
    articles:
      articles.map(
        normalizeArticle,
      ),

    total: Number(
      countRows[0]?.total || 0,
    ),
  };
}

async function findBySlug(
  slug,
) {
  const [rows] =
    await pool.query(
      `
        SELECT
          a.id,
          a.slug,
          a.designation,

          ROUND(
            CASE
              WHEN p.id IS NULL
                THEN a.price

              WHEN p.discount_type = 'PERCENT'
                THEN GREATEST(
                  0,
                  a.price -
                  (
                    a.price *
                    p.discount_value /
                    100
                  )
                )

              ELSE GREATEST(
                0,
                a.price -
                p.discount_value
              )
            END,
            2
          ) AS price,

          CASE
            WHEN p.id IS NULL
              THEN NULL
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

          (
            a.stock_quantity > 0
          ) AS inStock,

          a.reference,
          a.brand,

          p.id AS promotion_id,
          p.name AS promotion_name,
          p.discount_type,
          p.discount_value,

          a.created_at,
          a.updated_at

        FROM articles a

        INNER JOIN categories c
          ON c.id = a.category_id

        LEFT JOIN promotion_articles pa
          ON pa.article_id = a.id

        LEFT JOIN promotions p
          ON p.id = pa.promotion_id
          AND p.is_active = 1
          AND (
            p.starts_at IS NULL
            OR p.starts_at <= NOW()
          )
          AND (
            p.ends_at IS NULL
            OR p.ends_at >= NOW()
          )

        WHERE
          a.slug = ?
          AND a.is_active = 1

        GROUP BY
          a.id

        LIMIT 1
      `,
      [slug],
    );

  if (!rows[0]) {
    return null;
  }

  return normalizeArticle(
    rows[0],
  );
}

async function findById(id) {
  const articleId =
    Number(id);

  if (
    !Number.isInteger(
      articleId,
    ) ||
    articleId <= 0
  ) {
    return null;
  }

  const [rows] =
    await pool.query(
      `
        SELECT
          a.id,
          a.slug,
          a.designation,
          a.price,
          a.category_id,
          a.supplier_id,
          a.description,
          a.image,
          a.images,
          a.stock_quantity,
          a.min_stock,
          a.rating,
          a.reviews,
          a.reference,
          a.brand,
          a.is_active,
          a.created_at,
          a.updated_at,
          c.name AS category,
          s.name AS supplier

        FROM articles a

        INNER JOIN categories c
          ON c.id =
            a.category_id

        LEFT JOIN suppliers s
          ON s.id =
            a.supplier_id

        WHERE
          a.id = ?

        LIMIT 1
      `,
      [articleId],
    );

  if (!rows[0]) {
    return null;
  }

  return normalizeArticle(
    rows[0],
  );
}

async function articleExists(
  id,
) {
  const [rows] =
    await pool.query(
      `
        SELECT id
        FROM articles
        WHERE id = ?
        LIMIT 1
      `,
      [Number(id)],
    );

  return Boolean(
    rows[0],
  );
}

/*
 * Vérifier si l'article
 * a déjà été utilisé
 * dans une commande.
 *
 * Adaptez "order_items"
 * si votre table porte
 * un autre nom.
 */
async function isUsedInOrder(
  connection,
  articleId,
) {
  try {
    const [rows] =
      await connection.query(
        `
          SELECT id
          FROM order_items
          WHERE article_id = ?
          LIMIT 1
        `,
        [articleId],
      );

    return Boolean(
      rows[0],
    );
  } catch (error) {
    /*
     * Si votre projet n'a
     * pas cette table,
     * on n'empêche pas
     * la suppression.
     */
    if (
      error.code ===
      "ER_NO_SUCH_TABLE"
    ) {
      return false;
    }

    /*
     * Certains projets utilisent
     * une table avec une structure
     * différente.
     */
    if (
      error.code ===
      "ER_BAD_FIELD_ERROR"
    ) {
      return false;
    }

    throw error;
  }
}

async function deleteArticle(
  id,
) {
  const articleId =
    Number(id);

  if (
    !Number.isInteger(
      articleId,
    ) ||
    articleId <= 0
  ) {
    const error =
      new Error(
        "Identifiant article invalide.",
      );

    error.statusCode = 400;

    throw error;
  }

  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    /*
     * Vérifier l'article
     * avant suppression.
     */
    const [articles] =
      await connection.query(
        `
          SELECT
            id,
            designation,
            slug,
            image,
            images
          FROM articles
          WHERE id = ?
          LIMIT 1
        `,
        [articleId],
      );

    const article =
      articles[0];

    if (!article) {
      const error =
        new Error(
          "Article introuvable.",
        );

      error.statusCode = 404;

      throw error;
    }

    /*
     * On protège l'historique
     * des commandes.
     */
    const usedInOrder =
      await isUsedInOrder(
        connection,
        articleId,
      );

    if (usedInOrder) {
      const error =
        new Error(
          "Impossible de supprimer cet article car il est déjà utilisé dans une commande.",
        );

      error.statusCode = 409;
      error.code =
        "ARTICLE_USED_IN_ORDER";

      throw error;
    }

    /*
     * Supprimer les liens
     * entre article et promotions.
     */
    await connection.query(
      `
        DELETE FROM
          promotion_articles
        WHERE
          article_id = ?
      `,
      [articleId],
    );

    /*
     * Supprimer les liens
     * avec les packs.
     *
     * Si pack_articles
     * n'existe pas, on ignore.
     */
    try {
      await connection.query(
        `
          DELETE FROM
            pack_articles
          WHERE
            article_id = ?
        `,
        [articleId],
      );
    } catch (error) {
      if (
        error.code !==
          "ER_NO_SUCH_TABLE" &&
        error.code !==
          "ER_BAD_FIELD_ERROR"
      ) {
        throw error;
      }
    }

    /*
     * Vous pouvez avoir une
     * table stock_movements.
     *
     * On supprime les mouvements
     * uniquement si votre structure
     * permet leur suppression.
     */
    try {
      await connection.query(
        `
          DELETE FROM
            stock_movements
          WHERE
            article_id = ?
        `,
        [articleId],
      );
    } catch (error) {
      if (
        error.code !==
          "ER_NO_SUCH_TABLE" &&
        error.code !==
          "ER_BAD_FIELD_ERROR"
      ) {
        throw error;
      }
    }

    /*
     * Suppression définitive
     * de l'article.
     */
    const [result] =
      await connection.query(
        `
          DELETE FROM articles
          WHERE id = ?
        `,
        [articleId],
      );

    if (
      Number(
        result.affectedRows,
      ) === 0
    ) {
      const error =
        new Error(
          "Article introuvable.",
        );

      error.statusCode = 404;

      throw error;
    }

    await connection.commit();

    return {
      id: articleId,

      designation:
        article.designation,

      slug:
        article.slug,
    };
  } catch (error) {
    await connection.rollback();

    /*
     * Une autre table référence
     * encore l'article.
     */
    if (
      error.code ===
        "ER_ROW_IS_REFERENCED_2" ||
      error.errno === 1451
    ) {
      const conflictError =
        new Error(
          "Impossible de supprimer cet article car il est utilisé par une commande, un pack ou une autre opération.",
        );

      conflictError.statusCode =
        409;

      conflictError.code =
        "ARTICLE_REFERENCED";

      throw conflictError;
    }

    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  listArticles,
  findBySlug,
  findById,
  articleExists,
  deleteArticle,
};