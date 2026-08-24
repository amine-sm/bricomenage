# Frontend BricoMénage complet

## Installation

```bash
npm install
copy .env.local.example .env.local
npm run dev
```

Dans `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Le backend MySQL doit fonctionner sur `http://localhost:5000`.

## Administration

```text
http://localhost:3000/admin/connexion
```

Compte par défaut :

```text
admin@bricomenage.dz
Admin@123
```

## Pages publiques

- accueil
- catalogue
- détail article avec slug
- panier
- commande
- confirmation
- suivi de commande

## Pages administration

- tableau de bord
- articles avec upload d'images
- catégories
- fournisseurs
- stock
- commandes et historique
- promotions
- packs
