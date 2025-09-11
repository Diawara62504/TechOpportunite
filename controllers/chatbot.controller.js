const { 
  ChatConversation, 
  ChatMessage, 
  KnowledgeBase, 
  ChatIntent, 
  ChatAnalytics 
} = require('../models/chatbot.model');

class ChatbotService {
  constructor() {
    this.intentClassifier = new IntentClassifier();
    this.entityExtractor = new EntityExtractor();
    this.responseGenerator = new ResponseGenerator();
  }

  // Traitement du langage naturel simplifié
  async analyserMessage(texte, langue = 'fr') {
    const texteNormalise = texte.toLowerCase().trim();
    
    // Détection d'intention basique
    const intentions = await this.detecterIntention(texteNormalise, langue);
    
    // Extraction d'entités
    const entites = await this.extraireEntites(texteNormalise);
    
    return {
      intentions,
      entites,
      texteNormalise
    };
  }

  async detecterIntention(texte, langue) {
    // Mots-clés pour différentes intentions
    const motsCles = {
      salutation: ['bonjour', 'salut', 'hello', 'hi', 'bonsoir', 'hey'],
      recherche_emploi: ['emploi', 'travail', 'job', 'poste', 'opportunité', 'carrière'],
      candidature: ['candidature', 'postuler', 'application', 'cv', 'lettre motivation'],
      profil: ['profil', 'compte', 'informations', 'données personnelles'],
      tests: ['test', 'évaluation', 'quiz', 'examen', 'compétences'],
      certification: ['certification', 'certificat', 'diplôme', 'badge'],
      marketplace: ['marketplace', 'talents', 'freelance', 'mission'],
      entretien: ['entretien', 'interview', 'rendez-vous', 'meeting'],
      aide: ['aide', 'help', 'support', 'assistance', 'problème'],
      au_revoir: ['au revoir', 'bye', 'goodbye', 'à bientôt', 'merci']
    };

    let intentionDetectee = 'generale';
    let confianceMax = 0;

    for (const [intention, mots] of Object.entries(motsCles)) {
      const correspondances = mots.filter(mot => texte.includes(mot)).length;
      const confiance = correspondances / mots.length;
      
      if (confiance > confianceMax) {
        confianceMax = confiance;
        intentionDetectee = intention;
      }
    }

    return {
      nom: intentionDetectee,
      confiance: confianceMax
    };
  }

  async extraireEntites(texte) {
    const entites = [];
    
    // Extraction d'email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = texte.match(emailRegex);
    if (emails) {
      emails.forEach(email => {
        entites.push({ nom: 'email', valeur: email, confiance: 0.9 });
      });
    }

    // Extraction de numéros de téléphone
    const telRegex = /\b(?:\+33|0)[1-9](?:[0-9]{8})\b/g;
    const telephones = texte.match(telRegex);
    if (telephones) {
      telephones.forEach(tel => {
        entites.push({ nom: 'telephone', valeur: tel, confiance: 0.8 });
      });
    }

    return entites;
  }

  async genererReponse(intention, entites, contexte, langue = 'fr') {
    // Rechercher dans la base de connaissances
    const reponseKB = await this.rechercherDansKB(intention.nom, langue);
    
    if (reponseKB) {
      return {
        texte: reponseKB.reponse,
        type: 'texte',
        source: 'knowledge_base'
      };
    }

    // Réponses par défaut selon l'intention
    const reponsesDefaut = {
      fr: {
        salutation: "Bonjour ! Je suis l'assistant virtuel de TechOpportunités. Comment puis-je vous aider aujourd'hui ?",
        recherche_emploi: "Je peux vous aider à trouver des opportunités d'emploi. Quel type de poste recherchez-vous ?",
        candidature: "Pour postuler à une offre, vous devez d'abord créer votre profil. Voulez-vous que je vous guide ?",
        profil: "Je peux vous aider avec votre profil. Que souhaitez-vous modifier ou consulter ?",
        tests: "Nos tests techniques évaluent vos compétences. Dans quel domaine souhaitez-vous passer un test ?",
        certification: "Les certifications TechOpportunités valorisent vos compétences. Quelle certification vous intéresse ?",
        marketplace: "Notre marketplace connecte talents et entreprises. Êtes-vous candidat ou recruteur ?",
        entretien: "Je peux vous aider avec les entretiens vidéo. Avez-vous des questions spécifiques ?",
        aide: "Je suis là pour vous aider ! Pouvez-vous me dire quel est votre problème ?",
        au_revoir: "Au revoir ! N'hésitez pas à revenir si vous avez d'autres questions.",
        generale: "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler votre question ?"
      },
      en: {
        salutation: "Hello! I'm TechOpportunités virtual assistant. How can I help you today?",
        recherche_emploi: "I can help you find job opportunities. What type of position are you looking for?",
        candidature: "To apply for a job, you need to create your profile first. Would you like me to guide you?",
        generale: "I'm not sure I understand. Could you rephrase your question?"
      }
    };

    const reponses = reponsesDefaut[langue] || reponsesDefaut.fr;
    return {
      texte: reponses[intention.nom] || reponses.generale,
      type: 'texte',
      source: 'default'
    };
  }

