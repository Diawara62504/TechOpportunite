const mongoose = require("mongoose");

// Modèle pour stocker les événements d'analytics
const analyticsEventSchema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inscrits",
    required: false // Peut être null pour les visiteurs anonymes
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'page_view', 'job_view', 'job_apply', 'job_save', 'profile_view',
      'test_start', 'test_complete', 'certification_earned', 'search',
      'filter_apply', 'message_sent', 'login', 'register', 'logout',
      'ai_recommendation_view', 'ai_recommendation_click', 'language_change'
    ]
  },
  eventData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    country: String,
    city: String,
    device: String,
    browser: String,
    os: String,
    referrer: String,
    language: String,
    timezone: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index composé pour les requêtes d'analytics
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ utilisateur: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });

// Modèle pour les métriques agrégées quotidiennes
const dailyMetricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  metrics: {
    // Métriques générales
    totalUsers: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    sessions: { type: Number, default: 0 },
    pageViews: { type: Number, default: 0 },
    
    // Métriques emploi
    jobViews: { type: Number, default: 0 },
    jobApplications: { type: Number, default: 0 },
    jobSaves: { type: Number, default: 0 },
    newJobs: { type: Number, default: 0 },
    
    // Métriques tests et certifications
    testsStarted: { type: Number, default: 0 },
    testsCompleted: { type: Number, default: 0 },
    certificationsEarned: { type: Number, default: 0 },
    averageTestScore: { type: Number, default: 0 },
    
    // Métriques engagement
    searches: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 },
    
    // Métriques IA
    aiRecommendations: { type: Number, default: 0 },
    aiRecommendationClicks: { type: Number, default: 0 },
    aiMatchingAccuracy: { type: Number, default: 0 },
    
    // Métriques géographiques
    topCountries: [{
      country: String,
      count: Number
    }],
    topCities: [{
      city: String,
      count: Number
    }],
    
    // Métriques technologiques
    topTechnologies: [{
      technology: String,
      searches: Number,
      applications: Number
    }],
    
    // Métriques linguistiques
    languageDistribution: [{
      language: String,
      percentage: Number
    }]
  }
}, {
  timestamps: true
});

// Modèle pour les prédictions et insights IA
const aiInsightsSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'market_trend', 'skill_demand', 'salary_prediction', 'hiring_forecast',
      'user_behavior', 'technology_growth', 'regional_analysis', 'competition_analysis'
    ]
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  actionable: {
    type: Boolean,
    default: false
  },
  recommendations: [String]
}, {
  timestamps: true
});

// Modèle pour le tracking des conversions
const conversionFunnelSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  funnel: {
    type: String,
    required: true,
    enum: ['job_application', 'test_completion', 'certification', 'registration']
  },
  steps: [{
    name: String,
    users: Number,
    conversionRate: Number
  }],
  totalConversions: Number,
  overallConversionRate: Number
}, {
  timestamps: true
});

// Modèle pour les alertes automatiques
const analyticsAlertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'traffic_spike', 'traffic_drop', 'conversion_drop', 'error_spike',
      'new_market_opportunity', 'competitor_activity', 'user_churn_risk'
    ]
  },
  title: String,
  message: String,
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  },
  data: mongoose.Schema.Types.Mixed,
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inscrits"
  },
  acknowledgedAt: Date
}, {
  timestamps: true
});

const AnalyticsEvent = mongoose.model("AnalyticsEvent", analyticsEventSchema);
const DailyMetrics = mongoose.model("DailyMetrics", dailyMetricsSchema);
const AIInsights = mongoose.model("AIInsights", aiInsightsSchema);
const ConversionFunnel = mongoose.model("ConversionFunnel", conversionFunnelSchema);
const AnalyticsAlert = mongoose.model("AnalyticsAlert", analyticsAlertSchema);

module.exports = {
  AnalyticsEvent,
  DailyMetrics,
  AIInsights,
  ConversionFunnel,
  AnalyticsAlert
};
