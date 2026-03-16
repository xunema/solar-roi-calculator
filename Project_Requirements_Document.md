# Project Requirements Document: SolarCalc PH — Solar ROI & Battery Calculator

> **Version:** 1.1.0
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
- **No sun hours reference** — users don't know their location's peak sun hours
- **No cost projection visibility** — users can't see their current annual electricity costs

---

## 3. Goals & Success Criteria

| Goal | Success Metric |
|------|---------------|
| Mobile-first PWA installable on Android and iOS | Lighthouse PWA audit ≥ 90 |
| Works fully offline after first load | Passes Chrome DevTools offline test |
| Real-time KPI calculation on every input change | All 10+ KPI cards update instantly |
| Guided onboarding for non-technical users | Modal with 4 slides explaining blended rate, annual usage |
| Accessible to all users | Lighthouse Accessibility audit ≥ 90 |
| No backend, no build pipeline, static hosting | Deploys to GitHub Pages with zero server costs |
| Theme customization | Night/Day mode toggle functional |
| Layout control | Phone/Desktop toggle works across breakpoints |

---

## 4. Scope

### 4.1 In Scope (V1.1)

- **Section 1 — Status Quo:** 
  - Electricity rate (₱/kWh)
  - Operating schedule (weeks/year, days/week)
  - Daily energy consumption (kWh) for cost projection
  - **Projected Annual Cost** — computed from rate × consumption × operating days
  - **Annual Bill** — optional overwrite of projected cost for reverse-calc
- **Section 2 — Solar System:** Capacity (kW), peak sun hours with reference links, price per kW, misc infrastructure costs, battery price per kWh
- **Section 3 — Battery Storage:** Nighttime load (kW), nighttime duration (hours), auto-calculated battery kWh and extra solar requirement
- **Section 4 — Financing:** Loan principal, annual interest rate, loan term (months), standard amortization formula
- **Sun Hours Calculator:** Modal tool to estimate peak sun hours by region/location
- **KPI Dashboard:** Total CAPEX, Projected Annual Cost, Annual Savings, Simple ROI %, Payback Years, Monthly Savings, Monthly Amortization, Net Monthly Cash Flow, Total Interest Paid
- **PWA Features:** Service worker, manifest, offline caching, Add to Home Screen
- **Onboarding Modal:** 4-slide guide explaining blended rate, annual usage, and defaults
- **Tooltip System:** Contextual help on every input field with external resource links
- **Responsive Design:** Mobile (< 768px), Tablet (768–1023px), Desktop (≥ 1024px)
- **Theme Toggle:** Night/Day mode with system preference detection
- **Layout Toggle:** Phone (vertical/single-column) vs Desktop (sidebar) layout override

### 4.2 Out of Scope (V1.1)

- GEOP rate comparison logic (present in spreadsheet Sheet "GEOP" but deferred)
- PDF export
- User accounts / login / cross-session persistence
- Backend API or database
- Multi-language / i18n
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
| `dailyEnergyConsumptionKWh` | number | 50 | kWh | ≥ 0 | 1 | — |
| `projectedAnnualCost` | number | computed | ₱ | computed, overwritable | 1 | — |
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
| `projectedAnnualCost` | `dailyEnergyConsumptionKWh × electricityRate × operatingDaysPerYear` | ₱ |
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

### 5.3 Status Quo Cost Flow

The Status Quo section now provides a clear view of current electricity costs:

```
User Inputs:
├── Electricity Rate (₱/kWh)
├── Daily Energy Consumption (kWh)
├── Operating Schedule (weeks/year, days/week)
│
Computed:
├── Operating Days/Year = weeks × days/week
└── Projected Annual Cost = daily kWh × rate × operating days

User Can Override:
└── Annual Bill (actual) → overwrites Projected Annual Cost for ROI context
```

**Reverse Calculation:** When user enters `annualBill` without `dailyEnergyConsumptionKWh`, the system can optionally calculate backwards:
```
dailyEnergyConsumptionKWh = annualBill / (electricityRate × operatingDaysPerYear)
```

### 5.4 Spreadsheet Verification (from "250915 SOLAR ROI .xlsx")

The spreadsheet models three scenarios with these results:

