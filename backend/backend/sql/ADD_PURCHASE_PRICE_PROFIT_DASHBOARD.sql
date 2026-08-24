-- =========================================================
-- BricoMénage - Prix d'achat + bénéfice brut
-- =========================================================
-- Les articles possèdent déjà purchase_price dans le schéma actuel.
-- Cette migration fige le coût d'achat dans chaque commande.

SET @db := DATABASE();

SET @sql := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=@db
      AND TABLE_NAME='order_items'
      AND COLUMN_NAME='unit_cost'
  ),
  'SELECT 1',
  'ALTER TABLE order_items ADD COLUMN unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER unit_price'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=@db
      AND TABLE_NAME='order_items'
      AND COLUMN_NAME='cost_total'
  ),
  'SELECT 1',
  'ALTER TABLE order_items ADD COLUMN cost_total DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER line_total'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=@db
      AND TABLE_NAME='order_pack_components'
      AND COLUMN_NAME='component_unit_cost'
  ),
  'SELECT 1',
  'ALTER TABLE order_pack_components ADD COLUMN component_unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER component_image'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Anciennes ventes ARTICLE : initialisation avec le prix d'achat actuel.
UPDATE order_items oi
INNER JOIN articles a
  ON a.id = oi.article_id
SET
  oi.unit_cost = COALESCE(a.purchase_price, 0),
  oi.cost_total =
    COALESCE(a.purchase_price, 0) * oi.quantity
WHERE oi.item_type='ARTICLE'
  AND (oi.unit_cost=0 OR oi.cost_total=0);

-- Anciennes compositions de PACK.
UPDATE order_pack_components opc
LEFT JOIN articles a
  ON a.id = opc.article_id
SET opc.component_unit_cost =
  COALESCE(a.purchase_price, 0)
WHERE opc.component_unit_cost=0;

UPDATE order_items oi
LEFT JOIN (
  SELECT
    order_item_id,
    SUM(component_unit_cost * total_quantity) AS pack_cost
  FROM order_pack_components
  GROUP BY order_item_id
) costs
  ON costs.order_item_id = oi.id
SET
  oi.cost_total = COALESCE(costs.pack_cost, 0),
  oi.unit_cost =
    CASE
      WHEN oi.quantity > 0
      THEN COALESCE(costs.pack_cost, 0) / oi.quantity
      ELSE 0
    END
WHERE oi.item_type='PACK'
  AND (oi.unit_cost=0 OR oi.cost_total=0);

-- Vérification globale, hors commandes annulées.
SELECT
  COALESCE(SUM(o.subtotal),0) AS chiffre_affaires_produits_hors_livraison,
  COALESCE(SUM(costs.order_cost),0) AS cout_achat,
  COALESCE(SUM(o.subtotal),0) -
  COALESCE(SUM(costs.order_cost),0) AS benefice_brut_hors_livraison
FROM orders o
LEFT JOIN (
  SELECT order_id, SUM(cost_total) AS order_cost
  FROM order_items
  GROUP BY order_id
) costs
  ON costs.order_id=o.id
WHERE o.status <> 'ANNULEE';
