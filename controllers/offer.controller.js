const Offer = require("../models/offer.model")
const User = require("../models/user.model")

exports.createOffer = async (req, res) => {
    try {
        // Vérifier l'authentification
        if (!req.userId) {
            return res.status(401).json({ message: "Utilisateur non authentifié" });
        }

        // Assigner la source (recruteur) à l'utilisateur connecté
        const offerData = { ...req.body, source: req.userId, date: new Date() };
        const offer = await Offer.create(offerData);

        // Créer une notification pour le recruteur
        const Notification = require("../models/notification.model");

        const recruteur = await User.findById(req.userId);

        await Notification.create({
            expediteur: req.userId,
            receveur: req.userId, // Le recruteur reçoit sa propre notification
            contenue: `Vous avez publié une nouvelle offre: "${offer.titre}"`
        });

        res.status(201).json(offer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

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
        const pageTotale = Math.ceil(total/limit)
        const getoffer = await Offer.find(filter)
            .sort({ date: -1 }) // Trier par date décroissante (plus récentes en premier)
            .skip(skip)
            .limit(limit)
            .populate("source" , "nom prenom email")
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
            "source" , "nom prenom email titre entreprise localisation linkedin")
        res.status(200).json(afficher)
    } catch (error) {
       res.status(500).json(error.message)
    }
}

exports.getMyOffers = async (req, res) => {
    try {
        const afficher = await Offer.find({source: req.userId}).populate(
            "source", "nom prenom email titre entreprise localisation linkedin")
            .sort({ date: -1 }); // Trier par date décroissante
        res.status(200).json(afficher)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

exports.getOfferById = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id)
            .populate("source", "nom prenom email titre entreprise localisation linkedin")
            .populate("candidatures.candidat", "nom prenom email");

        if (!offer) {
            return res.status(404).json({ message: "Offre non trouvée" });
        }

        res.status(200).json(offer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.applyToOffer = async (req, res) => {
    try {
        const offerId = req.params.id;
        const candidatId = req.userId; // ID de l'utilisateur connecté (défini par le middleware auth)

        if (!candidatId) {
            return res.status(401).json({ message: "Utilisateur non authentifié" });
        }

        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ message: "Offre non trouvée" });
        }

        // Vérifier si l'utilisateur a déjà postulé
        const existingApplication = offer.candidatures.find(
            candidature => candidature.candidat.toString() === candidatId
        );

        if (existingApplication) {
            return res.status(400).json({ message: "Vous avez déjà postulé pour cette offre" });
        }

        // Récupérer les informations complètes du candidat
        const candidat = await User.findById(candidatId).select('-password');

        if (!candidat) {
            return res.status(404).json({ message: "Candidat non trouvé" });
        }

        // Créer l'objet candidature avec les données du profil
        const candidatureData = {
            candidat: candidatId,
            dateCandidature: new Date(),
            statut: 'en_attente',
            // Inclure les informations du profil du candidat
            profilCandidat: {
                nom: candidat.nom,
                prenom: candidat.prenom,
                email: candidat.email,
                titre: candidat.titre,
                localisation: candidat.localisation,
                telephone: candidat.telephone,
                linkedin: candidat.linkedin,
                github: candidat.github,
                portfolio: candidat.portfolio,
                cvUrl: candidat.cvUrl,
                about: candidat.about,
                competences: candidat.competences,
                experience: candidat.experience,
                formation: candidat.formation,
                langues: candidat.langues
            }
        };

        // Ajouter la candidature
        offer.candidatures.push(candidatureData);
        await offer.save();

        // Créer une notification pour le recruteur
        const Notification = require("../models/notification.model");

        console.log('Création de notification:');
        console.log('Candidat ID:', candidatId);
        console.log('Recruteur ID (offer.source):', offer.source);
        console.log('Offre ID:', offer._id);

        const notificationMessage = `${candidat.nom} ${candidat.prenom} a postulé pour votre offre "${offer.titre}"`;
        const notificationDetails = candidat.cvUrl ?
            `${notificationMessage}\nCV disponible: ${candidat.cvUrl}` :
            notificationMessage;

        const notification = await Notification.create({
            expediteur: candidatId, // Le candidat qui postule
            receveur: offer.source, // Le recruteur qui a créé l'offre
            contenue: notificationDetails,
            type: 'candidature',
            offre: offer._id,
            candidat: candidatId,
            lu: false
        });

        console.log('Notification créée:', notification._id);

        res.status(201).json({
            message: "Candidature envoyée avec succès",
            candidature: offer.candidatures[offer.candidatures.length - 1]
        });

    } catch (error) {
        console.error('Erreur dans applyToOffer:', error);
        res.status(500).json({ message: error.message });
    }
}

exports.updateApplicationStatus = async (req, res) => {
    try {
        const { candidatureId } = req.params;
        const { statut } = req.body;
        const userId = req.userId;

        if (!['acceptee', 'refusee', 'en_attente'].includes(statut)) {
            return res.status(400).json({ message: "Statut invalide" });
        }

        // Trouver l'offre qui contient cette candidature
        const offer = await Offer.findOne({ "candidatures._id": candidatureId });

        if (!offer) {
            return res.status(404).json({ message: "Candidature non trouvée" });
        }

        // Vérifier que l'utilisateur est le propriétaire de l'offre
        if (offer.source.toString() !== userId) {
            return res.status(403).json({ message: "Accès non autorisé" });
        }

        // Mettre à jour le statut de la candidature
        const candidature = offer.candidatures.id(candidatureId);
        if (!candidature) {
            return res.status(404).json({ message: "Candidature non trouvée" });
        }

        candidature.statut = statut;
        await offer.save();

        // Créer une notification pour le candidat
        const Notification = require("../models/notification.model");

        await Notification.create({
            expediteur: userId,
            receveur: candidature.candidat,
            contenue: `Votre candidature pour "${offer.titre}" a été ${statut === 'acceptee' ? 'acceptée' : 'refusée'}.`,
            type: 'validation',
            offre: offer._id,
            candidat: candidature.candidat,
            lu: false
        });

        res.status(200).json({
            message: `Candidature ${statut === 'acceptee' ? 'acceptée' : 'refusée'} avec succès`,
            candidature: candidature
        });

    } catch (error) {
        console.error('Erreur dans updateApplicationStatus:', error);
        res.status(500).json({ message: error.message });
    }
}
