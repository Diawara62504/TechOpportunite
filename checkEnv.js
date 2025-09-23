require('dotenv').config();

console.log('🔍 Vérification des variables d\'environnement:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Défini' : '❌ Non défini');
console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET ? '✅ Défini' : '❌ Non défini');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Défini' : '❌ Non défini');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Non défini');

if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
  console.log('\n⚠️  Variables JWT manquantes! Création de valeurs par défaut...');
  console.log('JWT_SECRET=your-super-secret-jwt-key-here');
  console.log('REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-here');
}
