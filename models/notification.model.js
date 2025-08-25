const mongoose = require("mongoose")

module.exports = mongoose.model("Notifications", mongoose.Schema({
    expediteur : {type: mongoose.Schema.Types.ObjectId, ref: "Inscrits"},
    receveur : {type: mongoose.Schema.Types.ObjectId, ref: "Inscrits"},
    contenue : {type: String}
},{timestamps:true}))