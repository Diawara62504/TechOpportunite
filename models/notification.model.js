const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    expediteur: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    receveur: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    title: {type: String, required: true},
    message: {type: String, required: true},
    contenue: {type: String}, // Garder pour compatibilité
    type: {
        type: String,
        enum: ['candidature', 'statut_candidature', 'nouvelle_offre', 'general', 'recruiter_validation', 'application_status'],
        default: 'general'
    },
    offre: {type: mongoose.Schema.Types.ObjectId, ref: "Offre"}, // Référence à l'offre concernée
    candidat: {type: mongoose.Schema.Types.ObjectId, ref: "User"}, // Référence au candidat concerné
    lu: {type: Boolean, default: false}, // Pour marquer si la notification a été lue
    data: {type: mongoose.Schema.Types.Mixed} // Données supplémentaires
}, {timestamps: true});

module.exports = mongoose.model("Notification", notificationSchema);
