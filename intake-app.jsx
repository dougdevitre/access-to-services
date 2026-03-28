import { useState, useCallback, useEffect } from "react";

const DOMAINS = [
  { id: "food", label: "Food Security", q: "Have you worried about running out of food in the past 30 days?" },
  { id: "housing", label: "Housing", q: "Are you worried about losing your housing or do you need a place to stay?" },
  { id: "safety", label: "Safety", q: "Do you feel physically and emotionally safe where you live?" },
  { id: "transportation", label: "Transportation", q: "Can you reliably get to appointments and services?" },
  { id: "utilities", label: "Utilities", q: "Have you had trouble paying utility bills in the past 12 months?" },
  { id: "financial", label: "Financial Strain", q: "Are you having trouble paying for basic needs like rent, food, or medicine?" },
  { id: "employment", label: "Employment", q: "Do you need help finding a job or a better job?" },
  { id: "education", label: "Education", q: "Do you or your children need help with school, training, or GED?" },
  { id: "healthcare", label: "Healthcare Access", q: "Do you have health insurance and access to a doctor?" },
  { id: "mental_health", label: "Mental Health", q: "Have you been feeling down, depressed, hopeless, or overwhelmed?" },
  { id: "substance_use", label: "Substance Use", q: "Do you have concerns about alcohol or drug use (yours or a household member's)?" },
  { id: "social_support", label: "Social Support", q: "Do you have people you can count on for help and support?" },
  { id: "childcare", label: "Child Care", q: "Do you have reliable, affordable child care?" },
  { id: "legal", label: "Legal Issues", q: "Do you have legal issues that need attention (custody, eviction, record, immigration)?" },
];

const PROGRAMS = [
  { name: "SNAP", income: 130, pop: "all", domain: "food", apply: "mydss.mo.gov or local FSD office" },
  { name: "WIC", income: 185, pop: "pregnant_children_under5", domain: "food", apply: "Local WIC clinic (signupwic.com)" },
  { name: "Medicaid (Adult)", income: 138, pop: "adults", domain: "healthcare", apply: "mydss.mo.gov" },
  { name: "Medicaid (Children)", income: 300, pop: "children", domain: "healthcare", apply: "mydss.mo.gov" },
  { name: "TANF", income: 50, pop: "families_with_children", domain: "financial", apply: "mydss.mo.gov or local FSD office" },
  { name: "Child Care Subsidy", income: 185, pop: "families_with_children", domain: "childcare", apply: "mydss.mo.gov" },
  { name: "LIHEAP", income: 150, pop: "all", domain: "utilities", apply: "Local Community Action Agency" },
  { name: "School Meals (Free)", income: 130, pop: "school_age", domain: "food", apply: "Through the school" },
  { name: "School Meals (Reduced)", income: 185, pop: "school_age", domain: "food", apply: "Through the school" },
  { name: "Head Start", income: 100, pop: "children_under5", domain: "education", apply: "eclkc.ohs.acf.hhs.gov" },
  { name: "Section 8 (HCV)", income: 50, pop: "all", domain: "housing", apply: "Local Public Housing Authority", note: "Waitlist — apply when open" },
  { name: "SSI", income: 0, pop: "disabled", domain: "financial", apply: "SSA — 1-800-772-1213", note: "Disability determination required" },
];

const FPL_2025 = { 1: 15650, 2: 21150, 3: 26650, 4: 32150, 5: 37650, 6: 43150, 7: 48650, 8: 54150 };
const fplFor = (size) => FPL_2025[Math.min(size, 8)] + Math.max(0, size - 8) * 5500;
const fplPct = (income, size) => Math.round((income * 12 / fplFor(size)) * 100);

const STEP_LABELS = ["Client Intake", "SDOH Screening", "Results & Referrals"];

const RESPONSE_MAP = { no_concern: 0, concern: 1, crisis: 2 };
const RESPONSE_LABELS = { no_concern: "No concern", concern: "Some concern", crisis: "Urgent / Crisis" };
const RESPONSE_COLORS = { no_concern: "#059669", concern: "#d97706", crisis: "#dc2626" };

