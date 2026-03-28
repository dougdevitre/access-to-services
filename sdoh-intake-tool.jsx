import { useState, useCallback } from "react";

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
  { name: "SNAP", income: 130, pop: "all", apply: "mydss.mo.gov or local FSD office" },
  { name: "WIC", income: 185, pop: "pregnant_children_under5", apply: "Local WIC clinic (signupwic.com)" },
  { name: "Medicaid (Adult)", income: 138, pop: "adults", apply: "mydss.mo.gov" },
  { name: "Medicaid (Children)", income: 300, pop: "children", apply: "mydss.mo.gov" },
  { name: "TANF", income: 50, pop: "families_with_children", apply: "mydss.mo.gov or local FSD office" },
  { name: "Child Care Subsidy", income: 185, pop: "families_with_children", apply: "mydss.mo.gov" },
  { name: "LIHEAP", income: 150, pop: "all", apply: "Local Community Action Agency" },
  { name: "School Meals (Free)", income: 130, pop: "school_age", apply: "Through the school" },
  { name: "Head Start", income: 100, pop: "children_under5", apply: "eclkc.ohs.acf.hhs.gov" },
  { name: "Section 8", income: 50, pop: "all", apply: "Local PHA", note: "Waitlist" },
  { name: "SSI", income: 0, pop: "disabled", apply: "SSA 1-800-772-1213", note: "Disability required" },
];

const FPL = { 1: 15650, 2: 21150, 3: 26650, 4: 32150, 5: 37650, 6: 43150, 7: 48650, 8: 54150 };
const fplPct = (inc, sz) => Math.round((inc * 12 / (FPL[Math.min(sz, 8)] + Math.max(0, sz - 8) * 5500)) * 100);

const RL = { no_concern: "No concern", concern: "Some concern", crisis: "Urgent / Crisis" };
const RC = { no_concern: "#059669", concern: "#d97706", crisis: "#dc2626" };
const RM = { no_concern: 0, concern: 1, crisis: 2 };

