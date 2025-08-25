const Offer = require("../models/offer.model")

exports.getStats = async (req, res)=>{
    try {
        const total = await Offer.countDocuments()
        const parType = await Offer.aggregate([{$group: {_id: "$type", count: {$sum: 1}}}])
        const parTech = await Offer.aggregate([{$unwind: "$technologies"}, {$group: {_id: "$technologies", count:{$sum:1}}}])
        res.json({total, parType, parTech})
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}