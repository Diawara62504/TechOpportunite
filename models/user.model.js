const mongoose = require("mongoose");
// const { isEmail } = require("validator");

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true},
  prenom: { type: String, required: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  preference: [{type: String, required: true }]
});

module.exports = mongoose.model("Inscrits", userSchema);
