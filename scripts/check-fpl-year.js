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

// Year labels in the README and the packaged skill must match FPL_YYYY,
// so a January update cannot leave last year's label behind.
const zlib = require("zlib");
const YEAR_LABEL = /\b(20\d\d) (?:FPL\b|Federal Poverty Level|HHS Poverty Guidelines)|\((20\d\d) values\)/g;
const labelSources = { "README.md": fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8") };
// The .skill file is a gzipped tar; read its Markdown members.
const tar = zlib.gunzipSync(fs.readFileSync(path.join(__dirname, "..", "access-to-services.skill")));
for (let off = 0; off + 512 <= tar.length; ) {
  const name = tar.toString("utf8", off, off + 100).replace(/\0.*$/s, "");
  if (!name) break;
  const size = parseInt(tar.toString("utf8", off + 124, off + 136).replace(/\0.*$/s, "").trim() || "0", 8);
  if (name.endsWith(".md") && !name.endsWith("eval-results.md")) {
    labelSources[`access-to-services.skill:${name}`] = tar.toString("utf8", off + 512, off + 512 + size);
  }
  off += 512 + Math.ceil(size / 512) * 512;
}
let staleLabels = 0;
for (const [file, text] of Object.entries(labelSources)) {
  for (const m of text.matchAll(YEAR_LABEL)) {
    if (parseInt(m[1] || m[2]) !== fplYear) {
      staleLabels++;
      console.error(`${file}: "${m[0]}" does not match FPL_${fplYear}`);
    }
  }
}
if (staleLabels > 0) {
  console.error(`${staleLabels} year label(s) out of step with FPL_${fplYear}. eval-results.md is a dated record and is not checked.`);
  process.exit(1);
}

if (fplYear < currentYear) {
  console.log(`FPL values are outdated: FPL_${fplYear} (current year: ${currentYear})`);
  console.log(`Update FPL_${fplYear} in intake-app.jsx with ${currentYear} HHS Poverty Guidelines.`);
  console.log(`Source: https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines`);
  process.exit(1);
} else {
  console.log(`FPL values are current (FPL_${fplYear}, current year: ${currentYear})`);
  process.exit(0);
}
