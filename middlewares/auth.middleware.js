const jwt = require("jsonwebtoken");

// Middleware d'authentification strict:
// - Exige un access token valide dans les cookies
// - En cas d'absence/expiration: renvoie 401 pour permettre au frontend
//   de déclencher l'appel /api/user/refresh-token via son intercepteur
const tokenValide = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.token;
    if (!accessToken) {
      return res.status(401).json({ message: "Non authentifié: token manquant" });
    }

    const decoded = jwt.verify(accessToken, process.env.SECRET_KEY);
    req.userId = decoded.id;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

module.exports = tokenValide;
