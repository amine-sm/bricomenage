-- BricoMénage - variantes produit
-- Compatible avec les articles existants utilisant uniquement "colors".

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS variant_type VARCHAR(20) NULL AFTER colors;

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS variants JSON NULL AFTER variant_type;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS variant_type VARCHAR(20) NULL AFTER designation;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS variant_value VARCHAR(100) NULL AFTER variant_type;

-- Conversion automatique des anciennes couleurs en variante COULEUR.
UPDATE articles
SET variant_type = 'COLOR', variants = colors
WHERE (variant_type IS NULL OR variant_type = '')
  AND colors IS NOT NULL
  AND JSON_LENGTH(colors) > 0;
