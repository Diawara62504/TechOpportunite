# Documentation API – Backend TechOpportunités

## Base URL
```
https://techopportunite.onrender.com
```

---

## Authentification
Certaines routes nécessitent un token JWT dans l’en-tête `Authorization: Bearer <token>`.

---

## Endpoints

### Utilisateurs (`/users`)
- **GET /users**  
  Récupère la liste des utilisateurs.
- **GET /users/:id**  
  Détail d’un utilisateur.
- **POST /users**  
  Crée un nouvel utilisateur.  
  Body : `{ nom, email, motDePasse, ... }`
- **PUT /users/:id**  
  Met à jour un utilisateur.  
  Body : `{ nom?, email?, ... }`
- **DELETE /users/:id**  
  Supprime un utilisateur.

---

### Offres (`/offers`)
- **GET /offers**  
  Liste des offres.
- **GET /offers/:id**  
  Détail d’une offre.
- **POST /offers**  
  Crée une offre.  
  Body : `{ titre, description, technologie, ... }`
- **PUT /offers/:id**  
  Met à jour une offre.
- **DELETE /offers/:id**  
  Supprime une offre.

---

### Notifications (`/notifications`)
- **GET /notifications**  
  Liste des notifications.
- **POST /notifications**  
  Crée une notification.  
  Body : `{ message, destinataire, ... }`
- **PUT /notifications/:id**  
  Met à jour une notification.
- **DELETE /notifications/:id**  
  Supprime une notification.

---

### Statistiques (`/stats`)
- **GET /stats**  
  Récupère les statistiques globales (utilisateurs, offres, etc.).

---

### Export
- **GET /export/excel**  
  Exporte les données au format Excel.
- **GET /export/pdf**  
  Exporte les données au format PDF.

---

## Codes de réponse
- `200 OK` : Succès
- `201 Created` : Ressource créée
- `400 Bad Request` : Requête invalide
- `401 Unauthorized` : Authentification requise
- `404 Not Found` : Ressource non trouvée
- `500 Internal Server Error` : Erreur serveur

---

## Sécurité
- Authentification par JWT
- Validation des entrées
- Gestion des erreurs centralisée

---

## Contact
Pour toute question ou support, contactez l’équipe TechOpportunités.
