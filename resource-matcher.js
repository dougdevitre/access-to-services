/**
 * Resource matching engine.
 * Matches flagged SDOH domains + client geography to resources in mo-resources.json.
 *
 * Usage:
 *   import { matchResources } from "./resource-matcher.js";
 *   const matches = matchResources(resources, flaggedDomainIds, county, coverage);
 */

// Map screening domain IDs to resource directory domain values
const DOMAIN_MAP = {
  food: ["food"],
  housing: ["housing"],
  safety: ["public_safety"],
  transportation: ["transportation"],
  utilities: ["financial"],
  financial: ["financial"],
  employment: ["employment"],
  education: ["education"],
  healthcare: ["healthcare"],
  mental_health: ["mental_health"],
  substance_use: ["substance_use"],
  social_support: ["mental_health", "family"],
  childcare: ["children", "family"],
  legal: ["legal"],
};

// Coverage hierarchy: broader coverages are fallbacks for narrower queries
const COVERAGE_RANK = {
  national: 0,
  statewide: 1,
  eastern_mo: 2, western_mo: 2, central_ne_mo: 2, sw_mo: 2, se_mo: 2, nw_mo: 2,
  stl_metro: 3, kc_metro: 3, mid_mo: 3,
  stl_city: 4, stl_north_county: 4, rural_mo: 3,
};

/**
 * Match resources to flagged domains and geography.
 *
 * @param {Array} resources - Array of resource objects from mo-resources.json
 * @param {string[]} flaggedIds - Domain IDs that were flagged (concern or crisis)
 * @param {string} county - Client's county (e.g., "St. Louis County")
 * @param {string} state - Client's state code (e.g., "MO")
 * @returns {Object} Map of domainId → matched resource array, sorted by relevance
 */
export function matchResources(resources, flaggedIds, county, state) {
  if (!resources || !flaggedIds.length) return {};

  const results = {};

  for (const domainId of flaggedIds) {
    const resourceDomains = DOMAIN_MAP[domainId] || [domainId];

    const matches = resources.filter(r => {
      // Domain match: resource serves at least one of the mapped domains
      const domainMatch = r.domain.some(d => resourceDomains.includes(d));
      if (!domainMatch) return false;

      // Geographic match: resource covers the client's area
      if (county && r.counties && r.counties.length > 0) {
        if (r.counties.some(c => c.toLowerCase().includes(county.toLowerCase()))) return true;
      }

      // Broad coverage always matches
      if (r.coverage === "national" || r.coverage === "statewide") return true;

      // State-level matching for MO
      if (state === "MO") return true;

      return false;
    });

    // Sort: county-specific first, then metro, then state, then national
    matches.sort((a, b) => {
      const aCounty = a.counties?.some(c => c.toLowerCase().includes((county || "").toLowerCase())) ? -10 : 0;
      const bCounty = b.counties?.some(c => c.toLowerCase().includes((county || "").toLowerCase())) ? -10 : 0;
      const aRank = COVERAGE_RANK[a.coverage] ?? 5;
      const bRank = COVERAGE_RANK[b.coverage] ?? 5;
      return (bRank + bCounty) - (aRank + aCounty);
    });

    if (matches.length > 0) {
      results[domainId] = matches.slice(0, 5); // Top 5 per domain
    }
  }

  return results;
}

/**
 * Format a phone number for display.
 */
export function formatPhone(phone) {
  if (!phone) return null;
  return phone;
}

/**
 * Generate a warm handoff script for a specific resource and domain.
 */
export function generateHandoffScript(resource, domainLabel, clientId) {
  const orgName = resource.name;
  const phone = resource.phone || "[phone not listed]";

  return {
    before: [
      `"Hi, I'm calling from [your agency]. I'm working with a client who needs help with ${domainLabel.toLowerCase()}.`,
      `I'd like to do a warm handoff if possible. Can I briefly share their situation?"`,
    ],
    intro: [
      `"[Client], I have ${orgName} on the line. They can help with ${domainLabel.toLowerCase()}.`,
      `I've shared a brief summary of your situation. Is it okay if I introduce you?"`,
    ],
    details: [
      `Organization: ${orgName}`,
      `Phone: ${phone}`,
      resource.hours ? `Hours: ${resource.hours}` : null,
      resource.address ? `Address: ${resource.address}` : null,
      resource.cost ? `Cost: ${resource.cost}` : null,
      resource.website ? `Website: ${resource.website}` : null,
    ].filter(Boolean),
    after: [
      `Document the referral in case notes.`,
      `Set a follow-up reminder for 3-5 business days.`,
      `If the client couldn't connect, try an alternative resource or assist with the application.`,
    ],
  };
}
