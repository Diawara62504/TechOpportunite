const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  expediteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  contenu: {
    type: String,
    required: true
  },
  offre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offre"
  },
  lu: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['message', 'systeme'],
    default: 'message'
  }
}, { timestamps: true });

// Index pour optimiser les requêtes de conversation
messageSchema.index({ expediteur: 1, destinataire: 1, offre: 1 });
messageSchema.index({ destinataire: 1, lu: 1 });

module.exports = mongoose.model("Message", messageSchema);
