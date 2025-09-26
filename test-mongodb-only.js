const mongoose = require('mongoose');
const path = require('path');

// Charger les variables d'environnement depuis config/.env
require('dotenv').config({ path: path.join(__dirname, 'config', '.env') });

async function testMongoDBConnection() {
  console.log('🔍 Test de connexion MongoDB Atlas...');
  console.log('📍 URI MongoDB:', process.env.MONGO ? 'Définie' : 'Non définie');
  
  if (!process.env.MONGO) {
    console.log('❌ Variable MONGO non trouvée dans config/.env');
    return false;
  }
  
  console.log('🔗 URI complète:', process.env.MONGO.replace(/\/\/.*@/, '//***:***@')); // Masquer les credentials
  
  try {
    console.log('🔄 Tentative de connexion...');
    
    // Connexion avec timeout court
    await mongoose.connect(process.env.MONGO, {
      serverSelectionTimeoutMS: 10000, // 10 secondes
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000
    });
    
    console.log('✅ Connexion MongoDB réussie !');
    console.log('📊 État de la connexion:', mongoose.connection.readyState);
    console.log('🏷️ Nom de la base:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    
    // Test d'une requête simple
    const User = require('./models/user.model');
    const userCount = await User.countDocuments();
    console.log('👥 Nombre d\'utilisateurs dans la base:', userCount);
    
    // Test d'insertion d'un utilisateur de test
    console.log('📝 Test d\'insertion d\'un utilisateur...');
    const testUser = new User({
      nom: 'Test',
      prenom: 'User',
      email: `test${Date.now()}@example.com`,
      password: 'hashedpassword',
      role: 'candidate'
    });
    
    const savedUser = await testUser.save();
    console.log('✅ Utilisateur inséré avec succès:', savedUser._id);
    
    // Nettoyer - supprimer l'utilisateur de test
    await User.findByIdAndDelete(savedUser._id);
    console.log('🧹 Utilisateur de test supprimé');
    
    // Fermer la connexion
    await mongoose.disconnect();
    console.log('🔌 Connexion fermée');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', {
      message: error.message,
      code: error.code,
      codeName: error.codeName,
      name: error.name
    });
    
    if (error.message.includes('Server selection timed out')) {
      console.log('\n💡 DIAGNOSTIC:');
      console.log('🔒 Votre IP n\'est pas dans la whitelist de MongoDB Atlas');
      console.log('📋 SOLUTIONS:');
      console.log('1. Connectez-vous à MongoDB Atlas: https://cloud.mongodb.com');
      console.log('2. Allez dans "Network Access"');
      console.log('3. Cliquez sur "Add IP Address"');
      console.log('4. Ajoutez votre IP actuelle ou utilisez 0.0.0.0/0 (moins sécurisé)');
      console.log('5. Attendez 1-2 minutes que les changements prennent effet');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 DIAGNOSTIC:');
      console.log('🔑 Problème d\'authentification MongoDB');
      console.log('📋 Vérifiez vos credentials dans config/.env');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 DIAGNOSTIC:');
      console.log('🌐 Problème de résolution DNS');
      console.log('📋 Vérifiez votre connexion internet');
    }
    
    return false;
  }
}

async function getCurrentIP() {
  try {
    const axios = require('axios');
    const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
    console.log('🌐 Votre IP publique:', response.data.ip);
    return response.data.ip;
  } catch (error) {
    console.log('❌ Impossible de récupérer votre IP publique');
    return null;
  }
}

async function runDiagnostic() {
  console.log('🚀 Diagnostic MongoDB Atlas...\n');
  
  // Afficher l'IP actuelle
  await getCurrentIP();
  console.log('');
  
  // Test de connexion
  const success = await testMongoDBConnection();
  
  console.log('\n📊 RÉSULTAT:');
  if (success) {
    console.log('✅ MongoDB Atlas est accessible et fonctionne correctement');
    console.log('🎉 Vous pouvez maintenant utiliser l\'inscription et la connexion');
  } else {
    console.log('❌ MongoDB Atlas n\'est pas accessible');
    console.log('🔧 Suivez les instructions ci-dessus pour résoudre le problème');
  }
}

runDiagnostic();


