const user = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { token } = require("morgan");
const NotificationService = require("../services/notificationService");

exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, password, preference, role, titre, entreprise, localisation, telephone, linkedin, github, portfolio, about, experience, formation, competences, langues } = req.body;

    const userExist = await user.findOne({ email });
    if (userExist) {
      return res.status(404).json({ message: "Utilisateur déjà inscrit" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Gérer l'upload du CV
    let cvUrl = '';
    if (req.file) {
      cvUrl = `/uploads/${req.file.filename}`;
    }

    // Parser les champs JSON si nécessaire
    let parsedExperience = [];
    let parsedFormation = [];
    let parsedLangues = [];

    try {
      parsedExperience = experience ? JSON.parse(experience) : [];
      parsedFormation = formation ? JSON.parse(formation) : [];
      parsedLangues = langues ? JSON.parse(langues) : [];
    } catch (parseError) {
      console.log('Erreur de parsing des données JSON:', parseError);
    }

    // Calculer les indicateurs de crédibilité
    const credibilityIndicators = {
      emailVerified: false, // À vérifier plus tard
      hasCV: cvUrl ? true : false,
      profileCompleted: titre && entreprise && localisation && about ? true : false,
      hasReferences: false, // À ajouter plus tard
      reportsCount: 0
    };

    // Calculer le score de crédibilité
    const calculateCredibilityScore = (indicators, userData) => {
      let score = 0;

      if (indicators.emailVerified) score += 20;
      if (indicators.hasCV) score += 15;
      if (indicators.profileCompleted) score += 20;
      if (indicators.hasReferences) score += 15;
      if (userData.experience && userData.experience.length > 0) score += 15;
      if (userData.formation && userData.formation.length > 0) score += 10;
      if (userData.competences && userData.competences.length > 0) score += 5;

      return Math.min(Math.max(score, 0), 100);
    };

    const credibilityScore = calculateCredibilityScore(credibilityIndicators, {
      experience: parsedExperience,
      formation: parsedFormation,
      competences
    });

    const ajout = await user.create({
      nom,
      prenom,
      email,
      password: hashed,
      preference: preference ? (Array.isArray(preference) ? preference : [preference]) : [],
      role: role || 'candidat',
      titre: titre || '',
      entreprise: entreprise || '',
      localisation: localisation || '',
      telephone: telephone || '',
      linkedin: linkedin || '',
      github: github || '',
      portfolio: portfolio || '',
      cvUrl,
      about: about || '',
      experience: parsedExperience,
      formation: parsedFormation,
      competences: competences ? (Array.isArray(competences) ? competences : [competences]) : [],
      langues: parsedLangues,
      validationStatus: role === 'admin' ? 'validated' : 'pending',
      credibilityScore,
      credibilityIndicators
    });

   

    // Retirer le mot de passe avant de renvoyer la réponse
    const userResponse = ajout.toObject();
    delete userResponse.password;

    // Si c'est un recruteur, notifier les admins
    if (role === 'recruteur') {
      try {
        await NotificationService.notifyAdminsNewRecruiter(ajout._id);
      } catch (notificationError) {
        console.error('Erreur lors de la notification aux admins:', notificationError);
        // Ne pas faire échouer l'inscription si la notification échoue
      }
    }

    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: "Erreur de serveur" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const isValable = await user.findOne({ email });
    if (!isValable) {
      return res.status(404).json({ message: "Informations incorrectes !" });
    }
    const isMatch = await bcrypt.compare(password, isValable.password);
    if (!isMatch) {
      return res.status(404).json({ message: "Information incorrectes !" });
    }

    // // Vérifier le statut de validation
    // if (isValable.validationStatus === 'pending') {
    //   return res.status(403).json({ message: "Votre compte est en attente de validation par un administrateur." });
    // }
    // if (isValable.validationStatus === 'rejected') {
    //   return res.status(403).json({ message: "Votre compte a été rejeté. Contactez l'administration." });
    // }
    // if (isValable.validationStatus === 'suspended') {
    //   return res.status(403).json({ message: "Votre compte est suspendu. Contactez l'administration." });
    // }
    // Vérifier que les secrets JWT sont définis
    const jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret-change-in-production';
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret-change-in-production';

    // Générer le token avec une expiration plus longue
    const token = jwt.sign(
      { id: isValable._id, role: isValable.role },
      jwtSecret,
      { expiresIn: "24h" }
    );

    // Générer le refresh token
    const refreshToken = jwt.sign(
      { id: isValable._id },
      refreshSecret,
      { expiresIn: "7d" }
    );

    // Sauvegarder les tokens dans des cookies sécurisés
    res.cookie('token', token, {
      httpOnly: false, // Changé pour permettre l'accès depuis le frontend
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Changé pour les domaines croisés
      maxAge: 24 * 60 * 60 * 1000 // 24 heures
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: false, // Changé pour permettre l'accès depuis le frontend
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Changé pour les domaines croisés
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    // On retire le mot de passe avant de renvoyer l'utilisateur
    const userToReturn = isValable.toObject();
    delete userToReturn.password;

    res.json({ message: "Connexion réussie", user: userToReturn });
  } catch (error) {
    res.status(400).json(error);
  }
};

exports.refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token manquant" });
  }

  const jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret-change-in-production';
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret-change-in-production';

  jwt.verify(refreshToken, refreshSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Refresh token invalide" });
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      jwtSecret,
      { expiresIn: "24h" }
    );

    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
    });

    res.json({ message: "Token rafraîchi avec succès" });
  });
};

