const mongoose = require("mongoose")

const technoSchema = new mongoose.Schema({
    nom: {type: String, unique: true}
})

module.exports = mongoose.model("Technologie", technoSchema)