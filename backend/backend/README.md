# Backend BricoMénage — Express + MySQL/phpMyAdmin

## Installation

```bash
npm install
copy .env.example .env
npm run db:init
npm run db:seed
npm run dev
```

Import manuel possible dans phpMyAdmin : `sql/database.sql`.
Pour une base déjà créée, importez `sql/migration_complete_features.sql`.

## Fonctions incluses

- Authentification administrateur JWT
- Catégories CRUD
- Fournisseurs CRUD
- Articles CRUD, images, stock et seuil minimum
- Promotions liées à plusieurs articles, dates et réduction fixe/pourcentage
- Packs liés à plusieurs articles avec quantité par produit et stock calculé
- Commandes contenant articles et/ou packs
- Décrémentation transactionnelle du stock
- Historique et suivi public par numéro + téléphone
- Dashboard, commandes, changement de statut
- Catalogue public, détail article par slug, packs et promotions

## Routes principales

- `POST /api/auth/login`
- `GET /api/articles`
- `GET /api/articles/slug/:slug`
- `GET /api/packs`
- `GET /api/packs/slug/:slug`
- `GET /api/promotions`
- `POST /api/orders`
- `POST /api/tracking/check`
- CRUD admin sous `/api/admin/*`
