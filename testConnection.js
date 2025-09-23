const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/techopportunites");
    console.log("✅ Connexion à MongoDB réussie");
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB:", error);
    process.exit(1);
  }
};

// Modèle utilisateur simplifié
const userSchema = new mongoose.Schema({
  nom: String,
  prenom: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ['candidat', 'recruteur', 'admin'],
    default: 'candidat'
  },
  validationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'approved'
  }
});

const User = mongoose.model("User", userSchema);

// Fonction pour créer un utilisateur de test
const createTestUser = async () => {
  try {
    console.log("🔄 Création d'un utilisateur de test...");
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: "test@example.com" });
    if (existingUser) {
      console.log("✅ Utilisateur de test existe déjà");
      return existingUser;
    }
    
    // Créer un nouvel utilisateur
    const hashedPassword = await bcrypt.hash("password123", 10);
    const testUser = new User({
      nom: "Test",
      prenom: "User",
      email: "test@example.com",
      password: hashedPassword,
      role: "candidat",
      validationStatus: "approved"
    });
    
    await testUser.save();
    console.log("✅ Utilisateur de test créé avec succès");
    return testUser;
    
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'utilisateur de test:", error);
    throw error;
  }
};

// Fonction pour tester la connexion
const testLogin = async () => {
  try {
    console.log("🔄 Test de connexion...");
    
    const { email, password } = { email: "test@example.com", password: "password123" };
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log("❌ Utilisateur non trouvé");
      return false;
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Mot de passe incorrect");
      return false;
    }
    
    if (user.validationStatus !== 'approved') {
      console.log(`❌ Compte non approuvé. Statut: ${user.validationStatus}`);
      return false;
    }
    
    console.log("✅ Connexion réussie");
    console.log(`   - Nom: ${user.prenom} ${user.nom}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Rôle: ${user.role}`);
    console.log(`   - Statut: ${user.validationStatus}`);
    
    return true;
    
  } catch (error) {
    console.error("❌ Erreur lors du test de connexion:", error);
    return false;
  }
};

// Fonction pour lister tous les utilisateurs
const listUsers = async () => {
  try {
    console.log("📋 Liste des utilisateurs:");
    const users = await User.find({}, 'prenom nom email role validationStatus');
    
    if (users.length === 0) {
      console.log("   Aucun utilisateur trouvé");
    } else {
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.prenom} ${user.nom} (${user.email}) - ${user.role} - ${user.validationStatus}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des utilisateurs:", error);
  }
};

// Exécuter les tests
const runTests = async () => {
  await connectDB();
  await listUsers();
  await createTestUser();
  await testLogin();
  mongoose.connection.close();
  console.log("🔌 Connexion fermée");
};

runTests();
