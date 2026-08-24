-- BricoMénage - migration serveur finale MySQL/MariaDB
-- Réexécutable : n'ajoute pas plusieurs fois les colonnes/index.
-- IMPORTANT : sauvegardez la base avant la première exécution.

SET @db := DATABASE();

-- ---------- COLONNES order_items ----------
SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order_items' AND COLUMN_NAME='pack_id'),
  'SELECT 1',
  'ALTER TABLE order_items ADD COLUMN pack_id BIGINT UNSIGNED NULL AFTER article_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order_items' AND COLUMN_NAME='item_type'),
  'SELECT 1',
  "ALTER TABLE order_items ADD COLUMN item_type ENUM('ARTICLE','PACK') NOT NULL DEFAULT 'ARTICLE' AFTER pack_id"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE order_items
SET item_type = CASE WHEN pack_id IS NOT NULL THEN 'PACK' ELSE 'ARTICLE' END
WHERE item_type IS NULL OR item_type NOT IN ('ARTICLE','PACK');

-- ---------- stock_deducted ----------
-- Ce drapeau évite les doubles retraits/restaurations lors d'une annulation/réactivation.
SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='orders' AND COLUMN_NAME='stock_deducted'),
  'SELECT 1',
  'ALTER TABLE orders ADD COLUMN stock_deducted TINYINT(1) NOT NULL DEFAULT 1 AFTER total'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ne restaure PAS automatiquement les anciennes commandes annulées : cela rend la migration sûre à relancer.
-- On considère les commandes déjà annulées comme déjà restaurées à partir de maintenant.
UPDATE orders SET stock_deducted = 0 WHERE status='ANNULEE';
UPDATE orders SET stock_deducted = 1 WHERE status<>'ANNULEE' AND stock_deducted IS NULL;

-- ---------- INDEX ----------
SET @sql := IF(EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='orders' AND INDEX_NAME='idx_orders_created_status'),
  'SELECT 1','CREATE INDEX idx_orders_created_status ON orders(created_at,status)');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order_items' AND INDEX_NAME='idx_order_items_order'),
  'SELECT 1','CREATE INDEX idx_order_items_order ON order_items(order_id)');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order_items' AND INDEX_NAME='idx_order_items_article'),
  'SELECT 1','CREATE INDEX idx_order_items_article ON order_items(article_id)');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order_items' AND INDEX_NAME='idx_order_items_pack'),
  'SELECT 1','CREATE INDEX idx_order_items_pack ON order_items(pack_id)');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='promotion_articles' AND INDEX_NAME='idx_promotion_articles_article'),
  'SELECT 1','CREATE INDEX idx_promotion_articles_article ON promotion_articles(article_id,promotion_id)');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='promotions' AND INDEX_NAME='idx_promotions_active_dates'),
  'SELECT 1','CREATE INDEX idx_promotions_active_dates ON promotions(is_active,starts_at,ends_at)');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='articles' AND INDEX_NAME='idx_articles_stock'),
  'SELECT 1','CREATE INDEX idx_articles_stock ON articles(is_active,stock_quantity,min_stock)');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- CLÉ ÉTRANGÈRE pack_id (si absente) ----------
SET @sql := IF(
  EXISTS(
    SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order_items' AND COLUMN_NAME='pack_id'
      AND REFERENCED_TABLE_NAME='packs'
  ),
  'SELECT 1',
  'ALTER TABLE order_items ADD CONSTRAINT fk_order_items_pack FOREIGN KEY(pack_id) REFERENCES packs(id) ON DELETE SET NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- CONTRÔLES ----------
SELECT 'migration_ok' AS status;
DESCRIBE order_items;
DESCRIBE orders;
SELECT COUNT(*) AS promotions_total,
       SUM(is_active=1) AS promotions_active_admin,
       SUM(is_active=0) AS promotions_inactive_admin
FROM promotions;
