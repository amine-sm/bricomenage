const pool = require("../config/db");

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

async function ensureSchema() {
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

  console.log(
    "[DB] Schéma commandes vérifié.",
  );
}

module.exports = ensureSchema;
