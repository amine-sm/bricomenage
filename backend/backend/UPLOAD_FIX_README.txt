CORRECTION UPLOAD ARTICLES

Le backend accepte maintenant les deux champs :
- images
- upload_images

Maximum global : 10 images par requête.
Taille maximale : 5 Mo par image.
Formats : JPG, PNG, WEBP.

Le contrôleur reçoit toujours req.files sous forme de tableau,
aucune modification supplémentaire du contrôleur n'est nécessaire.