const INITIAL_INTAKE = {
  clientId: "", forWhom: "self", state: "MO", county: "", urgency: "standard",
  householdSize: 1, monthlyIncome: "", hasChildren: false, childrenAges: "",
  isPregnant: false, isVeteran: false, hasDisability: false, isSenior: false,
  employmentStatus: "unemployed", currentBenefits: [], housingStatus: "stable",
};

export default function SDOHIntakeApp() {
  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState(INITIAL_INTAKE);
  const [responses, setResponses] = useState({});
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyContent, setCopyContent] = useState("");

  const updateIntake = (field, value) => setIntake(prev => ({ ...prev, [field]: value }));
  const updateResponse = (domainId, value) => setResponses(prev => ({ ...prev, [domainId]: value }));

  const flaggedDomains = DOMAINS.filter(d => responses[d.id] && responses[d.id] !== "no_concern");
  const crisisDomains = DOMAINS.filter(d => responses[d.id] === "crisis");
  const concernDomains = DOMAINS.filter(d => responses[d.id] === "concern");
  const compositeScore = DOMAINS.reduce((sum, d) => sum + (RESPONSE_MAP[responses[d.id]] || 0), 0);
  const screenedCount = DOMAINS.filter(d => responses[d.id]).length;

  const pct = intake.monthlyIncome && intake.householdSize
    ? fplPct(parseFloat(intake.monthlyIncome), parseInt(intake.householdSize))
    : null;

  const eligiblePrograms = PROGRAMS.filter(p => {
    if (pct === null || pct === undefined || isNaN(pct)) return false;
    if (pct > p.income && p.income > 0) return false;
    if (p.pop === "families_with_children" && !intake.hasChildren) return false;
    if (p.pop === "children" && !intake.hasChildren) return false;
    if (p.pop === "children_under5" && !intake.hasChildren) return false;
    if (p.pop === "school_age" && !intake.hasChildren) return false;
    if (p.pop === "pregnant_children_under5" && !intake.isPregnant && !intake.hasChildren) return false;
    if (p.pop === "disabled" && !intake.hasDisability) return false;
    return true;
  });

  const generateReport = useCallback(() => {
    const now = new Date().toLocaleDateString();
    const lines = [
      `## SDOH Screening Summary — ${now}`,
      `**Client:** ${intake.clientId || "[Not entered]"} | **For:** ${intake.forWhom}`,
      `**Location:** ${intake.county || "[County]"}, ${intake.state}`,
      `**Household:** ${intake.householdSize} | **Monthly Income:** $${intake.monthlyIncome || "N/A"} | **FPL:** ${pct ? pct + "%" : "N/A"}`,
      `**Urgency:** ${intake.urgency}`,
      "",
      `### Screening Results (Composite: ${compositeScore}/${DOMAINS.length * 2})`,
      "",
      "| Domain | Response | Score |",
      "|--------|----------|:-----:|",
      ...DOMAINS.map(d => {
        const r = responses[d.id] || "not_screened";
        const score = RESPONSE_MAP[r] ?? "—";
        const label = RESPONSE_LABELS[r] || "Not screened";
        return `| ${d.label} | ${label} | ${score} |`;
      }),
      "",
    ];

    if (crisisDomains.length > 0) {
      lines.push(`### CRISIS Domains`, ...crisisDomains.map(d => `- **${d.label}**`), "");
    }
    if (concernDomains.length > 0) {
      lines.push(`### Concern Domains`, ...concernDomains.map(d => `- ${d.label}`), "");
    }

    if (eligiblePrograms.length > 0) {
      lines.push(
        "### Potential Benefits Eligibility",
        "",
        "| Program | How to Apply | Notes |",
        "|---------|-------------|-------|",
        ...eligiblePrograms.map(p => `| ${p.name} | ${p.apply} | ${p.note || ""} |`),
        "",
        "Educational screening only — not an eligibility determination.",
      );
    }

    lines.push("", `### Priority Actions`);
    let actionNum = 1;
    if (crisisDomains.some(d => d.id === "safety")) {
      lines.push(`${actionNum++}. **IMMEDIATE:** Address safety concern — DV Hotline 1-800-799-7233 or 911 if in danger`);
    }
    flaggedDomains.forEach(d => {
      lines.push(`${actionNum++}. ${d.label}: [Referral / action needed]`);
    });

    lines.push("", `---`, `*Generated by Access to Services SDOH Intake Tool — ${now}*`);
    return lines.join("\n");
  }, [intake, responses, pct, compositeScore, crisisDomains, concernDomains, flaggedDomains, eligiblePrograms]);

  const handleCopy = () => {
    const report = generateReport();
    setCopyContent(report);
    setShowCopyModal(true);
    navigator.clipboard?.writeText(report);
  };

  const handleSendToChat = () => {
    const report = generateReport();
    if (typeof sendPrompt === "function") {
      sendPrompt(`Here are the SDOH screening results for my client. Generate referrals for the flagged domains and build a service plan.\n\n${report}`);
    } else {
      setCopyContent(report);
      setShowCopyModal(true);
      navigator.clipboard?.writeText(report);
    }
  };

  const handleReset = () => {
    setStep(0);
    setIntake(INITIAL_INTAKE);
    setResponses({});
  };

  const canProceed = step === 0
    ? intake.householdSize > 0
    : step === 1
      ? screenedCount >= 8
      : true;

  // Close modal on Escape key
  useEffect(() => {
    if (!showCopyModal) return;
    const handleKey = (e) => { if (e.key === "Escape") setShowCopyModal(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showCopyModal]);

  const colors = {
    bg: "var(--bg, #f8fafc)",
    card: "var(--card, #ffffff)",
    text: "var(--text, #1e293b)",
    muted: "var(--muted, #64748b)",
    border: "var(--border, #e2e8f0)",
    accent: "#1e6bb8",
    accentLight: "#ebf4fa",
    danger: "#dc2626",
    dangerLight: "#fef2f2",
    warning: "#d97706",
    warningLight: "#fffbeb",
    success: "#059669",
    successLight: "#ecfdf5",
  };

  return (
    <div lang="en" style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', system-ui, sans-serif", color: colors.text, maxWidth: 780, margin: "0 auto", padding: "16px 12px" }}>
      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: 24, padding: "20px 0 16px", borderBottom: `3px solid ${colors.accent}` }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.accent, margin: 0, letterSpacing: "-0.01em" }}>Access to Services</h1>
        <p style={{ fontSize: 13, color: colors.muted, margin: "4px 0 0" }}>SDOH Intake & Screening Tool</p>
      </header>

      {/* Step indicator */}
      <nav aria-label="Screening progress" style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {STEP_LABELS.map((label, i) => (
          <div key={label} style={{ flex: 1, textAlign: "center" }}>
            <div
              role="progressbar"
              aria-valuenow={i <= step ? 100 : 0}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{
                height: 4, borderRadius: 2, marginBottom: 6,
                background: i <= step ? colors.accent : colors.border,
                transition: "background 0.3s",
              }}
            />
            <span
              aria-current={i === step ? "step" : undefined}
              style={{ fontSize: 12, color: i <= step ? colors.accent : colors.muted, fontWeight: i === step ? 700 : 400 }}
            >
              {label}
            </span>
          </div>
        ))}
      </nav>

      {/* STEP 0: Intake */}
      {step === 0 && (
        <div role="form" aria-label="Client intake form">
          <Section title="Client Information">
            <Row>
              <Field id="clientId" label="Client ID" value={intake.clientId} onChange={v => updateIntake("clientId", v)} placeholder="Internal ID (no PII)" />
              <SelectField id="forWhom" label="Who is this for?" value={intake.forWhom} onChange={v => updateIntake("forWhom", v)} options={[["self","Self"],["child","Child"],["family","Family member"],["client","My client"]]} />
            </Row>
            <Row>
              <SelectField id="state" label="State" value={intake.state} onChange={v => updateIntake("state", v)} options={[["MO","Missouri"],["IL","Illinois"],["KS","Kansas"],["other","Other"]]} />
              <Field id="county" label="County" value={intake.county} onChange={v => updateIntake("county", v)} placeholder="e.g., St. Louis" />
            </Row>
            <Row>
              <SelectField id="urgency" label="Urgency" value={intake.urgency} onChange={v => updateIntake("urgency", v)} options={[["crisis","Crisis / Immediate"],["this_week","This week"],["standard","Planning ahead"]]} />
            </Row>
          </Section>

          <Section title="Household">
            <Row>
              <Field id="householdSize" label="Household Size" type="number" value={intake.householdSize} onChange={v => updateIntake("householdSize", Math.max(1, parseInt(v) || 1))} min={1} max={15} />
              <Field id="monthlyIncome" label="Monthly Income ($)" type="number" value={intake.monthlyIncome} onChange={v => updateIntake("monthlyIncome", v)} placeholder="Gross monthly" min={0} />
            </Row>
            {pct !== null && !isNaN(pct) && (
              <div role="status" style={{ background: pct <= 138 ? colors.successLight : pct <= 200 ? colors.warningLight : colors.accentLight, padding: "8px 12px", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                <strong>{pct}% of Federal Poverty Level</strong>
                {pct <= 138 && " — Likely Medicaid eligible"}
                {pct <= 130 && " — Likely SNAP eligible"}
              </div>
            )}
            <Row>
              <SelectField id="employmentStatus" label="Employment" value={intake.employmentStatus} onChange={v => updateIntake("employmentStatus", v)} options={[["employed","Employed"],["unemployed","Unemployed"],["underemployed","Underemployed"],["retired","Retired"],["unable_to_work","Unable to work"],["student","Student"]]} />
              <SelectField id="housingStatus" label="Housing Status" value={intake.housingStatus} onChange={v => updateIntake("housingStatus", v)} options={[["stable","Stable"],["at_risk","At risk"],["shelter","In shelter"],["unsheltered","Unsheltered"],["transitional","Transitional"],["doubled_up","Doubled up"]]} />
            </Row>
          </Section>

          <Section title="Special Circumstances">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} role="group" aria-label="Special circumstances">
              <Toggle label="Has children under 18" checked={intake.hasChildren} onChange={v => updateIntake("hasChildren", v)} />
              <Toggle label="Pregnant" checked={intake.isPregnant} onChange={v => updateIntake("isPregnant", v)} />
              <Toggle label="Veteran" checked={intake.isVeteran} onChange={v => updateIntake("isVeteran", v)} />
              <Toggle label="Has a disability" checked={intake.hasDisability} onChange={v => updateIntake("hasDisability", v)} />
              <Toggle label="Age 60+" checked={intake.isSenior} onChange={v => updateIntake("isSenior", v)} />
            </div>
            {intake.hasChildren && (
              <div style={{ marginTop: 8 }}>
                <Field id="childrenAges" label="Children's ages (comma-separated)" value={intake.childrenAges} onChange={v => updateIntake("childrenAges", v)} placeholder="e.g., 3, 7, 14" />
              </div>
            )}
          </Section>
        </div>
      )}

      {/* STEP 1: SDOH Screening */}
      {step === 1 && (
        <div role="form" aria-label="SDOH screening form">
          <div role="alert" style={{ background: colors.accentLight, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, color: colors.accent }}>
            <strong>Instructions:</strong> For each domain, ask the screening question and record the response. Screen at least 8 domains to proceed.
          </div>

          {intake.urgency === "crisis" && (
            <div role="alert" style={{ background: colors.dangerLight, border: `1px solid ${colors.danger}`, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <strong style={{ color: colors.danger }}>Crisis flagged at intake.</strong> Address immediate safety before completing screening. 988 (crisis) · 1-800-799-7233 (DV) · 911 (emergency)
            </div>
          )}

          {DOMAINS.map((domain, i) => (
            <fieldset key={domain.id} style={{
              background: colors.card, border: `1px solid ${responses[domain.id] === "crisis" ? colors.danger : responses[domain.id] === "concern" ? colors.warning : colors.border}`,
              borderRadius: 8, padding: "12px 14px", marginBottom: 8,
              borderLeftWidth: 3, borderLeftColor: responses[domain.id] ? RESPONSE_COLORS[responses[domain.id]] : colors.border,
            }}>
              <legend style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 2, padding: "0 4px" }}>{i + 1}. {domain.label}</legend>
              <div style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>"{domain.q}"</div>
              <div role="radiogroup" aria-label={`Response for ${domain.label}`} style={{ display: "flex", gap: 6 }}>
                {Object.entries(RESPONSE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    role="radio"
                    aria-checked={responses[domain.id] === key}
                    onClick={() => updateResponse(domain.id, key)}
                    style={{
                      flex: 1, padding: "6px 8px", fontSize: 12, fontWeight: responses[domain.id] === key ? 600 : 400,
                      border: `1.5px solid ${responses[domain.id] === key ? RESPONSE_COLORS[key] : colors.border}`,
                      borderRadius: 6, cursor: "pointer",
                      background: responses[domain.id] === key ? (key === "crisis" ? colors.dangerLight : key === "concern" ? colors.warningLight : colors.successLight) : "transparent",
                      color: responses[domain.id] === key ? RESPONSE_COLORS[key] : colors.muted,
                      transition: "all 0.15s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}

          <div role="status" aria-live="polite" style={{ textAlign: "center", fontSize: 12, color: colors.muted, marginTop: 8 }}>
            {screenedCount} of {DOMAINS.length} domains screened {screenedCount < 8 && `(need ${8 - screenedCount} more to proceed)`}
          </div>
        </div>
      )}

      {/* STEP 2: Results */}
      {step === 2 && (
        <div aria-label="Screening results">
          {/* Score summary */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <ScoreCard label="Composite Score" value={`${compositeScore}/${DOMAINS.length * 2}`} color={compositeScore > 14 ? colors.danger : compositeScore > 7 ? colors.warning : colors.success} />
            <ScoreCard label="Crisis Domains" value={crisisDomains.length} color={crisisDomains.length > 0 ? colors.danger : colors.success} />
            <ScoreCard label="Concern Domains" value={concernDomains.length} color={concernDomains.length > 0 ? colors.warning : colors.success} />
            <ScoreCard label="FPL" value={pct ? `${pct}%` : "N/A"} color={colors.accent} />
          </div>

          {/* Crisis alert */}
          {crisisDomains.length > 0 && (
            <div role="alert" style={{ background: colors.dangerLight, border: `1px solid ${colors.danger}`, borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: colors.danger, fontSize: 14, marginBottom: 4 }}>Crisis Domains Identified</div>
              {crisisDomains.map(d => (
                <div key={d.id} style={{ fontSize: 13, color: colors.danger, marginBottom: 2 }}>• <strong>{d.label}</strong> — immediate action needed</div>
              ))}
              {crisisDomains.some(d => d.id === "safety") && (
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>
                  DV Hotline: 1-800-799-7233 · Crisis: 988 · Emergency: 911
                </div>
              )}
            </div>
          )}

          {/* Domain results grid */}
          <Section title="Screening Results">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 6 }}>
              {DOMAINS.map(d => {
                const r = responses[d.id];
                return (
                  <div key={d.id} style={{
                    padding: "8px 10px", borderRadius: 6, fontSize: 12,
                    background: !r ? "#f1f5f9" : r === "crisis" ? colors.dangerLight : r === "concern" ? colors.warningLight : colors.successLight,
                    border: `1px solid ${!r ? colors.border : RESPONSE_COLORS[r]}`,
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.label}</div>
                    <div style={{ color: r ? RESPONSE_COLORS[r] : colors.muted }}>{RESPONSE_LABELS[r] || "Not screened"}</div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Benefits eligibility */}
          {eligiblePrograms.length > 0 && (
            <Section title={`Potential Benefits (${eligiblePrograms.length} programs)`}>
              <div style={{ fontSize: 11, color: colors.muted, marginBottom: 8 }}>Educational screening only — not an eligibility determination</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }} aria-label="Eligible programs">
                  <thead>
                    <tr style={{ background: colors.accentLight }}>
                      <th scope="col" style={{ textAlign: "left", padding: "6px 10px", borderBottom: `2px solid ${colors.accent}` }}>Program</th>
                      <th scope="col" style={{ textAlign: "left", padding: "6px 10px", borderBottom: `2px solid ${colors.accent}` }}>How to Apply</th>
                      <th scope="col" style={{ textAlign: "left", padding: "6px 10px", borderBottom: `2px solid ${colors.accent}` }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligiblePrograms.map((p, i) => (
                      <tr key={p.name} style={{ background: i % 2 === 0 ? "transparent" : "#f8fafc" }}>
                        <td style={{ padding: "6px 10px", fontWeight: 600, borderBottom: `1px solid ${colors.border}` }}>{p.name}</td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${colors.border}` }}>{p.apply}</td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${colors.border}`, color: colors.muted }}>{p.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Actions */}
          <Section title="Next Steps">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ActionButton label="Copy Report" onClick={handleCopy} />
              <ActionButton label="Send to Chat for Referrals" onClick={handleSendToChat} primary />
              <ActionButton label="Start New Screening" onClick={handleReset} />
            </div>
          </Section>
        </div>
      )}

      {/* Navigation */}
      <nav aria-label="Step navigation" style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          aria-label="Go to previous step"
          style={{
            padding: "10px 20px", borderRadius: 8, border: `1px solid ${colors.border}`, background: "transparent",
            color: step === 0 ? colors.border : colors.muted, cursor: step === 0 ? "default" : "pointer", fontSize: 13, fontWeight: 500,
          }}
        >
          Back
        </button>
        {step < 2 && (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed}
            aria-label={step === 0 ? "Begin SDOH screening" : "View screening results"}
            style={{
              padding: "10px 24px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: canProceed ? "pointer" : "default",
              background: canProceed ? colors.accent : colors.border, color: canProceed ? "#fff" : colors.muted,
            }}
          >
            {step === 0 ? "Begin Screening" : "View Results"}
          </button>
        )}
      </nav>

      {/* Copy modal */}
      {showCopyModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Screening report"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setShowCopyModal(false)}
        >
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, maxWidth: 600, width: "90%", maxHeight: "80vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Report Copied</h3>
              <button onClick={() => setShowCopyModal(false)} aria-label="Close dialog" style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: colors.muted }}>×</button>
            </div>
            <pre style={{ background: "#f1f5f9", padding: 12, borderRadius: 8, fontSize: 11, whiteSpace: "pre-wrap", maxHeight: 400, overflow: "auto", lineHeight: 1.5 }}>{copyContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Reusable Components ---

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1e6bb8", marginBottom: 10, paddingBottom: 4, borderBottom: "1px solid #e2e8f0" }}>{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }) {
  return <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>{children}</div>;
}

function Field({ id, label, value, onChange, type = "text", placeholder, ...props }) {
  const fieldId = `field-${id}`;
  return (
    <div style={{ flex: 1, minWidth: 140 }}>
      <label htmlFor={fieldId} style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 3 }}>{label}</label>
      <input id={fieldId} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }}
        {...props} />
    </div>
  );
}

function SelectField({ id, label, value, onChange, options }) {
  const fieldId = `field-${id}`;
  return (
    <div style={{ flex: 1, minWidth: 140 }}>
      <label htmlFor={fieldId} style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 3 }}>{label}</label>
      <select id={fieldId} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, background: "#fff", boxSizing: "border-box" }}>
        {options.map(([optValue, optLabel]) => <option key={optValue} value={optValue}>{optLabel}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontWeight: checked ? 600 : 400,
        border: `1.5px solid ${checked ? "#1e6bb8" : "#e2e8f0"}`,
        background: checked ? "#ebf4fa" : "transparent",
        color: checked ? "#1e6bb8" : "#64748b",
      }}
    >
      {checked ? "Yes: " : ""}{label}
    </button>
  );
}

function ScoreCard({ label, value, color }) {
  return (
    <div style={{ flex: 1, minWidth: 80, textAlign: "center", padding: "12px 8px", borderRadius: 8, border: `1px solid ${color}22`, background: `${color}08` }}>
      <div aria-label={label} style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function ActionButton({ label, onClick, primary }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
      border: primary ? "none" : "1px solid #e2e8f0",
      background: primary ? "#1e6bb8" : "#fff",
      color: primary ? "#fff" : "#1e293b",
    }}>
      {label}
    </button>
  );
}

// Export constants for testing
export { DOMAINS, PROGRAMS, FPL_2025, fplFor, fplPct, RESPONSE_MAP };
