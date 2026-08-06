const pool = require("../config/db");
const HttpError = require("../utils/httpError");

const clean = (value) =>
  String(value ?? "").trim();

function activeValue(value) {
  return (
    value === false ||
    value === 0 ||
    value === "0" ||
    String(value).toLowerCase() === "false"
  )
    ? 0
    : 1;
}

function normalizeSqlDateTime(value) {
  const normalized = clean(value);

  if (!normalized) {
    return null;
  }

  /*
   * Accepte :
   * 2026-08-06T13:30
   * 2026-08-06T13:30:00
   * 2026-08-06 13:30:00
   *
   * On conserve une date locale MySQL DATETIME,
   * sans conversion UTC.
   */
  const result = normalized
    .replace("T", " ")
    .replace(/Z$/i, "")
    .slice(0, 19);

  return result.length === 16
    ? `${result}:00`
    : result;
}

function parseArticleIds(body) {
  const source = Array.isArray(body.articleIds)
    ? body.articleIds
    : Array.isArray(body.articles)
      ? body.articles
      : [];

  return [
    ...new Set(
      source
        .map((item) =>
          typeof item === "object"
            ? Number(item.id)
            : Number(item),
        )
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0,
        ),
    ),
  ];
}

function validate(body) {
  const name = clean(body.name);

  const discountType = clean(
    body.discount_type || "PERCENT",
  ).toUpperCase();

  const discountValue = Number(
    body.discount_value,
  );

  const articleIds =
    parseArticleIds(body);

  if (!name) {
    throw new HttpError(
      400,
      "Le nom de la promotion est obligatoire.",
    );
  }

  if (
    !["PERCENT", "FIXED"].includes(
      discountType,
    )
  ) {
    throw new HttpError(
      400,
      "Type de réduction invalide.",
    );
  }

  if (
    !Number.isFinite(discountValue) ||
    discountValue <= 0
  ) {
    throw new HttpError(
      400,
      "Valeur de réduction invalide.",
    );
  }

  if (
    discountType === "PERCENT" &&
    discountValue > 100
  ) {
    throw new HttpError(
      400,
      "Le pourcentage ne peut pas dépasser 100 %.",
    );
  }

  if (!articleIds.length) {
    throw new HttpError(
      400,
      "Sélectionnez au moins un article.",
    );
  }

  const startsAt = normalizeSqlDateTime(
    body.starts_at,
  );

  const endsAt = normalizeSqlDateTime(
    body.ends_at,
  );

  if (
    startsAt &&
    endsAt &&
    endsAt <= startsAt
  ) {
    throw new HttpError(
      400,
      "La date de fin doit être postérieure à la date de début.",
    );
  }

  return {
    name,
    description:
      clean(body.description) || null,
    discountType,
    discountValue,
    startsAt,
    endsAt,
    isActive: activeValue(
      body.is_active,
    ),
    articleIds,
  };
}

function promotionalPrice(
  price,
  type,
  value,
) {
  const original = Number(price || 0);

  if (type === "PERCENT") {
    return Math.max(
      0,
      original -
        (original * Number(value || 0)) /
          100,
    );
  }

  return Math.max(
    0,
    original - Number(value || 0),
  );
}

async function fetchPromotion(
  connection,
  id,
) {
  const [[promotion]] =
    await connection.query(
      `
        SELECT
          p.*,
          COUNT(pa.article_id)
            AS article_count,

          CASE
            WHEN p.is_active = 1
              AND (
                p.starts_at IS NULL
                OR p.starts_at <= NOW()
              )
              AND (
                p.ends_at IS NULL
                OR p.ends_at >= NOW()
              )
            THEN 1
            ELSE 0
          END AS is_effective_active

        FROM promotions p

        LEFT JOIN promotion_articles pa
          ON pa.promotion_id = p.id

        WHERE p.id = ?

        GROUP BY p.id

        LIMIT 1
      `,
      [id],
    );

  if (!promotion) {
    return null;
  }

  const [articles] =
    await connection.query(
      `
        SELECT
          a.id,
          a.designation,
          a.reference,
          a.image,
          a.price,
          a.stock_quantity

        FROM promotion_articles pa

        INNER JOIN articles a
          ON a.id = pa.article_id

        WHERE pa.promotion_id = ?

        ORDER BY a.designation ASC
      `,
      [id],
    );

  return {
    ...promotion,
    article_count: Number(
      promotion.article_count || 0,
    ),
    is_effective_active: Boolean(
      promotion.is_effective_active,
    ),
    articles: articles.map(
      (article) => ({
        ...article,
        original_price: Number(
          article.price || 0,
        ),
        promotional_price:
          promotionalPrice(
            article.price,
            promotion.discount_type,
            promotion.discount_value,
          ),
      }),
    ),
  };
}

