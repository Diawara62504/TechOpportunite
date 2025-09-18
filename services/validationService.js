const dns = require('dns').promises;
const emailValidator = require('email-validator');

class ValidationService {
  static async validateProfessionalEmail(email) {
    if (!email || !emailValidator.validate(email)) {
      return { isValid: false, reason: 'Format email invalide' };
    }

    const [, domain] = email.split('@');
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    if (personalDomains.includes((domain || '').toLowerCase())) {
      return { isValid: false, reason: 'Email personnel non autorisé pour les recruteurs' };
    }

    try {
      const mx = await dns.resolveMx(domain);
      if (!mx || mx.length === 0) {
        return { isValid: false, reason: 'Domaine email invalide' };
      }
    } catch (e) {
      return { isValid: false, reason: 'Erreur vérification domaine' };
    }

    return { isValid: true };
  }
}

module.exports = ValidationService;