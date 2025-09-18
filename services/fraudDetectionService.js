// Simple heuristic fraud detection service used during offer creation
// Returns a risk score, list of suspicious terms, and boolean isScam

class FraudDetectionService {
  static async analyzeContent(text) {
    const content = (text || '').toLowerCase();

    // Basic suspicious terms often seen in scammy job posts
    const redFlags = [
      'paiement à l\'avance',
      'payment in advance',
      'western union',
      'moneygram',
      'crypto',
      'bitcoin',
      'wire transfer',
      'envoyez de l\'argent',
      'send money',
      'frais d\'inscription',
      'registration fee',
      'work from home kit',
      'guaranteed income',
      'garanti sans effort'
    ];

    const suspiciousTerms = redFlags.filter(flag => content.includes(flag));

    // Very simple scoring: +30 per red flag, capped at 100
    let riskScore = Math.min(suspiciousTerms.length * 30, 100);

    // Additional simple signals
    if (content.includes('whatsapp') || content.includes('telegram')) {
      riskScore = Math.min(riskScore + 15, 100);
      if (!suspiciousTerms.includes('messagerie instantanée')) suspiciousTerms.push('messagerie instantanée');
    }

    const isScam = riskScore >= 50; // threshold can be tuned

    return {
      riskScore,
      suspiciousTerms,
      isScam
    };
  }
}

module.exports = FraudDetectionService;