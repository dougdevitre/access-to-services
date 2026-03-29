#!/usr/bin/env node

/**
 * Check if the FPL (Federal Poverty Level) values are current.
 * The FPL is updated annually by HHS, usually in January.
 * This script checks if the hardcoded year matches the current year.
 *
 * Exit 0 = current. Exit 1 = outdated.
 */

const fs = require("fs");
const path = require("path");

const JSX_PATH = path.join(__dirname, "..", "intake-app.jsx");
const content = fs.readFileSync(JSX_PATH, "utf8");

// Find FPL_YYYY pattern
const fplMatch = content.match(/FPL_(\d{4})/);
if (!fplMatch) {
  console.error("Could not find FPL_YYYY in intake-app.jsx");
  process.exit(1);
}

const fplYear = parseInt(fplMatch[1]);
const currentYear = new Date().getFullYear();

if (fplYear < currentYear) {
  console.log(`FPL values are outdated: FPL_${fplYear} (current year: ${currentYear})`);
  console.log(`Update FPL_${fplYear} in intake-app.jsx with ${currentYear} HHS Poverty Guidelines.`);
  console.log(`Source: https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines`);
  process.exit(1);
} else {
  console.log(`FPL values are current (FPL_${fplYear}, current year: ${currentYear})`);
  process.exit(0);
}
