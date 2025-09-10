const Offer = require("../models/offer.model")

exports.getStats = async (req, res)=>{
    try {
        const total = await Offer.countDocuments()
        
        // Statistiques par type
        const parType = await Offer.aggregate([
            {$group: {_id: "$type", count: {$sum: 1}}},
            {$sort: {count: -1}}
        ])
        
        // Statistiques par technologies
        const parTech = await Offer.aggregate([
            {$unwind: "$technologies"}, 
            {$group: {_id: "$technologies", count: {$sum: 1}}},
            {$sort: {count: -1}},
            {$limit: 10} // Top 10 technologies
        ])
        
        // Statistiques par localisation
        const parLocalisation = await Offer.aggregate([
            {$group: {_id: "$localisation", count: {$sum: 1}}},
            {$sort: {count: -1}},
            {$limit: 10} // Top 10 localisations
        ])
        
        // Statistiques par mois (évolution temporelle)
        const parMois = await Offer.aggregate([
            {
                $group: {
                    _id: {
                        year: {$year: "$date"},
                        month: {$month: "$date"}
                    },
                    count: {$sum: 1}
                }
            },
            {$sort: {"_id.year": 1, "_id.month": 1}},
            {$limit: 12} // 12 derniers mois
        ])
        
        res.json({
            total, 
            parType, 
            parTech, 
            parLocalisation,
            parMois
        })
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}