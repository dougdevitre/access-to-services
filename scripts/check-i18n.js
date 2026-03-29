#!/usr/bin/env node

/**
 * Check i18n translation coverage.
 * Compares all language files against English (source of truth).
 * Exits 1 if any language is missing keys.
 */

// Since i18n.js uses ESM exports, we parse it as text
const fs = require("fs");
const path = require("path");

const I18N_PATH = path.join(__dirname, "..", "i18n.js");
const content = fs.readFileSync(I18N_PATH, "utf8");

// Extract string keys from the English block
const enMatch = content.match(/en:\s*\{([\s\S]*?)\n\s*\},?\s*\n\s*es:/);
if (!enMatch) {
  console.error("Could not parse English strings from i18n.js");
  process.exit(1);
}

const keyPattern = /["']?([\w.]+)["']?\s*:/g;
const enKeys = new Set();
let match;
while ((match = keyPattern.exec(enMatch[1])) !== null) {
  enKeys.add(match[1]);
}

// Extract keys from each non-English language block
const langPattern = /(\w{2}):\s*\{([\s\S]*?)\n\s*\},?/g;
let langMatch;
const issues = [];

while ((langMatch = langPattern.exec(content)) !== null) {
  const lang = langMatch[1];
  if (lang === "en") continue;

  const langKeys = new Set();
  const langKeyPattern = /["']?([\w.]+)["']?\s*:/g;
  let km;
  while ((km = langKeyPattern.exec(langMatch[2])) !== null) {
    langKeys.add(km[1]);
  }

  const missing = [...enKeys].filter(k => !langKeys.has(k));
  const extra = [...langKeys].filter(k => !enKeys.has(k));

  if (missing.length > 0) {
    issues.push({ lang, missing, extra });
    console.log(`\n[${lang}] Missing ${missing.length} key(s):`);
    for (const k of missing) console.log(`  - ${k}`);
  }
  if (extra.length > 0) {
    console.log(`\n[${lang}] ${extra.length} extra key(s) (not in English):`);
    for (const k of extra) console.log(`  + ${k}`);
  }
  if (missing.length === 0 && extra.length === 0) {
    console.log(`[${lang}] Full coverage (${langKeys.size}/${enKeys.size} keys)`);
  }
}

console.log(`\nEnglish has ${enKeys.size} keys.`);
process.exit(issues.length > 0 ? 1 : 0);
