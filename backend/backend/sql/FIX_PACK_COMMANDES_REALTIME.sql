-- BricoMénage - correction packs / annulation / temps réel
CREATE TABLE IF NOT EXISTS order_pack_components (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_item_id BIGINT UNSIGNED NOT NULL,
  article_id BIGINT UNSIGNED NULL,
  quantity_per_pack INT NOT NULL DEFAULT 1,
  total_quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_opc_order_item (order_item_id),
  INDEX idx_opc_article (article_id),
  CONSTRAINT fk_opc_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_opc_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Les nouvelles commandes rempliront automatiquement cette table.
-- Les anciennes commandes restent compatibles grâce au fallback pack_items.
