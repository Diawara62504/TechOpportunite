const { 
  AnalyticsEvent, 
  DailyMetrics, 
  AIInsights, 
  ConversionFunnel, 
  AnalyticsAlert 
} = require('../models/analytics.model');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

// Service d'analytics en temps réel
class AnalyticsService {
  
  // Enregistrer un événement d'analytics
  static async trackEvent(req, eventType, eventData = {}) {
    try {
      const sessionId = req.session?.id || req.headers['x-session-id'] || 'anonymous';
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.connection.remoteAddress;
      
      // Parsing des informations du navigateur
      const parser = new UAParser(userAgent);
      const browserInfo = parser.getResult();
      
      // Géolocalisation IP
      const geo = geoip.lookup(ipAddress);
      
      const analyticsEvent = new AnalyticsEvent({
        utilisateur: req.user?._id || null,
        sessionId,
        eventType,
        eventData,
        metadata: {
          userAgent,
          ipAddress,
          country: geo?.country || 'Unknown',
          city: geo?.city || 'Unknown',
          device: browserInfo.device.type || 'desktop',
          browser: `${browserInfo.browser.name} ${browserInfo.browser.version}`,
          os: `${browserInfo.os.name} ${browserInfo.os.version}`,
          referrer: req.headers.referer,
          language: req.headers['accept-language']?.split(',')[0] || 'fr',
          timezone: req.headers['x-timezone'] || 'UTC'
        }
      });
      
      await analyticsEvent.save();
      
      // Déclencher l'analyse en temps réel
      this.triggerRealTimeAnalysis(eventType, eventData);
      
      return analyticsEvent;
    } catch (error) {
      console.error('Erreur lors du tracking:', error);
    }
  }
  
  // Analyse en temps réel pour détecter les anomalies
  static async triggerRealTimeAnalysis(eventType, eventData) {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Compter les événements de la dernière heure
      const recentEvents = await AnalyticsEvent.countDocuments({
        eventType,
        timestamp: { $gte: oneHourAgo }
      });
      
      // Comparer avec la moyenne historique
      const historicalAverage = await this.getHistoricalAverage(eventType);
      
      // Détecter les pics de trafic
      if (recentEvents > historicalAverage * 2) {
        await this.createAlert('traffic_spike', {
          eventType,
          currentCount: recentEvents,
          historicalAverage,
          severity: recentEvents > historicalAverage * 5 ? 'critical' : 'warning'
        });
      }
      
      // Détecter les chutes de trafic
      if (recentEvents < historicalAverage * 0.5 && historicalAverage > 10) {
        await this.createAlert('traffic_drop', {
          eventType,
          currentCount: recentEvents,
          historicalAverage,
          severity: 'warning'
        });
      }
      
    } catch (error) {
      console.error('Erreur analyse temps réel:', error);
    }
  }
  
  // Calculer la moyenne historique
  static async getHistoricalAverage(eventType) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const pipeline = [
        {
          $match: {
            eventType,
            timestamp: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d-%H", date: "$timestamp" }
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: null,
            average: { $avg: "$count" }
          }
        }
      ];
      
      const result = await AnalyticsEvent.aggregate(pipeline);
      return result[0]?.average || 0;
    } catch (error) {
      console.error('Erreur calcul moyenne:', error);
      return 0;
    }
  }
  
  // Créer une alerte
  static async createAlert(type, data) {
    try {
      const alert = new AnalyticsAlert({
        type,
        title: this.getAlertTitle(type),
        message: this.getAlertMessage(type, data),
        severity: data.severity || 'info',
        data
      });
      
      await alert.save();
      
      // Envoyer notification en temps réel (WebSocket)
      // io.emit('analytics_alert', alert);
      
      return alert;
    } catch (error) {
      console.error('Erreur création alerte:', error);
    }
  }
  
  // Générer les titres d'alertes
  static getAlertTitle(type) {
    const titles = {
      'traffic_spike': '🚀 Pic de trafic détecté',
      'traffic_drop': '📉 Chute de trafic détectée',
      'conversion_drop': '⚠️ Baisse des conversions',
      'error_spike': '🔥 Augmentation des erreurs',
      'new_market_opportunity': '🌍 Nouvelle opportunité de marché',
      'competitor_activity': '👀 Activité concurrentielle',
      'user_churn_risk': '🚨 Risque de désabonnement'
    };
    return titles[type] || 'Alerte Analytics';
  }
  
  // Générer les messages d'alertes
  static getAlertMessage(type, data) {
    switch (type) {
      case 'traffic_spike':
        return `Le trafic pour ${data.eventType} a augmenté de ${Math.round((data.currentCount / data.historicalAverage - 1) * 100)}% par rapport à la moyenne.`;
      case 'traffic_drop':
        return `Le trafic pour ${data.eventType} a chuté de ${Math.round((1 - data.currentCount / data.historicalAverage) * 100)}% par rapport à la moyenne.`;
      default:
        return 'Anomalie détectée dans les données analytics.';
    }
  }
}

