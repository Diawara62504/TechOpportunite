# 📚 Documentation API – Backend TechOpportunités

## 🌐 Base URL
```
Production: https://techopportunite.onrender.com ✅ ACTIF

```

---

## 🔐 Authentification

L'API utilise un système d'authentification JWT avec cookies. Les routes protégées nécessitent un token valide.

### 🔑 Processus d'authentification
1. **Inscription** : `POST /user/register`
2. **Connexion** : `POST /user/login` → Retourne des cookies `token` et `refreshToken`
3. **Utilisation** : Les cookies sont automatiquement envoyés avec les requêtes
4. **Déconnexion** : `GET /user/logout` → Supprime les cookies

### ⚠️ Important
- Le token expire en **2 secondes** (pour les tests)
- Le refreshToken expire en **7 jours**
- Les cookies sont configurés avec `httpOnly: false` et `sameSite: "none"`

---

## 📋 Endpoints

### 👥 Utilisateurs (`/user`)

#### 🔐 POST `/user/register`
  Crée un nouvel utilisateur.  

**Body:**
```json
{
  "nom": "Diallo",
  "prenom": "Fatoumata",
  "email": "fatou@example.com",
  "password": "motdepasse123",
  "preference": "Développement Web",
  "role": "candidat"
}
```

**Réponse (200):**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "nom": "Diallo",
  "prenom": "Fatoumata",
  "email": "fatou@example.com",
  "preference": "Développement Web",
  "role": "candidat",
  "confirmationToken": "token_de_confirmation"
}
```

**Erreurs:**
- `404` : Utilisateur déjà inscrit
- `500` : Erreur de serveur

---

#### 🔑 POST `/user/login`
Connecte un utilisateur.

**Body:**
```json
{
  "email": "fatou@example.com",
  "password": "motdepasse123"
}
```

**Réponse (200):**
```json
"cookie créé avec succès"
```

**Cookies retournés:**
- `token` : JWT valide 2 secondes
- `refreshToken` : JWT valide 7 jours

**Erreurs:**
- `404` : Informations incorrectes
- `400` : Compte non confirmé

---

#### 👤 GET `/user/get`
Récupère la liste des utilisateurs avec pagination et recherche.

**Query Parameters:**
- `limit` (optionnel) : Nombre d'éléments par page (défaut: 3)
- `page` (optionnel) : Numéro de page (défaut: 1)
- `search` (optionnel) : Recherche dans nom, prénom, email

**Exemple:**
```
GET /user/get?limit=10&page=1&search=Diallo
```

**Réponse (200):**
```json
{
  "page": 1,
  "limit": 10,
  "total": 25,
  "pageTotale": 3,
  "affiche": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "nom": "Diallo",
      "prenom": "Fatoumata",
      "email": "fatou@example.com",
      "preference": "Développement Web",
      "role": "candidat"
    }
  ]
}
```

---

#### 🚪 GET `/user/logout`
Déconnecte l'utilisateur en supprimant les cookies.

**Réponse (200):**
```json
{
  "message": "Déconnecté"
}
```

---

### 💼 Offres (`/offer`)

#### 📋 GET `/offer`
Récupère la liste des offres avec pagination et recherche.

**Query Parameters:**
- `page` (optionnel) : Numéro de page (défaut: 1)
- `limit` (optionnel) : Nombre d'éléments par page (défaut: 5)
- `search` (optionnel) : Recherche dans type, technologies, localisation

**Exemple:**
```
GET /offer?page=1&limit=12&search=React
```

**Réponse (200):**
```json
{
  "page": 1,
  "limit": 12,
  "pageTotale": 5,
  "total": 58,
  "getoffer": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "titre": "Développeur React Senior",
      "description": "Nous recherchons un développeur React expérimenté...",
      "type": "CDI",
      "date": "2024-01-15T10:30:00.000Z",
      "localisation": "Dakar",
      "technologies": "React, Node.js, MongoDB",
      "source": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "nom": "Diallo",
        "prenom": "Fatoumata",
        "email": "fatou@example.com"
      },
      "persAyantPost": []
    }
  ]
}
```

---

#### ➕ POST `/offer`
Crée une nouvelle offre. **🔒 Authentification requise**

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "titre": "Développeur Full Stack",
  "description": "Nous recherchons un développeur full stack pour rejoindre notre équipe...",
  "type": "CDI",
  "localisation": "Abidjan",
  "technologies": "React, Node.js, MongoDB, AWS"
}
```

**Réponse (201):**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
  "titre": "Développeur Full Stack",
  "description": "Nous recherchons un développeur full stack...",
  "type": "CDI",
  "date": "2024-01-15T10:30:00.000Z",
  "localisation": "Abidjan",
  "technologies": "React, Node.js, MongoDB, AWS",
  "source": "64f8a1b2c3d4e5f6a7b8c9d0",
  "persAyantPost": []
}
```

---

#### 🔍 GET `/offer/:id`
Récupère les offres d'un utilisateur spécifique. **🔒 Authentification requise**

**Exemple:**
```
GET /offer/64f8a1b2c3d4e5f6a7b8c9d0
```

**Réponse (200):**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "titre": "Développeur React Senior",
    "description": "Description de l'offre...",
    "type": "CDI",
    "localisation": "Dakar",
    "technologies": "React, Node.js",
    "source": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "nom": "Diallo",
      "prenom": "Fatoumata",
      "email": "fatou@example.com"
    }
  }
]
```

