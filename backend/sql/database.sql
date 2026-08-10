CREATE DATABASE IF NOT EXISTS bricomenage
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bricomenage;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS promotion_articles;
DROP TABLE IF EXISTS pack_items;
DROP TABLE IF EXISTS order_history;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS packs;
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS admins;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE admins (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT NULL,
  image TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE suppliers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  contact_name VARCHAR(180) NULL,
  phone VARCHAR(50) NULL,
  email VARCHAR(190) NULL,
  address TEXT NULL,
  wilaya VARCHAR(120) NULL,
  nif VARCHAR(80) NULL,
  nis VARCHAR(80) NULL,
  registre_commerce VARCHAR(100) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE articles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  supplier_id BIGINT UNSIGNED NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  designation VARCHAR(220) NOT NULL,
  reference VARCHAR(120) NULL UNIQUE,
  brand VARCHAR(120) NULL,
  description TEXT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  old_price DECIMAL(12,2) NULL,
  purchase_price DECIMAL(12,2) NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 0,
  image TEXT NULL,
  images JSON NULL,
  rating DECIMAL(2,1) NOT NULL DEFAULT 0,
  reviews INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_articles_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id),
  CONSTRAINT fk_articles_supplier
    FOREIGN KEY (supplier_id)
    REFERENCES suppliers(id)
    ON DELETE SET NULL,
  INDEX idx_articles_category_id (category_id),
  INDEX idx_articles_supplier_id (supplier_id),
  INDEX idx_articles_slug (slug),
  INDEX idx_articles_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE promotions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(220) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  description TEXT NULL,
  discount_type ENUM('PERCENT','FIXED') NOT NULL DEFAULT 'PERCENT',
  discount_value DECIMAL(12,2) NOT NULL,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE promotion_articles (
  promotion_id BIGINT UNSIGNED NOT NULL,
  article_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (promotion_id, article_id),
  CONSTRAINT fk_promotion_articles_promotion
    FOREIGN KEY (promotion_id)
    REFERENCES promotions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_promotion_articles_article
    FOREIGN KEY (article_id)
    REFERENCES articles(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE packs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(220) NOT NULL UNIQUE,
  name VARCHAR(220) NOT NULL,
  description TEXT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  old_price DECIMAL(12,2) NULL,
  image TEXT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE pack_items (
  pack_id BIGINT UNSIGNED NOT NULL,
  article_id BIGINT UNSIGNED NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  PRIMARY KEY (pack_id, article_id),
  CONSTRAINT fk_pack_items_pack
    FOREIGN KEY (pack_id)
    REFERENCES packs(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_pack_items_article
    FOREIGN KEY (article_id)
    REFERENCES articles(id)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tracking_number VARCHAR(80) NOT NULL UNIQUE,
  customer_name VARCHAR(180) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  wilaya VARCHAR(120) NOT NULL,
  commune VARCHAR(120) NOT NULL,
  address TEXT NOT NULL,
  note TEXT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'NOUVELLE',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock_deducted TINYINT(1) NOT NULL DEFAULT 1,
  zr_city_id VARCHAR(80) NULL,
  zr_district_id VARCHAR(80) NULL,
  zr_delivery_type VARCHAR(20) NULL,
  zr_destination_hub_id VARCHAR(80) NULL,
  zr_source_hub_id VARCHAR(80) NULL,
  zr_parcel_id VARCHAR(100) NULL,
  zr_tracking_number VARCHAR(100) NULL,
  zr_status VARCHAR(80) NULL,
  zr_status_label VARCHAR(180) NULL,
  zr_shipping_fee DECIMAL(12,2) NULL,
  zr_last_payload LONGTEXT NULL,
  zr_synced_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_tracking (tracking_number),
  INDEX idx_orders_phone (phone),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_status (created_at, status)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  article_id BIGINT UNSIGNED NULL,
  pack_id BIGINT UNSIGNED NULL,
  item_type ENUM('ARTICLE','PACK') NOT NULL DEFAULT 'ARTICLE',
  designation VARCHAR(220) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantity INT NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  cost_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_article
    FOREIGN KEY (article_id)
    REFERENCES articles(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_order_items_pack
    FOREIGN KEY (pack_id)
    REFERENCES packs(id)
    ON DELETE SET NULL,
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_pack (pack_id),
  INDEX idx_order_items_article (article_id)
) ENGINE=InnoDB;

CREATE TABLE order_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(40) NOT NULL,
  label VARCHAR(180) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_history_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE,
  INDEX idx_order_history_order (order_id)
) ENGINE=InnoDB;

INSERT INTO categories (name, slug, description)
VALUES
  ('Outillage', 'outillage', 'Outils manuels et accessoires'),
  ('Jardin', 'jardin', 'Équipements pour vos extérieurs'),
  ('Mobilier', 'mobilier', 'Mobilier intérieur et extérieur'),
  ('Peinture', 'peinture', 'Peintures, rouleaux et pinceaux'),
  ('Électricité', 'electricite', 'Matériel et accessoires électriques'),
  ('Plomberie', 'plomberie', 'Équipements et raccords'),
  ('Électroportatif', 'electroportatif', 'Outils électriques portatifs');

INSERT INTO suppliers (
  name, contact_name, phone, email, wilaya
)
VALUES (
  'Fournisseur Démo',
  'Service commercial',
  '0550000000',
  'fournisseur@example.com',
  'Oran'
);

INSERT INTO articles (
  category_id, supplier_id, slug, designation, reference,
  brand, description, price, old_price, purchase_price,
  stock_quantity, min_stock, image, images, rating, reviews
)
VALUES
(
  1, 1, 'marteau-professionnel', 'Marteau professionnel',
  'MAR-001', 'BricoPro',
  'Marteau robuste avec manche ergonomique.',
  1200, 1500, 700, 20, 3,
  'https://images.unsplash.com/photo-1607870411590-d5e9e06da09a?auto=format&fit=crop&w=1000&q=80',
  JSON_ARRAY(
    'https://images.unsplash.com/photo-1607870411590-d5e9e06da09a?auto=format&fit=crop&w=1000&q=80'
  ),
  4.8, 124
),
(
  2, 1, 'chaise-de-jardin', 'Chaise de jardin',
  'CHA-002', 'GardenHome',
  'Chaise confortable adaptée aux jardins et terrasses.',
  4500, 5200, 2900, 15, 3,
  'https://images.pexels.com/photos/17976470/pexels-photo-17976470/free-photo-of-wooden-chair-in-the-garden.jpeg?auto=compress&cs=tinysrgb&w=1000',
  JSON_ARRAY(
    'https://images.pexels.com/photos/17976470/pexels-photo-17976470/free-photo-of-wooden-chair-in-the-garden.jpeg?auto=compress&cs=tinysrgb&w=1000'
  ),
  4.6, 89
),
(
  2, 1, 'parasol-deporte', 'Parasol déporté',
  'PAR-003', 'GardenHome',
  'Parasol déporté offrant une large zone d’ombre.',
  18500, NULL, 13000, 8, 2,
  'https://images.pexels.com/photos/13872652/pexels-photo-13872652.jpeg?auto=compress&cs=tinysrgb&w=1000',
  JSON_ARRAY(
    'https://images.pexels.com/photos/13872652/pexels-photo-13872652.jpeg?auto=compress&cs=tinysrgb&w=1000'
  ),
  4.9, 56
),
(
  7, 1, 'perceuse-750-w', 'Perceuse 750 W',
  'PER-004', 'BricoPro',
  'Perceuse électrique puissante pour vos travaux.',
  12900, 14900, 9000, 12, 3,
  'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80',
  JSON_ARRAY(
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80'
  ),
  4.7, 203
);

INSERT INTO packs (
  slug, name, description, price, old_price, stock_quantity
)
VALUES (
  'pack-jardin',
  'Pack jardin',
  'Table, quatre chaises et parasol.',
  39900,
  47500,
  5
);
