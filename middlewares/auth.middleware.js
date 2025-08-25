const jwt = require("jsonwebtoken");

const tokenValide = async (req, res, next) => {
  const authHeader = req.cookies.token;
  const authHeaderRefresh = req.cookies.refreshToken;
  if (!authHeader) {
    return res.json({ message: "Token manquant !" });
  }
  try {
    const token = jwt.verify(authHeader, process.env.SECRET_KEY);
    req.userId = token.id;
    next();
  } catch (error) {
    const refreshToken = jwt.verify(
      authHeaderRefresh,
      process.env.SECRET_REFRESH_KEY
    );
    if (!refreshToken) {
      return res.status(400).json({ message: "Token invalide ou expiré !" });
    }

    const token = jwt.sign({ id: refreshToken.id }, process.env.SECRET_KEY, {
      expiresIn: "2h",
    });
    res.cookie("token", token, {
        //c'est pour obliger l'utilisateur d'utiliser https(true) et non http (qui n'est pas securiser)
      httpOnly: false,
      secure: false,
      sameSite: "none",
      maxAge: 2 * 60 * 60 * 1000,
    });
    req.userId = refreshToken.id;
    next();
  }
};

module.exports = tokenValide;
