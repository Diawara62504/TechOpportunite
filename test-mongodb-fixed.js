const mongoose = require('mongoose');
const path = require('path');

// Charger les variables d'environnement depuis config/.env
require('dotenv').config({ path: path.join(__dirname, 'config', '.env') });

async function testMongoDBWithDifferentOptions() {
  console.log('🔍 Test MongoDB Atlas avec différentes options...');
  console.log('📍 IP dans whitelist: 10.158.253.94 ✅');
  
  if (!process.env.MONGO) {
    console.log('❌ Variable MONGO non trouvée');
    return false;
  }
  
  console.log('🔗 URI MongoDB:', process.env.MONGO.replace(/\/\/.*@/, '//***:***@'));
  
  // Options de connexion optimisées
  const connectionOptions = [
    {
      name: 'Options par défaut',
      options: {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000
      }
    },
    {
      name: 'Options avec retry',
      options: {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,
        retryWrites: true,
        retryReads: true,
        maxPoolSize: 10,
        minPoolSize: 5
      }
    },
    {
      name: 'Options avec compression',
      options: {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,
        compressors: ['zlib'],
        zlibCompressionLevel: 6
      }
    }
  ];
  
  for (const config of connectionOptions) {
    try {
      console.log(`\n🔄 Test avec: ${config.name}`);
      console.log('⏱️ Timeout: 30 secondes');
      
      await mongoose.connect(process.env.MONGO, config.options);
      
      console.log('✅ Connexion réussie !');
      console.log('📊 État de la connexion:', mongoose.connection.readyState);
      console.log('🏷️ Nom de la base:', mongoose.connection.name);
      console.log('🌐 Host:', mongoose.connection.host);
      console.log('🔌 Port:', mongoose.connection.port);
      
      // Test d'une requête simple
      const User = require('./models/user.model');
      const userCount = await User.countDocuments();
      console.log('👥 Nombre d\'utilisateurs:', userCount);
      
      // Test d'insertion
      console.log('📝 Test d\'insertion...');
      const testUser = new User({
        nom: 'Test',
        prenom: 'User',
        email: `test${Date.now()}@example.com`,
        password: 'hashedpassword',
        role: 'candidate'
      });
      
      const savedUser = await testUser.save();
      console.log('✅ Utilisateur inséré:', savedUser._id);
      
      // Nettoyer
      await User.findByIdAndDelete(savedUser._id);
      console.log('🧹 Utilisateur de test supprimé');
      
      await mongoose.disconnect();
      console.log('🔌 Connexion fermée');
      
      return true;
      
    } catch (error) {
      console.log(`❌ Échec avec ${config.name}:`, {
        message: error.message,
        code: error.code,
        name: error.name
      });
      
      // Fermer la connexion si elle existe
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    }
  }
  
  return false;
}

async function testWithDifferentURI() {
  console.log('\n🔄 Test avec URI modifiée...');
  
  // Essayer avec des paramètres d'URI différents
  const baseURI = process.env.MONGO;
  const modifiedURIs = [
    baseURI,
    baseURI + '&serverSelectionTimeoutMS=30000',
    baseURI + '&connectTimeoutMS=30000',
    baseURI + '&socketTimeoutMS=30000',
    baseURI.replace('?', '?retryWrites=true&w=majority&')
  ];
  
  for (let i = 0; i < modifiedURIs.length; i++) {
    const uri = modifiedURIs[i];
    try {
      console.log(`\n🔄 Test URI ${i + 1}/${modifiedURIs.length}`);
      console.log('🔗 URI:', uri.replace(/\/\/.*@/, '//***:***@'));
      
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000
      });
      
      console.log('✅ Connexion réussie avec URI modifiée !');
      console.log('📊 État:', mongoose.connection.readyState);
      
      await mongoose.disconnect();
      return true;
      
    } catch (error) {
      console.log(`❌ Échec URI ${i + 1}: ${error.message}`);
      
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    }
  }
  
  return false;
}

async function main() {
  console.log('🚀 Test MongoDB Atlas avec IP whitelistée...\n');
  
  // Test 1: Options différentes
  const success1 = await testMongoDBWithDifferentOptions();
  
  if (!success1) {
    // Test 2: URI modifiées
    const success2 = await testWithDifferentURI();
    
    if (!success2) {
      console.log('\n❌ Tous les tests ont échoué');
      console.log('\n💡 DIAGNOSTIC:');
      console.log('🔒 IP dans whitelist: ✅');
      console.log('🌐 Problème possible:');
      console.log('1. Firewall/antivirus bloque la connexion');
      console.log('2. Problème DNS (essayez 8.8.8.8 comme DNS)');
      console.log('3. Proxy/VPN interfère');
      console.log('4. MongoDB Atlas en maintenance');
      
      console.log('\n🔧 SOLUTIONS:');
      console.log('1. Désactivez temporairement l\'antivirus/firewall');
      console.log('2. Changez votre DNS vers 8.8.8.8');
      console.log('3. Désactivez le VPN si vous en utilisez un');
      console.log('4. Essayez depuis un autre réseau (mobile hotspot)');
    }
  } else {
    console.log('\n🎉 MongoDB Atlas fonctionne parfaitement !');
    console.log('✅ Vous pouvez maintenant utiliser l\'inscription et la connexion');
  }
}

main();


