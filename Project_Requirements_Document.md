# Project Requirements Document: SolarCalc PH — Solar ROI & Battery Calculator

> **Version:** 1.0.0
> **Date:** 2026-03-16
> **Source:** `250915 SOLAR ROI .xlsx` spreadsheet + `Solar_ROI_App_PRD_v2.md`
> **Status:** Draft

---

## 1. Executive Summary

**SolarCalc PH** is a Progressive Web App (PWA) that allows Philippine homeowners, business owners, and solar sales reps to calculate solar photovoltaic and battery storage return-on-investment in real time — entirely offline, with zero backend dependencies.

**Tagline:** *"Know your payback before you pay."*

The app digitizes and extends the logic from the "250915 SOLAR ROI" spreadsheet, which models three scenarios (Solar Only, Battery Only, Combined) with configurable inputs for electricity rates, operating schedules, system sizing, battery storage, and loan financing.

---

## 2. Problem Statement

The existing Excel spreadsheet (`250915 SOLAR ROI .xlsx`) provides a powerful ROI model but has significant limitations:

- **Not mobile-friendly** — sales reps can't use it on-site with clients
- **No offline capability** — requires Excel or a compatible app
- **No guided onboarding** — users must understand which cells to edit ("ONLY ENCODE IN THE BLUE")
- **No input validation** — users can enter invalid data without warning
- **No contextual help** — tooltips and explanations are absent
- **Single-scenario view** — the spreadsheet calculates Solar, Battery, and Combined, but the UX is not intuitive

---

## 3. Goals & Success Criteria

| Goal | Success Metric |
|------|---------------|
| Mobile-first PWA installable on Android and iOS | Lighthouse PWA audit ≥ 90 |
| Works fully offline after first load | Passes Chrome DevTools offline test |
| Real-time KPI calculation on every input change | All 8+ KPI cards update instantly |
| Guided onboarding for non-technical users | Modal with 4 slides explaining blended rate, annual usage |
| Accessible to all users | Lighthouse Accessibility audit ≥ 90 |
| No backend, no build pipeline, static hosting | Deploys to GitHub Pages with zero server costs |

---

## 4. Scope

### 4.1 In Scope (V1)

- **Section 1 — Status Quo:** Electricity rate (₱/kWh), operating schedule (weeks/year, days/week), optional annual bill with reverse-calc
- **Section 2 — Solar System:** Capacity (kW), peak sun hours, price per kW, misc infrastructure costs, battery price per kWh
- **Section 3 — Battery Storage:** Nighttime load (kW), nighttime duration (hours), auto-calculated battery kWh and extra solar requirement
- **Section 4 — Financing:** Loan principal, annual interest rate, loan term (months), standard amortization formula
- **KPI Dashboard:** Total CAPEX, Annual Savings, Simple ROI %, Payback Years, Monthly Savings, Monthly Amortization, Net Monthly Cash Flow, Total Interest Paid
- **PWA Features:** Service worker, manifest, offline caching, Add to Home Screen
- **Onboarding Modal:** 4-slide guide explaining blended rate, annual usage, and defaults
- **Tooltip System:** Contextual help on every input field
- **Responsive Design:** Mobile (< 768px), Tablet (768–1023px), Desktop (≥ 1024px)

### 4.2 Out of Scope (V1)

- GEOP rate comparison logic (present in spreadsheet Sheet "GEOP" but deferred)
- PDF export
- User accounts / login / cross-session persistence
- Backend API or database
- Multi-language / i18n
- Dark mode
- Charts or graphs
- Net metering / feed-in tariff calculations
- Excess energy sold calculations (present in spreadsheet but deferred)

---

## 5. Data Model

### 5.1 Input Fields

