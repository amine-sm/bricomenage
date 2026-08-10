-- =========================================================
-- BricoMénage - correction bénéfice packs/promotions
-- La livraison n'entre JAMAIS dans le bénéfice.
-- Formule : sous-total produits réellement vendu - coût d'achat.
-- =========================================================

START TRANSACTION;

-- 1) Articles historiques : complète le coût d'achat manquant.
UPDATE order_items oi
INNER JOIN articles a
  ON a.id = oi.article_id
SET
  oi.unit_cost = COALESCE(a.purchase_price, 0),
  oi.cost_total = ROUND(COALESCE(a.purchase_price, 0) * oi.quantity, 2)
WHERE oi.item_type = 'ARTICLE'
  AND (oi.unit_cost IS NULL OR oi.unit_cost = 0 OR oi.cost_total IS NULL OR oi.cost_total = 0);

-- 2) Composants de packs déjà figés : complète leur coût unitaire manquant.
UPDATE order_pack_components opc
INNER JOIN articles a
  ON a.id = opc.article_id
SET opc.component_unit_cost = COALESCE(a.purchase_price, 0)
WHERE opc.component_unit_cost IS NULL
   OR opc.component_unit_cost = 0;

-- 3) Packs avec snapshot : coût = somme des composants réellement figés dans la commande.
UPDATE order_items oi
INNER JOIN (
  SELECT
    order_item_id,
    ROUND(SUM(COALESCE(component_unit_cost, 0) * total_quantity), 2) AS pack_cost_total
  FROM order_pack_components
  GROUP BY order_item_id
) snapshot_costs
  ON snapshot_costs.order_item_id = oi.id
SET
  oi.cost_total = snapshot_costs.pack_cost_total,
  oi.unit_cost = CASE
    WHEN oi.quantity > 0 THEN ROUND(snapshot_costs.pack_cost_total / oi.quantity, 2)
    ELSE 0
  END
WHERE oi.item_type = 'PACK'
  AND (oi.unit_cost IS NULL OR oi.unit_cost = 0 OR oi.cost_total IS NULL OR oi.cost_total = 0);

-- 4) Anciens packs sans snapshot : fallback sur la composition actuelle du pack.
-- Cette étape sert uniquement à réparer les anciennes commandes.
UPDATE order_items oi
INNER JOIN (
  SELECT
    oi2.id AS order_item_id,
    ROUND(
      SUM(
        COALESCE(a.purchase_price, 0) *
        COALESCE(pi.quantity, 0) *
        COALESCE(oi2.quantity, 0)
      ),
      2
    ) AS pack_cost_total
  FROM order_items oi2
  INNER JOIN pack_items pi
    ON pi.pack_id = oi2.pack_id
  INNER JOIN articles a
    ON a.id = pi.article_id
  LEFT JOIN order_pack_components opc
    ON opc.order_item_id = oi2.id
  WHERE oi2.item_type = 'PACK'
    AND oi2.pack_id IS NOT NULL
    AND opc.order_item_id IS NULL
  GROUP BY oi2.id
) fallback_costs
  ON fallback_costs.order_item_id = oi.id
SET
  oi.cost_total = fallback_costs.pack_cost_total,
  oi.unit_cost = CASE
    WHEN oi.quantity > 0 THEN ROUND(fallback_costs.pack_cost_total / oi.quantity, 2)
    ELSE 0
  END
WHERE oi.item_type = 'PACK'
  AND (oi.unit_cost IS NULL OR oi.unit_cost = 0 OR oi.cost_total IS NULL OR oi.cost_total = 0);

COMMIT;

-- 5) Vérification : livraison affichée séparément, jamais ajoutée au bénéfice.
SELECT
  COALESCE(SUM(o.subtotal), 0) AS ventes_produits_apres_promotions,
  COALESCE(SUM(o.delivery_fee), 0) AS livraison_exclue_du_benefice,
  COALESCE(SUM(costs.order_cost), 0) AS cout_achat,
  COALESCE(SUM(o.subtotal), 0) - COALESCE(SUM(costs.order_cost), 0) AS benefice_hors_livraison
FROM orders o
LEFT JOIN (
  SELECT order_id, SUM(cost_total) AS order_cost
  FROM order_items
  GROUP BY order_id
) costs
  ON costs.order_id = o.id
WHERE o.status <> 'ANNULEE';
