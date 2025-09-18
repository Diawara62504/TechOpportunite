// Backfill script: infer domain and categories for existing offers missing these fields
// Usage:
//   node backend/utils/backfillDomains.js
// Or import and run backfillDomains() from another script.

const { connect } = require('../config/db');
const Offer = require('../models/offer.model');
const { inferDomainAndCategories } = require('./domainClassifier');

async function backfillDomains({ dryRun = false, batchSize = 200 } = {}) {
  const query = { $or: [{ domain: { $exists: false } }, { domain: null }, { domain: '' }] };
  const total = await Offer.countDocuments(query);
  console.log(`[backfill] Offers to process: ${total}`);
  let processed = 0, updated = 0;

  while (processed < total) {
    const offers = await Offer.find(query).limit(batchSize);
    if (!offers.length) break;

    for (const off of offers) {
      const { domain, categories } = inferDomainAndCategories({
        titre: off.titre,
        description: off.description,
        technologies: off.technologies
      });

      if (domain) {
        updated += 1;
        if (!dryRun) {
          off.domain = domain;
          // Conserver existants et merger avec nouveaux (limiter à 10)
          const existingCats = Array.isArray(off.categories) ? off.categories : [];
          const merged = Array.from(new Set([...(categories || []), ...existingCats])).slice(0, 10);
          off.categories = merged;
          await off.save();
        }
      }
      processed += 1;
    }

    console.log(`[backfill] Processed ${processed}/${total} ... Updated ${updated}`);
  }

  console.log(`[backfill] Done. Updated ${updated} offers.`);
  return { total, processed, updated };
}

// Run directly
if (require.main === module) {
  (async () => {
    try {
      await connect();
      await backfillDomains();
      process.exit(0);
    } catch (e) {
      console.error('[backfill] Failed:', e);
      process.exit(1);
    }
  })();
}

module.exports = { backfillDomains };