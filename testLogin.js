const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

// Modèle utilisateur
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

// Test de connexion
const testLogin = async () => {
  try {
    console.log("🧪 Test de connexion...");
    
    // Créer un utilisateur de test s'il n'existe pas
    let testUser = await User.findOne({ email: "test@example.com" });
    if (!testUser) {
      console.log("📝 Création d'un utilisateur de test...");
      const hashedPassword = await bcrypt.hash("password123", 10);
      testUser = new User({
        nom: "Test",
        prenom: "User",
        email: "test@example.com",
        password: hashedPassword,
        role: "candidat",
        validationStatus: "approved"
      });
      await testUser.save();
      console.log("✅ Utilisateur de test créé");
    }
    
    // Tester la connexion
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
    
    // Tester la génération de token
    const jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret-change-in-production';
    const token = jwt.sign(
      { id: user._id, role: user.role },
      jwtSecret,
      { expiresIn: "24h" }
    );
    
    console.log("✅ Connexion réussie");
    console.log(`   - Nom: ${user.prenom} ${user.nom}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Rôle: ${user.role}`);
    console.log(`   - Statut: ${user.validationStatus}`);
    console.log(`   - Token généré: ${token.substring(0, 20)}...`);
    
    return true;
    
  } catch (error) {
    console.error("❌ Erreur lors du test de connexion:", error);
    return false;
  }
};

// Exécuter le test
const run = async () => {
  await connectDB();
  await testLogin();
  mongoose.connection.close();
  console.log("🔌 Connexion fermée");
};

run();
