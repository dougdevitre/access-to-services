#!/usr/bin/env node

/**
 * Check resource freshness and output machine-readable results.
 * Used by CI to auto-open issues for stale entries.
 *
 * Exit 0 = all fresh. Exit 1 = stale entries found.
 * Outputs JSON to stdout when --json flag is passed.
 */

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "mo-resources.json");
const STALE_DAYS = 180; // 6 months
const jsonMode = process.argv.includes("--json");

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const now = new Date();
const staleEntries = [];

for (const r of data.resources) {
  if (!r.verified) {
    staleEntries.push({ id: r.id, name: r.name, verified: null, daysOld: Infinity, reason: "missing verified date" });
    continue;
  }

  const verified = new Date(r.verified);
  const daysOld = Math.floor((now - verified) / (1000 * 60 * 60 * 24));

  if (daysOld > STALE_DAYS) {
    staleEntries.push({ id: r.id, name: r.name, verified: r.verified, daysOld, reason: `${daysOld} days since verification` });
  }
}

if (jsonMode) {
  console.log(JSON.stringify({ staleCount: staleEntries.length, entries: staleEntries, checkedAt: now.toISOString() }));
} else {
  if (staleEntries.length === 0) {
    console.log(`All ${data.resources.length} resources verified within ${STALE_DAYS} days.`);
  } else {
    console.log(`${staleEntries.length} stale resource(s) found (>${STALE_DAYS} days):\n`);
    for (const e of staleEntries) {
      console.log(`  [${e.id}] ${e.name} — ${e.reason}`);
    }
  }
}

process.exit(staleEntries.length > 0 ? 1 : 0);
