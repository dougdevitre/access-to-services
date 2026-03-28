#!/usr/bin/env node

/**
 * Validates mo-resources.json against the schema and checks data quality.
 * Run: node scripts/validate.js
 */

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "mo-resources.json");
const SCHEMA_PATH = path.join(__dirname, "..", "mo-resources.schema.json");

const VALID_DOMAINS = [
  "food", "housing", "mental_health", "substance_use", "healthcare",
  "education", "employment", "legal", "children", "family",
  "public_safety", "disability", "aging", "transportation",
  "crisis", "financial", "immigration", "reentry",
];

const VALID_POPULATIONS = [
  "all", "low_income", "seniors", "disabled", "children", "children_0_3",
  "children_under5", "school_age", "families_with_children", "veterans",
  "pregnant", "lgbtq_youth", "justice_involved", "homeless", "immigrants",
  "caregivers", "medicare", "families_prenatal_5",
  "families_children_disabilities", "all_rural",
];

const VALID_COVERAGE = [
  "national", "statewide", "eastern_mo", "western_mo", "central_ne_mo",
  "sw_mo", "se_mo", "nw_mo", "stl_metro", "stl_city", "stl_north_county",
  "kc_metro", "mid_mo", "rural_mo",
];

const VALID_COST = ["free", "sliding_scale", "income_based", "suggested_donation"];
const VALID_INSURANCE = ["medicaid", "medicare", "private", "uninsured"];
const REQUIRED_FIELDS = ["id", "name", "domain", "type", "coverage", "population", "description", "verified"];

let errors = 0;
let warnings = 0;

function error(msg) { errors++; console.error(`  ERROR: ${msg}`); }
function warn(msg) { warnings++; console.warn(`  WARN:  ${msg}`); }

// Load data
let data;
try {
  data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: Cannot parse ${DATA_PATH}: ${e.message}`);
  process.exit(1);
}

console.log(`Validating ${DATA_PATH}`);
console.log(`Found ${data.resources?.length || 0} resources\n`);

// Check meta
if (!data.meta) error("Missing 'meta' object");
if (!data.meta?.version) error("Missing meta.version");
if (!data.meta?.state) error("Missing meta.state");
if (!data.meta?.last_updated) error("Missing meta.last_updated");

// Check resources
const ids = new Set();

for (const r of data.resources || []) {
  const label = `[${r.id || "NO_ID"}] ${r.name || "NO_NAME"}`;

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (!r[field]) error(`${label}: missing required field '${field}'`);
  }

  // Unique ID
  if (r.id) {
    if (ids.has(r.id)) error(`${label}: duplicate id '${r.id}'`);
    ids.add(r.id);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(r.id)) warn(`${label}: id should be lowercase alphanumeric with hyphens`);
  }

  // Domain vocabulary
  if (Array.isArray(r.domain)) {
    for (const d of r.domain) {
      if (!VALID_DOMAINS.includes(d)) error(`${label}: invalid domain '${d}'`);
    }
  }

  // Population vocabulary
  if (Array.isArray(r.population)) {
    for (const p of r.population) {
      if (!VALID_POPULATIONS.includes(p)) error(`${label}: invalid population '${p}'`);
    }
  }

  // Coverage vocabulary
  if (r.coverage && !VALID_COVERAGE.includes(r.coverage)) {
    error(`${label}: invalid coverage '${r.coverage}'`);
  }

  // Cost vocabulary
  if (r.cost && !VALID_COST.includes(r.cost)) {
    error(`${label}: invalid cost '${r.cost}'`);
  }

  // Insurance vocabulary
  if (Array.isArray(r.insurance)) {
    for (const ins of r.insurance) {
      if (!VALID_INSURANCE.includes(ins)) error(`${label}: invalid insurance '${ins}'`);
    }
  }

  // Verified date format
  if (r.verified && !/^\d{4}-\d{2}-\d{2}$/.test(r.verified)) {
    error(`${label}: invalid verified date format '${r.verified}' (expected YYYY-MM-DD)`);
  }

  // Freshness check
  if (r.verified) {
    const verifiedDate = new Date(r.verified);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (verifiedDate < sixMonthsAgo) {
      warn(`${label}: verified date '${r.verified}' is older than 6 months — needs re-verification`);
    }
  }

  // Actionability warnings
  if (!r.phone && !r.website) {
    warn(`${label}: no phone or website — limited actionability for referrals`);
  }

  // Description length
  if (r.description && r.description.length < 10) {
    warn(`${label}: description is very short (${r.description.length} chars)`);
  }
}

// Coverage analysis
console.log("\n--- Coverage Summary ---");
const byCoverage = {};
const byDomain = {};
for (const r of data.resources || []) {
  byCoverage[r.coverage] = (byCoverage[r.coverage] || 0) + 1;
  for (const d of r.domain || []) {
    byDomain[d] = (byDomain[d] || 0) + 1;
  }
}
console.log("\nBy coverage area:");
for (const [k, v] of Object.entries(byCoverage).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log("\nBy domain:");
for (const [k, v] of Object.entries(byDomain).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}

// Final report
console.log(`\n--- Results ---`);
console.log(`${errors} errors, ${warnings} warnings`);
process.exit(errors > 0 ? 1 : 0);