exports.getUser = async (req, res) => {
  try {
    const { limit = 3, page = 1, search = "" } = req.query;
    const skip = (page - 1) * limit;
    const filter = {
      $or: [
        { nom: { $regex: search, $options: "i" } },
        { prenom: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };
    const total = await user.countDocuments(filter);
    const pageTotale = Math.floor(total / limit);

    const affiche = await user.find(filter).skip(skip).limit(limit);
    res.json({
      page: page,
      limit: limit,
      total: total,
      pageTotale: pageTotale,
      affiche,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur de server" });
  }
};

exports.logout = async (req, res) => {
    try {
        // Effacer les cookies en spécifiant les mêmes options que lors de leur création
        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        };
        res.clearCookie("token", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);
        res.status(200).json({ message: "Déconnexion réussie" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userProfile = await user.findById(req.userId).select("-password");
    if (!userProfile) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const updateData = req.body;
    
    // Supprimer les champs sensibles qui ne doivent pas être modifiés
    delete updateData.password;
    delete updateData.email;
    delete updateData._id;
    

    if (req.files) {
      if (req.files.cv) {
        updateData.cvUrl = `/uploads/${req.files.cv[0].filename}`;
      }
      if (req.files.logo) {
        updateData.logoUrl = `/uploads/${req.files.logo[0].filename}`;
      }
    }
    
    const updatedUser = await user.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true, runValidators: true }
    ).select("-password");
    
    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    res.json({ message: "Profil mis à jour avec succès", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du profil" });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.userId;
    const Offer = require("../models/offer.model");
    
    // Statistiques pour les recruteurs
    const offresPubliees = await Offer.countDocuments({ source: userId });
    const candidaturesRecues = await Offer.aggregate([
      { $match: { source: userId } },
      { $project: { candidaturesCount: { $size: "$candidatures" } } },
      { $group: { _id: null, total: { $sum: "$candidaturesCount" } } }
    ]);
    
    // Statistiques pour les candidats
    const candidaturesEnvoyees = await Offer.countDocuments({
      "candidatures.candidat": userId
    });
    
    res.json({
      offresPubliees,
      candidaturesRecues: candidaturesRecues[0]?.total || 0,
      candidaturesEnvoyees
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
  }
};

// Récupérer le profil public d'un candidat (accès recruteur/admin)
exports.getCandidatePublicProfile = async (req, res) => {
  try {
    const User = require("../models/user.model");
    const UserCertification = require("../models/userCertification.model");
    const TestResult = require("../models/testResult.model");

    const requester = await User.findById(req.userId).select('role');
    if (!requester || (requester.role !== 'recruteur' && requester.role !== 'admin')) {
      return res.status(403).json({ message: 'Accès réservé aux recruteurs' });
    }

    const { id } = req.params;
    const candidate = await User.findById(id).select('-password');
    if (!candidate) return res.status(404).json({ message: 'Candidat non trouvé' });

    const certifications = await UserCertification.find({ utilisateur: id })
      .populate('certification', 'nom niveau')
      .lean();

    const tests = await TestResult.find({ candidat: id, statut: 'termine' })
      .populate('test', 'titre technologie niveau')
      .sort({ dateFin: -1 })
      .limit(10)
      .lean();

    res.json({
      candidate,
      certifications: (certifications || []).map(c => ({
        nom: c.certification?.nom,
        niveau: c.certification?.niveau,
        scoreObtenu: c.scoreObtenu,
        certificatUrl: c.certificatUrl,
        dateObtention: c.dateObtention
      })),
      tests: (tests || []).map(t => ({
        testTitre: t.testTitre || (t.test && t.test.titre) || undefined,
        technologie: t.technologie || (t.test && t.test.technologie) || undefined,
        niveau: t.niveau || (t.test && t.test.niveau) || undefined,
        scoreTotal: t.scoreTotal,
        pourcentageReussite: t.pourcentageReussite,
        dateFin: t.dateFin
      }))
    });
  } catch (error) {
    console.error('Erreur getCandidatePublicProfile:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer le profil de l'utilisateur connecté
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error('Erreur getUserProfile:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