| Scenario | CAPEX | Annual Savings | Simple ROI | Payback |
|----------|-------|---------------|------------|---------|
| **A. Solar Only** (300 kW, 4h/day, 300 days) | ₱14,000,000 | ₱3,600,000 | 25.7%/yr | ~3.89 yr |
| **B. Battery Only** (400 kWh LFP, +1h/day) | ₱3,200,000 | ₱900,000 | 28.1%/yr | ~3.56 yr |
| **C. Combined** (Solar + Battery) | ₱17,200,000 | ₱4,500,000 | 26.2%/yr | ~3.82 yr |

Loan example from spreadsheet: ₱14,000,000 principal @ 12% annual over 60 months = ₱311,422.27/month, total payable ₱18,685,336.06, interest ₱4,685,336.06.

---

## 6. Sun Hours Per Day Calculator

### 6.1 Purpose
Help users determine their location's peak sun hours without external research.

### 6.2 Input Fields

| Field | Type | Default | Options |
|-------|------|---------|---------|
| `region` | select | "Metro Manila" | Philippine regions: NCR, CAR, Region I-XII, NIR, BARMM |
| `cityMunicipality` | select | dynamic | Populated based on region selection |
| `roofOrientation` | select | "South" | South, Southeast, Southwest, East, West |
| `roofAngle` | select | "15-30°" | Flat (0-15°), Standard (15-30°), Steep (30-45°) |

### 6.3 Calculation Logic

Base peak sun hours by region (annual average):

| Region | Base Sun Hours | Cities Reference |
|--------|---------------|------------------|
| Metro Manila | 4.0 | Manila, Quezon City, Makati |
| Region I (Ilocos) | 4.5 | Laoag, Vigan, Dagupan |
| Region II (Cagayan Valley) | 4.3 | Tuguegarao, Santiago |
| Region III (Central Luzon) | 4.4 | Angeles, Olongapo, Cabanatuan |
| Region IV-A (Calabarzon) | 4.0 | Calamba, Batangas City, Lipa |
| Region IV-B (Mimaropa) | 4.2 | Puerto Princesa, Calapan |
| Region V (Bicol) | 3.9 | Legazpi, Naga, Iriga |
| Region VI (Western Visayas) | 4.1 | Iloilo City, Bacolod |
| Region VII (Central Visayas) | 4.2 | Cebu City, Dumaguete |
| Region VIII (Eastern Visayas) | 4.0 | Tacloban, Ormoc |
| Region IX (Zamboanga Peninsula) | 4.3 | Zamboanga City, Dipolog |
| Region X (Northern Mindanao) | 4.1 | Cagayan de Oro, Iligan |
| Region XI (Davao) | 4.2 | Davao City, Tagum |
| Region XII (Soccsksargen) | 4.3 | General Santos, Koronadal |
| Region XIII (Caraga) | 3.9 | Butuan, Surigao |
| Cordillera (CAR) | 4.0 | Baguio, Benguet |
| Negros Island Region | 4.1 | Dumaguete, Bacolod |
| BARMM | 4.4 | Cotabato City, Marawi |

**Orientation Adjustment:**
- South: +0.0 hrs (optimal)
- Southeast/Southwest: -0.2 hrs
- East: -0.4 hrs
- West: -0.4 hrs

**Angle Adjustment:**
- Standard (15-30°): +0.0 hrs (optimal)
- Flat (0-15°): -0.1 hrs
- Steep (30-45°): -0.1 hrs

### 6.4 External Reference Links

Tooltip on Peak Sun Hours field should include:

```
Peak sun hours = equivalent hours of full sun (1000 W/m²) per day.
Philippine average: 4-5 hours/day.

External resources:
🔗 Google Project Sunroof (global map): https://www.google.com/get/sunroof
🔗 NREL Solar Resource Data (Philippines): https://www.nrel.gov/solar/solar-resource-maps.html
🔗 PVWatts Calculator: https://pvwatts.nrel.gov/
```

---

## 7. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Markup | HTML5 semantic elements | PWA baseline, no build step |
| Styling | Tailwind CSS via CDN | Rapid responsive layout, no build step |
| Logic | Vanilla JavaScript (ES2022 modules) | Zero dependencies, offline-first |
| PWA | `manifest.json` + `sw.js` | Offline caching, installability |
| State | Single reactive `state` object with `Proxy`-based change detection | Real-time recalc on every input |
| Icons | Inline SVG or emoji fallback | No icon font dependency |
| Theming | CSS custom properties + class-based dark mode | Toggle between light/dark themes |