async function listPromotions(req, res) {
  const [rows] = await pool.query(`
    SELECT
      p.*,
      COUNT(pa.article_id)
        AS article_count,

      CASE
        WHEN p.is_active = 1
          AND (
            p.starts_at IS NULL
            OR p.starts_at <= NOW()
          )
          AND (
            p.ends_at IS NULL
            OR p.ends_at >= NOW()
          )
        THEN 1
        ELSE 0
      END AS is_effective_active

    FROM promotions p

    LEFT JOIN promotion_articles pa
      ON pa.promotion_id = p.id

    GROUP BY p.id

    ORDER BY p.created_at DESC
  `);

  return res.json({
    success: true,
    promotions: rows.map(
      (promotion) => ({
        ...promotion,
        article_count: Number(
          promotion.article_count || 0,
        ),
        is_effective_active: Boolean(
          promotion.is_effective_active,
        ),
      }),
    ),
  });
}

async function getPromotion(req, res) {
  const promotion =
    await fetchPromotion(
      pool,
      Number(req.params.id),
    );

  if (!promotion) {
    throw new HttpError(
      404,
      "Promotion introuvable.",
    );
  }

  return res.json(promotion);
}

async function verifyArticles(
  connection,
  articleIds,
) {
  const placeholders =
    articleIds.map(() => "?").join(",");

  const [[result]] =
    await connection.query(
      `
        SELECT COUNT(*) AS total
        FROM articles
        WHERE id IN (${placeholders})
      `,
      articleIds,
    );

  if (
    Number(result.total) !==
    articleIds.length
  ) {
    throw new HttpError(
      400,
      "Un article sélectionné est introuvable.",
    );
  }
}

async function createPromotion(req, res) {
  const data = validate(req.body);
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    await verifyArticles(
      connection,
      data.articleIds,
    );

    const [result] =
      await connection.query(
        `
          INSERT INTO promotions (
            name,
            description,
            discount_type,
            discount_value,
            starts_at,
            ends_at,
            is_active
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          data.name,
          data.description,
          data.discountType,
          data.discountValue,
          data.startsAt,
          data.endsAt,
          data.isActive,
        ],
      );

    const promotionId =
      Number(result.insertId);

    await connection.query(
      `
        INSERT INTO promotion_articles (
          promotion_id,
          article_id
        )
        VALUES ?
      `,
      [
        data.articleIds.map(
          (articleId) => [
            promotionId,
            articleId,
          ],
        ),
      ],
    );

    await connection.commit();

    const promotion =
      await fetchPromotion(
        pool,
        promotionId,
      );

    return res.status(201).json({
      success: true,
      message:
        "Promotion créée avec succès.",
      promotion,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updatePromotion(req, res) {
  const id = Number(req.params.id);
  const data = validate(req.body);
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[existing]] =
      await connection.query(
        `
          SELECT id
          FROM promotions
          WHERE id = ?
          FOR UPDATE
        `,
        [id],
      );

    if (!existing) {
      throw new HttpError(
        404,
        "Promotion introuvable.",
      );
    }

    await verifyArticles(
      connection,
      data.articleIds,
    );

    await connection.query(
      `
        UPDATE promotions
        SET
          name = ?,
          description = ?,
          discount_type = ?,
          discount_value = ?,
          starts_at = ?,
          ends_at = ?,
          is_active = ?
        WHERE id = ?
      `,
      [
        data.name,
        data.description,
        data.discountType,
        data.discountValue,
        data.startsAt,
        data.endsAt,
        data.isActive,
        id,
      ],
    );

    const [currentRows] =
      await connection.query(
        `
          SELECT article_id
          FROM promotion_articles
          WHERE promotion_id = ?
        `,
        [id],
      );

    const currentIds =
      currentRows.map(
        (row) =>
          Number(row.article_id),
      );

    const currentSet =
      new Set(currentIds);

    const requestedSet =
      new Set(data.articleIds);

    const toAdd =
      data.articleIds.filter(
        (articleId) =>
          !currentSet.has(articleId),
      );

    const toRemove =
      currentIds.filter(
        (articleId) =>
          !requestedSet.has(articleId),
      );

    if (toAdd.length > 0) {
      await connection.query(
        `
          INSERT IGNORE INTO
            promotion_articles (
              promotion_id,
              article_id
            )
          VALUES ?
        `,
        [
          toAdd.map(
            (articleId) => [
              id,
              articleId,
            ],
          ),
        ],
      );
    }

    if (toRemove.length > 0) {
      const placeholders =
        toRemove.map(() => "?").join(",");

      await connection.query(
        `
          DELETE FROM promotion_articles
          WHERE promotion_id = ?
            AND article_id IN (
              ${placeholders}
            )
        `,
        [
          id,
          ...toRemove,
        ],
      );
    }

    await connection.commit();

    const promotion =
      await fetchPromotion(pool, id);

    return res.json({
      success: true,
      message:
        "Promotion modifiée avec succès.",
      promotion,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deletePromotion(req, res) {
  const id = Number(req.params.id);
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[promotion]] =
      await connection.query(
        `
          SELECT id
          FROM promotions
          WHERE id = ?
          FOR UPDATE
        `,
        [id],
      );

    if (!promotion) {
      throw new HttpError(
        404,
        "Promotion introuvable.",
      );
    }

    await connection.query(
      `
        DELETE FROM promotion_articles
        WHERE promotion_id = ?
      `,
      [id],
    );

    await connection.query(
      `
        DELETE FROM promotions
        WHERE id = ?
      `,
      [id],
    );

    await connection.commit();

    return res.json({
      success: true,
      message:
        "Promotion supprimée.",
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  listPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
};
