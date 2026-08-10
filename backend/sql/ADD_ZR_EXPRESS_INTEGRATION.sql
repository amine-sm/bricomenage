-- BricoMénage - Intégration ZR Express NEW
SET @db := DATABASE();

-- Le backend ensureSchema.js exécute cette migration automatiquement.
-- Ce fichier est fourni pour phpMyAdmin si vous préférez l'appliquer manuellement.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS zr_city_id VARCHAR(80) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zr_district_id VARCHAR(80) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zr_delivery_type VARCHAR(20) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zr_destination_hub_id VARCHAR(80) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zr_source_hub_id VARCHAR(80) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zr_parcel_id VARCHAR(100) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zr_tracking_number VARCHAR(100) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zr_status VARCHAR(80) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zr_status_label VARCHAR(180) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zr_shipping_fee DECIMAL(12,2) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zr_last_payload LONGTEXT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zr_synced_at DATETIME NULL;