**Not using:** React, Vue, npm, any backend/API.

---

## 8. File Structure

```
solarcalc-ph/
├── index.html              # Single page app shell
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (cache-first)
├── css/
│   ├── custom.css          # Custom overrides
│   └── themes.css          # Light/dark theme variables
├── js/
│   ├── app.js              # Entry point: init state, bind events, render
│   ├── state.js            # Reactive state object + Proxy watcher
│   ├── calc.js             # Pure calculation functions (no DOM)
│   ├── ui.js               # DOM manipulation, rendering, tooltips
│   ├── onboarding.js       # Modal/guide logic
│   ├── themes.js           # Theme toggle (night/day)
│   ├── layout.js           # Phone/Desktop layout toggle
│   ├── sunhours.js         # Sun hours calculator logic
│   └── format.js           # Currency/number formatting helpers
├── data/
│   └── philippine-sun-hours.json  # Region/city sun hours data
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── tests/
│   └── calc.test.js        # Unit tests (console.assert)
└── README.md
```

---

## 9. UI Requirements

### 9.1 Layout

#### Default Responsive Behavior
- **Mobile (< 768px):** Single column, collapsible accordion sections, sticky bottom KPI sheet
- **Tablet (768–1023px):** Single column, wider inputs, KPI below form
- **Desktop (≥ 1024px):** Two-column — inputs (60%) left, KPI dashboard sticky sidebar (40%) right

#### Manual Layout Toggle
Users can override the default layout with a toggle in the header:

| Toggle State | Behavior |
|--------------|----------|
| **Phone** 📱 | Forces single-column vertical layout regardless of screen width |
| **Desktop** 🖥️ | Forces two-column sidebar layout (if screen permits) or maximized single column |
| **Auto** (default) | Follows responsive breakpoints above |

**Implementation:** The layout toggle sets a `data-layout` attribute on the body/container:
```html
<body data-layout="auto">  <!-- auto | phone | desktop -->
```

CSS responds to this attribute:
```css
/* Phone mode - always stacked */
[data-layout="phone"] .kpi-sidebar { position: relative; }

/* Desktop mode - side by side */
[data-layout="desktop"] .kpi-sidebar { position: sticky; }
```

### 9.2 KPI Dashboard

| # | KPI | Format | Color Coding |
|---|-----|--------|-------------|
| 1 | Total CAPEX | ₱ #,###,### | — |
| 2 | **Projected Annual Cost** | ₱ #,###,### /yr | Red (cost) |
| 3 | Annual Savings | ₱ #,###,### /yr | Green if > 0 |
| 4 | Simple ROI | ##.#% /yr | Green ≥ 15%, Yellow 8–14.9%, Red < 8% |
| 5 | Payback Period | #.# years | Green ≤ 5, Yellow 5.1–8, Red > 8 |
| 6 | Monthly Savings | ₱ #,###,### /mo | — |
| 7 | Monthly Amortization | ₱ #,###,### /mo | Show only if loan > 0 |
| 8 | Net Monthly Cash Flow | ₱ #,###,### /mo | Green if +, Red if −. Show only if loan > 0 |
| 9 | Total Interest Paid | ₱ #,###,### | Show only if loan > 0 |

### 9.3 Design System

#### Light Theme (Default)
- **Primary color:** `#0f766e` (teal-700)
- **Background:** `#f9fafb` (gray-50)
- **Card background:** `#ffffff`
- **Text primary:** `#111827` (gray-900)
- **Text secondary:** `#6b7280` (gray-500)
- **Border:** `#e5e7eb` (gray-200)

#### Dark Theme (Night Mode)
- **Primary color:** `#14b8a6` (teal-500)
- **Background:** `#0f172a` (slate-900)
- **Card background:** `#1e293b` (slate-800)
- **Text primary:** `#f1f5f9` (slate-100)
- **Text secondary:** `#94a3b8` (slate-400)
- **Border:** `#334155` (slate-700)

#### Common
- **Font:** Inter via Google Fonts, fallback system-ui
- **KPI values:** 28px bold (desktop), 22px (mobile)
- **Border radius:** `rounded-xl` cards, `rounded-lg` inputs

