const axios = require('axios');
const path = require('path');

// Charger les variables d'environnement depuis config/.env
require('dotenv').config({ path: path.join(__dirname, 'config', '.env') });

async function testLocalBackend() {
  console.log('🏠 Test du backend local...');
  
  const testUser = {
    nom: "Test",
    prenom: "User", 
    email: `test${Date.now()}@example.com`,
    password: "password123",
    role: "candidate"
  };
  
  try {
    // Test des offres (devrait fonctionner même sans MongoDB)
    console.log('📋 Test des offres...');
    const offersResponse = await axios.get('http://localhost:5000/api/offers?page=1&limit=1', {
      timeout: 5000
    });
    console.log('✅ Offres - Status:', offersResponse.status);
    
    // Test d'inscription
    console.log('📝 Test d\'inscription...');
    const registerResponse = await axios.post('http://localhost:5000/api/user/register', testUser, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ Inscription réussie - Status:', registerResponse.status);
    console.log('📄 Réponse:', registerResponse.data);
    
    // Test de connexion
    console.log('🔐 Test de connexion...');
    const loginResponse = await axios.post('http://localhost:5000/api/user/login', {
      email: testUser.email,
      password: testUser.password
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ Connexion réussie - Status:', loginResponse.status);
    console.log('👤 Utilisateur:', loginResponse.data.user?.email);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur backend local:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return false;
  }
}

async function testRemoteBackend() {
  console.log('\n🌐 Test du backend hébergé...');
  
  const testUser = {
    nom: "Test",
    prenom: "User", 
    email: `test${Date.now()}@example.com`,
    password: "password123",
    role: "candidate"
  };
  
  try {
    // Test des offres
    console.log('📋 Test des offres...');
    const offersResponse = await axios.get('https://techopportunite.onrender.com/api/offers?page=1&limit=1', {
      timeout: 15000
    });
    console.log('✅ Offres - Status:', offersResponse.status);
    
    // Test d'inscription
    console.log('📝 Test d\'inscription...');
    const registerResponse = await axios.post('https://techopportunite.onrender.com/api/user/register', testUser, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    });
    
    console.log('✅ Inscription réussie - Status:', registerResponse.status);
    console.log('📄 Réponse:', registerResponse.data);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur backend hébergé:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.message.includes('timeout')) {
      console.log('💡 Le serveur Render est probablement en "sleep mode"');
      console.log('💡 Attendez 30-60 secondes et réessayez');
    }
    
    return false;
  }
}

async function checkMongoDBConnection() {
  console.log('🔍 Vérification de la connexion MongoDB...');
  console.log('📍 URI MongoDB:', process.env.MONGO ? 'Définie' : 'Non définie');
  
  if (process.env.MONGO) {
    console.log('✅ Variables MongoDB chargées depuis config/.env');
    console.log('🔑 Variables disponibles:', {
      MONGO: 'Définie',
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV,
      SECRET_KEY: process.env.SECRET_KEY ? 'Définie' : 'Non définie'
    });
  } else {
    console.log('❌ Variables MongoDB non trouvées');
  }
}

async function runAllTests() {
  console.log('🚀 Tests complets du système...\n');
  
  // Vérification MongoDB
  await checkMongoDBConnection();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test backend local
  const localSuccess = await testLocalBackend();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test backend hébergé
  const remoteSuccess = await testRemoteBackend();
  
  // Résumé
  console.log('\n📊 RÉSUMÉ DES TESTS:');
  console.log('🏠 Backend local:', localSuccess ? '✅ Fonctionne' : '❌ Problème');
  console.log('🌐 Backend hébergé:', remoteSuccess ? '✅ Fonctionne' : '❌ Problème');
  
  if (!localSuccess && !remoteSuccess) {
    console.log('\n💡 RECOMMANDATIONS:');
    console.log('1. Vérifiez que le backend local est démarré: npm run dev');
    console.log('2. Vérifiez la connexion MongoDB Atlas (whitelist IP)');
    console.log('3. Le backend hébergé peut être en "sleep mode" sur Render');
  }
}

runAllTests();


