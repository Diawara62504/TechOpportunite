const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// Middleware d'authentification strict et compatible:
// - Récupère le token depuis le cookie ou l'en-tête Authorization
// - Vérifie et enrichit req.user avec { id, _id, role }
// - Expose également verifyToken pour compatibilité (authMiddleware.verifyToken)
async function tokenValide(req, res, next) {
  try {
    const bearer = req.headers?.authorization || '';
    const headerToken = bearer.startsWith('Bearer ') ? bearer.split(' ')[1] : null;
    const accessToken = req.cookies?.token || headerToken;

    if (!accessToken) {
      return res.status(401).json({ message: "Non authentifié: token manquant" });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    // Récupérer le rôle utilisateur si possible
    let role = 'candidat';
    try {
      const dbUser = await User.findById(decoded.id).select('role');
      if (dbUser && dbUser.role) role = dbUser.role;
    } catch (e) {
      // En cas d'erreur DB, on conserve le rôle par défaut
    }

    req.userId = decoded.id;
    req.user = { id: decoded.id, _id: decoded.id, role };

    return next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

// Compatibilité: certaines routes attendent authMiddleware.verifyToken
// On assigne la même fonction sous cet alias
tokenValide.verifyToken = tokenValide;

module.exports = tokenValide;
