-- OPTIONNEL, À EXÉCUTER UNE SEULE FOIS UNIQUEMENT si votre ancien backend
-- avait décrémenté le stock des commandes ANNULEE sans jamais le restaurer.
-- Ne lancez PAS ce fichier si le stock des commandes annulées a déjà été restauré.

START TRANSACTION;

UPDATE articles a
LEFT JOIN (
  SELECT oi.article_id, SUM(oi.quantity) AS qty
  FROM order_items oi
  INNER JOIN orders o ON o.id=oi.order_id
  WHERE o.status='ANNULEE' AND oi.item_type='ARTICLE' AND oi.article_id IS NOT NULL
  GROUP BY oi.article_id
) direct_qty ON direct_qty.article_id=a.id
LEFT JOIN (
  SELECT pi.article_id, SUM(oi.quantity*pi.quantity) AS qty
  FROM order_items oi
  INNER JOIN orders o ON o.id=oi.order_id
  INNER JOIN pack_items pi ON pi.pack_id=oi.pack_id
  WHERE o.status='ANNULEE' AND oi.item_type='PACK' AND oi.pack_id IS NOT NULL
  GROUP BY pi.article_id
) pack_qty ON pack_qty.article_id=a.id
SET a.stock_quantity=a.stock_quantity+COALESCE(direct_qty.qty,0)+COALESCE(pack_qty.qty,0)
WHERE COALESCE(direct_qty.qty,0)+COALESCE(pack_qty.qty,0)>0;

UPDATE orders SET stock_deducted=0 WHERE status='ANNULEE';
COMMIT;
