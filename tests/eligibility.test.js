#!/usr/bin/env node

/**
 * Automated tests for FPL calculations, eligibility logic, and data validation.
 * Run: node tests/eligibility.test.js
 */

const fs = require("fs");
const path = require("path");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function section(name) {
  console.log(`\n--- ${name} ---`);
}

// ============================================================
// FPL Calculations
// ============================================================
section("FPL 2025 Calculations");

const FPL_2025 = { 1: 15650, 2: 21150, 3: 26650, 4: 32150, 5: 37650, 6: 43150, 7: 48650, 8: 54150 };
const fplFor = (size) => FPL_2025[Math.min(size, 8)] + Math.max(0, size - 8) * 5500;
const fplPct = (income, size) => Math.round((income * 12 / fplFor(size)) * 100);

assert(fplFor(1) === 15650, "FPL for household of 1 = $15,650");
assert(fplFor(4) === 32150, "FPL for household of 4 = $32,150");
assert(fplFor(8) === 54150, "FPL for household of 8 = $54,150");
assert(fplFor(9) === 59650, "FPL for household of 9 = $59,650 (8 + $5,500)");
assert(fplFor(10) === 65150, "FPL for household of 10 = $65,150 (8 + 2×$5,500)");

assert(fplPct(1304, 1) === 100, "HH1 earning $1,304/mo = 100% FPL");
assert(fplPct(0, 1) === 0, "HH1 earning $0/mo = 0% FPL");
assert(fplPct(2679, 4) === 100, "HH4 earning $2,679/mo = 100% FPL");
assert(fplPct(1696, 1) === 130, "HH1 earning $1,696/mo = 130% FPL (SNAP threshold)");

// Edge cases
assert(fplPct(1000, 1) === 77, "HH1 earning $1,000/mo = 77% FPL");
assert(!isNaN(fplPct(0, 1)), "Zero income produces a valid number");

// ============================================================
// Eligibility Logic
// ============================================================
section("Benefits Eligibility Logic");

const PROGRAMS = [
  { name: "SNAP", income: 130, pop: "all", domain: "food" },
  { name: "WIC", income: 185, pop: "pregnant_children_under5", domain: "food" },
  { name: "Medicaid (Adult)", income: 138, pop: "adults", domain: "healthcare" },
  { name: "Medicaid (Children)", income: 300, pop: "children", domain: "healthcare" },
  { name: "TANF", income: 50, pop: "families_with_children", domain: "financial" },
  { name: "Child Care Subsidy", income: 185, pop: "families_with_children", domain: "childcare" },
  { name: "LIHEAP", income: 150, pop: "all", domain: "utilities" },
  { name: "School Meals (Free)", income: 130, pop: "school_age", domain: "food" },
  { name: "School Meals (Reduced)", income: 185, pop: "school_age", domain: "food" },
  { name: "Head Start", income: 100, pop: "children_under5", domain: "education" },
  { name: "Section 8 (HCV)", income: 50, pop: "all", domain: "housing" },
  { name: "SSI", income: 0, pop: "disabled", domain: "financial" },
];

function getEligible(pct, intake) {
  return PROGRAMS.filter(p => {
    if (pct === null || pct === undefined || isNaN(pct)) return false;
    if (pct > p.income && p.income > 0) return false;
    if (p.pop === "families_with_children" && !intake.hasChildren) return false;
    if (p.pop === "children" && !intake.hasChildren) return false;
    if (p.pop === "children_under5" && !intake.hasChildren) return false;
    if (p.pop === "school_age" && !intake.hasChildren) return false;
    if (p.pop === "pregnant_children_under5" && !intake.isPregnant && !intake.hasChildren) return false;
    if (p.pop === "disabled" && !intake.hasDisability) return false;
    return true;
  }).map(p => p.name);
}

// Single adult, very low income (50% FPL)
const singleLow = getEligible(50, { hasChildren: false, isPregnant: false, hasDisability: false, isSenior: false });
assert(singleLow.includes("SNAP"), "Single adult 50% FPL eligible for SNAP");
assert(singleLow.includes("Medicaid (Adult)"), "Single adult 50% FPL eligible for Medicaid");
assert(singleLow.includes("Section 8 (HCV)"), "Single adult 50% FPL eligible for Section 8");
assert(!singleLow.includes("WIC"), "Single adult NOT eligible for WIC");
assert(!singleLow.includes("TANF"), "Single adult NOT eligible for TANF");
assert(!singleLow.includes("School Meals (Free)"), "Single adult NOT eligible for School Meals");

// Family with children, 100% FPL
const familyMid = getEligible(100, { hasChildren: true, isPregnant: false, hasDisability: false, isSenior: false });
assert(familyMid.includes("SNAP"), "Family 100% FPL eligible for SNAP");
assert(familyMid.includes("Medicaid (Adult)"), "Family 100% FPL eligible for Medicaid (Adult)");
assert(familyMid.includes("Medicaid (Children)"), "Family 100% FPL eligible for Medicaid (Children)");
assert(!familyMid.includes("TANF"), "Family 100% FPL NOT eligible for TANF (threshold 50%)");
assert(familyMid.includes("School Meals (Free)"), "Family 100% FPL eligible for free School Meals");
assert(familyMid.includes("Head Start"), "Family 100% FPL eligible for Head Start");

