const pool = require("../config/db");
const slugify = require("slugify");

async function columnExists(
  tableName,
  columnName,
) {
  const [rows] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [tableName, columnName],
  );

  return Number(rows[0]?.total || 0) > 0;
}

async function ensureColumn(
  tableName,
  columnName,
  alterSql,
) {
  const exists = await columnExists(
    tableName,
    columnName,
  );

  if (exists) {
    return false;
  }

  await pool.query(alterSql);

  console.log(
    `[DB] Colonne ajoutée : ${tableName}.${columnName}`,
  );

  return true;
}


async function indexExists(tableName, indexName) {
  const [rows] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
    `,
    [tableName, indexName],
  );

  return Number(rows[0]?.total || 0) > 0;
}

async function ensurePromotionSlugs() {
  await ensureColumn(
    "promotions",
    "slug",
    `
      ALTER TABLE promotions
      ADD COLUMN slug VARCHAR(220) NULL AFTER id
    `,
  );

  const [rows] = await pool.query(
    "SELECT id,name,slug FROM promotions ORDER BY id ASC",
  );
  const used = new Set();

  for (const row of rows) {
    const base = slugify(row.name || "promotion", { lower: true, strict: true }) || `promotion-${row.id}`;
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) candidate = `${base}-${suffix++}`;
    used.add(candidate);

    if (row.slug !== candidate) {
      await pool.query(
        "UPDATE promotions SET slug=? WHERE id=?",
        [candidate, row.id],
      );
    }
  }

  await pool.query(
    "ALTER TABLE promotions MODIFY COLUMN slug VARCHAR(220) NOT NULL",
  );

  if (!(await indexExists("promotions", "uq_promotions_slug"))) {
    await pool.query(
      "ALTER TABLE promotions ADD UNIQUE INDEX uq_promotions_slug (slug)",
    );
    console.log("[DB] Index ajouté : promotions.slug");
  }
}

async function ensurePackSnapshotTable() {
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS order_pack_components (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        order_item_id BIGINT UNSIGNED NOT NULL,
        article_id BIGINT UNSIGNED NULL,
        component_designation VARCHAR(220) NULL,
        component_image VARCHAR(500) NULL,
        quantity_per_pack INT NOT NULL DEFAULT 1,
        total_quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_opc_order_item (order_item_id),
        INDEX idx_opc_article (article_id),
        CONSTRAINT fk_opc_order_item
          FOREIGN KEY (order_item_id)
          REFERENCES order_items(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_opc_article
          FOREIGN KEY (article_id)
          REFERENCES articles(id)
          ON DELETE SET NULL
      ) ENGINE=InnoDB
    `,
  );
}


