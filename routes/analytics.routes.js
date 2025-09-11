const express = require('express');
const router = express.Router();
const { analyticsController, AnalyticsService } = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Middleware pour tracker automatiquement les événements de page
const trackPageView = (req, res, next) => {
  // Track page view en arrière-plan
  AnalyticsService.trackEvent(req, 'page_view', {
    page: req.originalUrl,
    method: req.method
  }).catch(err => console.error('Erreur tracking page view:', err));
  
  next();
};

// Routes publiques (avec tracking automatique)
router.post('/track', trackPageView, analyticsController.trackEvent);

// Routes protégées (admin/recruteur seulement)
router.use(authMiddleware);

// Vérifier les permissions admin/recruteur
const requireAnalyticsAccess = (req, res, next) => {
  if (req.user.role !== 'recruteur' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Accès refusé - Permissions analytics requises' 
    });
  }
  next();
};

router.use(requireAnalyticsAccess);

// Dashboard principal
router.get('/dashboard', analyticsController.getDashboard);

// Métriques de conversion
router.get('/conversion', analyticsController.getConversionMetrics);

// Prédictions IA
router.get('/ai-predictions', analyticsController.getAIPredictions);

// Gestion des alertes
router.put('/alerts/:alertId/acknowledge', analyticsController.acknowledgeAlert);

// Routes avancées pour l'export de données
router.get('/export/events', async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const query = {};
    if (startDate) query.timestamp = { $gte: new Date(startDate) };
    if (endDate) query.timestamp = { ...query.timestamp, $lte: new Date(endDate) };
    
    const events = await AnalyticsEvent.find(query)
      .limit(10000)
      .sort({ timestamp: -1 });
    
    if (format === 'csv') {
      // Conversion CSV
      const csv = events.map(event => ({
        timestamp: event.timestamp,
        eventType: event.eventType,
        userId: event.utilisateur,
        sessionId: event.sessionId,
        country: event.metadata.country,
        device: event.metadata.device
      }));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
      
      // Simple CSV conversion
      const headers = Object.keys(csv[0] || {});
      const csvContent = [
        headers.join(','),
        ...csv.map(row => headers.map(header => row[header]).join(','))
      ].join('\n');
      
      return res.send(csvContent);
    }
    
    res.json({ success: true, data: events });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistiques en temps réel
router.get('/realtime', async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Événements de la dernière heure
    const recentEvents = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: oneHourAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d-%H-%M", date: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Utilisateurs actifs maintenant
    const activeUsers = await AnalyticsEvent.distinct('sessionId', {
      timestamp: { $gte: new Date(now.getTime() - 5 * 60 * 1000) } // 5 minutes
    });
    
    // Top événements actuels
    const topEvents = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: oneHourAgo }
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
      },
      {
        $limit: 5
      }
    ]);
    
    res.json({
      success: true,
      data: {
        activeUsers: activeUsers.length,
        recentEvents,
        topEvents,
        timestamp: now
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Heatmap des interactions
router.get('/heatmap', async (req, res) => {
  try {
    const { page, period = '7d' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    
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
    }
    
    const heatmapData = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          ...(page && { 'eventData.page': page })
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: "$timestamp" },
            dayOfWeek: { $dayOfWeek: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: heatmapData
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyse des parcours utilisateurs
router.get('/user-journey', async (req, res) => {
  try {
    const { userId, sessionId } = req.query;
    
    if (!userId && !sessionId) {
      return res.status(400).json({ 
        error: 'userId ou sessionId requis' 
      });
    }
    
    const query = {};
    if (userId) query.utilisateur = userId;
    if (sessionId) query.sessionId = sessionId;
    
    const journey = await AnalyticsEvent.find(query)
      .sort({ timestamp: 1 })
      .limit(1000);
    
    // Analyser le parcours
    const analysis = {
      totalEvents: journey.length,
      duration: journey.length > 1 ? 
        journey[journey.length - 1].timestamp - journey[0].timestamp : 0,
      uniquePages: [...new Set(journey.map(e => e.eventData.page).filter(Boolean))],
      conversionEvents: journey.filter(e => 
        ['job_apply', 'test_complete', 'certification_earned'].includes(e.eventType)
      ),
      dropOffPoints: []
    };
    
    res.json({
      success: true,
      data: {
        journey,
        analysis
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
