const mongoose = require("mongoose")

module.exports = mongoose.model("Notifications", mongoose.Schema({
    expediteur : {type: mongoose.Schema.Types.ObjectId, ref: "Inscrits"},
    receveur : {type: mongoose.Schema.Types.ObjectId, ref: "Inscrits"},
    contenue : {type: String},
    type: {
        type: String,
        enum: ['candidature', 'statut_candidature', 'nouvelle_offre', 'general'],
        default: 'general'
    },
    offre: {type: mongoose.Schema.Types.ObjectId, ref: "Offre"}, // Référence à l'offre concernée
    candidat: {type: mongoose.Schema.Types.ObjectId, ref: "Inscrits"}, // Référence au candidat concerné
    lu: {type: Boolean, default: false} // Pour marquer si la notification a été lue
},{timestamps:true}))
