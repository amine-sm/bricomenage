BEGIN;

CREATE TABLE IF NOT EXISTS admins (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  contact_name VARCHAR(180),
  phone VARCHAR(50),
  email VARCHAR(190),
  address TEXT,
  wilaya VARCHAR(120),
  nif VARCHAR(80),
  nis VARCHAR(80),
  registre_commerce VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id),
  supplier_id BIGINT REFERENCES suppliers(id),
  slug VARCHAR(220) NOT NULL UNIQUE,
  designation VARCHAR(220) NOT NULL,
  reference VARCHAR(120) UNIQUE,
  brand VARCHAR(120),
  description TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  old_price NUMERIC(12, 2) CHECK (old_price IS NULL OR old_price >= 0),
  purchase_price NUMERIC(12, 2) CHECK (purchase_price IS NULL OR purchase_price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  image TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  rating NUMERIC(2, 1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews INTEGER NOT NULL DEFAULT 0 CHECK (reviews >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_category_id
  ON articles(category_id);

CREATE INDEX IF NOT EXISTS idx_articles_slug
  ON articles(slug);

CREATE INDEX IF NOT EXISTS idx_articles_active
  ON articles(is_active);

CREATE TABLE IF NOT EXISTS promotions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL
    CHECK (discount_type IN ('PERCENT', 'FIXED')),
  discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promotion_articles (
  promotion_id BIGINT NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  PRIMARY KEY (promotion_id, article_id)
);

CREATE TABLE IF NOT EXISTS packs (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(220) NOT NULL UNIQUE,
  name VARCHAR(220) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  old_price NUMERIC(12, 2) CHECK (old_price IS NULL OR old_price >= 0),
  image TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pack_items (
  pack_id BIGINT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  article_id BIGINT NOT NULL REFERENCES articles(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (pack_id, article_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  tracking_number VARCHAR(80) NOT NULL UNIQUE,
  customer_name VARCHAR(180) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  wilaya VARCHAR(120) NOT NULL,
  commune VARCHAR(120) NOT NULL,
  address TEXT NOT NULL,
  note TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'NOUVELLE',
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_tracking_number
  ON orders(tracking_number);

CREATE INDEX IF NOT EXISTS idx_orders_phone
  ON orders(phone);

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  article_id BIGINT REFERENCES articles(id),
  designation VARCHAR(220) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE TABLE IF NOT EXISTS order_history (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(40) NOT NULL,
  label VARCHAR(180) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order_id
  ON order_history(order_id);

COMMIT;
