-- BricoMénage : rendre l’adresse de commande facultative
ALTER TABLE orders
  MODIFY COLUMN address TEXT NULL;
