START TRANSACTION;

INSERT INTO categories(name,slug,description,is_active) VALUES
('Outillage','outillage','Outils manuels et accessoires',1),
('Jardin','jardin','Équipements pour vos extérieurs',1),
('Mobilier','mobilier','Mobilier intérieur et extérieur',1),
('Peinture','peinture','Peintures, rouleaux et pinceaux',1),
('Électricité','electricite','Matériel et accessoires électriques',1),
('Plomberie','plomberie','Équipements et raccords',1),
('Électroportatif','electroportatif','Outils électriques portatifs',1)
ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),is_active=1;

INSERT INTO suppliers(name,contact_name,phone,email,wilaya,is_active)
SELECT 'Fournisseur Démo','Service commercial','0550000000','fournisseur@example.com','Oran',1
WHERE NOT EXISTS(SELECT 1 FROM suppliers WHERE email='fournisseur@example.com');

SET @supplier_id := (SELECT id FROM suppliers ORDER BY id LIMIT 1);
SET @outillage := (SELECT id FROM categories WHERE slug='outillage' LIMIT 1);
SET @jardin := (SELECT id FROM categories WHERE slug='jardin' LIMIT 1);
SET @electro := (SELECT id FROM categories WHERE slug='electroportatif' LIMIT 1);

INSERT INTO articles(category_id,supplier_id,slug,designation,reference,brand,description,price,old_price,purchase_price,stock_quantity,min_stock,image,images,rating,reviews,is_active)
VALUES
(@outillage,@supplier_id,'marteau-professionnel','Marteau professionnel','MAR-001','BricoPro','Marteau robuste avec manche ergonomique.',1200,1500,700,20,3,NULL,JSON_ARRAY(),4.8,124,1),
(@jardin,@supplier_id,'chaise-de-jardin','Chaise de jardin','CHA-002','GardenHome','Chaise confortable adaptée aux jardins et terrasses.',4500,5200,2900,15,3,NULL,JSON_ARRAY(),4.6,89,1),
(@jardin,@supplier_id,'parasol-deporte','Parasol déporté','PAR-003','GardenHome','Parasol déporté offrant une large zone d’ombre.',18500,NULL,13000,8,2,NULL,JSON_ARRAY(),4.9,56,1),
(@electro,@supplier_id,'perceuse-750-w','Perceuse 750 W','PER-004','BricoPro','Perceuse électrique puissante pour vos travaux.',12900,14900,9000,12,3,NULL,JSON_ARRAY(),4.7,203,1)
ON DUPLICATE KEY UPDATE
 designation=VALUES(designation),price=VALUES(price),old_price=VALUES(old_price),purchase_price=VALUES(purchase_price),min_stock=VALUES(min_stock),is_active=1;

INSERT INTO packs(slug,name,description,price,old_price,stock_quantity,is_active)
VALUES('pack-jardin','Pack jardin','Quatre chaises et un parasol.',30000,36500,0,1)
ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),price=VALUES(price),old_price=VALUES(old_price),is_active=1;

SET @pack_id := (SELECT id FROM packs WHERE slug='pack-jardin' LIMIT 1);
SET @chair_id := (SELECT id FROM articles WHERE slug='chaise-de-jardin' LIMIT 1);
SET @parasol_id := (SELECT id FROM articles WHERE slug='parasol-deporte' LIMIT 1);

INSERT INTO pack_items(pack_id,article_id,quantity) VALUES
(@pack_id,@chair_id,4),(@pack_id,@parasol_id,1)
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);

COMMIT;
