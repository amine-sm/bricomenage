# BricoMénage

Projet e-commerce sans compte client.

## Architecture
- `frontend`: Next.js App Router exporté en statique.
- `backend`: API Express + PostgreSQL.
- Commande invité avec téléphone, adresse et numéro de tracking.

## Démarrage rapide
### Base PostgreSQL
```bash
createdb bricomenage
psql -d bricomenage -f backend/sql/schema.sql
psql -d bricomenage -f backend/sql/seed.sql
```

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

### Export statique
```bash
cd frontend
npm run build
```
Le site statique sera disponible dans `frontend/out`.

## Administration de démonstration
- Email : `admin@bricomenage.dz`
- Mot de passe : `Admin@2026`

Changez ce mot de passe après la première connexion.
