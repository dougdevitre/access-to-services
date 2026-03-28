# Access to Services

**A Social Determinants of Health (SDOH) screening and referral tool for Missouri.**

Screen clients across 14 SDOH domains, estimate benefits eligibility using 2025 Federal Poverty Level guidelines, and generate referrals from a verified directory of 58+ Missouri social service organizations.

Built as a [Claude skill](https://docs.anthropic.com) with an interactive React UI component.

---

## Why This Exists

Social service navigators, case managers, and community health workers spend significant time manually matching clients to programs and resources. This tool standardizes the screening process, surfaces benefits a client may qualify for, and connects flagged domains to verified local resources — all in one workflow.

**This is not a diagnostic tool.** It is an educational screening aid. All eligibility results are estimates, not determinations.

---

## What It Does

### 1. Client Intake
Collects household composition, income, geography, and special circumstances (veteran status, disability, pregnancy, etc.) to inform eligibility screening.

### 2. SDOH Screening (14 Domains)
Each domain uses a plain-language screening question appropriate for direct client conversation:

| Domain | Screening Question |
|--------|--------------------|
| Food Security | Have you worried about running out of food in the past 30 days? |
| Housing | Are you worried about losing your housing or do you need a place to stay? |
| Safety | Do you feel physically and emotionally safe where you live? |
| Transportation | Can you reliably get to appointments and services? |
| Utilities | Have you had trouble paying utility bills in the past 12 months? |
| Financial Strain | Are you having trouble paying for basic needs like rent, food, or medicine? |
| Employment | Do you need help finding a job or a better job? |
| Education | Do you or your children need help with school, training, or GED? |
| Healthcare Access | Do you have health insurance and access to a doctor? |
| Mental Health | Have you been feeling down, depressed, hopeless, or overwhelmed? |
| Substance Use | Do you have concerns about alcohol or drug use? |
| Social Support | Do you have people you can count on for help and support? |
| Child Care | Do you have reliable, affordable child care? |
| Legal Issues | Do you have legal issues that need attention? |

Responses are scored as **No concern** (0), **Some concern** (1), or **Urgent/Crisis** (2) to produce a composite SDOH score.

### 3. Benefits Eligibility Estimation
Screens against 12 Missouri programs using income-to-FPL thresholds:

| Program | FPL Threshold | Population |
|---------|:------------:|------------|
| SNAP | 130% | All |
| WIC | 185% | Pregnant / children under 5 |
| Medicaid (Adult) | 138% | Adults |
| Medicaid (Children) | 300% | Children |
| TANF | 50% | Families with children |
| Child Care Subsidy | 185% | Families with children |
| LIHEAP | 150% | All |
| School Meals (Free) | 130% | School-age children |
| School Meals (Reduced) | 185% | School-age children |
| Head Start | 100% | Children under 5 |
| Section 8 (HCV) | 50% | All (waitlist) |
| SSI | — | Disability required |

### 4. Report Generation
Produces a structured screening summary with crisis flags, composite scores, benefits matches, and priority actions — ready to copy into case notes or send to a Claude chat for referral generation.

---

## Resource Directory

`mo-resources.json` contains **58 verified Missouri social service resources** following a structured schema ([SCHEMA.md](SCHEMA.md)).

### Coverage

| Area | Resources | Key Types |
|------|:---------:|-----------|
| Statewide | 16 | FSD, hotlines, CMHCs, legal aid, workforce, VR |
| National | 10 | 988, DV hotline, SAMHSA, Veterans Crisis Line, RAINN |
| St. Louis metro | 9 | FQHCs, shelters, DV services, housing authority, SUD |
| Kansas City metro | 6 | FQHCs, shelters, housing authority, legal aid |
| Mid-Missouri | 3 | FQHC, community action agencies |
| SE Missouri | 2 | FQHC, community action (Bootheel) |
| SW Missouri | 2 | CMHCs, food bank |
| Eastern MO | 3 | VA, legal aid, food bank |
| Western MO | 3 | VA, legal aid, food bank |

### Service Types
Crisis hotlines, FQHCs, CMHCs, food banks, shelters (emergency + DV), housing authorities, legal aid, SUD treatment, veteran services, community action agencies, reentry programs, immigration services, disability advocacy, child care referral, workforce centers, and government programs.

### Data Quality
- Every entry includes a `verified` date (YYYY-MM-DD)
- Entries older than 6 months are flagged for re-verification
- Validated against a [JSON Schema](mo-resources.schema.json) on every commit
- Schema enforces standard domain and population vocabularies

---

## Project Structure

```
access-to-services/
├── intake-app.jsx              # React SDOH intake & screening component
├── mo-resources.json           # Verified Missouri resource directory (58 entries)
├── mo-resources.schema.json    # JSON Schema for resource validation
├── access-to-services.skill    # Claude skill definition
├── SCHEMA.md                   # Human-readable schema & query guide
├── eval-results.md             # Skill routing evaluation (15 test cases)
├── scripts/
│   └── validate.js             # Resource directory validation (schema + freshness)
├── tests/
│   └── eligibility.test.js     # 58 automated tests (FPL, eligibility, data integrity)
├── CONTRIBUTING.md             # How to add resources and submit changes
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

### Validating Resources

```bash
# Validate schema, vocabulary, freshness, and actionability
node scripts/validate.js

# Run all automated tests (FPL, eligibility, data integrity)
node tests/eligibility.test.js
```

---

## Contributing

We welcome contributions from navigators, case managers, social workers, developers, and anyone who wants to improve access to services.

**Common contributions:**
- Adding a new resource to `mo-resources.json`
- Reporting outdated phone numbers or hours
- Improving accessibility or mobile responsiveness
- Adding coverage for underserved Missouri regions

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide, including required fields, validation steps, and submission process.

---

## Accessibility

The React component includes:
- Semantic HTML (`<header>`, `<nav>`, `<section>`, `<fieldset>`)
- ARIA attributes (`role="radiogroup"`, `aria-checked`, `role="switch"`, `aria-current`, `aria-label`, `aria-modal`)
- Programmatic `<label htmlFor>` associations on all form fields
- Keyboard support (Escape to close modals)
- Screen reader announcements via `role="status"` and `role="alert"` for crisis warnings and progress

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
- **Privacy.** The Client ID field should use internal identifiers only — never enter PII (names, SSNs, DOBs) into the screening tool.

---

## License

Code is licensed under [Apache License 2.0](LICENSE).
Resource data in `mo-resources.json` is provided under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