| Field | Type | Default | Unit | Validation | Section | Spreadsheet Cell(s) |
|-------|------|---------|------|------------|---------|---------------------|
| `electricityRate` | number | 10.00 | ₱/kWh | > 0, max 100 | 1 | K4 (COST PER KW = 11) |
| `operatingWeeksPerYear` | number | 52 | weeks | 1–52, integer | 1 | K5 (50) |
| `operatingDaysPerWeek` | number | 7 | days | 1–7, integer | 1 | K6 (6) |
| `annualBill` | number | null | ₱ | ≥ 0 or null | 1 | O5 (5,000,000) |
| `solarCapacityKW` | number | 10 | kW | > 0, max 100,000 | 2 | K13 (300) |
| `peakSunHoursPerDay` | number | 4.0 | hours | 0.5–8, step 0.1 | 2 | K7 (4) |
| `solarPricePerKW` | number | 30,000 | ₱/kW | > 0 | 2 | K8 (40,000) |
| `miscInfraCosts` | number | 0 | ₱ | ≥ 0 | 2 | K10 (2,000,000) |
| `batteryPricePerKWh` | number | 12,000 | ₱/kWh | > 0 | 2 | K9 (5,000) |
| `nighttimeLoadKW` | number | 0 | kW | ≥ 0 | 3 | — |
| `nighttimeDurationHours` | number | 0 | hours | ≥ 0, max 24 | 3 | — |
| `loanPrincipal` | number | 0 | ₱ | ≥ 0 | 4 | S6 (14,000,000) |
| `annualInterestRate` | number | 0 | % | 0–100 | 4 | V5 (12%) |
| `loanTermMonths` | number | 60 | months | 1–360, integer | 4 | S5 (60) |

### 5.2 Computed Fields

| Field | Formula | Unit |
|-------|---------|------|
| `operatingDaysPerYear` | `operatingWeeksPerYear × operatingDaysPerWeek` | days |
| `requiredBatteryKWh` | `nighttimeLoadKW × nighttimeDurationHours` | kWh |
| `extraSolarForBatteryKW` | `IF requiredBatteryKWh > 0 THEN requiredBatteryKWh / peakSunHoursPerDay ELSE 0` | kW |
| `totalSolarKW` | `solarCapacityKW + extraSolarForBatteryKW` | kW |
| `totalCapex` | `(totalSolarKW × solarPricePerKW) + (requiredBatteryKWh × batteryPricePerKWh) + miscInfraCosts` | ₱ |
| `annualGenerationKWh` | `totalSolarKW × peakSunHoursPerDay × operatingDaysPerYear` | kWh |
| `annualSavings` | `annualGenerationKWh × electricityRate` | ₱ |
| `simpleROI` | `IF totalCapex > 0 THEN (annualSavings / totalCapex) × 100 ELSE 0` | % |
| `paybackYears` | `IF annualSavings > 0 THEN totalCapex / annualSavings ELSE Infinity` | years |
| `monthlyAmortization` | Standard annuity formula (see PRD Section 7) | ₱/month |
| `totalLoanCost` | `monthlyAmortization × loanTermMonths` | ₱ |
| `totalInterestPaid` | `totalLoanCost - loanPrincipal` | ₱ |
| `monthlySavings` | `annualSavings / 12` | ₱/month |
| `netMonthlyCashFlow` | `monthlySavings - monthlyAmortization` | ₱/month |

### 5.3 Spreadsheet Verification (from "250915 SOLAR ROI .xlsx")

The spreadsheet models three scenarios with these results:

| Scenario | CAPEX | Annual Savings | Simple ROI | Payback |
|----------|-------|---------------|------------|---------|
| **A. Solar Only** (300 kW, 4h/day, 300 days) | ₱14,000,000 | ₱3,600,000 | 25.7%/yr | ~3.89 yr |
| **B. Battery Only** (400 kWh LFP, +1h/day) | ₱3,200,000 | ₱900,000 | 28.1%/yr | ~3.56 yr |
| **C. Combined** (Solar + Battery) | ₱17,200,000 | ₱4,500,000 | 26.2%/yr | ~3.82 yr |

Loan example from spreadsheet: ₱14,000,000 principal @ 12% annual over 60 months = ₱311,422.27/month, total payable ₱18,685,336.06, interest ₱4,685,336.06.

---

## 6. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Markup | HTML5 semantic elements | PWA baseline, no build step |
| Styling | Tailwind CSS via CDN | Rapid responsive layout, no build step |
| Logic | Vanilla JavaScript (ES2022 modules) | Zero dependencies, offline-first |
| PWA | `manifest.json` + `sw.js` | Offline caching, installability |
| State | Single reactive `state` object with `Proxy`-based change detection | Real-time recalc on every input |
| Icons | Inline SVG or emoji fallback | No icon font dependency |

**Not using:** React, Vue, npm, any backend/API, localStorage persistence (V1 is sessionless).

---

## 7. File Structure

