const user = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { token } = require("morgan");

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
      langues: parsedLangues
    });

    // Retirer le mot de passe avant de renvoyer la réponse
    const userResponse = ajout.toObject();
    delete userResponse.password;

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
    if (isValable.confirmationToken == "") {
      return res.json({ message: "Compte invalide non confirmé !" });
    }
    const token = jwt.sign({ id: isValable._id }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign({ id: isValable._id }, process.env.SECRET_REFRESH_KEY, {
      expiresIn: "7d",
    });
    // Cookies compatibles dev (http) et prod (https)
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000,
    };
    res.cookie("token", token, cookieOptions);
    res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

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

  jwt.verify(refreshToken, process.env.SECRET_REFRESH_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Refresh token invalide" });
    }

    const newAccessToken = jwt.sign({ id: decoded.id }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000, // 1 heure
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