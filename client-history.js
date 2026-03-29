/**
 * Client history management.
 * Stores completed screenings indexed by Client ID in localStorage.
 * Enables loading previous screenings and comparing changes over time.
 *
 * Storage key: "sdoh-client-history"
 * Format: { [clientId]: [ { date, intake, responses, referrals, compositeScore } ] }
 */

const HISTORY_KEY = "sdoh-client-history";

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* localStorage unavailable or full */ }
}

/**
 * Save a completed screening to client history.
 */
export function saveScreening(clientId, intake, responses, referrals, compositeScore) {
  if (!clientId) return;

  const history = loadHistory();
  if (!history[clientId]) history[clientId] = [];

  history[clientId].push({
    date: new Date().toISOString(),
    intake,
    responses,
    referrals: referrals || {},
    compositeScore,
  });

  // Keep only last 10 screenings per client
  if (history[clientId].length > 10) {
    history[clientId] = history[clientId].slice(-10);
  }

  saveHistory(history);
}

/**
 * Get all screenings for a client.
 * @returns {Array} Screenings sorted newest first
 */
export function getClientScreenings(clientId) {
  if (!clientId) return [];
  const history = loadHistory();
  return (history[clientId] || []).slice().reverse();
}

/**
 * Check if a client has previous screenings.
 */
export function hasHistory(clientId) {
  if (!clientId) return false;
  const history = loadHistory();
  return (history[clientId] || []).length > 0;
}

/**
 * Get a summary of all clients in history.
 * @returns {Array} [{ clientId, screeningCount, lastDate }]
 */
export function getClientList() {
  const history = loadHistory();
  return Object.entries(history).map(([clientId, screenings]) => ({
    clientId,
    screeningCount: screenings.length,
    lastDate: screenings[screenings.length - 1]?.date,
  })).sort((a, b) => (b.lastDate || "").localeCompare(a.lastDate || ""));
}

/**
 * Compare two screenings and return domain-level changes.
 * @returns {Array} [{ domain, previous, current, change: "improved"|"worsened"|"same"|"new" }]
 */
export function compareScreenings(previous, current, domainIds) {
  const SCORE = { no_concern: 0, concern: 1, crisis: 2 };

  return domainIds.map(id => {
    const prev = previous?.responses?.[id];
    const curr = current?.responses?.[id];
    const prevScore = SCORE[prev] ?? null;
    const currScore = SCORE[curr] ?? null;

    let change = "same";
    if (prevScore === null && currScore !== null) change = "new";
    else if (prevScore !== null && currScore === null) change = "same";
    else if (currScore < prevScore) change = "improved";
    else if (currScore > prevScore) change = "worsened";

    return { domain: id, previous: prev || null, current: curr || null, change };
  });
}

/**
 * Get provider dashboard stats from all client history.
 * @returns {{ totalScreenings, totalClients, domainCounts, recentScreenings }}
 */
export function getDashboardStats(domainIds) {
  const history = loadHistory();
  const allScreenings = [];

  for (const [clientId, screenings] of Object.entries(history)) {
    for (const s of screenings) {
      allScreenings.push({ ...s, clientId });
    }
  }

  const domainCounts = {};
  for (const id of domainIds) domainCounts[id] = 0;

  for (const s of allScreenings) {
    for (const id of domainIds) {
      if (s.responses[id] && s.responses[id] !== "no_concern") {
        domainCounts[id]++;
      }
    }
  }

  // Sort domains by frequency
  const sortedDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 0);

  return {
    totalScreenings: allScreenings.length,
    totalClients: Object.keys(history).length,
    domainCounts: sortedDomains,
    recentScreenings: allScreenings
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, 10),
  };
}
