/**
 * Referral outcome tracking.
 * Tracks status, follow-up dates, and provider notes for each referral.
 *
 * Referral statuses flow: pending → contacted → enrolled / declined / no_response
 */

export const REFERRAL_STATUSES = [
  { id: "pending", label: "Pending", color: "#64748b" },
  { id: "contacted", label: "Contacted", color: "#d97706" },
  { id: "enrolled", label: "Enrolled", color: "#059669" },
  { id: "completed", label: "Completed", color: "#1e6bb8" },
  { id: "declined", label: "Declined", color: "#dc2626" },
  { id: "no_response", label: "No Response", color: "#9333ea" },
  { id: "waitlisted", label: "Waitlisted", color: "#d97706" },
];

export const STATUS_MAP = Object.fromEntries(REFERRAL_STATUSES.map(s => [s.id, s]));

/**
 * Create a new referral record.
 */
export function createReferral(domainId, resourceId, resourceName) {
  return {
    domainId,
    resourceId,
    resourceName,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    followUpDate: getDefaultFollowUp(),
    notes: "",
  };
}

/**
 * Update a referral's status.
 */
export function updateReferralStatus(referral, newStatus) {
  return {
    ...referral,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get default follow-up date (5 business days from now).
 */
function getDefaultFollowUp() {
  const date = new Date();
  let daysAdded = 0;
  while (daysAdded < 5) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) daysAdded++;
  }
  return date.toISOString().split("T")[0];
}

/**
 * Get referrals that need follow-up (past or today).
 */
export function getReferralsNeedingFollowUp(referrals) {
  const today = new Date().toISOString().split("T")[0];
  return referrals.filter(r =>
    r.followUpDate <= today &&
    ["pending", "contacted", "waitlisted"].includes(r.status)
  );
}

/**
 * Generate a referral summary for case notes.
 */
export function generateReferralSummary(referrals) {
  if (!referrals.length) return "";

  const lines = [
    "### Referral Tracking",
    "",
    "| Domain | Resource | Status | Follow-up | Notes |",
    "|--------|----------|--------|-----------|-------|",
  ];

  for (const r of referrals) {
    const status = STATUS_MAP[r.status]?.label || r.status;
    lines.push(`| ${r.domainId} | ${r.resourceName} | ${status} | ${r.followUpDate || "—"} | ${r.notes || "—"} |`);
  }

  return lines.join("\n");
}
