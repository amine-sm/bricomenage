-- Slug automatique packs / promotions
-- Le backend remplit automatiquement les valeurs à partir du nom.

ALTER TABLE promotions
  ADD COLUMN slug VARCHAR(220) NULL AFTER id;

-- Important : le remplissage des slugs avec gestion des accents et doublons
-- est fait automatiquement au démarrage du backend par scripts/ensureSchema.js.