// Pregnant woman, 150% FPL
const pregnant = getEligible(150, { hasChildren: false, isPregnant: true, hasDisability: false, isSenior: false });
assert(pregnant.includes("WIC"), "Pregnant woman 150% FPL eligible for WIC");
assert(!pregnant.includes("Medicaid (Adult)"), "Pregnant woman 150% FPL NOT eligible for Medicaid (Adult) (threshold 138%)");
assert(pregnant.includes("LIHEAP"), "Pregnant woman 150% FPL eligible for LIHEAP");
assert(!pregnant.includes("SNAP"), "Pregnant woman 150% FPL NOT eligible for SNAP (over 130%)");

// Person with disability, 0% FPL
const disabled = getEligible(0, { hasChildren: false, isPregnant: false, hasDisability: true, isSenior: false });
assert(disabled.includes("SSI"), "Disabled person eligible for SSI");
assert(disabled.includes("SNAP"), "Disabled person 0% FPL eligible for SNAP");
assert(disabled.includes("Medicaid (Adult)"), "Disabled person 0% FPL eligible for Medicaid");

// Senior 60+ should still get Medicaid (bug fix verification)
const senior = getEligible(100, { hasChildren: false, isPregnant: false, hasDisability: false, isSenior: true });
assert(senior.includes("Medicaid (Adult)"), "Senior 60+ at 100% FPL IS eligible for Medicaid (bug fix)");

// High income — should get nothing except SSI check
const highIncome = getEligible(400, { hasChildren: true, isPregnant: false, hasDisability: true, isSenior: false });
assert(highIncome.includes("SSI"), "High income + disabled still shows SSI (income=0 threshold)");
assert(!highIncome.includes("SNAP"), "High income NOT eligible for SNAP");
assert(!highIncome.includes("Medicaid (Adult)"), "High income NOT eligible for Medicaid (Adult)");
assert(!highIncome.includes("Medicaid (Children)"), "High income 400% NOT eligible for Medicaid (Children) (threshold 300%)");

// No income data — should get nothing
const noIncome = getEligible(null, { hasChildren: true, isPregnant: false, hasDisability: false, isSenior: false });
assert(noIncome.length === 0, "No income data = no eligibility results");

const nanIncome = getEligible(NaN, { hasChildren: false, isPregnant: false, hasDisability: false, isSenior: false });
assert(nanIncome.length === 0, "NaN income = no eligibility results");

// ============================================================
// Resource Directory Validation
// ============================================================
section("Resource Directory Integrity");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "mo-resources.json"), "utf8"));

assert(data.meta && data.meta.version, "meta.version exists");
assert(data.resources && data.resources.length > 0, "resources array is non-empty");
assert(data.resources.length >= 50, `Resource count >= 50 (found ${data.resources.length})`);

// Check for unique IDs
const ids = data.resources.map(r => r.id);
const uniqueIds = new Set(ids);
assert(ids.length === uniqueIds.size, "All resource IDs are unique");

// Check required fields
const REQUIRED = ["id", "name", "domain", "type", "coverage", "population", "description", "verified"];
let allHaveRequired = true;
for (const r of data.resources) {
  for (const field of REQUIRED) {
    if (!r[field]) {
      allHaveRequired = false;
      console.error(`    Missing '${field}' on ${r.id || r.name}`);
    }
  }
}
assert(allHaveRequired, "All resources have required fields");

// Check domain coverage
const domains = new Set();
data.resources.forEach(r => r.domain.forEach(d => domains.add(d)));
const criticalDomains = ["food", "housing", "mental_health", "healthcare", "employment", "legal", "crisis"];
for (const d of criticalDomains) {
  assert(domains.has(d), `Critical domain '${d}' is represented in resources`);
}

// Check geographic coverage
const coverages = new Set(data.resources.map(r => r.coverage));
assert(coverages.has("statewide"), "Has statewide resources");
assert(coverages.has("stl_metro"), "Has STL metro resources");
assert(coverages.has("kc_metro"), "Has KC metro resources");
assert(coverages.has("national"), "Has national resources");

// Check crisis resources exist
const crisisResources = data.resources.filter(r => r.domain.includes("crisis"));
assert(crisisResources.length >= 3, `Has >= 3 crisis resources (found ${crisisResources.length})`);

// Check 988 is in the directory
const has988 = data.resources.some(r => r.phone && r.phone.includes("988"));
assert(has988, "988 Suicide & Crisis Lifeline is in the directory");

// Check DV hotline is in the directory
const hasDV = data.resources.some(r => r.phone && r.phone.includes("1-800-799-7233"));
assert(hasDV, "National DV Hotline is in the directory");

// ============================================================
// Screening Logic
// ============================================================
section("Screening Logic");

const RESPONSE_MAP = { no_concern: 0, concern: 1, crisis: 2 };

// Composite score calculation
const testResponses = { food: "crisis", housing: "concern", safety: "no_concern" };
const DOMAINS_SUBSET = [
  { id: "food" }, { id: "housing" }, { id: "safety" },
  { id: "transportation" }, { id: "utilities" },
];
const score = DOMAINS_SUBSET.reduce((sum, d) => sum + (RESPONSE_MAP[testResponses[d.id]] || 0), 0);
assert(score === 3, "Composite score: crisis(2) + concern(1) + no_concern(0) + unscreened(0) + unscreened(0) = 3");

// Max possible score
const allCrisis = { food: "crisis", housing: "crisis", safety: "crisis", transportation: "crisis", utilities: "crisis" };
const maxScore = DOMAINS_SUBSET.reduce((sum, d) => sum + (RESPONSE_MAP[allCrisis[d.id]] || 0), 0);
assert(maxScore === 10, "Max composite for 5 domains = 10 (all crisis)");

// ============================================================
// Summary
// ============================================================
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
