** CLUB Routes**

POST /new-club : Crée un nouveau club avec des informations comme le nom, l'email, le téléphone et la couleur. Un code d'adhésion unique est généré pour chaque club. Ce code peut être utilisé pour inviter d'autres utilisateurs à rejoindre le club.

GET /clubs : Récupère tous les clubs enregistrés dans la base de données et les retourne, en incluant les informations des admins et des membres.

GET /user-clubs : Récupère tous les clubs auxquels l'utilisateur authentifié appartient. Cette route est protégée par le middleware isAuthenticated.

GET /club/:id : Récupère un club spécifique en fonction de son ID, y compris les admins, les membres, et les équipes associées au club.

PUT /update-club/:id : Met à jour un club en fonction de son ID. Les admins du club peuvent ajouter ou supprimer des membres et admins. De plus, ils peuvent mettre à jour les informations du club et télécharger une nouvelle image de profil pour le club.

DELETE /delete-club/:id : Supprime un club en fonction de son ID. Seuls les admins peuvent supprimer un club.