// Contrôleurs API
const analyticsController = {
  
  // Endpoint pour tracker un événement
  trackEvent: async (req, res) => {
    try {
      const { eventType, eventData } = req.body;
      
      if (!eventType) {
        return res.status(400).json({ error: 'eventType requis' });
      }
      
      const event = await AnalyticsService.trackEvent(req, eventType, eventData);
      
      res.status(201).json({
        success: true,
        eventId: event._id
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Dashboard principal avec métriques clés
  getDashboard: async (req, res) => {
    try {
      const { period = '7d' } = req.query;
      const endDate = new Date();
      const startDate = new Date();
      
      // Calculer la période
      switch (period) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }
      
      // Métriques générales
      const totalEvents = await AnalyticsEvent.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate }
      });
      
      const uniqueUsers = await AnalyticsEvent.distinct('utilisateur', {
        timestamp: { $gte: startDate, $lte: endDate },
        utilisateur: { $ne: null }
      });
      
      const uniqueSessions = await AnalyticsEvent.distinct('sessionId', {
        timestamp: { $gte: startDate, $lte: endDate }
      });
      
      // Métriques par type d'événement
      const eventsByType = await AnalyticsEvent.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      // Évolution temporelle
      const timeSeriesData = await AnalyticsEvent.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { 
                format: period === '24h' ? "%Y-%m-%d-%H" : "%Y-%m-%d", 
                date: "$timestamp" 
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
      
      // Top pays
      const topCountries = await AnalyticsEvent.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$metadata.country',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ]);
      
      // Insights IA récents
      const aiInsights = await AIInsights.find({
        createdAt: { $gte: startDate },
        validUntil: { $gte: new Date() }
      })
      .sort({ priority: -1, confidence: -1 })
      .limit(5);
      
      // Alertes non acquittées
      const activeAlerts = await AnalyticsAlert.find({
        acknowledged: false,
        createdAt: { $gte: startDate }
      })
      .sort({ severity: -1, createdAt: -1 })
      .limit(10);
      
      res.json({
        success: true,
        data: {
          overview: {
            totalEvents,
            uniqueUsers: uniqueUsers.length,
            uniqueSessions: uniqueSessions.length,
            period
          },
          eventsByType,
          timeSeriesData,
          topCountries,
          aiInsights,
          activeAlerts
        }
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Métriques de conversion
  getConversionMetrics: async (req, res) => {
    try {
      const { funnel = 'job_application' } = req.query;
      
      // Définir les étapes du funnel
      const funnelSteps = {
        job_application: [
          'job_view',
          'job_save',
          'job_apply'
        ],
        test_completion: [
          'test_start',
          'test_complete'
        ],
        certification: [
          'test_complete',
          'certification_earned'
        ],
        registration: [
          'page_view',
          'register'
        ]
      };
      
      const steps = funnelSteps[funnel] || funnelSteps.job_application;
      const conversionData = [];
      
      for (let i = 0; i < steps.length; i++) {
        const stepCount = await AnalyticsEvent.countDocuments({
          eventType: steps[i],
          timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });
        
        const conversionRate = i === 0 ? 100 : (stepCount / conversionData[0].users) * 100;
        
        conversionData.push({
          name: steps[i],
          users: stepCount,
          conversionRate: Math.round(conversionRate * 100) / 100
        });
      }
      
      res.json({
        success: true,
        data: {
          funnel,
          steps: conversionData,
          overallConversionRate: conversionData[conversionData.length - 1]?.conversionRate || 0
        }
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Prédictions IA
  getAIPredictions: async (req, res) => {
    try {
      // Simulation de prédictions IA (à remplacer par un vrai modèle ML)
      const predictions = await AIInsights.find({
        validUntil: { $gte: new Date() }
      })
      .sort({ confidence: -1, priority: -1 })
      .limit(20);
      
      // Générer de nouvelles prédictions si nécessaire
      if (predictions.length < 5) {
        await generateAIPredictions();
      }
      
      res.json({
        success: true,
        data: predictions
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Acquitter une alerte
  acknowledgeAlert: async (req, res) => {
    try {
      const { alertId } = req.params;
      
      const alert = await AnalyticsAlert.findByIdAndUpdate(
        alertId,
        {
          acknowledged: true,
          acknowledgedBy: req.user._id,
          acknowledgedAt: new Date()
        },
        { new: true }
      );
      
      if (!alert) {
        return res.status(404).json({ error: 'Alerte non trouvée' });
      }
      
      res.json({
        success: true,
        data: alert
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

// Fonction pour générer des prédictions IA (simulation)
async function generateAIPredictions() {
  const predictions = [
    {
      type: 'market_trend',
      title: 'Croissance du marché JavaScript',
      description: 'Une augmentation de 25% des recherches JavaScript est prévue ce mois',
      data: { technology: 'JavaScript', growth: 25, timeframe: '30d' },
      confidence: 0.85,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      tags: ['javascript', 'market', 'growth'],
      priority: 'high',
      actionable: true,
      recommendations: [
        'Augmenter le nombre de tests JavaScript',
        'Cibler les développeurs JavaScript dans les campagnes',
        'Créer du contenu spécialisé JavaScript'
      ]
    },
    {
      type: 'skill_demand',
      title: 'Forte demande pour React',
      description: 'React devient la compétence la plus recherchée en Afrique',
      data: { skill: 'React', region: 'Africa', demand_increase: 40 },
      confidence: 0.92,
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      tags: ['react', 'africa', 'demand'],
      priority: 'critical',
      actionable: true,
      recommendations: [
        'Développer des certifications React avancées',
        'Partenariats avec entreprises utilisant React',
        'Formation React pour candidats existants'
      ]
    }
  ];
  
  for (const prediction of predictions) {
    await AIInsights.create(prediction);
  }
}

module.exports = {
  AnalyticsService,
  analyticsController
};
