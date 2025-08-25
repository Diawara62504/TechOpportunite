const user = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { token } = require("morgan");

exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, password, preference, role } = req.body;
    const userExist = await user.findOne({ email });
    if (userExist) {
      return res.status(404).json({ message: "Ulisateur déjà inscrit" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const ajout = await user.create({
      nom,
      prenom,
      email,
      password: hashed,
      preference,
      role,
    });
    res.status(200).json(ajout);
  } catch (error) {
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
      expiresIn: "2s",
    });
    const refreshToken = jwt.sign({ id: isValable._id }, process.env.SECRET_REFRESH_KEY, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: false,
      secure: false,
      sameSite: "none",
      maxAge: 2*60 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: false,
      secure: false,
      sameSite: "none",
      maxAge: 7*24*15 * 60 * 1000,
    });
    res.json("cookie créé avec succès");
  } catch (error) {
    res.status(400).json(error);
  }
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

exports.logout = async (req, res)=>{
    try {
       res.clearCookie("token") 
       res.clearCookie("refreshToken") 
       res.json({message: "Déconnecté"})
    } catch (error) {
        res.status(500).json(error.message)
    }
}