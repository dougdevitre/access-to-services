# Contributing to Access to Services

Thank you for helping improve access to social services in Missouri. This guide covers how to contribute resources, report data issues, and submit code changes.

## Adding a Resource

Resource entries live in `mo-resources.json`. To add a new organization:

### Required Fields

| Field | Example | Notes |
|-------|---------|-------|
| `id` | `stl-food-outreach` | Unique. Use pattern: `region-shortname` |
| `name` | `Food Outreach` | Official organization name |
| `domain` | `["food"]` | From [standard vocabulary](#domain-vocabulary) |
| `type` | `food_bank` | Organization type |
| `coverage` | `stl_metro` | Geographic coverage area |
| `population` | `["all"]` | From [standard vocabulary](#population-vocabulary) |
| `description` | `"Provides nutritious food..."` | Brief, accurate description |
| `verified` | `2026-03-28` | Date you verified the information (YYYY-MM-DD) |

### Optional Fields

`phone`, `phone_alt`, `address`, `website`, `hours`, `counties`, `cost`, `insurance`, `note`

### Submission Checklist

Before submitting a new resource:

- [ ] Verified the organization is currently operating (called or checked website)
- [ ] Confirmed the phone number connects to the organization
- [ ] Checked for duplicate entries in `mo-resources.json`
- [ ] Used standard domain and population vocabulary
- [ ] Set `verified` to today's date
- [ ] Ran `node scripts/validate.js` and it passes

### How to Submit

1. Fork the repository
2. Add your entry to the `resources` array in `mo-resources.json`
3. Run `node scripts/validate.js` to validate
4. Open a pull request with the title: `Add resource: [Organization Name]`
5. Include in the PR description: how you verified the information and your relationship to the organization (if any)

## Reporting Incorrect Information

If you find outdated or incorrect resource data:

1. Open an issue with the title: `Data issue: [Organization Name]`
2. Include: what is wrong, what the correct information is, and how you know

Common issues: phone number changed, organization closed, hours changed, address moved.

## Code Changes

### Setup

```bash
git clone https://github.com/dougdevitre/access-to-services.git
cd access-to-services
```

### Before Submitting

1. Run validation: `node scripts/validate.js`
2. Run tests: `node tests/eligibility.test.js`
3. Test any JSX changes in a React environment

### Code Style

- Use descriptive variable names (not abbreviated)
- Include ARIA attributes for interactive elements
- Keep screening questions at a 5th-8th grade reading level
- Do not commit PII or real client data

## Domain Vocabulary

```
food, housing, mental_health, substance_use, healthcare, education,
employment, legal, children, family, public_safety, disability,
aging, transportation, crisis, financial, immigration, reentry
```

## Population Vocabulary

```
all, low_income, seniors, disabled, children, children_0_3,
children_under5, school_age, families_with_children, veterans,
pregnant, lgbtq_youth, justice_involved, homeless, immigrants,
caregivers, medicare, families_prenatal_5, families_children_disabilities,
all_rural
```

## Questions?

Open an issue or reach out to the maintainers.
