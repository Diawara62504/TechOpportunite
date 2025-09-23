// Script de démarrage du serveur TechOpportunités
console.log('🚀 Démarrage du serveur TechOpportunités...');

// Définir les variables d'environnement par défaut
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '5000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-' + Date.now();
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret-' + Date.now();
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/techopportunites';

console.log('⚙️ Configuration:');
console.log('   - NODE_ENV:', process.env.NODE_ENV);
console.log('   - PORT:', process.env.PORT);
console.log('   - JWT_SECRET:', process.env.JWT_SECRET ? 'Défini' : 'Non défini');
console.log('   - MONGODB_URI:', process.env.MONGODB_URI);

// Démarrer le serveur principal
try {
  require('./server.js');
} catch (error) {
  console.error('❌ Erreur lors du démarrage du serveur:', error);
  process.exit(1);
}
