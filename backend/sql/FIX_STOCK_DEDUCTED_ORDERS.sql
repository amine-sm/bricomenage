-- BricoMénage
-- Correction :
-- Unknown column 'stock_deducted' in 'field list'

SET @db := DATABASE();

SET @sql := IF(
  EXISTS(
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME = 'stock_deducted'
  ),
  'SELECT 1',
  'ALTER TABLE orders ADD COLUMN stock_deducted TINYINT(1) NOT NULL DEFAULT 1 AFTER total'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE orders
SET stock_deducted = 0
WHERE status = 'ANNULEE';

SELECT
  id,
  tracking_number,
  status,
  stock_deducted
FROM orders
ORDER BY id DESC;