### 9.4 Theme Toggle

Location: Header bar, right side

```
☀️ / 🌙  [Toggle Switch]
```

**Behavior:**
- Click toggles between light and dark themes
- Icon changes: ☀️ for light mode, 🌙 for dark mode
- Preference saved to `localStorage`
- On load, checks:
  1. Saved preference in `localStorage`
  2. System preference via `prefers-color-scheme`
  3. Defaults to light mode

**Implementation:**
```javascript
// Apply theme by setting class on html element
html.classList.toggle('dark', isDarkMode);
```

```css
/* Tailwind dark mode classes */
.dark .card { @apply bg-slate-800 border-slate-700; }
```

---

## 10. Accessibility Requirements

- All inputs have associated `<label>` elements
- Tooltips use `role="tooltip"` and `aria-describedby`
- KPI color coding supplemented with text labels
- Modal uses `<dialog>` with focus trapping
- Minimum touch target: 44×44px
- Keyboard navigation through all inputs
- `prefers-reduced-motion` support
- Theme respects `prefers-color-scheme` media query
- Layout toggle has clear visual state

---

## 11. Implementation Phases

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
| **11** | **Status Quo cost projection** | Daily consumption input + projected annual cost calculation |
| **12** | **Sun hours calculator** | Modal with region/city selection, outputs peak sun hours |
| **13** | **Theme system** | `themes.js` with toggle, dark mode classes, localStorage persistence |
| **14** | **Layout toggle** | `layout.js` with phone/desktop/auto modes, header toggle |
| 15 | Accessibility audit | Tab order, labels, color not sole indicator |

---

## 12. Edge Cases

| Scenario | Behavior |
|----------|----------|
| All fields at default | KPIs compute normally |
| Empty input | Treat as 0; show "Required" hint for mandatory fields |
| Nighttime load & duration = 0 | "No battery needed" message |
| Loan > CAPEX | Warning: "Loan exceeds system cost" (non-blocking) |
| Rate entered as 0.12 instead of 12 | Hint: "Did you mean 12%?" |
| Division by zero | Return Infinity or 0 per formula; display "—" for Infinity |
| Annual bill overwrites projected cost | Visual indicator that value is user-overwritten |
| Sun hours calculator no selection | Default to national average (4.0 hrs) |
| Theme toggle during onboarding | Immediate theme change, no modal close |
| Layout toggle on small screen | Desktop mode shows maximized single column |

---

## 13. Testing Checklist

- [ ] `node tests/calc.test.js` — all assertions pass
- [ ] PWA installs on Android Chrome
- [ ] PWA installs on iOS Safari
- [ ] App works fully offline after first load
- [ ] All 16 input fields render with correct labels, defaults, tooltips
- [ ] All 9 KPI cards render and update in real time
- [ ] Projected Annual Cost calculates correctly from daily consumption
- [ ] Annual Bill overwrite functions correctly
- [ ] Sun hours calculator opens and returns valid values
- [ ] Peak sun hours tooltip shows external links
- [ ] Theme toggle switches between light/dark modes
- [ ] Theme preference persists across reloads
- [ ] Layout toggle switches between phone/desktop modes
- [ ] Responsive layout correct at 375px, 768px, 1024px+
- [ ] Onboarding modal opens/closes properly
- [ ] No console errors
- [ ] Lighthouse PWA ≥ 90
- [ ] Lighthouse Accessibility ≥ 90

---

## Changelog

### v1.1.0 (2026-03-16)
- **Added:** Projected Annual Cost calculation in Status Quo section
- **Added:** Daily Energy Consumption input field
- **Added:** Sun Hours Per Day Calculator with Philippine region data
- **Added:** Peak sun hours tooltip with external reference links (Google Project Sunroof, NREL)
- **Added:** Night/Day theme toggle with system preference detection
- **Added:** Phone/Desktop layout toggle for manual layout control
- **Moved:** Dark mode from "Out of Scope" to "In Scope"
- **Updated:** File structure to include `themes.js`, `layout.js`, `sunhours.js`, and `philippine-sun-hours.json`
- **Updated:** KPI Dashboard to include Projected Annual Cost
- **Updated:** Implementation phases to include new features
