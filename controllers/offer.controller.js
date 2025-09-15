const Offer = require("../models/offer.model")
const User = require("../models/user.model")
const { getSocket } = require("../utils/socket");
const UserCertification = require("../models/userCertification.model");
const TestResult = require("../models/testResult.model");
const { GamificationService } = require("./gamification.controller");
const { AnalyticsService } = require("./analytics.controller");

exports.createOffer = async (req, res) => {
    try {
        // Vérifier l'authentification
        if (!req.userId) {
            return res.status(401).json({ message: "Utilisateur non authentifié" });
        }

        // Vérifier le rôle (seuls les recruteurs peuvent publier)
        const currentUser = await User.findById(req.userId).select('role');
        if (!currentUser || currentUser.role !== 'recruteur') {
            return res.status(403).json({ message: "Seuls les recruteurs peuvent publier des offres" });
        }

        // Assigner la source (recruteur) à l'utilisateur connecté
        const offerData = { ...req.body, source: req.userId, date: new Date() };
        const offer = await Offer.create(offerData);

        // Créer une notification de nouvelle offre pour les candidats (optionnel)
        const Notification = require("../models/notification.model");

        // Notifier le recruteur qu'il a publié (utile côté UI recruteur)
        await Notification.create({
            expediteur: req.userId,
            receveur: req.userId,
            contenue: `Vous avez publié une nouvelle offre: "${offer.titre}"`,
            type: 'nouvelle_offre',
            offre: offer._id,
            lu: false
        });

        // NB: la diffusion aux candidats peut être faite côté frontend (liste d'offres)
        // ou via un système de subscription. On garde la notification recruteur ici.

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

        // Interdire au recruteur de postuler à sa propre offre
        if (offer.source && offer.source.toString() === candidatId) {
            return res.status(400).json({ message: "Vous ne pouvez pas postuler à votre propre offre" });
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

        // Upload inline: si CV/portfolio envoyés, les persister côté user si manquants
        // req.files?.cv/portfolio définis par upload.fields
        if (req.files) {
            if (!candidat.cvUrl && req.files.cv?.[0]) {
                candidat.cvUrl = `/uploads/${req.files.cv[0].filename}`;
            }
            if ((!candidat.portfolio || candidat.portfolio === '') && req.files.portfolio?.[0]) {
                // Pour portfolio, accepter PDF/Doc également (même stockage), ou un lien URL fourni dans body
                candidat.portfolio = `/uploads/${req.files.portfolio[0].filename}`;
            }
            await candidat.save();
        }
        // Si un lien de portfolio est fourni dans le body (string), le sauvegarder si manquant
        if ((!candidat.portfolio || candidat.portfolio === '') && req.body.portfolioLink) {
            candidat.portfolio = req.body.portfolioLink;
            await candidat.save();
        }

        // Récupérer certifications et derniers résultats de tests pour enrichir le snapshot
        const certifications = await UserCertification.find({ utilisateur: candidatId })
          .populate('certification', 'nom niveau')
          .lean();
        const tests = await TestResult.find({ candidat: candidatId, statut: 'termine' })
          .populate('test', 'titre technologie niveau')
          .sort({ dateFin: -1 })
          .limit(5)
          .lean();

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
                langues: candidat.langues,
                certifications: (certifications || []).map(c => ({
                  nom: c.certification?.nom,
                  niveau: c.certification?.niveau,
                  scoreObtenu: c.scoreObtenu,
                  certificatUrl: c.certificatUrl,
                  dateObtention: c.dateObtention
                })),
                tests: (tests || []).map(t => ({
                  testTitre: t.testTitre || (t.test && t.test.titre) || undefined,
                  technologie: t.technologie || undefined,
                  niveau: t.niveau || undefined,
                  scoreTotal: t.scoreTotal,
                  pourcentageReussite: t.pourcentageReussite,
                  dateFin: t.dateFin
                }))
            }
        };

        // Ajouter la candidature
        offer.candidatures.push(candidatureData);
        await offer.save();

        // Créer une notification pour le recruteur
        const Notification = require("../models/notification.model");

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

        // Emit temps réel au recruteur
        const io = getSocket();
        if (io && offer.source) {
          io.to(`user:${offer.source.toString()}`).emit('notification:new', {
            _id: notification._id,
            contenue: notification.contenue,
            type: notification.type,
            offre: notification.offre,
            candidat: notification.candidat,
            lu: notification.lu,
            createdAt: notification.createdAt
          });
        }

        // Gamification: incrémenter statistiques + points
        try {
          await GamificationService.updateUserStats(candidatId, 'application_sent', 1);
        } catch (e) { /* no-op */ }

        // Analytics: tracker l'événement job_apply
        try {
          await AnalyticsService.trackEvent(
            { user: { _id: candidatId }, headers: req.headers, ip: req.ip, connection: req.connection },
            'job_apply',
            { offreId: offer._id, titre: offer.titre }
          );
        } catch (e) { /* no-op */ }

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

        if (!['accepte', 'refuse', 'en_attente'].includes(statut)) {
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

        // Normaliser les statuts côté backend (acceptee/refusee -> accepte/refuse)
        const normalized = statut === 'acceptee' ? 'accepte' : (statut === 'refusee' ? 'refuse' : 'en_attente');
        candidature.statut = normalized;
        await offer.save();

        // Créer une notification pour le candidat
        const Notification = require("../models/notification.model");

        const notif = await Notification.create({
            expediteur: userId,
            receveur: candidature.candidat,
            contenue: `Votre candidature pour "${offer.titre}" a été ${normalized === 'accepte' ? 'acceptée' : normalized === 'refuse' ? 'refusée' : 'mise à jour'}.`,
            type: 'statut_candidature',
            offre: offer._id,
            candidat: candidature.candidat,
            lu: false
        });

        // Emit temps réel au candidat
        const io = getSocket();
        if (io && candidature.candidat) {
          io.to(`user:${candidature.candidat.toString()}`).emit('notification:new', {
            _id: notif._id,
            contenue: notif.contenue,
            type: notif.type,
            offre: notif.offre,
            candidat: notif.candidat,
            lu: notif.lu,
            createdAt: notif.createdAt
          });
        }

        res.status(200).json({
            message: `Candidature ${normalized === 'accepte' ? 'acceptée' : normalized === 'refuse' ? 'refusée' : 'mise à jour'} avec succès`,
            candidature: candidature
        });

    } catch (error) {
        console.error('Erreur dans updateApplicationStatus:', error);
        res.status(500).json({ message: error.message });
    }
}
