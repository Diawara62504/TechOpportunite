// Script pour démarrer le serveur avec des valeurs par défaut
require('dotenv').config();

// Définir les variables d'environnement par défaut si elles n'existent pas
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'default-jwt-secret-change-in-production-' + Date.now();
  console.log('⚠️ JWT_SECRET non défini, utilisation d\'une valeur par défaut');
}

if (!process.env.REFRESH_TOKEN_SECRET) {
  process.env.REFRESH_TOKEN_SECRET = 'default-refresh-secret-change-in-production-' + Date.now();
  console.log('⚠️ REFRESH_TOKEN_SECRET non défini, utilisation d\'une valeur par défaut');
}

if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/techopportunites';
  console.log('⚠️ MONGODB_URI non défini, utilisation de la base locale');
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

console.log('🚀 Démarrage du serveur avec configuration:');
console.log('   - NODE_ENV:', process.env.NODE_ENV);
console.log('   - JWT_SECRET:', process.env.JWT_SECRET ? 'Défini' : 'Non défini');
console.log('   - REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET ? 'Défini' : 'Non défini');
console.log('   - MONGODB_URI:', process.env.MONGODB_URI ? 'Défini' : 'Non défini');

// Démarrer le serveur
require('./server.js');
