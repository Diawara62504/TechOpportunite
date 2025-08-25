const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, "le titre est requis"],
  },
  description: {
    type: String,
  },
  type: { type: String },
  date: { type: Date },
  localisation: { type: String },
  source: { type: mongoose.Schema.Types.ObjectId,
    ref: "Inscrits" },
  technologies: { type: String, required: true },
  persAyantPost: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inscrits",
    },
  ],
});

module.exports = mongoose.model("Offre", offerSchema);
