BEGIN;

INSERT INTO categories (name, slug, description)
VALUES
  ('Outillage', 'outillage', 'Outils manuels et accessoires'),
  ('Jardin', 'jardin', 'Équipements pour vos extérieurs'),
  ('Mobilier', 'mobilier', 'Mobilier intérieur et extérieur'),
  ('Peinture', 'peinture', 'Peintures, rouleaux et pinceaux'),
  ('Électricité', 'electricite', 'Matériel et accessoires électriques'),
  ('Plomberie', 'plomberie', 'Équipements et raccords'),
  ('Électroportatif', 'electroportatif', 'Outils électriques portatifs')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO suppliers (
  name,
  contact_name,
  phone,
  email,
  wilaya
)
VALUES (
  'Fournisseur Démo',
  'Service commercial',
  '0550000000',
  'fournisseur@example.com',
  'Oran'
)
ON CONFLICT DO NOTHING;

INSERT INTO articles (
  category_id,
  supplier_id,
  slug,
  designation,
  reference,
  brand,
  description,
  price,
  old_price,
  purchase_price,
  stock_quantity,
  min_stock,
  image,
  rating,
  reviews
)
SELECT
  c.id,
  s.id,
  values_table.slug,
  values_table.designation,
  values_table.reference,
  values_table.brand,
  values_table.description,
  values_table.price,
  values_table.old_price,
  values_table.purchase_price,
  values_table.stock_quantity,
  3,
  values_table.image,
  values_table.rating,
  values_table.reviews
FROM (
  VALUES
    (
      'Outillage',
      'marteau-professionnel',
      'Marteau professionnel',
      'MAR-001',
      'BricoPro',
      'Marteau robuste avec manche ergonomique.',
      1200::NUMERIC,
      1500::NUMERIC,
      700::NUMERIC,
      20,
      'https://images.unsplash.com/photo-1607870411590-d5e9e06da09a?auto=format&fit=crop&w=1000&q=80',
      4.8::NUMERIC,
      124
    ),
    (
      'Jardin',
      'chaise-de-jardin',
      'Chaise de jardin',
      'CHA-002',
      'GardenHome',
      'Chaise confortable adaptée aux jardins et terrasses.',
      4500::NUMERIC,
      5200::NUMERIC,
      2900::NUMERIC,
      15,
      'https://images.pexels.com/photos/17976470/pexels-photo-17976470/free-photo-of-wooden-chair-in-the-garden.jpeg?auto=compress&cs=tinysrgb&w=1000',
      4.6::NUMERIC,
      89
    ),
    (
      'Jardin',
      'parasol-deporte',
      'Parasol déporté',
      'PAR-003',
      'GardenHome',
      'Parasol déporté offrant une large zone d’ombre.',
      18500::NUMERIC,
      NULL::NUMERIC,
      13000::NUMERIC,
      8,
      'https://images.pexels.com/photos/13872652/pexels-photo-13872652.jpeg?auto=compress&cs=tinysrgb&w=1000',
      4.9::NUMERIC,
      56
    ),
    (
      'Électroportatif',
      'perceuse-750-w',
      'Perceuse 750 W',
      'PER-004',
      'BricoPro',
      'Perceuse électrique puissante pour vos travaux.',
      12900::NUMERIC,
      14900::NUMERIC,
      9000::NUMERIC,
      12,
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80',
      4.7::NUMERIC,
      203
    )
) AS values_table(
  category_name,
  slug,
  designation,
  reference,
  brand,
  description,
  price,
  old_price,
  purchase_price,
  stock_quantity,
  image,
  rating,
  reviews
)
JOIN categories c
  ON c.name = values_table.category_name
CROSS JOIN LATERAL (
  SELECT id
  FROM suppliers
  ORDER BY id
  LIMIT 1
) s
ON CONFLICT (slug) DO NOTHING;

INSERT INTO packs (
  slug,
  name,
  description,
  price,
  old_price,
  stock_quantity,
  is_active
)
VALUES (
  'pack-jardin',
  'Pack jardin',
  'Table, quatre chaises et parasol.',
  39900,
  47500,
  5,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
