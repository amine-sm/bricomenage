USE bricomenage;

CREATE TABLE IF NOT EXISTS promotion_articles (
  promotion_id BIGINT UNSIGNED NOT NULL,
  article_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (promotion_id, article_id),
  CONSTRAINT fk_promo_article_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
  CONSTRAINT fk_promo_article_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pack_items (
  pack_id BIGINT UNSIGNED NOT NULL,
  article_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (pack_id, article_id),
  CONSTRAINT fk_pack_item_pack FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE CASCADE,
  CONSTRAINT fk_pack_item_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS pack_id BIGINT UNSIGNED NULL AFTER article_id;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_type ENUM('ARTICLE','PACK') NOT NULL DEFAULT 'ARTICLE' AFTER pack_id;