async function ensureAdminPermissions() {
  await ensureColumn(
    "admins",
    "role",
    `
      ALTER TABLE admins
      ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER'
      AFTER is_active
    `,
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_permissions (
      admin_id BIGINT UNSIGNED NOT NULL,
      permission_key VARCHAR(120) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (admin_id, permission_key),
      INDEX idx_admin_permissions_key (permission_key),
      CONSTRAINT fk_admin_permissions_admin
        FOREIGN KEY (admin_id)
        REFERENCES admins(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  const [[superAdmin]] = await pool.query(
    `SELECT id FROM admins WHERE role = 'SUPER_ADMIN' ORDER BY id ASC LIMIT 1`,
  );

  if (!superAdmin) {
    const [[primaryAdmin]] = await pool.query(
      `
        SELECT id
        FROM admins
        ORDER BY
          CASE WHEN LOWER(email) = 'admin@bricomenage.dz' THEN 0 ELSE 1 END,
          id ASC
        LIMIT 1
      `,
    );

    if (primaryAdmin) {
      await pool.query(
        `UPDATE admins SET role = 'SUPER_ADMIN' WHERE id = ?`,
        [primaryAdmin.id],
      );
      console.log(`[DB] Super Administrateur défini : admins.id=${primaryAdmin.id}`);
    }
  }
}

async function ensureSchema() {
  await ensureAdminPermissions();

  await ensurePromotionSlugs();

  /*
   * Stock facultatif : les anciennes lignes restent suivies (1),
   * mais un nouvel article peut être créé sans quantité de stock.
   */
  await ensureColumn(
    "articles",
    "stock_managed",
    `
      ALTER TABLE articles
      ADD COLUMN stock_managed TINYINT(1) NOT NULL DEFAULT 1
      AFTER stock_quantity
    `,
  );

  /*
   * Coût d'achat figé au moment de la vente.
   * Cela évite de modifier l'historique des bénéfices
   * si le prix d'achat d'un article change plus tard.
   */
  await ensureColumn(
    "order_items",
    "unit_cost",
    `
      ALTER TABLE order_items
      ADD COLUMN unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0
      AFTER unit_price
    `,
  );

  await ensureColumn(
    "order_items",
    "cost_total",
    `
      ALTER TABLE order_items
      ADD COLUMN cost_total DECIMAL(12,2) NOT NULL DEFAULT 0
      AFTER line_total
    `,
  );

  /*
   * Les colonnes suivantes figent le nom et l'image des produits
   * contenus dans un pack au moment de la commande.
   * Les anciennes bases sont migrées automatiquement.
   */
  await ensurePackSnapshotTable();

  await ensureColumn(
    "order_pack_components",
    "component_designation",
    `
      ALTER TABLE order_pack_components
      ADD COLUMN component_designation VARCHAR(220) NULL
      AFTER article_id
    `,
  );

  await ensureColumn(
    "order_pack_components",
    "component_image",
    `
      ALTER TABLE order_pack_components
      ADD COLUMN component_image VARCHAR(500) NULL
      AFTER component_designation
    `,
  );

  await ensureColumn(
    "order_pack_components",
    "component_unit_cost",
    `
      ALTER TABLE order_pack_components
      ADD COLUMN component_unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0
      AFTER component_image
    `,
  );

  await ensureColumn(
    "order_items",
    "pack_id",
    `
      ALTER TABLE order_items
      ADD COLUMN pack_id BIGINT UNSIGNED NULL
      AFTER article_id
    `,
  );

  await ensureColumn(
    "order_items",
    "item_type",
    `
      ALTER TABLE order_items
      ADD COLUMN item_type
        ENUM('ARTICLE','PACK')
        NOT NULL
        DEFAULT 'ARTICLE'
      AFTER pack_id
    `,
  );

  await ensurePackSnapshotTable();

  /*
   * L’adresse de livraison est facultative.
   * Cette migration corrige aussi les bases déjà installées
   * où orders.address était encore défini en NOT NULL.
   */
  const [addressColumnRows] = await pool.query(
    `
      SELECT IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = 'address'
      LIMIT 1
    `,
  );

  if (
    addressColumnRows.length > 0 &&
    String(addressColumnRows[0].IS_NULLABLE).toUpperCase() !== 'YES'
  ) {
    await pool.query(
      `ALTER TABLE orders MODIFY COLUMN address TEXT NULL`,
    );
    console.log(
      '[DB] Colonne orders.address rendue facultative.',
    );
  }

  /* ZR Express : destination, prix et suivi logistique. */
  const zrColumns = [
    ["zr_city_id", "VARCHAR(80) NULL"],
    ["zr_district_id", "VARCHAR(80) NULL"],
    ["zr_delivery_type", "VARCHAR(20) NULL"],
    ["zr_destination_hub_id", "VARCHAR(80) NULL"],
    ["zr_source_hub_id", "VARCHAR(80) NULL"],
    ["zr_parcel_id", "VARCHAR(100) NULL"],
    ["zr_tracking_number", "VARCHAR(100) NULL"],
    ["zr_status", "VARCHAR(80) NULL"],
    ["zr_status_label", "VARCHAR(180) NULL"],
    ["zr_shipping_fee", "DECIMAL(12,2) NULL"],
    ["zr_last_payload", "LONGTEXT NULL"],
    ["zr_synced_at", "DATETIME NULL"],
  ];

  for (const [column, definition] of zrColumns) {
    await ensureColumn(
      "orders",
      column,
      `ALTER TABLE orders ADD COLUMN ${column} ${definition}`,
    );
  }

  const stockDeductedAdded =
    await ensureColumn(
      "orders",
      "stock_deducted",
      `
        ALTER TABLE orders
        ADD COLUMN stock_deducted
          TINYINT(1)
          NOT NULL
          DEFAULT 1
        AFTER total
      `,
    );

  if (stockDeductedAdded) {
    await pool.query(
      `
        UPDATE orders
        SET stock_deducted = 0
        WHERE status = 'ANNULEE'
      `,
    );
  }

  await pool.query(
    `
      UPDATE order_items
      SET item_type =
        CASE
          WHEN pack_id IS NOT NULL
            THEN 'PACK'
          ELSE 'ARTICLE'
        END
      WHERE item_type IS NULL
         OR item_type NOT IN (
           'ARTICLE',
           'PACK'
         )
    `,
  );

  /*
   * Migration des anciennes commandes.
   * Pour les ARTICLE, on utilise le prix d'achat actuel
   * uniquement pour initialiser les anciennes lignes.
   */
  await pool.query(`
    UPDATE order_items oi
    INNER JOIN articles a
      ON a.id = oi.article_id
    SET
      oi.unit_cost =
        COALESCE(a.purchase_price, 0),
      oi.cost_total =
        COALESCE(a.purchase_price, 0) *
        oi.quantity
    WHERE
      oi.item_type = 'ARTICLE'
      AND (
        oi.unit_cost = 0
        OR oi.cost_total = 0
      )
  `);

  /*
   * Coût des composants des anciens packs.
   */
  await pool.query(`
    UPDATE order_pack_components opc
    LEFT JOIN articles a
      ON a.id = opc.article_id
    SET
      opc.component_unit_cost =
        COALESCE(a.purchase_price, 0)
    WHERE opc.component_unit_cost = 0
  `);

  /*
   * Reconstituer le coût total des anciennes lignes PACK.
   */
  await pool.query(`
    UPDATE order_items oi
    LEFT JOIN (
      SELECT
        order_item_id,
        SUM(
          component_unit_cost *
          total_quantity
        ) AS pack_cost
      FROM order_pack_components
      GROUP BY order_item_id
    ) costs
      ON costs.order_item_id = oi.id
    SET
      oi.cost_total =
        COALESCE(costs.pack_cost, 0),
      oi.unit_cost =
        CASE
          WHEN oi.quantity > 0
          THEN
            COALESCE(costs.pack_cost, 0) /
            oi.quantity
          ELSE 0
        END
    WHERE
      oi.item_type = 'PACK'
      AND (
        oi.unit_cost = 0
        OR oi.cost_total = 0
      )
  `);

  console.log(
    "[DB] Schéma commandes vérifié.",
  );
}

module.exports = ensureSchema;
