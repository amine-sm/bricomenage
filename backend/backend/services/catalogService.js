const pool = require("../config/db");
const articleService = require("./articleService");

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
    stock_managed:
      row.stock_managed === undefined
        ? true
        : Boolean(Number(row.stock_managed)),
    rating: numberValue(row.rating),
    reviews: numberValue(row.reviews),
    image,
    images: images.length > 0 ? images : image ? [image] : [],
    inStock:
      row.stock_managed !== undefined && Number(row.stock_managed) === 0
        ? true
        : numberValue(row.stock_quantity) > 0,
    item_type: "ARTICLE",
  };
}

function normalizePack(row) {
  const stockManaged =
    row.stock_managed === undefined
      ? true
      : Boolean(Number(row.stock_managed));

  return {
    ...row,
    id: Number(row.id),
    price: numberValue(row.price),
    old_price:
      row.old_price === null || row.old_price === undefined
        ? null
        : numberValue(row.old_price),
    article_count: numberValue(row.article_count),
    stock_quantity: stockManaged ? numberValue(row.calculated_stock) : 0,
    calculated_stock: stockManaged ? numberValue(row.calculated_stock) : 0,
    stock_managed: stockManaged,
    inStock: !stockManaged || numberValue(row.calculated_stock) > 0,
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
        CASE
          WHEN COUNT(pi.article_id) = 0 THEN 0
          WHEN SUM(CASE WHEN a.id IS NULL OR a.is_active = 0 THEN 1 ELSE 0 END) > 0 THEN 0
          WHEN SUM(CASE WHEN a.stock_managed = 1 THEN 1 ELSE 0 END) = 0 THEN NULL
          ELSE COALESCE(
            MIN(CASE WHEN a.stock_managed = 1 THEN FLOOR(a.stock_quantity / NULLIF(pi.quantity, 0)) ELSE NULL END),
            0
          )
        END AS calculated_stock,
        CASE
          WHEN SUM(CASE WHEN a.stock_managed = 1 THEN 1 ELSE 0 END) > 0 THEN 1
          ELSE 0
        END AS stock_managed
      FROM packs p
      LEFT JOIN pack_items pi
        ON pi.pack_id = p.id
      LEFT JOIN articles a
        ON a.id = pi.article_id
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

  const normalizedPacks =
    rows.map(normalizePack);

  const packIds =
    normalizedPacks.map(
      (pack) => pack.id,
    );

  const imagesByPack =
    new Map();

  if (packIds.length > 0) {
    const placeholders =
      packIds
        .map(() => "?")
        .join(",");

    const [imageRows] =
      await pool.query(
        `
          SELECT
            pi.pack_id,
            a.image,
            a.images

          FROM pack_items pi

          INNER JOIN articles a
            ON a.id = pi.article_id

          WHERE pi.pack_id IN (
            ${placeholders}
          )
            AND a.is_active = 1

          ORDER BY
            pi.pack_id ASC,
            a.id ASC
        `,
        packIds,
      );

    imageRows.forEach((row) => {
      const packId =
        Number(row.pack_id);

      const current =
        imagesByPack.get(packId) || [];

      const articleImages = [
        row.image,
        ...normalizeImages(
          row.images,
        ),
      ].filter(Boolean);

      imagesByPack.set(
        packId,
        Array.from(
          new Set([
            ...current,
            ...articleImages,
          ]),
        ),
      );
    });
  }

  return {
    packs: normalizedPacks.map(
      (pack) => ({
        ...pack,
        article_images:
          imagesByPack.get(
            pack.id,
          ) || [],
      }),
    ),

    total: numberValue(
      countRows[0]?.total,
    ),
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
        CASE
          WHEN COUNT(pi.article_id) = 0 THEN 0
          WHEN SUM(CASE WHEN a.id IS NULL OR a.is_active = 0 THEN 1 ELSE 0 END) > 0 THEN 0
          WHEN SUM(CASE WHEN a.stock_managed = 1 THEN 1 ELSE 0 END) = 0 THEN NULL
          ELSE COALESCE(
            MIN(CASE WHEN a.stock_managed = 1 THEN FLOOR(a.stock_quantity / NULLIF(pi.quantity, 0)) ELSE NULL END),
            0
          )
        END AS calculated_stock,
        CASE
          WHEN SUM(CASE WHEN a.stock_managed = 1 THEN 1 ELSE 0 END) > 0 THEN 1
          ELSE 0
        END AS stock_managed
      FROM packs p
      LEFT JOIN pack_items pi
        ON pi.pack_id = p.id
      LEFT JOIN articles a
        ON a.id = pi.article_id
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
        a.images,
        a.price,
        a.stock_quantity,
        a.stock_managed,
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
    articles: articles.map(
      (article) => {
        const images =
          normalizeImages(
            article.images,
          );

        const image =
          article.image ||
          images[0] ||
          null;

        return {
          ...article,
          id: Number(article.id),
          image,
          images:
            images.length > 0
              ? images
              : image
                ? [image]
                : [],
          price: numberValue(
            article.price,
          ),
          stock_quantity:
            numberValue(
              article.stock_quantity,
            ),
          stock_managed:
            article.stock_managed === undefined
              ? true
              : Boolean(Number(article.stock_managed)),
          quantity: numberValue(
            article.quantity,
          ),
          line_total: numberValue(
            article.line_total,
          ),
        };
      },
    ),
  };
}

async function listPromotions({
  search = "",
  limit = 100,
  offset = 0,
} = {}) {
  return articleService.listArticles({
    search,
    category: "",
    promotion: true,
    limit,
    offset,
  });
}

module.exports = {
  listPacks,
  findPackBySlug,
  listPromotions,
};
