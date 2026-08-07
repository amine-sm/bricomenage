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

async function ensureSchema() {
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
