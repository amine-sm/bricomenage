UPLOAD ARTICLES - CONFIGURATION FINALE

Nom du champ FormData : upload_images
Nombre maximum : 10 images
Taille maximum : 5 Mo par image
Formats : JPG, JPEG, PNG, WEBP

Frontend :

selectedFiles.forEach((file) => {
  formData.append("upload_images", file);
});

Routes concernées :
POST  /api/admin/articles
PUT   /api/admin/articles/:id
PATCH /api/admin/articles/:id

Le dossier uploads/products est créé automatiquement.
