const Offer = require("../models/offer.model")

exports.createOffer = async (req, res)=>{
    try {
        const offer = await Offer.create(req.body)
        res.status(201).json(offer)
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

exports.getAllOffer = async (req, res)=>{
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 5
        const skip = (page - 1)*limit

        
        const search = req.query.search||''
        const filter = {$or:[
            {type: {$regex: search, $options: "i"}},
            {technologies: {$regex: search, $options: "i"}},
            {localisation: {$regex: search, $options: "i"}}
        ]}
        
        const total = await Offer.countDocuments(filter)
        const pageTotale = Math.floor(total/limit)
        const getoffer = await Offer.find(filter).skip(skip).limit(limit).populate(
            "source" , "nom prenom email")
        res.json({
            page: page, limit: limit, pageTotale: pageTotale, total: total, getoffer: getoffer
        }) 
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

exports.updateOffer = async (req, res)=>{
    try {
        const modif = await Offer.findByIdAndUpdate(req.params.id,req.body, {new: true})
        res.status(202).json(modif)
    } catch (error) {
        res.status(500).json(error.message)
    }
}

exports.deleteOffer = async (req, res)=>{
    try {
        const sup = await Offer.findByIdAndDelete(req.params.id)
        res.status(202).json(sup)
    } catch (error) {
        res.status(500).json(error.message)
    }
}

exports.filter= async (req, res)=>{
    try {
        const afficher=await Offer.find({source:req.params.id}).populate(
            "source" , "nom prenom email")
        res.status(200).json(afficher)
    } catch (error) {
       res.status(500).json(error.message)
    }
}