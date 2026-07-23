# Product Requirements Document (PRD): Solar ROI & Battery Calculator — v2.0

> **Purpose of this document:** This PRD is written to be directly consumable by an AI coding agent (e.g., Claude Code, Aider, OpenCode). Every section is structured to eliminate ambiguity — data models are explicit, formulas are pseudocode, UI behavior is specified as state transitions, and the file tree is pre-defined. A human product owner should review this for correctness; a coding agent should be able to execute it top-to-bottom.

---

## 1. Product Identity

| Field | Value |
|-------|-------|
| **Product Name** | SolarCalc PH |
| **Tagline** | "Know your payback before you pay." |
| **Version** | 1.0.0 |
| **Platform** | Progressive Web App (PWA) — single `index.html` entry point |
| **Hosting** | GitHub Pages (static, no backend) |
| **License** | MIT (or specify) |
| **Locale** | Philippines (₱ PHP currency, Meralco bill references, PSH defaults) |
| **Repo** | `github.com/<org>/solarcalc-ph` |

---

## 2. Target Users & Usage Scenarios

| Persona | Goal | Key Behavior |
|---------|------|--------------|
| **Business Owner / Facility Manager** | Justify CAPEX to management | Enters precise kWh and rates from accounting; wants PDF-ready KPI summary |
| **Homeowner** | Decide if solar is "worth it" | Doesn't know blended rate; needs the onboarding guide and reverse-calc from annual bill |
| **Solar Sales Rep** | Generate on-site quick quote | Rapid data entry on mobile; needs "Add to Home Screen" offline capability |
| **Non-Technical Beginner** | Understand what the numbers mean | Relies heavily on tooltips and the onboarding modal; may only fill Section 1 + defaults |

---

## 3. Tech Stack (Locked Decisions)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Markup** | HTML5 semantic elements | PWA baseline, no build step |
| **Styling** | Tailwind CSS via CDN (`<script src="https://cdn.tailwindcss.com">`) | Rapid responsive layout, no build step |
| **Logic** | Vanilla JavaScript (ES2022 modules) | Zero dependencies, offline-first, GitHub Pages compatible |
| **PWA** | `manifest.json` + `sw.js` (service worker) | Offline caching, installability |
| **State** | Single reactive `state` object with `Proxy`-based change detection | Real-time recalculation on every input change |
| **Icons** | Inline SVG or emoji fallback (❓ for tooltips, ☀️ for branding) | No icon font dependency |

**Explicitly NOT using:** React, Vue, npm build pipeline, any backend/API, localStorage for persistence (V1 is sessionless).

---

## 4. File Structure

```
solarcalc-ph/
├── index.html              # Single page app shell
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (cache-first strategy)
├── css/
│   └── custom.css          # Overrides and custom Tailwind config (if needed)
├── js/
│   ├── app.js              # Entry point: init state, bind events, render
│   ├── state.js            # Reactive state object + Proxy watcher
│   ├── calc.js             # Pure calculation functions (no DOM access)
│   ├── ui.js               # DOM manipulation, section rendering, tooltip logic
│   ├── onboarding.js       # Modal/guide logic
│   └── format.js           # Currency/number formatting helpers
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

---

## 5. Data Model

All user inputs and computed outputs live in a single flat `state` object. Every field has a defined type, default, unit, and validation rule.

### 5.1 Input Fields

```
FIELD                       TYPE     DEFAULT   UNIT      VALIDATION                SECTION
─────────────────────────────────────────────────────────────────────────────────────────────
electricityRate             number   10.00     ₱/kWh     > 0, max 100              Section 1
operatingWeeksPerYear       number   52        weeks     1–52, integer             Section 1
operatingDaysPerWeek        number   7         days      1–7, integer              Section 1
annualBill                  number   null      ₱         >= 0 or null (optional)   Section 1

