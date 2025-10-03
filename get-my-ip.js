const axios = require('axios');

async function getMyIP() {
  console.log('🌐 Récupération de votre IP publique...');
  
  const services = [
    'https://api.ipify.org?format=json',
    'https://ipapi.co/json/',
    'https://api.myip.com',
    'https://httpbin.org/ip'
  ];
  
  for (const service of services) {
    try {
      console.log(`🔄 Tentative avec ${service}...`);
      const response = await axios.get(service, { timeout: 5000 });
      
      let ip;
      if (response.data.ip) {
        ip = response.data.ip;
      } else if (response.data.origin) {
        ip = response.data.origin;
      } else if (typeof response.data === 'string') {
        ip = response.data.trim();
      }
      
      if (ip) {
        console.log('✅ IP publique trouvée:', ip);
        console.log('\n📋 INSTRUCTIONS POUR MONGODB ATLAS:');
        console.log('1. Allez sur: https://cloud.mongodb.com');
        console.log('2. Connectez-vous à votre compte');
        console.log('3. Sélectionnez votre projet');
        console.log('4. Cliquez sur "Network Access" dans le menu de gauche');
        console.log('5. Cliquez sur "Add IP Address"');
        console.log('6. Collez cette IP:', ip);
        console.log('7. Ou utilisez 0.0.0.0/0 pour permettre toutes les IPs (moins sécurisé)');
        console.log('8. Cliquez sur "Confirm"');
        console.log('9. Attendez 1-2 minutes');
        console.log('10. Relancez: node test-mongodb-only.js');
        
        return ip;
      }
    } catch (error) {
      console.log(`❌ Échec avec ${service}: ${error.message}`);
    }
  }
  
  console.log('❌ Impossible de récupérer votre IP publique');
  console.log('\n💡 SOLUTION ALTERNATIVE:');
  console.log('1. Allez sur: https://whatismyipaddress.com/');
  console.log('2. Copiez votre IP publique');
  console.log('3. Suivez les instructions MongoDB Atlas ci-dessus');
  
  return null;
}

async function testMongoDBWithRetry() {
  console.log('\n🔄 Test de connexion MongoDB avec retry...');
  
  const mongoose = require('mongoose');
  const path = require('path');
  
  // Charger les variables d'environnement
  require('dotenv').config({ path: path.join(__dirname, 'config', '.env') });
  
  if (!process.env.MONGO) {
    console.log('❌ Variable MONGO non trouvée');
    return false;
  }
  
  // Essayer plusieurs fois avec des timeouts différents
  const timeouts = [5000, 10000, 15000];
  
  for (const timeout of timeouts) {
    try {
      console.log(`🔄 Tentative avec timeout ${timeout}ms...`);
      
      await mongoose.connect(process.env.MONGO, {
        serverSelectionTimeoutMS: timeout,
        connectTimeoutMS: timeout,
        socketTimeoutMS: timeout
      });
      
      console.log('✅ Connexion MongoDB réussie !');
      console.log('📊 État:', mongoose.connection.readyState);
      console.log('🏷️ Base:', mongoose.connection.name);
      
      await mongoose.disconnect();
      return true;
      
    } catch (error) {
      console.log(`❌ Échec avec timeout ${timeout}ms: ${error.message}`);
      
      if (error.message.includes('ETIMEOUT') || error.message.includes('Server selection timed out')) {
        console.log('💡 Problème de réseau ou IP non autorisée');
      }
    }
  }
  
  return false;
}

async function main() {
  console.log('🚀 Diagnostic complet MongoDB Atlas...\n');
  
  // Récupérer l'IP
  const ip = await getMyIP();
  
  // Test MongoDB
  const mongoSuccess = await testMongoDBWithRetry();
  
  console.log('\n📊 RÉSUMÉ:');
  console.log('🌐 IP publique:', ip || 'Non trouvée');
  console.log('🗄️ MongoDB Atlas:', mongoSuccess ? '✅ Accessible' : '❌ Non accessible');
  
  if (!mongoSuccess && ip) {
    console.log('\n🔧 ACTION REQUISE:');
    console.log(`Ajoutez l'IP ${ip} à la whitelist MongoDB Atlas`);
    console.log('Puis relancez: node test-mongodb-only.js');
  }
}

main();