export default function App() {
  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState({ clientId: "", forWhom: "self", state: "MO", county: "", urgency: "standard", householdSize: 1, monthlyIncome: "", hasChildren: false, childrenAges: "", isPregnant: false, isVeteran: false, hasDisability: false, isSenior: false, employmentStatus: "unemployed", housingStatus: "stable" });
  const [resp, setResp] = useState({});
  const [modal, setModal] = useState(false);
  const [copyText, setCopyText] = useState("");

  const u = (f, v) => setIntake(p => ({ ...p, [f]: v }));
  const flagged = DOMAINS.filter(d => resp[d.id] && resp[d.id] !== "no_concern");
  const crisis = DOMAINS.filter(d => resp[d.id] === "crisis");
  const concerns = DOMAINS.filter(d => resp[d.id] === "concern");
  const composite = DOMAINS.reduce((s, d) => s + (RM[resp[d.id]] || 0), 0);
  const screened = DOMAINS.filter(d => resp[d.id]).length;
  const pct = intake.monthlyIncome && intake.householdSize ? fplPct(parseFloat(intake.monthlyIncome), parseInt(intake.householdSize)) : null;

  const elig = PROGRAMS.filter(p => {
    if (!pct || (pct > p.income && p.income > 0)) return false;
    if (p.pop === "families_with_children" && !intake.hasChildren) return false;
    if (p.pop === "children" && !intake.hasChildren) return false;
    if (p.pop === "children_under5" && !intake.hasChildren) return false;
    if (p.pop === "school_age" && !intake.hasChildren) return false;
    if (p.pop === "pregnant_children_under5" && !intake.isPregnant && !intake.hasChildren) return false;
    if (p.pop === "disabled" && !intake.hasDisability) return false;
    if (p.pop === "adults" && intake.isSenior) return false;
    return true;
  });

  const report = useCallback(() => {
    const d = new Date().toLocaleDateString();
    const l = [`## SDOH Screening — ${d}`, `**Client:** ${intake.clientId || "N/A"} | **Location:** ${intake.county || "N/A"}, ${intake.state} | **HH:** ${intake.householdSize} | **Income:** $${intake.monthlyIncome || "N/A"}/mo | **FPL:** ${pct || "N/A"}%`, "", "| Domain | Response | Score |", "|--------|----------|:-----:|", ...DOMAINS.map(d => `| ${d.label} | ${RL[resp[d.id]] || "—"} | ${RM[resp[d.id]] ?? "—"} |`), ""];
    if (crisis.length) l.push("### Crisis", ...crisis.map(d => `- **${d.label}**`), "");
    if (elig.length) l.push("### Benefits", "| Program | Apply |", "|---------|-------|", ...elig.map(p => `| ${p.name} | ${p.apply} |`), "", "*Educational screening only.*");
    l.push("", "### Actions", ...flagged.map((d, i) => `${i + 1}. ${d.label}: [Referral needed]`));
    return l.join("\n");
  }, [intake, resp, pct, crisis, elig, flagged]);

  const A = "#1e6bb8", AL = "#ebf4fa", DR = "#dc2626", DL = "#fef2f2", WR = "#d97706", WL = "#fffbeb", GR = "#059669", GL = "#ecfdf5", BD = "#e2e8f0", MT = "#64748b";

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 780, margin: "0 auto", padding: "16px 12px", color: "#1e293b" }}>
      <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 14, borderBottom: `3px solid ${A}` }}>
        <h1 style={{ fontSize: 21, fontWeight: 700, color: A, margin: 0 }}>Access to Services</h1>
        <p style={{ fontSize: 12, color: MT, margin: "3px 0 0" }}>SDOH Intake & Screening Tool</p>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {["Client Intake", "SDOH Screening", "Results & Referrals"].map((l, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 4, borderRadius: 2, marginBottom: 5, background: i <= step ? A : BD }} />
            <span style={{ fontSize: 11, color: i <= step ? A : MT, fontWeight: i === step ? 700 : 400 }}>{l}</span>
          </div>
        ))}
      </div>

      {step === 0 && <div>
        <Sec t="Client Information">
          <R><F l="Client ID" v={intake.clientId} o={v => u("clientId", v)} p="Internal ID (no PII)" /><S l="Who is this for?" v={intake.forWhom} o={v => u("forWhom", v)} opts={[["self","Self"],["child","Child"],["family","Family member"],["client","My client"]]} /></R>
          <R><S l="State" v={intake.state} o={v => u("state", v)} opts={[["MO","Missouri"],["IL","Illinois"],["KS","Kansas"],["other","Other"]]} /><F l="County" v={intake.county} o={v => u("county", v)} p="e.g., St. Louis" /></R>
          <R><S l="Urgency" v={intake.urgency} o={v => u("urgency", v)} opts={[["crisis","Crisis / Immediate"],["this_week","This week"],["standard","Planning ahead"]]} /></R>
        </Sec>
        <Sec t="Household">
          <R><F l="Household Size" type="number" v={intake.householdSize} o={v => u("householdSize", parseInt(v)||1)} /><F l="Monthly Income ($)" type="number" v={intake.monthlyIncome} o={v => u("monthlyIncome", v)} p="Gross monthly" /></R>
          {pct !== null && <div style={{ background: pct <= 138 ? GL : pct <= 200 ? WL : AL, padding: "7px 12px", borderRadius: 6, marginBottom: 10, fontSize: 13 }}><strong>{pct}% FPL</strong>{pct <= 138 && " — Likely Medicaid eligible"}{pct <= 130 && " · Likely SNAP eligible"}</div>}
          <R><S l="Employment" v={intake.employmentStatus} o={v => u("employmentStatus", v)} opts={[["employed","Employed"],["unemployed","Unemployed"],["underemployed","Underemployed"],["retired","Retired"],["unable_to_work","Unable to work"],["student","Student"]]} /><S l="Housing" v={intake.housingStatus} o={v => u("housingStatus", v)} opts={[["stable","Stable"],["at_risk","At risk"],["shelter","In shelter"],["unsheltered","Unsheltered"],["transitional","Transitional"],["doubled_up","Doubled up"]]} /></R>
        </Sec>
        <Sec t="Special Circumstances">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {[["hasChildren","Children under 18"],["isPregnant","Pregnant"],["isVeteran","Veteran"],["hasDisability","Disability"],["isSenior","Age 60+"]].map(([k,l]) => <Tog key={k} l={l} c={intake[k]} o={v => u(k, v)} />)}
          </div>
          {intake.hasChildren && <div style={{ marginTop: 8 }}><F l="Children's ages" v={intake.childrenAges} o={v => u("childrenAges", v)} p="e.g., 3, 7, 14" /></div>}
        </Sec>
      </div>}

      {step === 1 && <div>
        <div style={{ background: AL, padding: "9px 12px", borderRadius: 7, marginBottom: 14, fontSize: 12, color: A }}><strong>Instructions:</strong> For each domain, ask the question and record the response. Screen at least 8 to proceed.</div>
        {intake.urgency === "crisis" && <div style={{ background: DL, border: `1px solid ${DR}`, padding: "9px 12px", borderRadius: 7, marginBottom: 14, fontSize: 12 }}><strong style={{ color: DR }}>Crisis flagged.</strong> Address safety first. 988 · 1-800-799-7233 · 911</div>}
        {DOMAINS.map((d, i) => (
          <div key={d.id} style={{ border: `1px solid ${resp[d.id] === "crisis" ? DR : resp[d.id] === "concern" ? WR : BD}`, borderRadius: 7, padding: "10px 12px", marginBottom: 7, borderLeftWidth: 3, borderLeftColor: resp[d.id] ? RC[resp[d.id]] : BD }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>{i+1}. {d.label}</div>
            <div style={{ fontSize: 11, color: MT, marginBottom: 7 }}>"{d.q}"</div>
            <div style={{ display: "flex", gap: 5 }}>
              {Object.entries(RL).map(([k, lb]) => (
                <button key={k} onClick={() => setResp(p => ({...p, [d.id]: k}))} style={{ flex: 1, padding: "5px 6px", fontSize: 11, fontWeight: resp[d.id]===k?600:400, border: `1.5px solid ${resp[d.id]===k?RC[k]:BD}`, borderRadius: 5, cursor: "pointer", background: resp[d.id]===k?(k==="crisis"?DL:k==="concern"?WL:GL):"transparent", color: resp[d.id]===k?RC[k]:MT }}>{lb}</button>
              ))}
            </div>
          </div>
        ))}
        <div style={{ textAlign: "center", fontSize: 11, color: MT, marginTop: 6 }}>{screened}/14 screened{screened < 8 && ` (need ${8-screened} more)`}</div>
      </div>}

      {step === 2 && <div>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <SC l="Score" v={`${composite}/28`} c={composite>14?DR:composite>7?WR:GR} />
          <SC l="Crisis" v={crisis.length} c={crisis.length?DR:GR} />
          <SC l="Concern" v={concerns.length} c={concerns.length?WR:GR} />
          <SC l="FPL" v={pct?`${pct}%`:"N/A"} c={A} />
        </div>
        {crisis.length > 0 && <div style={{ background: DL, border: `1px solid ${DR}`, borderRadius: 7, padding: "10px 12px", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: DR, fontSize: 13, marginBottom: 3 }}>Crisis Domains</div>
          {crisis.map(d => <div key={d.id} style={{ fontSize: 12, color: DR }}>• <strong>{d.label}</strong></div>)}
          {crisis.some(d => d.id === "safety") && <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600 }}>DV: 1-800-799-7233 · Crisis: 988 · Emergency: 911</div>}
        </div>}
        <Sec t="Results">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 5 }}>
            {DOMAINS.map(d => <div key={d.id} style={{ padding: "7px 9px", borderRadius: 5, fontSize: 11, background: !resp[d.id]?"#f1f5f9":resp[d.id]==="crisis"?DL:resp[d.id]==="concern"?WL:GL, border: `1px solid ${resp[d.id]?RC[resp[d.id]]:BD}` }}><div style={{ fontWeight: 600, marginBottom: 1 }}>{d.label}</div><div style={{ color: resp[d.id]?RC[resp[d.id]]:MT }}>{RL[resp[d.id]]||"Not screened"}</div></div>)}
          </div>
        </Sec>
        {elig.length > 0 && <Sec t={`Benefits (${elig.length})`}>
          <div style={{ fontSize: 10, color: MT, marginBottom: 6 }}>Educational screening only — not a determination</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: AL }}><th style={{ textAlign: "left", padding: "5px 8px", borderBottom: `2px solid ${A}` }}>Program</th><th style={{ textAlign: "left", padding: "5px 8px", borderBottom: `2px solid ${A}` }}>How to Apply</th><th style={{ textAlign: "left", padding: "5px 8px", borderBottom: `2px solid ${A}` }}>Notes</th></tr></thead>
            <tbody>{elig.map((p, i) => <tr key={p.name} style={{ background: i%2?"#f8fafc":"transparent" }}><td style={{ padding: "5px 8px", fontWeight: 600, borderBottom: `1px solid ${BD}` }}>{p.name}</td><td style={{ padding: "5px 8px", borderBottom: `1px solid ${BD}` }}>{p.apply}</td><td style={{ padding: "5px 8px", borderBottom: `1px solid ${BD}`, color: MT }}>{p.note||"—"}</td></tr>)}</tbody>
          </table>
        </Sec>}
        <Sec t="Next Steps">
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <Btn l="📋 Copy Report" o={() => { const r = report(); setCopyText(r); setModal(true); navigator.clipboard?.writeText(r); }} />
            <Btn l="💬 Send to Chat" o={() => sendPrompt(`SDOH screening results — generate referrals and build a service plan:\n\n${report()}`)} primary />
            <Btn l="🔄 New Screening" o={() => { setStep(0); setIntake({ clientId:"",forWhom:"self",state:"MO",county:"",urgency:"standard",householdSize:1,monthlyIncome:"",hasChildren:false,childrenAges:"",isPregnant:false,isVeteran:false,hasDisability:false,isSenior:false,employmentStatus:"unemployed",housingStatus:"stable" }); setResp({}); }} />
          </div>
        </Sec>
      </div>}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, paddingTop: 14, borderTop: `1px solid ${BD}` }}>
        <button onClick={() => setStep(Math.max(0, step-1))} disabled={step===0} style={{ padding: "9px 18px", borderRadius: 7, border: `1px solid ${BD}`, background: "transparent", color: step===0?BD:MT, cursor: step===0?"default":"pointer", fontSize: 12, fontWeight: 500 }}>← Back</button>
        {step < 2 && <button onClick={() => setStep(step+1)} disabled={step===0?false:screened<8} style={{ padding: "9px 22px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 600, cursor: (step===1&&screened<8)?"default":"pointer", background: (step===1&&screened<8)?BD:A, color: (step===1&&screened<8)?MT:"#fff" }}>{step===0?"Begin Screening →":"View Results →"}</button>}
      </div>

      {modal && <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={() => setModal(false)}>
        <div style={{ background: "#fff", borderRadius: 10, padding: 18, maxWidth: 560, width: "90%", maxHeight: "80vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><h3 style={{ margin: 0, fontSize: 15 }}>Report Copied</h3><button onClick={() => setModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: MT }}>×</button></div>
          <pre style={{ background: "#f1f5f9", padding: 10, borderRadius: 6, fontSize: 10, whiteSpace: "pre-wrap", maxHeight: 360, overflow: "auto", lineHeight: 1.5 }}>{copyText}</pre>
        </div>
      </div>}
    </div>
  );
}

function Sec({ t, children }) { return <div style={{ marginBottom: 18 }}><h2 style={{ fontSize: 14, fontWeight: 700, color: "#1e6bb8", marginBottom: 8, paddingBottom: 3, borderBottom: "1px solid #e2e8f0" }}>{t}</h2>{children}</div>; }
function R({ children }) { return <div style={{ display: "flex", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>{children}</div>; }
function F({ l, v, o, type = "text", p, ...props }) { return <div style={{ flex: 1, minWidth: 130 }}><label style={{ fontSize: 11, fontWeight: 500, color: "#475569", display: "block", marginBottom: 2 }}>{l}</label><input type={type} value={v} onChange={e => o(e.target.value)} placeholder={p} style={{ width: "100%", padding: "6px 9px", border: "1px solid #e2e8f0", borderRadius: 5, fontSize: 12, boxSizing: "border-box", outline: "none" }} {...props} /></div>; }
function S({ l, v, o, opts }) { return <div style={{ flex: 1, minWidth: 130 }}><label style={{ fontSize: 11, fontWeight: 500, color: "#475569", display: "block", marginBottom: 2 }}>{l}</label><select value={v} onChange={e => o(e.target.value)} style={{ width: "100%", padding: "6px 9px", border: "1px solid #e2e8f0", borderRadius: 5, fontSize: 12, background: "#fff", boxSizing: "border-box" }}>{opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>; }
function Tog({ l, c, o }) { return <button onClick={() => o(!c)} style={{ padding: "5px 11px", borderRadius: 18, fontSize: 11, cursor: "pointer", fontWeight: c?600:400, border: `1.5px solid ${c?"#1e6bb8":"#e2e8f0"}`, background: c?"#ebf4fa":"transparent", color: c?"#1e6bb8":"#64748b" }}>{c?"✓ ":""}{l}</button>; }
function SC({ l, v, c }) { return <div style={{ flex: 1, textAlign: "center", padding: "10px 6px", borderRadius: 7, border: `1px solid ${c}22`, background: `${c}08` }}><div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{l}</div></div>; }
function Btn({ l, o, primary }) { return <button onClick={o} style={{ padding: "9px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: primary?"none":"1px solid #e2e8f0", background: primary?"#1e6bb8":"#fff", color: primary?"#fff":"#1e293b" }}>{l}</button>; }