```
solarcalc-ph/
├── index.html              # Single page app shell
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (cache-first)
├── css/
│   └── custom.css          # Custom overrides
├── js/
│   ├── app.js              # Entry point: init state, bind events, render
│   ├── state.js            # Reactive state object + Proxy watcher
│   ├── calc.js             # Pure calculation functions (no DOM)
│   ├── ui.js               # DOM manipulation, rendering, tooltips
│   ├── onboarding.js       # Modal/guide logic
│   └── format.js           # Currency/number formatting helpers
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── tests/
│   └── calc.test.js        # Unit tests (console.assert)
└── README.md
```

---

## 8. UI Requirements

### 8.1 Layout

- **Mobile (< 768px):** Single column, collapsible accordion sections, sticky bottom KPI sheet
- **Tablet (768–1023px):** Single column, wider inputs, KPI below form
- **Desktop (≥ 1024px):** Two-column — inputs (60%) left, KPI dashboard sticky sidebar (40%) right

### 8.2 KPI Dashboard

| # | KPI | Format | Color Coding |
|---|-----|--------|-------------|
| 1 | Total CAPEX | ₱ #,###,### | — |
| 2 | Annual Savings | ₱ #,###,### /yr | Green if > 0 |
| 3 | Simple ROI | ##.#% /yr | Green ≥ 15%, Yellow 8–14.9%, Red < 8% |
| 4 | Payback Period | #.# years | Green ≤ 5, Yellow 5.1–8, Red > 8 |
| 5 | Monthly Savings | ₱ #,###,### /mo | — |
| 6 | Monthly Amortization | ₱ #,###,### /mo | Show only if loan > 0 |
| 7 | Net Monthly Cash Flow | ₱ #,###,### /mo | Green if +, Red if −. Show only if loan > 0 |
| 8 | Total Interest Paid | ₱ #,###,### | Show only if loan > 0 |

### 8.3 Design System

- **Primary color:** `#0f766e` (teal-700)
- **Font:** Inter via Google Fonts, fallback system-ui
- **KPI values:** 28px bold (desktop), 22px (mobile)
- **Border radius:** `rounded-xl` cards, `rounded-lg` inputs

---

## 9. Accessibility Requirements

- All inputs have associated `<label>` elements
- Tooltips use `role="tooltip"` and `aria-describedby`
- KPI color coding supplemented with text labels
- Modal uses `<dialog>` with focus trapping
- Minimum touch target: 44×44px
- Keyboard navigation through all inputs
- `prefers-reduced-motion` support

---

## 10. Implementation Phases

| Phase | Deliverable | Acceptance Criteria |
|-------|-------------|---------------------|
| 1 | `calc.js` + `tests/calc.test.js` | All test cases pass via `node tests/calc.test.js` |
| 2 | `state.js` with Proxy reactivity | State changes trigger callbacks |
| 3 | `format.js` with ₱ formatting | `formatCurrency(146000)` → `"₱146,000.00"` |
| 4 | `index.html` shell + Tailwind + manifest | Opens in browser with header |
| 5 | `ui.js` — Section 1 + KPI dashboard | Real-time KPI updates |
| 6 | `ui.js` — Sections 2, 3, 4 | All inputs wired |
| 7 | Tooltip system | Click ❓ opens/closes tooltips |
| 8 | Onboarding modal | 4-slide guide |
| 9 | `sw.js` — offline caching | App loads offline |
| 10 | Responsive polish + KPI coloring | Visual check at 375px, 768px, 1024px |
| 11 | Accessibility audit | Tab order, labels, color not sole indicator |

---

## 11. Edge Cases

| Scenario | Behavior |
|----------|----------|
| All fields at default | KPIs compute normally |
| Empty input | Treat as 0; show "Required" hint for mandatory fields |
| Nighttime load & duration = 0 | "No battery needed" message |
| Loan > CAPEX | Warning: "Loan exceeds system cost" (non-blocking) |
| Rate entered as 0.12 instead of 12 | Hint: "Did you mean 12%?" |
| Division by zero | Return Infinity or 0 per formula; display "—" for Infinity |

---

## 12. Testing Checklist

- [ ] `node tests/calc.test.js` — all assertions pass
- [ ] PWA installs on Android Chrome
- [ ] PWA installs on iOS Safari
- [ ] App works fully offline after first load
- [ ] All 14 input fields render with correct labels, defaults, tooltips
- [ ] All 8+ KPI cards render and update in real time
- [ ] Responsive layout correct at 375px, 768px, 1024px+
- [ ] Onboarding modal opens/closes properly
- [ ] No console errors
- [ ] Lighthouse PWA ≥ 90
- [ ] Lighthouse Accessibility ≥ 90
