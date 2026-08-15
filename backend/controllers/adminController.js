const slugify = require("slugify");
const pool = require("../config/db");
const HttpError = require("../utils/httpError");
const zrExpressService = require("../services/zrExpressService");

function clean(value) {
  return String(value ?? "").trim();
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function nullableNumber(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function booleanValue(
  value,
  fallback = true,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  return !(
    value === false ||
    value === 0 ||
    value === "0" ||
    String(value).toLowerCase() ===
      "false"
  );
}

function parseArray(value) {
  if (Array.isArray(value)) {
    return value
      .map(String)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
          .map(String)
          .map((item) =>
            item.trim(),
          )
          .filter(Boolean)
      : [];
  } catch {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function safeArticle(row) {
  if (!row) {
    return null;
  }

  const images = parseArray(
    row.images,
  );

  const image =
    row.image ||
    images[0] ||
    null;

  return {
    ...row,
    id: Number(row.id),
    category_id: Number(
      row.category_id,
    ),
    supplier_id:
      row.supplier_id === null
        ? null
        : Number(row.supplier_id),
    price: Number(
      row.price || 0,
    ),
    old_price:
      row.old_price === null
        ? null
        : Number(row.old_price),
    purchase_price:
      row.purchase_price === null
        ? null
        : Number(
            row.purchase_price,
          ),
    stock_quantity: Number(
      row.stock_quantity || 0,
    ),
    stock_managed:
      row.stock_managed === undefined
        ? true
        : Boolean(Number(row.stock_managed)),
    min_stock: Number(
      row.min_stock || 0,
    ),
    rating: Number(
      row.rating || 0,
    ),
    reviews: Number(
      row.reviews || 0,
    ),
    is_active: Boolean(
      row.is_active,
    ),
    image,
    images:
      images.length > 0
        ? images
        : image
          ? [image]
          : [],
  };
}

function buildImageUrl(
  req,
  filename,
) {
  if (!filename) {
    return null;
  }

  return `${req.protocol}://${req.get(
    "host",
  )}/uploads/products/${filename}`;
}

function uploadedImages(req) {
  const files = Array.isArray(
    req.files,
  )
    ? req.files
    : Object.values(
        req.files || {},
      ).flat();

  return files
    .slice(0, 10)
    .map((file) =>
      buildImageUrl(
        req,
        file.filename,
      ),
    )
    .filter(Boolean);
}

async function uniqueSlug(
  designation,
  excludedId = null,
) {
  const base =
    slugify(designation, {
      lower: true,
      strict: true,
      trim: true,
    }) || `article-${Date.now()}`;

  let candidate = base;
  let suffix = 1;

  while (true) {
    const params = [candidate];
    let sql =
      "SELECT id FROM articles WHERE slug = ?";

    if (excludedId) {
      sql += " AND id <> ?";
      params.push(excludedId);
    }

    sql += " LIMIT 1";

    const [rows] =
      await pool.query(
        sql,
        params,
      );

    if (!rows[0]) {
      return candidate;
    }

    suffix += 1;
    candidate =
      `${base}-${suffix}`;
  }
}

async function verifyCategory(
  categoryId,
) {
  const [rows] =
    await pool.query(
      `
        SELECT id
        FROM categories
        WHERE id = ?
          AND is_active = 1
        LIMIT 1
      `,
      [categoryId],
    );

  if (!rows[0]) {
    throw new HttpError(
      400,
      "Catégorie invalide ou inactive.",
    );
  }
}

async function verifySupplier(
  supplierId,
) {
  if (!supplierId) {
    return;
  }

  const [rows] =
    await pool.query(
      `
        SELECT id
        FROM suppliers
        WHERE id = ?
          AND is_active = 1
        LIMIT 1
      `,
      [supplierId],
    );

  if (!rows[0]) {
    throw new HttpError(
      400,
      "Fournisseur invalide ou inactif.",
    );
  }
}

async function getArticleRow(id) {
  const [rows] =
    await pool.query(
      `
        SELECT
          a.*,
          c.name AS category,
          c.name AS category_name,
          s.name AS supplier,
          s.name AS supplier_name
        FROM articles a
        INNER JOIN categories c
          ON c.id = a.category_id
        LEFT JOIN suppliers s
          ON s.id = a.supplier_id
        WHERE a.id = ?
        LIMIT 1
      `,
      [id],
    );

  return safeArticle(rows[0]);
}

async function dashboard(
  req,
  res,
) {
  const [
    [articles],
    [categories],
    [orders],
    [revenue],
  ] = await Promise.all([
    pool.query(
      "SELECT COUNT(*) AS total FROM articles",
    ),
    pool.query(
      "SELECT COUNT(*) AS total FROM categories",
    ),
    pool.query(
      `
        SELECT COUNT(*) AS total
        FROM orders
        WHERE status <> 'ANNULEE'
      `,
    ),
    pool.query(
      `
        SELECT
          COALESCE(
            SUM(total),
            0
          ) AS total
        FROM orders
        WHERE status <> 'ANNULEE'
      `,
    ),
  ]);

  return res.json({
    success: true,
    stats: {
      articles: Number(
        articles[0].total,
      ),
      categories: Number(
        categories[0].total,
      ),
      orders: Number(
        orders[0].total,
      ),
      revenue: Number(
        revenue[0].total,
      ),
    },
  });
}

async function listCategories(
  req,
  res,
) {
  /*
   * Compter réellement les articles liés
   * à chaque catégorie dans l'administration.
   *
   * On compte tous les articles de la catégorie,
   * qu'ils soient actifs ou inactifs.
   */
  const [rows] =
    await pool.query(`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image,
        c.is_active,
        c.created_at,
        c.updated_at,
        COUNT(
          DISTINCT a.id
        ) AS article_count
      FROM categories c
      LEFT JOIN articles a
        ON a.category_id = c.id
      GROUP BY
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image,
        c.is_active,
        c.created_at,
        c.updated_at
      ORDER BY
        c.name ASC
    `);

  return res.json({
    success: true,

    categories:
      rows.map(
        (category) => ({
          ...category,

          article_count:
            Number(
              category.article_count ||
                0,
            ),
        }),
      ),
  });
}

function uploadedCategoryImage(
  req,
) {
  const files = Array.isArray(
    req.files,
  )
    ? req.files
    : Object.values(
        req.files || {},
      ).flat();

  const file =
    files.find(
      (item) =>
        item.fieldname ===
          "category_image" ||
        item.fieldname ===
          "image",
    ) ||
    files[0];

  return file
    ? buildImageUrl(
        req,
        file.filename,
      )
    : null;
}

async function createCategory(
  req,
  res,
) {
  const name = clean(
    req.body.name,
  );

  if (!name) {
    throw new HttpError(
      400,
      "Le nom est obligatoire.",
    );
  }

  const categorySlug =
    clean(req.body.slug) ||
    slugify(name, {
      lower: true,
      strict: true,
    });

  const [result] =
    await pool.query(
      `
        INSERT INTO categories (
          name,
          slug,
          description,
          image
        )
        VALUES (?, ?, ?, ?)
      `,
      [
        name,
        categorySlug,
        clean(
          req.body.description,
        ) || null,
        uploadedCategoryImage(req) ||
        clean(
          req.body.existing_image,
        ) ||
          null,
      ],
    );

  return res
    .status(201)
    .json({
      success: true,
      category: {
        id: result.insertId,
        name,
        slug: categorySlug,
      },
    });
}

async function updateCategory(
  req,
  res,
) {
  const name = clean(
    req.body.name,
  );

  if (!name) {
    throw new HttpError(
      400,
      "Le nom est obligatoire.",
    );
  }

  const categorySlug =
    clean(req.body.slug) ||
    slugify(name, {
      lower: true,
      strict: true,
    });

  await pool.query(
    `
      UPDATE categories
      SET
        name = ?,
        slug = ?,
        description = ?,
        image = ?,
        is_active = ?
      WHERE id = ?
    `,
    [
      name,
      categorySlug,
      clean(
        req.body.description,
      ) || null,
      uploadedCategoryImage(req) ||
      clean(
        req.body.existing_image,
      ) ||
        null,
      booleanValue(
        req.body.is_active,
      )
        ? 1
        : 0,
      req.params.id,
    ],
  );

  return res.json({
    success: true,
    message:
      "Catégorie modifiée.",
  });
}

async function deleteCategory(
  req,
  res,
) {
  const [usage] =
    await pool.query(
      `
        SELECT COUNT(*) AS total
        FROM articles
        WHERE category_id = ?
      `,
      [req.params.id],
    );

  if (
    Number(
      usage[0]?.total || 0,
    ) > 0
  ) {
    throw new HttpError(
      409,
      "Cette catégorie est utilisée par des articles.",
    );
  }

  await pool.query(
    `
      DELETE FROM categories
      WHERE id = ?
    `,
    [req.params.id],
  );

  return res.json({
    success: true,
    message:
      "Catégorie supprimée.",
  });
}

async function articleReferences(
  req,
  res,
) {
  const [
    [categories],
    [suppliers],
  ] = await Promise.all([
    pool.query(`
      SELECT
        id,
        name,
        slug
      FROM categories
      WHERE is_active = 1
      ORDER BY name ASC
    `),
    pool.query(`
      SELECT
        id,
        name,
        contact_name,
        phone,
        email,
        wilaya
      FROM suppliers
      WHERE is_active = 1
      ORDER BY name ASC
    `),
  ]);

  return res.json({
    success: true,
    categories,
    suppliers,
  });
}

async function listArticles(
  req,
  res,
) {
  const search = clean(
    req.query.search,
  );

  const categoryId = clean(
    req.query.categoryId ||
      req.query.category_id,
  );

  const supplierId = clean(
    req.query.supplierId ||
      req.query.supplier_id,
  );

  const stock = clean(
    req.query.stock,
  );

  const where = ["1 = 1"];
  const params = [];

  if (search) {
    const term = `%${search}%`;

    where.push(`
      (
        a.designation LIKE ?
        OR a.reference LIKE ?
        OR a.brand LIKE ?
      )
    `);

    params.push(
      term,
      term,
      term,
    );
  }

  if (categoryId) {
    where.push(
      "a.category_id = ?",
    );
    params.push(
      Number(categoryId),
    );
  }

  if (supplierId) {
    where.push(
      "a.supplier_id = ?",
    );
    params.push(
      Number(supplierId),
    );
  }

  if (stock === "available") {
    where.push(
      "(a.stock_managed = 0 OR a.stock_quantity > a.min_stock)",
    );
  }

  if (stock === "low") {
    where.push(`
      a.stock_managed = 1
      AND a.stock_quantity > 0
      AND a.stock_quantity <= a.min_stock
    `);
  }

  if (stock === "out") {
    where.push(
      "a.stock_managed = 1 AND a.stock_quantity <= 0",
    );
  }

  const [rows] =
    await pool.query(
      `
        SELECT
          a.*,
          c.name AS category,
          c.name AS category_name,
          s.name AS supplier,
          s.name AS supplier_name
        FROM articles a
        INNER JOIN categories c
          ON c.id = a.category_id
        LEFT JOIN suppliers s
          ON s.id = a.supplier_id
        WHERE ${where.join(
          " AND ",
        )}
        ORDER BY
          a.created_at DESC
      `,
      params,
    );

  return res.json({
    success: true,
    articles:
      rows.map(safeArticle),
    total: rows.length,
  });
}

async function getArticle(
  req,
  res,
) {
  const article =
    await getArticleRow(
      req.params.id,
    );

  if (!article) {
    throw new HttpError(
      404,
      "Article introuvable.",
    );
  }

  return res.json({
    success: true,
    article,
  });
}

async function createArticle(
  req,
  res,
) {
  const designation = clean(
    req.body.designation,
  );

  const categoryId = Number(
    req.body.category_id,
  );

  const supplierId =
    nullableNumber(
      req.body.supplier_id,
    );

  if (!designation) {
    throw new HttpError(
      400,
      "La désignation est obligatoire.",
    );
  }

  if (!categoryId) {
    throw new HttpError(
      400,
      "La catégorie est obligatoire.",
    );
  }

  await verifyCategory(
    categoryId,
  );

  await verifySupplier(
    supplierId,
  );

  const articleSlug =
    clean(req.body.slug) ||
    (await uniqueSlug(
      designation,
    ));

  const newImages =
    uploadedImages(req);

  const externalImages =
    parseArray(
      req.body.images ||
        req.body.existing_images,
    );

  const images = [
    ...new Set([
      ...newImages,
      ...externalImages,
    ]),
  ].slice(0, 10);

  const mainImage =
    clean(
      req.body.main_image ||
        req.body.image,
    ) ||
    images[0] ||
    null;

  const stockManaged =
    clean(req.body.stock_quantity) !== ""
      ? 1
      : 0;

  const stockQuantity = stockManaged
    ? Math.max(
        0,
        Math.trunc(number(req.body.stock_quantity)),
      )
    : 0;

  const [result] =
    await pool.query(
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
          stock_managed,
          min_stock,
          image,
          images,
          rating,
          reviews,
          is_active
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `,
      [
        categoryId,
        supplierId,
        articleSlug,
        designation,
        clean(
          req.body.reference,
        ) || null,
        clean(
          req.body.brand,
        ) || null,
        clean(
          req.body.description,
        ) || null,
        Math.max(
          0,
          number(
            req.body.price,
          ),
        ),
        nullableNumber(
          req.body.old_price,
        ),
        nullableNumber(
          req.body.purchase_price,
        ),
        stockQuantity,
        stockManaged,
        Math.max(
          0,
          Math.trunc(
            number(
              req.body.min_stock,
            ),
          ),
        ),
        mainImage,
        JSON.stringify(
          images,
        ),
        Math.min(
          5,
          Math.max(
            0,
            number(
              req.body.rating,
            ),
          ),
        ),
        Math.max(
          0,
          Math.trunc(
            number(
              req.body.reviews,
            ),
          ),
        ),
        booleanValue(
          req.body.is_active,
        )
          ? 1
          : 0,
      ],
    );

  const article =
    await getArticleRow(
      result.insertId,
    );

  return res
    .status(201)
    .json({
      success: true,
      message:
        "Article ajouté avec succès.",
      article,
    });
}

async function updateArticle(
  req,
  res,
) {
  const id = Number(
    req.params.id,
  );

  const existing =
    await getArticleRow(id);

  if (!existing) {
    throw new HttpError(
      404,
      "Article introuvable.",
    );
  }

  const designation =
    req.body.designation !==
    undefined
      ? clean(
          req.body.designation,
        )
      : existing.designation;

  if (!designation) {
    throw new HttpError(
      400,
      "La désignation est obligatoire.",
    );
  }

  const categoryId =
    req.body.category_id !==
    undefined
      ? Number(
          req.body.category_id,
        )
      : existing.category_id;

  const supplierId =
    req.body.supplier_id !==
    undefined
      ? nullableNumber(
          req.body.supplier_id,
        )
      : existing.supplier_id;

  await verifyCategory(
    categoryId,
  );

  await verifySupplier(
    supplierId,
  );

  const articleSlug =
    clean(req.body.slug) ||
    (designation !==
    existing.designation
      ? await uniqueSlug(
          designation,
          id,
        )
      : existing.slug);

  const existingImages =
    req.body.existing_images !==
    undefined
      ? parseArray(
          req.body.existing_images,
        )
      : req.body.images !==
          undefined
        ? parseArray(
            req.body.images,
          )
        : existing.images;

  const removedImages =
    parseArray(
      req.body.removed_images,
    );

  const keptImages =
    existingImages.filter(
      (image) =>
        !removedImages.includes(
          image,
        ),
    );

  const newImages =
    uploadedImages(req);

  const images = [
    ...new Set([
      ...newImages,
      ...keptImages,
    ]),
  ].slice(0, 10);

  /*
   * Lorsqu'une nouvelle image est
   * envoyée, elle devient l'image
   * principale de l'article.
   */
  let mainImage =
    clean(
      req.body.main_image,
    ) ||
    newImages[0] ||
    clean(
      req.body.image,
    ) ||
    existing.image ||
    images[0] ||
    null;

  if (
    mainImage &&
    removedImages.includes(
      mainImage,
    )
  ) {
    mainImage =
      images[0] || null;
  }

  if (
    mainImage &&
    images.length > 0 &&
    !images.includes(mainImage)
  ) {
    images.unshift(
      mainImage,
    );
  }

  const stockFieldProvided =
    req.body.stock_quantity !== undefined;

  const stockManaged = stockFieldProvided
    ? clean(req.body.stock_quantity) !== ""
      ? 1
      : 0
    : existing.stock_managed
      ? 1
      : 0;

  const stockQuantity = stockFieldProvided
    ? stockManaged
      ? Math.max(0, Math.trunc(number(req.body.stock_quantity)))
      : 0
    : existing.stock_quantity;

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
        stock_managed = ?,
        min_stock = ?,
        image = ?,
        images = ?,
        rating = ?,
        reviews = ?,
        is_active = ?
      WHERE id = ?
    `,
    [
      categoryId,
      supplierId,
      articleSlug,
      designation,
      req.body.reference !==
      undefined
        ? clean(
            req.body.reference,
          ) || null
        : existing.reference,
      req.body.brand !==
      undefined
        ? clean(
            req.body.brand,
          ) || null
        : existing.brand,
      req.body.description !==
      undefined
        ? clean(
            req.body.description,
          ) || null
        : existing.description,
      req.body.price !==
      undefined
        ? Math.max(
            0,
            number(
              req.body.price,
            ),
          )
        : existing.price,
      req.body.old_price !==
      undefined
        ? nullableNumber(
            req.body.old_price,
          )
        : existing.old_price,
      req.body.purchase_price !==
      undefined
        ? nullableNumber(
            req.body.purchase_price,
          )
        : existing.purchase_price,
      stockQuantity,
      stockManaged,
      req.body.min_stock !==
      undefined
        ? Math.max(
            0,
            Math.trunc(
              number(
                req.body.min_stock,
              ),
            ),
          )
        : existing.min_stock,
      mainImage,
      JSON.stringify(
        images,
      ),
      req.body.rating !==
      undefined
        ? Math.min(
            5,
            Math.max(
              0,
              number(
                req.body.rating,
              ),
            ),
          )
        : existing.rating,
      req.body.reviews !==
      undefined
        ? Math.max(
            0,
            Math.trunc(
              number(
                req.body.reviews,
              ),
            ),
          )
        : existing.reviews,
      req.body.is_active !==
      undefined
        ? booleanValue(
            req.body.is_active,
          )
          ? 1
          : 0
        : existing.is_active
          ? 1
          : 0,
      id,
    ],
  );

  const article =
    await getArticleRow(id);

  return res.json({
    success: true,
    message:
      "Article modifié avec succès.",
    article,
  });
}

async function deleteArticle(
  req,
  res,
) {
  const id = Number(req.params.id);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new HttpError(
      400,
      "Identifiant article invalide.",
    );
  }

  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[article]] =
      await connection.query(
        `
          SELECT
            id,
            designation
          FROM articles
          WHERE id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [id],
      );

    if (!article) {
      throw new HttpError(
        404,
        "Article introuvable.",
      );
    }

    await connection.query(
      `
        DELETE FROM promotion_articles
        WHERE article_id = ?
      `,
      [id],
    );

    await connection.query(
      `
        DELETE FROM pack_items
        WHERE article_id = ?
      `,
      [id],
    );

    const [result] =
      await connection.query(
        `
          DELETE FROM articles
          WHERE id = ?
        `,
        [id],
      );

    if (!result.affectedRows) {
      throw new HttpError(
        404,
        "Article introuvable.",
      );
    }

    await connection.commit();

    return res.json({
      success: true,
      message:
        "Article supprimé définitivement avec succès.",
      deletedArticle: {
        id,
        designation:
          article.designation,
      },
    });
  } catch (error) {
    await connection.rollback();

    if (
      error.code ===
        "ER_ROW_IS_REFERENCED_2" ||
      Number(error.errno) === 1451
    ) {
      throw new HttpError(
        409,
        "Impossible de supprimer cet article car il est encore référencé par une autre donnée.",
      );
    }

    throw error;
  } finally {
    connection.release();
  }
}

async function listSuppliers(
  req,
  res,
) {
  const [rows] =
    await pool.query(`
      SELECT *
      FROM suppliers
      ORDER BY created_at DESC
    `);

  return res.json({
    success: true,
    suppliers: rows,
  });
}

async function createSupplier(
  req,
  res,
) {
  const name = clean(
    req.body.name,
  );

  if (!name) {
    throw new HttpError(
      400,
      "Le nom du fournisseur est obligatoire.",
    );
  }

  const [result] =
    await pool.query(
      `
        INSERT INTO suppliers (
          name,
          contact_name,
          phone,
          email,
          address,
          wilaya,
          nif,
          nis,
          registre_commerce,
          is_active
        )
        VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `,
      [
        name,
        clean(
          req.body.contact_name,
        ) || null,
        clean(
          req.body.phone,
        ) || null,
        clean(
          req.body.email,
        ) || null,
        clean(
          req.body.address,
        ) || null,
        clean(
          req.body.wilaya,
        ) || null,
        clean(req.body.nif) ||
          null,
        clean(req.body.nis) ||
          null,
        clean(
          req.body
            .registre_commerce,
        ) || null,
        booleanValue(
          req.body.is_active,
        )
          ? 1
          : 0,
      ],
    );

  return res
    .status(201)
    .json({
      success: true,
      supplier: {
        id: result.insertId,
        name,
      },
    });
}

async function updateSupplier(
  req,
  res,
) {
  const name = clean(
    req.body.name,
  );

  if (!name) {
    throw new HttpError(
      400,
      "Le nom du fournisseur est obligatoire.",
    );
  }

  await pool.query(
    `
      UPDATE suppliers
      SET
        name = ?,
        contact_name = ?,
        phone = ?,
        email = ?,
        address = ?,
        wilaya = ?,
        nif = ?,
        nis = ?,
        registre_commerce = ?,
        is_active = ?
      WHERE id = ?
    `,
    [
      name,
      clean(
        req.body.contact_name,
      ) || null,
      clean(req.body.phone) ||
        null,
      clean(req.body.email) ||
        null,
      clean(req.body.address) ||
        null,
      clean(req.body.wilaya) ||
        null,
      clean(req.body.nif) ||
        null,
      clean(req.body.nis) ||
        null,
      clean(
        req.body
          .registre_commerce,
      ) || null,
      booleanValue(
        req.body.is_active,
      )
        ? 1
        : 0,
      req.params.id,
    ],
  );

  return res.json({
    success: true,
    message:
      "Fournisseur modifié.",
  });
}

async function deleteSupplier(
  req,
  res,
) {
  const [usage] =
    await pool.query(
      `
        SELECT COUNT(*) AS total
        FROM articles
        WHERE supplier_id = ?
      `,
      [req.params.id],
    );

  if (
    Number(
      usage[0]?.total || 0,
    ) > 0
  ) {
    await pool.query(
      `
        UPDATE suppliers
        SET is_active = 0
        WHERE id = ?
      `,
      [req.params.id],
    );

    return res.json({
      success: true,
      message:
        "Fournisseur désactivé car il est utilisé par des articles.",
    });
  }

  await pool.query(
    `
      DELETE FROM suppliers
      WHERE id = ?
    `,
    [req.params.id],
  );

  return res.json({
    success: true,
    message:
      "Fournisseur supprimé.",
  });
}

async function listOrders(
  req,
  res,
) {
  const [rows] =
    await pool.query(`
      SELECT *
      FROM orders
      ORDER BY created_at DESC
    `);

  return res.json({
    success: true,
    orders: rows,
  });
}

async function getOrder(
  req,
  res,
) {
  const orderId =
    Number(req.params.id);

  const [orders] =
    await pool.query(
      `
        SELECT *
        FROM orders
        WHERE id = ?
        LIMIT 1
      `,
      [orderId],
    );

  if (!orders[0]) {
    throw new HttpError(
      404,
      "Commande introuvable.",
    );
  }

  const [items] =
    await pool.query(
      `
        SELECT
          oi.id,
          oi.order_id,
          oi.article_id,
          oi.pack_id,
          oi.item_type,
          oi.designation,
          oi.unit_price,
          oi.quantity,
          oi.line_total,

          CASE
            WHEN oi.item_type = 'PACK'
              THEN p.image
            ELSE a.image
          END AS image

        FROM order_items oi

        LEFT JOIN articles a
          ON a.id = oi.article_id

        LEFT JOIN packs p
          ON p.id = oi.pack_id

        WHERE oi.order_id = ?

        ORDER BY oi.id ASC
      `,
      [orderId],
    );

  /*
   * Charger les produits inclus dans chaque pack.
   *
   * 1. On utilise d'abord le snapshot order_pack_components :
   *    c'est la composition exacte au moment de la commande.
   * 2. Pour une ancienne commande sans snapshot, on retombe sur
   *    la composition actuelle de pack_items.
   */
  for (const item of items) {
    item.pack_components = [];

    if (
      String(item.item_type) !==
      "PACK"
    ) {
      continue;
    }

    const [snapshot] =
      await pool.query(
        `
          SELECT
            opc.article_id,
            COALESCE(
              opc.component_designation,
              a.designation
            ) AS designation,
            COALESCE(
              opc.component_image,
              a.image
            ) AS image,
            opc.quantity_per_pack,
            opc.total_quantity
          FROM order_pack_components opc
          LEFT JOIN articles a
            ON a.id = opc.article_id
          WHERE opc.order_item_id = ?
          ORDER BY opc.id ASC
        `,
        [item.id],
      );

    if (snapshot.length > 0) {
      item.pack_components =
        snapshot.map(
          (part) => ({
            article_id:
              part.article_id,
            designation:
              part.designation ||
              "Article du pack",
            image:
              part.image || null,
            quantity_per_pack:
              Number(
                part.quantity_per_pack ||
                  1,
              ),
            total_quantity:
              Number(
                part.total_quantity ||
                  0,
              ),
          }),
        );

      continue;
    }

    /*
     * Compatibilité avec les commandes créées avant
     * l'ajout du snapshot.
     */
    if (item.pack_id) {
      const [legacyParts] =
        await pool.query(
          `
            SELECT
              a.id AS article_id,
              a.designation,
              a.image,
              pi.quantity AS quantity_per_pack
            FROM pack_items pi
            INNER JOIN articles a
              ON a.id = pi.article_id
            WHERE pi.pack_id = ?
            ORDER BY a.designation ASC
          `,
          [item.pack_id],
        );

      item.pack_components =
        legacyParts.map(
          (part) => ({
            article_id:
              part.article_id,
            designation:
              part.designation,
            image:
              part.image || null,
            quantity_per_pack:
              Number(
                part.quantity_per_pack ||
                  1,
              ),
            total_quantity:
              Number(
                part.quantity_per_pack ||
                  1,
              ) *
              Number(
                item.quantity || 1,
              ),
          }),
        );
    }
  }

  const [history] =
    await pool.query(
      `
        SELECT *
        FROM order_history
        WHERE order_id = ?
        ORDER BY
          created_at ASC,
          id ASC
      `,
      [orderId],
    );

  return res.json({
    success: true,
    order: orders[0],
    items,
    history,
  });
}


async function deleteOrder(
  req,
  res,
) {
  const orderId = Number(req.params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new HttpError(
      400,
      "Identifiant de commande invalide.",
    );
  }

  const [[existingOrder]] =
    await pool.query(
      `
        SELECT
          id,
          tracking_number,
          stock_deducted,
          zr_tracking_number,
          zr_parcel_id
        FROM orders
        WHERE id = ?
        LIMIT 1
      `,
      [orderId],
    );

  if (!existingOrder) {
    throw new HttpError(
      404,
      "Commande introuvable.",
    );
  }

  /*
   * Si un colis ZR existe déjà, on l'annule avant de supprimer
   * la commande locale afin d'éviter de laisser un colis actif
   * chez le transporteur sans commande correspondante dans BricoMénage.
   */
  if (
    (existingOrder.zr_tracking_number ||
      existingOrder.zr_parcel_id) &&
    zrExpressService.configured()
  ) {
    try {
      await zrExpressService.cancelParcelForOrder(
        orderId,
      );
    } catch (error) {
      throw new HttpError(
        502,
        `Impossible de supprimer la commande car le colis ZR Express n'a pas pu être annulé : ${error.message}`,
      );
    }
  }

  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[order]] =
      await connection.query(
        `
          SELECT id, stock_deducted
          FROM orders
          WHERE id = ?
          FOR UPDATE
        `,
        [orderId],
      );

    if (!order) {
      throw new HttpError(
        404,
        "Commande introuvable.",
      );
    }

    /*
     * Une commande déduit le stock dès sa création.
     * Lors d'une suppression définitive, on remet donc le stock
     * uniquement s'il n'a pas déjà été restauré par une annulation.
     */
    if (Number(order.stock_deducted) === 1) {
      const [items] =
        await connection.query(
          `
            SELECT
              id,
              article_id,
              pack_id,
              item_type,
              quantity
            FROM order_items
            WHERE order_id = ?
            FOR UPDATE
          `,
          [orderId],
        );

      const stockNeeds = new Map();

      const addNeed = (
        articleId,
        quantity,
      ) => {
        const id = Number(articleId);
        const qty = Number(quantity);

        if (!id || !qty) {
          return;
        }

        stockNeeds.set(
          id,
          (stockNeeds.get(id) || 0) + qty,
        );
      };

      for (const item of items) {
        if (
          String(item.item_type).toUpperCase() ===
          "PACK"
        ) {
          const [snapshotParts] =
            await connection.query(
              `
                SELECT article_id, total_quantity
                FROM order_pack_components
                WHERE order_item_id = ?
              `,
              [item.id],
            );

          if (snapshotParts.length > 0) {
            for (const part of snapshotParts) {
              addNeed(
                part.article_id,
                part.total_quantity,
              );
            }
          } else if (item.pack_id) {
            /* Compatibilité avec les anciennes commandes. */
            const [parts] =
              await connection.query(
                `
                  SELECT article_id, quantity
                  FROM pack_items
                  WHERE pack_id = ?
                `,
                [item.pack_id],
              );

            for (const part of parts) {
              addNeed(
                part.article_id,
                Number(part.quantity) *
                  Number(item.quantity || 1),
              );
            }
          }
        } else if (item.article_id) {
          addNeed(
            item.article_id,
            item.quantity,
          );
        }
      }

      for (const [articleId, qty] of
        stockNeeds.entries()) {
        await connection.query(
          `
            UPDATE articles
            SET stock_quantity = stock_quantity + ?
            WHERE id = ? AND stock_managed = 1
          `,
          [qty, articleId],
        );
      }
    }

    /*
     * order_items et order_history sont liés à orders avec
     * ON DELETE CASCADE. order_pack_components est lui-même lié
     * à order_items avec ON DELETE CASCADE.
     */
    const [result] =
      await connection.query(
        `DELETE FROM orders WHERE id = ?`,
        [orderId],
      );

    if (!result.affectedRows) {
      throw new HttpError(
        404,
        "Commande introuvable.",
      );
    }

    await connection.commit();

    const io = req.app.get("io");

    if (io) {
      io.to("admins").emit(
        "order:deleted",
        {
          id: orderId,
          tracking_number:
            existingOrder.tracking_number,
          deleted_at:
            new Date().toISOString(),
        },
      );
    }

    return res.json({
      success: true,
      message:
        "Commande supprimée avec succès.",
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateOrderStatus(
  req,
  res,
) {
  const ALLOWED = new Set([
    "NOUVELLE",
    "CONFIRMEE",
    "EN_PREPARATION",
    "EXPEDIEE",
    "EN_LIVRAISON",
    "LIVREE",
    "ANNULEE",
  ]);

  const status = clean(req.body.status).toUpperCase();
  const label = clean(req.body.label) || status;
  const description = clean(req.body.description) || null;

  if (!ALLOWED.has(status)) {
    throw new HttpError(400, "Statut de commande invalide.");
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[order]] = await connection.query(
      `SELECT id,status,stock_deducted,zr_tracking_number,zr_parcel_id FROM orders WHERE id=? FOR UPDATE`,
      [req.params.id],
    );

    if (!order) {
      throw new HttpError(404, "Commande introuvable.");
    }

    if (String(order.status) === status) {
      await connection.rollback();
      return res.json({ success: true, message: "La commande possède déjà ce statut." });
    }

    const [items] = await connection.query(
      `SELECT id,article_id,pack_id,item_type,quantity FROM order_items WHERE order_id=? FOR UPDATE`,
      [req.params.id],
    );

    const stockNeeds = new Map();
    const addNeed = (articleId, qty) => {
      const id = Number(articleId);
      const quantity = Number(qty);

      if (!id || !quantity) {
        return;
      }

      stockNeeds.set(
        id,
        (stockNeeds.get(id) || 0) + quantity,
      );
    };

    for (const item of items) {
      if (item.item_type === "PACK") {
        /*
         * Priorité au snapshot enregistré lors de la commande.
         * C'est la composition exacte réellement déduite du stock.
         */
        const [snapshotParts] = await connection.query(
          `SELECT article_id,total_quantity
           FROM order_pack_components
           WHERE order_item_id=?`,
          [item.id],
        );

        if (snapshotParts.length > 0) {
          for (const part of snapshotParts) {
            addNeed(
              part.article_id,
              part.total_quantity,
            );
          }
        } else {
          /*
           * Compatibilité avec les anciennes commandes créées
           * avant l'ajout du snapshot.
           */
          const [parts] = await connection.query(
            `SELECT article_id,quantity FROM pack_items WHERE pack_id=?`,
            [item.pack_id],
          );

          for (const part of parts) {
            addNeed(
              part.article_id,
              Number(part.quantity) *
                Number(item.quantity),
            );
          }
        }
      } else if (item.article_id) {
        addNeed(
          item.article_id,
          item.quantity,
        );
      }
    }

    // Annulation : remettre le stock UNE SEULE FOIS.
    if (status === "ANNULEE" && Number(order.stock_deducted) === 1) {
      for (const [articleId, qty] of stockNeeds.entries()) {
        await connection.query(
          `UPDATE articles SET stock_quantity = stock_quantity + ? WHERE id = ? AND stock_managed = 1`,
          [qty, articleId],
        );
      }
      await connection.query(`UPDATE orders SET stock_deducted=0 WHERE id=?`, [req.params.id]);
    }

    // Réactivation d'une commande annulée : vérifier puis redéduire le stock.
    if (status !== "ANNULEE" && Number(order.stock_deducted) === 0) {
      const managedStockIds = new Set();

      for (const [articleId, qty] of stockNeeds.entries()) {
        const [[article]] = await connection.query(
          `SELECT id,designation,stock_quantity,stock_managed,is_active FROM articles WHERE id=? FOR UPDATE`,
          [articleId],
        );
        if (!article || !Number(article.is_active)) {
          throw new HttpError(409, "Un article de cette commande n’est plus disponible.");
        }

        if (Number(article.stock_managed) === 0) {
          continue;
        }

        managedStockIds.add(Number(articleId));

        if (Number(article.stock_quantity) < qty) {
          throw new HttpError(409, `Stock insuffisant pour ${article.designation}.`);
        }
      }

      for (const [articleId, qty] of stockNeeds.entries()) {
        if (!managedStockIds.has(Number(articleId))) {
          continue;
        }

        const [result] = await connection.query(
          `UPDATE articles SET stock_quantity=stock_quantity-? WHERE id=? AND stock_managed=1 AND stock_quantity>=?`,
          [qty, articleId, qty],
        );
        if (!result.affectedRows) {
          throw new HttpError(409, "Le stock a changé. Impossible de réactiver la commande.");
        }
      }
      await connection.query(`UPDATE orders SET stock_deducted=1 WHERE id=?`, [req.params.id]);
    }

    await connection.query(
      `UPDATE orders SET status = ? WHERE id = ?`,
      [status, req.params.id],
    );

    await connection.query(
      `INSERT INTO order_history(order_id,status,label,description) VALUES (?,?,?,?)`,
      [req.params.id, status, label, description],
    );

    await connection.commit();

    let zrWarning = null;

    if (
      status === "ANNULEE" &&
      zrExpressService.configured() &&
      (order.zr_tracking_number || order.zr_parcel_id)
    ) {
      try {
        await zrExpressService.cancelParcelForOrder(
          Number(req.params.id),
        );
      } catch (error) {
        zrWarning =
          `Commande annulée localement, mais ZR Express n’a pas pu être annulé automatiquement : ${error.message}`;

        console.error(
          "[ZR Express] Annulation externe échouée :",
          error.message,
        );
      }
    }

    const io = req.app.get("io");

    if (io) {
      io.to("admins").emit(
        "order:status-updated",
        {
          id: Number(req.params.id),
          status,
          updated_at:
            new Date().toISOString(),
        },
      );
    }

    return res.json({
      success: true,
      message: status === "ANNULEE"
        ? "Commande annulée et stock restauré."
        : "Statut de la commande modifié.",
      zrWarning,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listPromotions(
  req,
  res,
) {
  const [rows] =
    await pool.query(`
      SELECT *
      FROM promotions
      ORDER BY created_at DESC
    `);

  return res.json({
    success: true,
    promotions: rows,
  });
}

async function createPromotion(
  req,
  res,
) {
  const [result] =
    await pool.query(
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
        VALUES (
          ?, ?, ?, ?, ?, ?, ?
        )
      `,
      [
        clean(req.body.name),
        clean(
          req.body.description,
        ) || null,
        clean(
          req.body.discount_type,
        ) || "PERCENT",
        number(
          req.body.discount_value,
        ),
        req.body.starts_at ||
          null,
        req.body.ends_at ||
          null,
        1,
      ],
    );

  return res
    .status(201)
    .json({
      success: true,
      promotion: {
        id: result.insertId,
      },
    });
}

async function listPacks(
  req,
  res,
) {
  const [rows] =
    await pool.query(`
      SELECT *
      FROM packs
      ORDER BY created_at DESC
    `);

  return res.json({
    success: true,
    packs: rows,
  });
}

async function createPack(
  req,
  res,
) {
  const name = clean(
    req.body.name,
  );

  const packSlug =
    clean(req.body.slug) ||
    slugify(name, {
      lower: true,
      strict: true,
    });

  const [result] =
    await pool.query(
      `
        INSERT INTO packs (
          slug,
          name,
          description,
          price,
          old_price,
          image,
          stock_quantity,
          is_active
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?
        )
      `,
      [
        packSlug,
        name,
        clean(
          req.body.description,
        ) || null,
        number(req.body.price),
        nullableNumber(
          req.body.old_price,
        ),
        clean(req.body.image) ||
          null,
        Math.max(
          0,
          Math.trunc(
            number(
              req.body.stock_quantity,
            ),
          ),
        ),
        1,
      ],
    );

  return res
    .status(201)
    .json({
      success: true,
      pack: {
        id: result.insertId,
        slug: packSlug,
      },
    });
}


async function updateArticleStock(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Identifiant article invalide.");
  }

  const existing = await getArticleRow(id);

  if (!existing) {
    throw new HttpError(404, "Article introuvable.");
  }

  const stockFieldProvided = req.body.stock_quantity !== undefined;
  const stockManaged = stockFieldProvided
    ? clean(req.body.stock_quantity) !== ""
      ? 1
      : 0
    : existing.stock_managed
      ? 1
      : 0;

  const stockQuantity = stockFieldProvided
    ? stockManaged
      ? Math.max(0, Math.trunc(number(req.body.stock_quantity)))
      : 0
    : existing.stock_quantity;

  const minStock = req.body.min_stock !== undefined
    ? Math.max(0, Math.trunc(number(req.body.min_stock)))
    : existing.min_stock;

  const purchasePrice = req.body.purchase_price !== undefined
    ? nullableNumber(req.body.purchase_price)
    : existing.purchase_price;

  await pool.query(
    `
      UPDATE articles
      SET purchase_price = ?, stock_quantity = ?, stock_managed = ?, min_stock = ?
      WHERE id = ?
    `,
    [purchasePrice, stockQuantity, stockManaged, minStock, id],
  );

  const article = await getArticleRow(id);

  return res.json({
    success: true,
    message: "Stock mis à jour avec succès.",
    article,
  });
}

module.exports = {
  dashboard,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  articleReferences,
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  updateArticleStock,
  deleteArticle,
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  listOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder,
  listPromotions,
  createPromotion,
  listPacks,
  createPack,
};
