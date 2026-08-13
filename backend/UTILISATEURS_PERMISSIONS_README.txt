BRICOMENAGE - UTILISATEURS ET AUTORISATIONS
============================================

1. Le backend migre automatiquement la base au démarrage via scripts/ensureSchema.js.
2. Pour cPanel/phpMyAdmin, vous pouvez aussi exécuter manuellement :
   sql/ADD_ADMIN_USERS_PERMISSIONS.sql
3. Le compte admin@bricomenage.dz devient automatiquement SUPER_ADMIN.
4. Nouvelle page frontend : /admin/utilisateurs/
5. Le SUPER_ADMIN peut créer, modifier, désactiver et supprimer des utilisateurs normaux.
6. Les permissions sont contrôlées côté backend (403 si action interdite).
7. Les menus non autorisés sont masqués côté frontend.
8. Le stock utilise maintenant /admin/stock afin qu'un droit Stock ne permette pas de modifier toute la fiche article.

Permissions disponibles :
- dashboard.view
- articles.view / create / update / delete
- promotions.view / create / update / delete
- packs.view / create / update / delete
- categories.view / create / update / delete
- suppliers.view / create / update / delete
- stock.view / update
- orders.view / update / zr

IMPORTANT FRONTEND
------------------
Après remplacement du frontend, reconstruire l'export statique :
  npm install
  npm run build

Puis déployer le nouveau dossier out/ généré.