solarCapacityKW             number   10        kW        > 0, max 100000           Section 2
peakSunHoursPerDay          number   4.0       hours     0.5–8, step 0.1           Section 2
solarPricePerKW             number   30000     ₱/kW      > 0                       Section 2
miscInfraCosts              number   0         ₱         >= 0                      Section 2
batteryPricePerKWh          number   12000     ₱/kWh     > 0                       Section 2

nighttimeLoadKW             number   0         kW        >= 0                      Section 3
nighttimeDurationHours      number   0         hours     >= 0, max 24              Section 3

loanPrincipal               number   0         ₱         >= 0                      Section 4
annualInterestRate          number   0         %         0–100 (stored as %)       Section 4
loanTermMonths              number   60        months    1–360, integer            Section 4
```

### 5.2 Computed Fields

```
FIELD                       FORMULA                                                           UNIT
──────────────────────────────────────────────────────────────────────────────────────────────────────
operatingDaysPerYear        operatingWeeksPerYear × operatingDaysPerWeek                      days
requiredBatteryKWh          nighttimeLoadKW × nighttimeDurationHours                          kWh
extraSolarForBatteryKW      IF requiredBatteryKWh > 0 THEN requiredBatteryKWh / peakSunHoursPerDay ELSE 0   kW
totalSolarKW                solarCapacityKW + extraSolarForBatteryKW                          kW
totalCapex                  (totalSolarKW × solarPricePerKW) + (requiredBatteryKWh × batteryPricePerKWh) + miscInfraCosts   ₱
annualGenerationKWh         totalSolarKW × peakSunHoursPerDay × operatingDaysPerYear          kWh
annualSavings               annualGenerationKWh × electricityRate                             ₱
simpleROI                   IF totalCapex > 0 THEN (annualSavings / totalCapex) × 100 ELSE 0   %
paybackYears                IF annualSavings > 0 THEN totalCapex / annualSavings ELSE Infinity   years
monthlyAmortization         IF loanPrincipal > 0 AND annualInterestRate > 0 THEN
                              LET r = (annualInterestRate / 100) / 12
                              LET n = loanTermMonths
                              loanPrincipal × (r × (1 + r)^n) / ((1 + r)^n - 1)
                            ELSE IF loanPrincipal > 0 AND annualInterestRate == 0 THEN
                              loanPrincipal / loanTermMonths
                            ELSE 0                                                            ₱/month
totalLoanCost               monthlyAmortization × loanTermMonths                              ₱
totalInterestPaid           totalLoanCost - loanPrincipal                                     ₱
monthlySavings              annualSavings / 12                                                ₱/month
netMonthlyCashFlow          monthlySavings - monthlyAmortization                              ₱/month
```

### 5.3 Reverse Calculation (Annual Bill Override)

When the user fills `annualBill` AND leaves `electricityRate` at its default (or explicitly triggers reverse-calc):

```
IF annualBill != null AND annualBill > 0:
  estimatedAnnualKWh = annualBill / electricityRate
  // Display this as an informational callout:
  // "Based on your ₱X annual bill at ₱Y/kWh, you consume ~Z kWh/year."
