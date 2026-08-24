-- =========================================================
-- BricoMénage - Gestion utilisateurs + autorisations
-- Migration NON destructive pour une base existante.
-- Compatible MariaDB 10.11 / MySQL moderne.
-- =========================================================

START TRANSACTION;

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER' AFTER is_active;

CREATE TABLE IF NOT EXISTS admin_permissions (
  admin_id BIGINT UNSIGNED NOT NULL,
  permission_key VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (admin_id, permission_key),
  INDEX idx_admin_permissions_key (permission_key),
  CONSTRAINT fk_admin_permissions_admin
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Votre compte principal devient SUPER_ADMIN.
UPDATE admins
SET role = 'SUPER_ADMIN'
WHERE LOWER(email) = 'admin@bricomenage.dz';

-- Sécurité : s'il n'existe aucun SUPER_ADMIN (email différent),
-- le plus ancien compte admin devient SUPER_ADMIN.
SET @super_count := (SELECT COUNT(*) FROM admins WHERE role = 'SUPER_ADMIN');
SET @first_admin_id := (SELECT MIN(id) FROM admins);
UPDATE admins
SET role = 'SUPER_ADMIN'
WHERE id = @first_admin_id
  AND @super_count = 0;

COMMIT;