  async rechercherDansKB(intention, langue) {
    try {
      const resultats = await KnowledgeBase.findOne({
        $or: [
          { categorie: intention },
          { motsClefs: { $in: [intention] } }
        ],
        actif: true
      });

      if (resultats && resultats.langues[langue]) {
        await resultats.incrementerPopularite();
        return {
          reponse: resultats.langues[langue].reponse || resultats.reponse
        };
      }

      return null;
    } catch (error) {
      console.error('Erreur recherche KB:', error);
      return null;
    }
  }
}

// Classes utilitaires simplifiées
class IntentClassifier {
  classify(text) {
    // Implémentation simplifiée
    return { intent: 'general', confidence: 0.5 };
  }
}

class EntityExtractor {
  extract(text) {
    // Implémentation simplifiée
    return [];
  }
}

class ResponseGenerator {
  generate(intent, entities, context) {
    // Implémentation simplifiée
    return "Comment puis-je vous aider ?";
  }
}

class ChatbotController {
  constructor() {
    this.chatbotService = new ChatbotService();
  }

  // Démarrer une nouvelle conversation
  async demarrerConversation(req, res) {
    try {
      const { sessionId, langue = 'fr', contexte } = req.body;
      const utilisateur = req.user ? req.user.id : null;

      const conversation = new ChatConversation({
        utilisateur,
        sessionId,
        langue,
        contexte: {
          ...contexte,
          typeUtilisateur: req.user ? req.user.role : 'visiteur'
        }
      });

      await conversation.save();

      // Message de bienvenue
      const messageBienvenue = new ChatMessage({
        conversation: conversation._id,
        expediteur: 'bot',
        contenu: {
          texte: langue === 'en' 
            ? "Hello! I'm your TechOpportunités assistant. How can I help you today?"
            : "Bonjour ! Je suis votre assistant TechOpportunités. Comment puis-je vous aider ?",
          type: 'texte'
        }
      });

      await messageBienvenue.save();
      await conversation.ajouterMessage(messageBienvenue);

      res.json({
        success: true,
        data: {
          conversationId: conversation._id,
          message: messageBienvenue
        }
      });
    } catch (error) {
      console.error('Erreur démarrage conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du démarrage de la conversation'
      });
    }
  }

  // Envoyer un message
  async envoyerMessage(req, res) {
    try {
      const { conversationId, message } = req.body;
      const startTime = Date.now();

      const conversation = await ChatConversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation non trouvée'
        });
      }

      // Sauvegarder le message utilisateur
      const messageUtilisateur = new ChatMessage({
        conversation: conversationId,
        expediteur: 'utilisateur',
        contenu: {
          texte: message,
          type: 'texte'
        }
      });

      await messageUtilisateur.save();
      await conversation.ajouterMessage(messageUtilisateur);

      // Analyser le message et générer une réponse
      const analyse = await this.chatbotService.analyserMessage(message, conversation.langue);
      const reponse = await this.chatbotService.genererReponse(
        analyse.intentions,
        analyse.entites,
        conversation.contexte,
        conversation.langue
      );

      // Sauvegarder la réponse du bot
      const messageBot = new ChatMessage({
        conversation: conversationId,
        expediteur: 'bot',
        contenu: reponse,
        intentionDetectee: analyse.intentions,
        reponseIA: {
          modele: 'chatbot-v1',
          tempsReponse: Date.now() - startTime,
          tokensUtilises: message.length + reponse.texte.length
        }
      });

      await messageBot.save();
      await conversation.ajouterMessage(messageBot);

      res.json({
        success: true,
        data: {
          messageBot,
          intention: analyse.intentions
        }
      });
    } catch (error) {
      console.error('Erreur envoi message:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi du message'
      });
    }
  }

  // Obtenir l'historique d'une conversation
  async obtenirHistorique(req, res) {
    try {
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const conversation = await ChatConversation.findById(conversationId)
        .populate({
          path: 'messages',
          options: {
            sort: { dateMessage: 1 },
            skip: (page - 1) * limit,
            limit: parseInt(limit)
          }
        });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation non trouvée'
        });
      }

      res.json({
        success: true,
        data: {
          conversation,
          messages: conversation.messages
        }
      });
    } catch (error) {
      console.error('Erreur obtention historique:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'historique'
      });
    }
  }

  // Évaluer la satisfaction
  async evaluerSatisfaction(req, res) {
    try {
      const { conversationId } = req.params;
      const { note, commentaire } = req.body;

      const conversation = await ChatConversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation non trouvée'
        });
      }

      conversation.satisfaction = {
        note,
        commentaire,
        dateEvaluation: new Date()
      };

      if (note >= 4) {
        conversation.metriques.problemeResolu = true;
      }

      await conversation.save();

      res.json({
        success: true,
        message: 'Évaluation enregistrée avec succès'
      });
    } catch (error) {
      console.error('Erreur évaluation satisfaction:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'évaluation'
      });
    }
  }

  // Demander un transfert vers un agent humain
  async demanderTransfertHumain(req, res) {
    try {
      const { conversationId } = req.params;
      const { raison } = req.body;

      const conversation = await ChatConversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation non trouvée'
        });
      }

      conversation.transfertHumain = {
        demande: true,
        raison,
        dateTransfert: new Date()
      };

      conversation.statut = 'transferee';
      await conversation.save();

      // Message automatique de transfert
      const messageTransfert = new ChatMessage({
        conversation: conversationId,
        expediteur: 'bot',
        contenu: {
          texte: conversation.langue === 'en' 
            ? "I'm transferring you to a human agent. Please wait a moment."
            : "Je vous transfère vers un agent humain. Veuillez patienter un moment.",
          type: 'texte'
        }
      });

      await messageTransfert.save();
      await conversation.ajouterMessage(messageTransfert);

      res.json({
        success: true,
        message: 'Transfert vers un agent humain demandé'
      });
    } catch (error) {
      console.error('Erreur transfert humain:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du transfert'
      });
    }
  }

  // Fermer une conversation
  async fermerConversation(req, res) {
    try {
      const { conversationId } = req.params;

      const conversation = await ChatConversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation non trouvée'
        });
      }

      await conversation.fermerConversation();

      res.json({
        success: true,
        message: 'Conversation fermée avec succès'
      });
    } catch (error) {
      console.error('Erreur fermeture conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la fermeture'
      });
    }
  }

  // Obtenir les statistiques du chatbot
  async obtenirStatistiques(req, res) {
    try {
      const { dateDebut, dateFin } = req.query;
      const debut = dateDebut ? new Date(dateDebut) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const fin = dateFin ? new Date(dateFin) : new Date();

      const stats = await ChatConversation.obtenirStatistiques(debut, fin);
      
      const statsDetaillees = await ChatConversation.aggregate([
        {
          $match: {
            createdAt: { $gte: debut, $lte: fin }
          }
        },
        {
          $group: {
            _id: '$langue',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          statistiques: stats[0] || {},
          langues: statsDetaillees,
          periode: { debut, fin }
        }
      });
    } catch (error) {
      console.error('Erreur statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  // Gestion de la base de connaissances
  async ajouterConnaissance(req, res) {
    try {
      const { categorie, question, reponse, motsClefs, langues } = req.body;

      const connaissance = new KnowledgeBase({
        categorie,
        question,
        reponse,
        motsClefs,
        langues
      });

      await connaissance.save();

      res.json({
        success: true,
        data: connaissance,
        message: 'Connaissance ajoutée avec succès'
      });
    } catch (error) {
      console.error('Erreur ajout connaissance:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout de la connaissance'
      });
    }
  }

  // Rechercher dans la base de connaissances
  async rechercherConnaissances(req, res) {
    try {
      const { q, categorie, langue = 'fr' } = req.query;

      let query = { actif: true };
      
      if (categorie) {
        query.categorie = categorie;
      }

      if (q) {
        query.$or = [
          { question: { $regex: q, $options: 'i' } },
          { reponse: { $regex: q, $options: 'i' } },
          { motsClefs: { $in: [new RegExp(q, 'i')] } }
        ];
      }

      const connaissances = await KnowledgeBase.find(query)
        .sort({ popularite: -1 })
        .limit(10);

      res.json({
        success: true,
        data: connaissances
      });
    } catch (error) {
      console.error('Erreur recherche connaissances:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche'
      });
    }
  }
}

module.exports = new ChatbotController();