```

> **Agent note:** This is informational only in V1. It does NOT auto-fill other fields. Display as a read-only callout below the Annual Bill input.

---

## 6. UI Layout & Component Specification

### 6.1 Page Structure

```
┌─────────────────────────────────────────────────┐
│  HEADER: Logo/Title + "Guide" button            │
├─────────────────────────────────────────────────┤
│  ONBOARDING MODAL (hidden by default)           │
├─────────────────────────────────────────────────┤
│  SECTION TABS or ACCORDION:                     │
│    [1. Status Quo] [2. System] [3. Battery]     │
│    [4. Financing]                               │
├─────────────────────────────────────────────────┤
│  ACTIVE SECTION — input form                    │
├─────────────────────────────────────────────────┤
│  KPI DASHBOARD — always visible, sticky bottom  │
│  on mobile OR right sidebar on desktop (≥1024px)│
└─────────────────────────────────────────────────┘
```

### 6.2 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **< 768px (mobile)** | Single column. Sections as collapsible accordion. KPI dashboard as sticky bottom sheet (collapsed = 1-line payback summary, expandable). |
| **768px–1023px (tablet)** | Single column, wider inputs. KPI dashboard below form. |
| **≥ 1024px (desktop)** | Two-column: left = input sections (60%), right = KPI dashboard sticky sidebar (40%). |

### 6.3 Input Field Component Spec

Each input field renders as:

```html
<div class="field-group" data-field="{fieldName}">
  <label>
    {Field Label}
    <button class="tooltip-trigger" aria-label="Help for {Field Label}">❓</button>
  </label>
  <div class="input-row">
    <span class="unit-prefix">{₱ or empty}</span>
    <input
      type="number"
      id="{fieldName}"
      name="{fieldName}"
      value="{default}"
      min="{min}"
      max="{max}"
      step="{step}"
      inputmode="decimal"
      aria-describedby="{fieldName}-tooltip"
    />
    <span class="unit-suffix">{/kWh, /kW, %, months, etc.}</span>
  </div>
  <div id="{fieldName}-tooltip" class="tooltip-content hidden" role="tooltip">
    {Tooltip text — see Section 8 for all tooltip copy}
  </div>
  <div class="field-error hidden" role="alert">{Validation error message}</div>
</div>
```

**Behaviors:**
- `input` event → update `state[fieldName]` → trigger recalc → re-render KPI dashboard.
- Tooltip opens on click/tap of ❓, closes on click outside or second tap. Only one tooltip open at a time.
- Validation: real-time on `input` event. Red border + error message if out of range. Calculation uses last valid value (do NOT use invalid input).
- Auto-calculated fields (Section 3: batteryKWh, extraSolar) render as read-only styled display, not `<input>`. Style distinctly (e.g., gray background, no border).

### 6.4 KPI Dashboard Component Spec

Display all computed KPIs as a card grid. Each card:

```html
<div class="kpi-card">
  <div class="kpi-label">{KPI Name}</div>
  <div class="kpi-value">{Formatted Value}</div>
  <div class="kpi-sublabel">{Unit or context}</div>
</div>
```

**KPI display order and formatting:**

| # | KPI | Format | Conditional Styling |
|---|-----|--------|---------------------|
| 1 | Total CAPEX | ₱ #,###,### | — |
| 2 | Annual Savings | ₱ #,###,### /yr | Green if > 0 |
| 3 | Simple ROI | ##.#% /yr | Green ≥ 15%, Yellow 8–14.9%, Red < 8% |
| 4 | Payback Period | #.# years | Green ≤ 5, Yellow 5.1–8, Red > 8 |
| 5 | Monthly Savings | ₱ #,###,### /mo | — |
| 6 | Monthly Amortization | ₱ #,###,### /mo | Show only if loanPrincipal > 0 |
| 7 | Net Monthly Cash Flow | ₱ #,###,### /mo | Green if positive, Red if negative. Show only if loanPrincipal > 0 |
| 8 | Total Interest Paid | ₱ #,###,### | Show only if loanPrincipal > 0 |

**Number formatting:** Philippine peso format — `₱` prefix, comma thousands separator, period decimal, 2 decimal places for currency, 1 decimal for percentages and years.

### 6.5 Onboarding Modal

- Triggered by "Guide" button in header, OR auto-shown on first visit (use a sessionStorage flag, NOT localStorage).
- Content is static HTML rendered inside a modal overlay (`<dialog>` element preferred for accessibility).
- Sections: "What is the Status Quo?", "How to Read Your Utility Bill", "Quick Start Defaults".
- "Got it, let's start" button closes modal and focuses the first input field.
- Must be dismissable via ESC key and clicking outside.

---

## 7. Calculation Engine (`calc.js`)

This module exports **pure functions only** — no DOM access, no side effects.

```javascript
// calc.js — All functions are pure. Input: state object. Output: computed values object.

