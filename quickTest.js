// Test rapide pour vérifier la connexion
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/techopportunites");
    console.log("✅ Connexion à MongoDB réussie");
    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB:", error);
    return false;
  }
};

const testServer = async () => {
  try {
    const response = await fetch('https://techopportunite.onrender.com/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    console.log('Status:', response.status);
    const data = await response.text();
    console.log('Response:', data);
    
  } catch (error) {
    console.error('Erreur de test:', error);
  }
};

const run = async () => {
  console.log("🧪 Test rapide de l'API...");
  await testServer();
  process.exit(0);
};

run();
