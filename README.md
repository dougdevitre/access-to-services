# Access to Services

**A Social Determinants of Health (SDOH) screening, referral, and follow-up tool for Missouri.**

Screen clients across 14 SDOH domains, estimate benefits eligibility, auto-match to 58+ verified local resources, track referral outcomes, and monitor client progress over time — in English and Spanish.

Built as a [Claude skill](https://docs.anthropic.com) with an interactive React UI component.

---

## End-to-End Workflow

```
 STEP 1              STEP 2              STEP 3              STEP 4
 Client Intake       SDOH Screening      Results             Referrals & Follow-up
 ───────────────     ───────────────     ───────────────     ───────────────────────

 ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
 │ Household   │     │ 14 domains  │     │ Composite   │     │ Auto-matched     │
 │ composition │────>│ screened    │────>│ score       │────>│ resources by     │
 │ & income    │     │ (8 minimum) │     │ & benefits  │     │ domain + county  │
 │             │     │             │     │ eligibility │     │                  │
 │ County &    │     │ Crisis /    │     │             │     │ Referral tracker │
 │ state       │     │ Concern /   │     │ Crisis      │     │ (status, dates,  │
 │             │     │ No concern  │     │ alerts      │     │  notes)          │
 │ Special     │     │             │     │             │     │                  │
 │ circumstances│    │             │     │ Benefits    │     │ Warm handoff     │
 │ (veteran,   │     │             │     │ table       │     │ call scripts     │
 │  disability,│     │             │     │             │     │                  │
 │  pregnant)  │     │             │     │             │     │ Client history   │
 │             │     │             │     │             │     │ comparison       │
 └─────────────┘     └─────────────┘     └─────────────┘     └──────────────────┘
                                                                      │
       ┌──────────────────────────────────────────────────────────────┘
       v
 ┌──────────────────────────────────────────────────────────┐
 │  EXPORT: Copy report to case notes or send to Claude     │
 │  for AI-generated service plan with referrals            │
 │                                                          │
 │  SAVE: Screening saved to client history for future      │
 │  comparison and longitudinal case planning                │
 └──────────────────────────────────────────────────────────┘
```

---

## Why This Exists

Social service navigators, case managers, and community health workers spend significant time manually matching clients to programs and resources. This tool standardizes the screening process, surfaces benefits a client may qualify for, and connects flagged domains to verified local resources — all in one workflow.

**This is not a diagnostic tool.** It is an educational screening aid. All eligibility results are estimates, not determinations.

---

## Features

### 1. Client Intake

Collects household composition, income, geography, and special circumstances to inform eligibility screening. Returning clients see a **"View Previous"** button to load past screening data.

```
┌─────────────────────────────────────────────┐
│  Client Information                          │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Client ID    │  │ Who is this for?  v │  │
│  └──────────────┘  └─────────────────────┘  │
│                                              │
│  Household                                   │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │ HH Size: 4   │  │ Income: $2,400/mo  │  │
│  └──────────────┘  └─────────────────────┘  │
│  ┌──────────────────────────────────────┐   │
│  │ 90% FPL — Likely Medicaid + SNAP     │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Special Circumstances                       │
│  [✓ Children] [ Pregnant] [ Veteran]        │
│  [✓ Disability] [ Age 60+]                  │
└─────────────────────────────────────────────┘
```

### 2. SDOH Screening (14 Domains)

Each domain uses a plain-language screening question appropriate for direct client conversation:

```
┌─────────────────────────────────────────────┐
│  1. Food Security                            │
│  "Have you worried about running out of      │
│   food in the past 30 days?"                 │
│                                              │
│  [No concern] [Some concern] [URGENT/CRISIS] │
├─────────────────────────────────────────────┤
│  2. Housing                                  │
│  "Are you worried about losing your housing  │
│   or do you need a place to stay?"           │
│                                              │
│  [No concern] [Some concern] [URGENT/CRISIS] │
├─────────────────────────────────────────────┤
│  ...12 more domains...                       │
│                                              │
│           8 / 14 domains screened            │
└─────────────────────────────────────────────┘
```

**Domains covered:** Food Security, Housing, Safety, Transportation, Utilities, Financial Strain, Employment, Education, Healthcare Access, Mental Health, Substance Use, Social Support, Child Care, Legal Issues

**Scoring:** No concern (0) · Some concern (1) · Urgent/Crisis (2) · Composite: 0-28

### 3. Results & Benefits

```
┌─────────────────────────────────────────────┐
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ │
│  │ Score  │ │ Crisis │ │Concern │ │ FPL  │ │
│  │ 12/28  │ │   2    │ │   3    │ │ 90%  │ │
│  └────────┘ └────────┘ └────────┘ └──────┘ │
│                                              │
│  ⚠ CRISIS: Housing, Safety                  │
│  DV Hotline: 1-800-799-7233 · Crisis: 988  │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ SNAP         mydss.mo.gov            │   │
│  │ Medicaid     mydss.mo.gov            │   │
│  │ LIHEAP       Community Action Agency │   │
│  │ School Meals Through the school      │   │
│  │ Section 8    Local PHA (waitlist)    │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 4. Referrals & Follow-up

The tool auto-matches flagged domains to resources based on the client's county:

```
┌─────────────────────────────────────────────────────────┐
│  MATCHED RESOURCES                                       │
│                                                          │
│  Housing (CRISIS)                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Gateway Homeless Services  314-231-1515           │   │
│  │                            [+ Refer] [Call Script]│   │
│  ├──────────────────────────────────────────────────┤   │
│  │ STL Housing Authority      314-531-4770           │   │
│  │                            [Referred] [Call Script]│  │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  REFERRAL TRACKER                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ STL Housing Authority                             │   │
│  │ Status: [Contacted ▾]  Follow-up: [2026-04-03]   │   │
│  │ Notes: [Left message with intake coordinator    ] │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Affinia Healthcare                                │   │
│  │ Status: [Enrolled ▾]   Follow-up: [2026-04-10]   │   │
│  │ Notes: [Appt scheduled for 4/5               ]   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  SCREENING HISTORY (Client #A-1042)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ✓ Housing: Improved  ✗ Mental Health: Worsened   │   │
│  │ ★ Employment: New concern                         │   │
│  │ (compared to screening on 1/15/2026)              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Warm Handoff Scripts** — Click "Call Script" on any resource for a ready-to-use 3-part script:

```
┌─────────────────────────────────────────────┐
│  WARM HANDOFF SCRIPT                         │
│                                              │
│  1. Call the Organization                    │
│  "Hi, I'm calling from [agency]. I'm        │
│   working with a client who needs help with  │
│   housing. Can I do a warm handoff?"         │
│                                              │
│  2. Introduce the Client                     │
│  "[Client], I have Gateway Homeless Services │
│   on the line. They can help with housing.   │
│   Is it okay if I introduce you?"            │
│                                              │
│  Resource Details                            │
│  Organization: Gateway Homeless Services     │
│  Phone: 314-231-1515                         │
│  Address: 1419 N 11th St, St. Louis 63106   │
│                                              │
│  3. After the Call                           │
│  • Document the referral in case notes       │
│  • Set follow-up reminder for 3-5 days       │
│  • If no connection, try alternative         │
└─────────────────────────────────────────────┘
```

---

## Referral Status Flow

```
                    ┌──────────┐
                    │ PENDING  │  Referral created
                    └────┬─────┘
                         │
                    ┌────v─────┐
                    │CONTACTED │  Provider called org
                    └────┬─────┘
                         │
            ┌────────────┼────────────┬──────────────┐
            v            v            v              v
      ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐
      │ ENROLLED │ │ DECLINED │ │WAITLISTED│ │NO RESPONSE│
      └────┬─────┘ └──────────┘ └──────────┘ └───────────┘
           │
      ┌────v─────┐
      │COMPLETED │  Client accessed service
      └──────────┘
```

---

## Benefits Eligibility (2025 FPL)

```
FPL %    0%        50%       100%      130%  138%     185%       300%
─────────┼─────────┼─────────┼─────────┼─────┼────────┼──────────┼────
         │         │         │         │     │        │          │
SSI      │■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■│ (disability)
Section 8│■■■■■■■■■│         │         │     │        │          │ (waitlist)
TANF     │■■■■■■■■■│         │         │     │        │          │ (families)
Head St. │■■■■■■■■■■■■■■■■■■■│         │     │        │          │ (under 5)
SNAP     │■■■■■■■■■■■■■■■■■■■■■■■■■■■■■│     │        │          │
Free Meal│■■■■■■■■■■■■■■■■■■■■■■■■■■■■■│     │        │          │ (school)
Medicaid │■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■│        │          │ (adult)
LIHEAP   │■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■│          │
WIC      │■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■│          │ (preg/kids)
Rd. Meal │■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■│          │ (school)
Ch. Care │■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■│          │ (families)
Med Kids │■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■│ (children)
```

---

## Resource Directory

`mo-resources.json` contains **58 verified Missouri social service resources** following a structured schema ([SCHEMA.md](SCHEMA.md)).

### Geographic Coverage

```
                    ┌─────────────────────────────────────┐
                    │            MISSOURI                  │
                    │                                      │
       NW MO       │    NE MO            Statewide: 16   │
       (via state)  │    (via state)       National:  10   │
                    │                                      │
    ┌───────┐      │         ┌───────┐                    │
    │ KC    │ 6    │         │ Mid-  │ 3                  │
    │ Metro │──────│─────────│ MO    │                    │
    └───────┘      │         └───────┘                    │
                    │                                      │
    ┌───────┐      │                    ┌───────┐         │
    │Western│ 3    │                    │ STL   │ 9       │
    │ MO    │──────│────────────────────│ Metro │         │
    └───────┘      │                    └───────┘         │
                    │                                      │
    ┌───────┐      │                    ┌───────┐         │
    │ SW MO │ 2    │                    │Eastern│ 3       │
    │       │──────│────────────────────│ MO    │         │
    └───────┘      │                    └───────┘         │
                    │                                      │
                    │         ┌───────┐                    │
                    │         │ SE MO │ 2                  │
                    │         │Boothl.│                    │
                    │         └───────┘                    │
                    └─────────────────────────────────────┘
```

### Service Types

```
Crisis Hotlines  ████████████████████████  13
FQHCs            ████████████              6
Government       ████████                  4
Shelters         ██████                    3
Legal Aid        ██████                    3
Housing Auth.    ██████                    3
Food Banks       ██████                    3
Community Action ██████                    3
CMHCs            ██████                    3
Workforce        ████                      2
VA Medical       ████                      2
SUD Treatment    ████                      2
Advocacy         ████                      2
Immigration      ████                      2
Reentry          ████                      2
Transit          ██                        1
Referral         ██                        1
```

### Domain Coverage

```
mental_health   ██████████████████████████  13
healthcare      ██████████████████████████  13
housing         ██████████████████████      11
food            ██████████████████          9
public_safety   ████████████████            8
substance_use   ██████████████              7
employment      ██████████████              7
legal           ████████████                6
crisis          ████████████                6
children        ████████████                6
financial       ██████████                  5
aging           ████████                    4
disability      ████████                    4
transportation  ██████                      3
education       ██████                      3
family          ████                        2
reentry         ████                        2
immigration     ████                        2
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        intake-app.jsx                            │
│                     (React UI Component)                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Step 0  │  │  Step 1  │  │  Step 2  │  │    Step 3      │  │
│  │  Intake  │─>│ Screening│─>│ Results  │─>│   Referrals    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
│       │                            │               │             │
│       v                            v               v             │
│  ┌─────────┐                ┌───────────┐   ┌────────────────┐  │
│  │ client- │                │ resource- │   │   referral-    │  │
│  │ history │                │ matcher   │   │   tracker      │  │
│  │ .js     │                │ .js       │   │   .js          │  │
│  └────┬────┘                └─────┬─────┘   └───────┬────────┘  │
│       │                           │                  │           │
│       v                           v                  v           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    localStorage                          │    │
│  │  Sessions · Client History · Referral Status             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                     │
│                            v                                     │
│  ┌─────────────┐    ┌──────────┐    ┌────────────────────────┐  │
│  │  i18n.js    │    │mo-resour-│    │ access-to-services     │  │
│  │  EN / ES    │    │ces.json  │    │ .skill (Claude skill)  │  │
│  └─────────────┘    │ 58 orgs  │    └────────────────────────┘  │
│                      └──────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
                  Client enters
                  household info
                       │
                       v
              ┌────────────────┐
              │  FPL Calculator │  Income × 12 ÷ FPL threshold
              │  (2025 values)  │  for household size
              └───────┬────────┘
                      │
          ┌───────────┼───────────┐
          v           v           v
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │  SNAP    │ │ Medicaid │ │ 10 more  │  12 programs filtered
    │  ≤130%   │ │  ≤138%   │ │ programs │  by FPL + population
    └──────────┘ └──────────┘ └──────────┘
                      │
                      v
              ┌────────────────┐
              │  14-Domain     │  Each domain scored 0-2
              │  SDOH Screening│  Composite score 0-28
              └───────┬────────┘
                      │
          ┌───────────┼───────────┐
          v           v           v
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │  Crisis  │ │ Concern  │ │  No      │  Flagged domains
    │  domains │ │ domains  │ │ concern  │  drive referrals
    └────┬─────┘ └────┬─────┘ └──────────┘
         │            │
         v            v
    ┌─────────────────────┐
    │   Resource Matcher   │  Flagged domains + county
    │   (resource-matcher) │  → top 5 resources per domain
    └──────────┬──────────┘  sorted by geographic relevance
               │
               v
    ┌─────────────────────┐
    │   Referral Tracker   │  Status · Follow-up dates
    │   (referral-tracker) │  Provider notes · Outcomes
    └──────────┬──────────┘
               │
               v
    ┌─────────────────────┐
    │   Client History     │  Save by Client ID
    │   (client-history)   │  Compare screenings over time
    └─────────────────────┘
```

---

## Project Structure

```
access-to-services/
├── intake-app.jsx              # React SDOH intake & screening component (4 steps)
├── resource-matcher.js         # Domain-to-resource matching engine
├── referral-tracker.js         # Referral status management & follow-up
├── client-history.js           # Client screening history & comparison
├── i18n.js                     # English + Spanish translations (130+ strings)
├── mo-resources.json           # Verified Missouri resource directory (58 entries)
├── mo-resources.schema.json    # JSON Schema for resource validation
├── access-to-services.skill    # Claude skill definition
├── SCHEMA.md                   # Human-readable schema & query guide
├── eval-results.md             # Skill routing evaluation (15 test cases)
├── scripts/
│   └── validate.js             # Resource directory validation (schema + freshness)
├── tests/
│   └── eligibility.test.js     # 58 automated tests (FPL, eligibility, data integrity)
├── .github/
│   ├── workflows/validate.yml  # CI: validate + test on every PR
│   ├── ISSUE_TEMPLATE/         # Templates for adding resources & reporting issues
│   └── PULL_REQUEST_TEMPLATE.md
├── package.json                # npm scripts: validate, test, check
├── CONTRIBUTING.md             # How to add resources and submit changes
├── SECURITY.md                 # Data handling, privacy, vulnerability reporting
├── LICENSE                     # Apache-2.0 (code) + CC-BY-4.0 (data)
└── .gitignore
```

---

## Quick Start

### As a Claude Skill
The `access-to-services.skill` file is loaded directly by Claude. When active, it provides SDOH screening, benefits guidance, crisis triage, and referral generation backed by the resource directory.

### Embedding the React Component

```jsx
import SDOHIntakeApp from "./intake-app";

function App() {
  return <SDOHIntakeApp />;
}
```

The component expects an optional global `sendPrompt(text)` function for chat integration. If unavailable, "Send to Chat" falls back to clipboard copy.

### Running Validation & Tests

```bash
# Validate schema, vocabulary, freshness, and actionability
node scripts/validate.js

# Run all 58 automated tests (FPL, eligibility, data integrity)
node tests/eligibility.test.js

# Run both
npm run check
```

---

## Contributing

We welcome contributions from navigators, case managers, social workers, developers, and anyone who wants to improve access to services.

**Common contributions:**
- Adding a new resource to `mo-resources.json`
- Reporting outdated phone numbers or hours
- Improving accessibility or mobile responsiveness
- Adding coverage for underserved Missouri regions
- Translating to additional languages (see `i18n.js`)

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide, including required fields, validation steps, and submission process.

---

## Accessibility

The React component includes:
- Semantic HTML (`<header>`, `<nav>`, `<section>`, `<fieldset>`)
- ARIA attributes (`role="radiogroup"`, `aria-checked`, `role="switch"`, `aria-current`, `aria-label`, `aria-modal`)
- Programmatic `<label htmlFor>` associations on all form fields
- Keyboard support (Escape to close modals)
- Screen reader announcements via `role="status"` and `role="alert"` for crisis warnings and progress
- Language toggle (English / Spanish) with `lang` attribute on root element

---

## Data Standards

The resource directory schema draws from:
- **[Open Referral / HSDS](https://openreferral.org/)** — field naming and structure patterns
- **CMS AHC HRSN** — screening domain selection
- **PRAPARE** — breadth of social determinants covered

The 14-domain screener is broader than the CMS 5-core AHC HRSN and comparable in scope to PRAPARE, optimized for actionability (every screened domain connects to a referral pathway).

---

## Important Notes

- **Not a diagnostic tool.** This is an educational screening aid, not a clinical instrument or eligibility determination.
- **Verify before sharing.** Always confirm phone numbers, hours, and addresses before giving them to clients. Resource data decays ~30-40% per year.
- **Crisis takes priority.** If a client discloses immediate danger, domestic violence, or suicidal ideation, address safety first. 988 (crisis) · 1-800-799-7233 (DV) · 911 (emergency).
- **Privacy.** The Client ID field should use internal identifiers only — never enter PII (names, SSNs, DOBs) into the screening tool. Data is stored in browser localStorage only.

---

## License

Code is licensed under [Apache License 2.0](LICENSE).
Resource data in `mo-resources.json` is provided under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