/**
 * @param {Object} state - The full input state object (see Section 5.1)
 * @returns {Object} computed - All computed fields (see Section 5.2)
 */
export function computeAll(state) { ... }

/**
 * Monthly loan amortization using standard annuity formula.
 * @param {number} principal - Loan amount in ₱
 * @param {number} annualRatePercent - e.g., 12 for 12%
 * @param {number} termMonths - e.g., 60
 * @returns {number} Monthly payment in ₱
 */
export function calcAmortization(principal, annualRatePercent, termMonths) { ... }

/**
 * Reverse-calc: estimate annual kWh from annual bill and rate
 * @param {number} annualBill - ₱
 * @param {number} rate - ₱/kWh
 * @returns {number} estimated annual kWh
 */
export function estimateAnnualKWh(annualBill, rate) { ... }
```

**Agent directive:** Write unit tests for `calc.js` in a `tests/calc.test.js` file using simple `console.assert` statements (no test framework needed for V1). Test cases:

| Test | Inputs | Expected |
|------|--------|----------|
| Basic payback | 10kW solar, ₱10/kWh, 4 PSH, 365 days, ₱30k/kW, no battery, no misc | CAPEX=₱300,000; Annual Gen=14,600 kWh; Savings=₱146,000; Payback≈2.05 yr |
| With battery | Above + 5kW night × 8hr = 40kWh battery @ ₱12k/kWh | Battery cost=₱480,000; Extra solar=10kW; Total CAPEX=₱1,080,000 |
| Zero interest loan | ₱500,000 principal, 0% rate, 60mo | Amort=₱8,333.33/mo |
| Standard loan | ₱500,000 principal, 12% rate, 60mo | Amort≈₱11,122.22/mo |
| Division by zero guards | 0 annual savings → payback=Infinity; 0 CAPEX → ROI=0 |

---

## 8. Tooltip Copy (Complete)

All tooltip strings, keyed by `fieldName`, for the agent to embed directly:

```javascript
export const TOOLTIPS = {
  electricityRate:
    "This is your 'Blended Rate'. Calculate it by dividing your Total Bill Amount by your Total kWh Consumed. This represents the cost you avoid paying your utility for every unit of solar energy you produce.",

  operatingWeeksPerYear:
    "How many weeks a year is your facility fully operational? For homes, this is usually 52. For businesses that close for holidays, try 50.",

  operatingDaysPerWeek:
    "How many days a week do you consume heavy power? If your business is closed on Sundays, your solar system produces excess power that day.",

  annualBill:
    "Optional: If you don't know your exact electricity rate, enter your estimated total annual electricity bill. We'll use this with your blended rate to estimate your yearly consumption.",

  solarCapacityKW:
    "The 'engine size' of your solar plant. Rule of thumb: every 1 kW of solar needs about 10 square meters of unshaded roof space.",

  peakSunHoursPerDay:
    "Also known as Peak Sun Hours (PSH). In the Philippines, the sun is up for 12 hours, but effective full-power output averages about 4 to 4.5 hours per day.",

  solarPricePerKW:
    "Market benchmarks: Commercial systems ₱20,000–₱30,000/kW. Residential ₱30,000–₱50,000/kW due to smaller scale.",

  miscInfraCosts:
    "Hidden installation costs: roof waterproofing, structural reinforcement, rewiring, Meralco net-metering application fees, or submeter relocation.",

  batteryPricePerKWh:
    "Lithium Iron Phosphate (LFP) batteries currently cost ₱8,000–₱15,000 per kWh. They typically last 10+ years depending on daily cycling depth.",

  nighttimeLoadKW:
    "Total power draw of all appliances you want to run on battery at night. Example: 5 aircons at 2 kW each = 10 kW.",

  nighttimeDurationHours:
    "How many hours after sunset do you need battery power? Typical: 8 hours for overnight operation, 4 hours for evening-only.",

  loanPrincipal:
    "How much of the total system cost are you borrowing? Enter 0 or leave blank if paying entirely in cash.",

  annualInterestRate:
    "The annual interest rate from your bank. Typical Philippine commercial rates: 8%–12%.",

  loanTermMonths:
    "Loan repayment period. Example: 60 months = 5 years.",
};
```

---

## 9. PWA Configuration

### 9.1 `manifest.json`

```json
{
  "name": "SolarCalc PH — Solar ROI Calculator",
  "short_name": "SolarCalc",
  "description": "Calculate your solar PV and battery ROI instantly.",
  "start_url": "/index.html",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f766e",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 9.2 Service Worker (`sw.js`)

Strategy: **Cache-first with network fallback**. Cache name includes version for cache-busting.

```
CACHE_NAME = 'solarcalc-v1.0.0'
CACHED_ASSETS = [
  '/',
  '/index.html',
  '/css/custom.css',
  '/js/app.js',
  '/js/state.js',
  '/js/calc.js',
  '/js/ui.js',
  '/js/onboarding.js',
  '/js/format.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]
```

On `install`: pre-cache all assets.
On `fetch`: serve from cache, fall back to network, cache new responses.
On `activate`: delete old caches where name ≠ `CACHE_NAME`.

---

## 10. Design System

### 10.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#0f766e` (teal-700) | Header, primary buttons, active tab |
| `--color-primary-light` | `#ccfbf1` (teal-100) | Input field backgrounds (the "blue" Excel cue, adapted to solar/teal) |
| `--color-surface` | `#ffffff` | Card and section backgrounds |
| `--color-bg` | `#f0fdfa` (teal-50) | Page background |
| `--color-text` | `#1e293b` (slate-800) | Primary text |
| `--color-text-muted` | `#64748b` (slate-500) | Labels, tooltips, sublabels |
| `--color-success` | `#16a34a` (green-600) | Positive KPI values |
| `--color-warning` | `#ca8a04` (yellow-600) | Moderate KPI values |
| `--color-danger` | `#dc2626` (red-600) | Negative KPI values, errors |

### 10.2 Typography

- Font: `Inter` via Google Fonts CDN, fallback `system-ui, sans-serif`.
- Body: 16px / 1.5 line-height.
- KPI value: 28px bold on desktop, 22px on mobile.
- Section headers: 20px semibold.

### 10.3 Spacing & Sizing

- Section padding: `p-6` (1.5rem).
- Field group vertical gap: `space-y-4`.
- KPI card grid: `grid-cols-2` on mobile, `grid-cols-4` on desktop. Gap: `gap-4`.
- Border radius: `rounded-xl` for cards, `rounded-lg` for inputs.

---

## 11. Accessibility Requirements

- All inputs have associated `<label>` elements (explicit `for`/`id` pairing).
- Tooltips use `role="tooltip"` and `aria-describedby`.
- KPI color coding is supplemented with text labels (not color-only).
- Modal uses `<dialog>` element with proper focus trapping.
- Minimum touch target: 44×44px.
- Keyboard navigation: Tab through all inputs in section order; Enter/Space to toggle tooltips.
- `prefers-reduced-motion`: disable any transitions if set.

---

## 12. Onboarding Content (Static Copy)

### Slide 1: "What is the Status Quo?"

> **The Status Quo is doing nothing.** Before we can tell you if solar is worth it, we need to know how much doing *nothing* is costing you right now. That means capturing your current electricity rate and consumption pattern.

### Slide 2: "How to Find Your Blended Rate"

> **Step 1:** Get your latest utility bill (Meralco or local provider).
>
> **Step 2:** Find the **Total Amount Due** (the big number you pay).
>
> **Step 3:** Find the **Total kWh Consumed** (usually near the meter reading).
>
> **Step 4:** Divide: **Total Amount ÷ Total kWh = Your Blended Rate (₱/kWh).**
>
> *Don't just use the Generation Charge — that's only one part of your bill!*

### Slide 3: "Finding Your Annual Usage"

> Check the back of your bill for the **12-month consumption bar chart**. Add up all 12 months, or take the average month and multiply by 12. This gives you your annual kWh — and multiplied by your blended rate, your annual bill.

### Slide 4: "Quick Start — Use Our Defaults"

> Not sure about some numbers? We've pre-filled Philippine averages:
> - Peak Sun Hours: **4 hours/day**
> - Solar Price: **₱30,000/kW** (commercial)
> - Battery Price: **₱12,000/kWh** (LFP)
>
> Just fill in **your electricity rate** and **your desired solar system size**, and the calculator does the rest.

---

## 13. Implementation Sequence (Agent Build Order)

The coding agent should implement in this order to maintain a working app at each step:

| Phase | Deliverable | Acceptance Criteria |
|-------|-------------|---------------------|
| **1** | `calc.js` + `tests/calc.test.js` | All test cases pass via `node tests/calc.test.js` |
| **2** | `state.js` with Proxy-based reactivity | Changing any state field triggers a registered callback |
| **3** | `format.js` with PHP currency + number formatting | `formatCurrency(146000)` → `"₱146,000.00"` |
| **4** | `index.html` shell + Tailwind CDN + `manifest.json` | Opens in browser with header and empty sections |
| **5** | `ui.js` — render Section 1 inputs + KPI dashboard | Typing in Section 1 updates KPIs in real time |
| **6** | `ui.js` — render Sections 2, 3, 4 | All inputs wired, all KPIs computing |
| **7** | Tooltip system | Click ❓ → tooltip appears; click away → closes |
| **8** | `onboarding.js` — modal with static content | "Guide" button opens modal; ESC / click-outside closes |
| **9** | `sw.js` — service worker + offline caching | App loads after going offline (devtools > Network > Offline) |
| **10** | Responsive polish + KPI conditional coloring | Passes manual visual check at 375px, 768px, 1024px widths |
| **11** | Accessibility audit | Tab order correct; all labels present; color not sole indicator |

---

## 14. Out of Scope (V1) — Do NOT Implement

- GEOP rate comparison logic
- PDF export
- User accounts / login / persistence across sessions
- Backend API or database
- Multi-language / i18n
- Dark mode (can be added later via Tailwind `dark:` classes)
- Charts or graphs of payback timeline
- Net metering / feed-in tariff calculations

---

## 15. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| All fields at default | KPIs compute and display normally with defaults |
| User clears an input (empty string) | Treat as 0 for numeric fields; show validation hint "Required" for mandatory fields (electricityRate, solarCapacityKW) |
| Nighttime load = 0, duration = 0 | Battery section shows "No battery needed" message; batteryKWh = 0; extraSolar = 0 |
| Loan principal > totalCapex | Show warning: "Loan amount exceeds total system cost" (non-blocking) |
| annualInterestRate entered as 0.12 instead of 12 | If rate < 1 AND > 0, show hint: "Did you mean 12%? Enter the percentage number, not the decimal." |
| Extremely large values (e.g., 1,000,000 kW) | Allow but format properly; no artificial caps beyond validation max |
| Division by zero (0 sun hours, 0 savings) | Return Infinity or 0 as specified in formula pseudocode; display "—" for Infinity payback |

---

## 16. Testing Checklist

Before marking V1 complete, verify:

- [ ] `node tests/calc.test.js` — all assertions pass
- [ ] PWA installs on Android Chrome ("Add to Home Screen" prompt appears)
- [ ] PWA installs on iOS Safari (Add to Home Screen works, opens in standalone mode)
- [ ] App works fully offline after first load
- [ ] All 14 input fields render with correct labels, defaults, and tooltips
- [ ] All 8+ KPI cards render and update in real time on input change
- [ ] Responsive layout correct at 375px (iPhone SE), 768px (iPad), 1024px+
- [ ] Onboarding modal opens, displays all 4 content slides, and closes properly
- [ ] No console errors on any interaction path
- [ ] Lighthouse PWA audit ≥ 90
- [ ] Lighthouse Accessibility audit ≥ 90
