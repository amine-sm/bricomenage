-- BricoMénage
-- Image du pack + détail des produits inclus dans les commandes

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
) ENGINE=InnoDB;

SET @db := DATABASE();

SET @sql := IF(
  EXISTS(
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=@db
      AND TABLE_NAME='order_pack_components'
      AND COLUMN_NAME='component_designation'
  ),
  'SELECT 1',
  'ALTER TABLE order_pack_components ADD COLUMN component_designation VARCHAR(220) NULL AFTER article_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS(
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=@db
      AND TABLE_NAME='order_pack_components'
      AND COLUMN_NAME='component_image'
  ),
  'SELECT 1',
  'ALTER TABLE order_pack_components ADD COLUMN component_image VARCHAR(500) NULL AFTER component_designation'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remplissage possible pour les snapshots déjà créés.
UPDATE order_pack_components opc
LEFT JOIN articles a
  ON a.id = opc.article_id
SET
  opc.component_designation =
    COALESCE(opc.component_designation, a.designation),
  opc.component_image =
    COALESCE(opc.component_image, a.image)
WHERE
  opc.component_designation IS NULL
  OR opc.component_image IS NULL;
