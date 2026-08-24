-- BricoMénage - stock article facultatif
-- 1 = stock suivi, 0 = stock non suivi (article commandable sans quantité saisie).

ALTER TABLE articles
  ADD COLUMN stock_managed TINYINT(1) NOT NULL DEFAULT 1
  AFTER stock_quantity;

-- Les articles existants restent en gestion de stock par défaut.
UPDATE articles SET stock_managed = 1 WHERE stock_managed IS NULL;