---

### 📊 Statistiques (`/stats`)

#### 📈 GET `/stats`
Récupère les statistiques globales des offres.

**Réponse (200):**
```json
{
  "total": 58,
  "parType": [
    { "_id": "CDI", "count": 25 },
    { "_id": "CDD", "count": 15 },
    { "_id": "Freelance", "count": 12 },
    { "_id": "Stage", "count": 6 }
  ],
  "parTech": [
    { "_id": "React", "count": 18 },
    { "_id": "Node.js", "count": 15 },
    { "_id": "Python", "count": 12 },
    { "_id": "JavaScript", "count": 20 }
  ]
}
```

---

### 🔔 Notifications (`/notification`)

#### ➕ POST `/notification`
Crée une nouvelle notification. **🔒 Authentification requise**

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "message": "Nouvelle offre correspondant à vos critères",
  "destinataire": "64f8a1b2c3d4e5f6a7b8c9d0",
  "type": "offre"
}
```

---

#### 📋 GET `/notification`
Récupère les notifications de l'utilisateur connecté. **🔒 Authentification requise**

**Headers:**
```
Authorization: Bearer <token>
```

---

## 🚨 Codes de réponse

| Code | Signification | Description |
|------|---------------|-------------|
| `200` | OK | Requête réussie |
| `201` | Created | Ressource créée avec succès |
| `400` | Bad Request | Requête invalide ou données manquantes |
| `401` | Unauthorized | Authentification requise ou token invalide |
| `404` | Not Found | Ressource non trouvée |
| `500` | Internal Server Error | Erreur serveur interne |

---

## 🛡️ Sécurité et bonnes pratiques

### 🔐 Authentification
- **Toujours** inclure le token JWT dans les headers pour les routes protégées
- **Gérer** l'expiration des tokens côté client
- **Utiliser** HTTPS en production

### 📝 Validation des données
- **Vérifier** que tous les champs requis sont présents
- **Valider** le format des emails et mots de passe
- **Sanitizer** les entrées utilisateur

### 🔄 Gestion des erreurs
- **Toujours** vérifier les codes de réponse
- **Implémenter** une gestion d'erreur robuste côté client
- **Logger** les erreurs pour le debugging

### 📊 Performance
- **Utiliser** la pagination pour les listes importantes
- **Implémenter** la mise en cache côté client
- **Optimiser** les requêtes avec des filtres appropriés

---

## 🧪 Exemples d'utilisation

### Frontend React avec Axios

```javascript
// Configuration Axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://techopportunite.onrender.com',
  withCredentials: true // Pour les cookies
});

// Inscription
const register = async (userData) => {
  try {
    const response = await api.post('/user/register', userData);
    return response.data;
  } catch (error) {
    console.error('Erreur inscription:', error.response.data);
    throw error;
  }
};

// Connexion
const login = async (credentials) => {
  try {
    const response = await api.post('/user/login', credentials);
    return response.data;
  } catch (error) {
    console.error('Erreur connexion:', error.response.data);
    throw error;
  }
};

// Récupérer les offres avec filtres
const getOffers = async (page = 1, limit = 12, search = '') => {
  try {
    const response = await api.get('/offer', {
      params: { page, limit, search }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur récupération offres:', error.response.data);
    throw error;
  }
};

// Créer une offre (authentification requise)
const createOffer = async (offerData) => {
  try {
    const response = await api.post('/offer', offerData);
    return response.data;
  } catch (error) {
    console.error('Erreur création offre:', error.response.data);
    throw error;
  }
};
```

### JavaScript Vanilla avec Fetch

```javascript
// Fonction utilitaire pour les requêtes
const apiRequest = async (endpoint, options = {}) => {
  const url = `https://techopportunite.onrender.com${endpoint}`;
  const config = {
    credentials: 'include', // Pour les cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur API');
    }
    
    return data;
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

// Exemples d'utilisation
const login = (email, password) => 
  apiRequest('/user/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

const getOffers = (page = 1, search = '') => 
  apiRequest(`/offer?page=${page}&search=${encodeURIComponent(search)}`);

const getStats = () => apiRequest('/stats');
```

---

## 🐛 Debugging et logs

### 🔍 Vérification des cookies
```javascript
// Vérifier les cookies dans le navigateur
console.log(document.cookie);

// Vérifier les cookies dans les DevTools
// Application > Cookies > https://techopportunite.onrender.com
```

### 📝 Logs côté serveur
Le serveur utilise un middleware de logging qui affiche :
- Méthode HTTP et URL
- Timestamp de la requête
- Status de la réponse

---

## 📞 Support

Pour toute question ou problème :
- **Issues** : Créer une issue sur le repository
- **Email** : support@techopportunites.com
- **Documentation** : Consulter ce fichier régulièrement

---

## 🔄 Changelog

### Version 1.0.0
- ✅ Authentification JWT avec cookies
- ✅ CRUD utilisateurs
- ✅ CRUD offres avec pagination
- ✅ Système de notifications
- ✅ Statistiques globales
- ✅ Recherche et filtres
