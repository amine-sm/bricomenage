# Backend BricoMénage — MySQL / phpMyAdmin

## Installation

```bash
npm install
```

Créer `.env` :

```bash
copy .env.example .env
```

Importer `sql/database.sql` dans phpMyAdmin ou exécuter :

```bash
npm run db:init
```

Créer le compte administrateur :

```bash
npm run db:seed
```

Démarrer :

```bash
npm run dev
```

API :

```text
http://localhost:5000
```

## Routes publiques

```text
GET  /api/articles
GET  /api/articles/slug/:slug
POST /api/orders
POST /api/tracking/check
```

## Authentification

```text
POST /api/auth/login
GET  /api/auth/me
```

## Routes administrateur

Toutes utilisent :

```text
Authorization: Bearer VOTRE_TOKEN
```

```text
GET    /api/admin/dashboard

GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id

GET    /api/admin/articles
POST   /api/admin/articles
PUT    /api/admin/articles/:id
DELETE /api/admin/articles/:id

GET    /api/admin/suppliers
POST   /api/admin/suppliers
PUT    /api/admin/suppliers/:id
DELETE /api/admin/suppliers/:id

GET    /api/admin/orders
GET    /api/admin/orders/:id
PATCH  /api/admin/orders/:id/status

GET    /api/admin/promotions
POST   /api/admin/promotions

GET    /api/admin/packs
POST   /api/admin/packs
```

## Frontend

Dans `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Upload images

Pour ajouter un article avec images, envoyer un formulaire `multipart/form-data`.

Champ des fichiers :

```text
images
```

Maximum : 6 images, 5 Mo chacune.
