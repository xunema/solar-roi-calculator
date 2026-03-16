# SolarCalc PH ☀️

**"Know your payback before you pay."**

A Progressive Web App (PWA) for calculating solar photovoltaic and battery storage return-on-investment, tailored for the Philippine market.

---

## What It Does

SolarCalc PH takes your electricity rate, photovoltaic system specs, optional battery storage, and financing details — then instantly calculates:

- **Total CAPEX** — full system cost including panels, battery, and infrastructure
- **Annual Savings** — how much you stop paying your utility each year
- **Simple ROI** — percentage of investment recovered per year
- **Payback Period** — years until the system pays for itself
- **Monthly Cash Flow** — net savings after loan payments (if financed)

**Key Features:**
- ⚡ **Real-time calculations** — See results instantly as you type
- 📊 **Per-section results** — Each section shows its own computed outputs
- 🎯 **11 KPI Dashboard** — All metrics with click-to-navigate
- ☀️ **Sun Hours Calculator** — Philippine regional data built-in
- 🏠 **Quick Presets** — Residential, Commercial, Battery Only, Spreadsheet
- 🌙 **Night/Day themes** — Comfortable viewing any time
- 📱 **PWA** — Works offline, installable on mobile

No server, no signup, no internet required after first load.

---

## Who It's For

| User | Use Case |
|------|----------|
| **Business Owners** | Justify solar CAPEX to management with concrete numbers |
| **Homeowners** | Decide if rooftop solar is worth the investment |
| **Solar Sales Reps** | Generate quick on-site quotes from a phone |
| **Beginners** | Understand solar ROI with guided onboarding and Philippine defaults |

---

## Quick Start

### Option 1: Visit the Live App
🔗 **https://xunema.github.io/solar-roi-calculator/**

### Option 2: Run Locally
```bash
# Clone the repo
git clone https://github.com/<org>/solarcalc-ph.git
cd solarcalc-ph

# Open in browser (no build step needed)
open index.html
# or
python3 -m http.server 8000
# then visit http://localhost:8000
```

### Option 3: Install as PWA
1. Visit the app in Chrome (Android) or Safari (iOS)
2. Tap "Add to Home Screen"
3. The app works offline from that point forward

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 |
| Styling | Tailwind CSS (CDN) |
| Logic | Vanilla JavaScript (ES2022) |
| PWA | Service Worker + Web App Manifest |
| State | Proxy-based reactive state |
| Hosting | GitHub Pages (static) |

**Zero dependencies.** No npm, no build pipeline, no backend.

---

## Project Structure

```
solarcalc-ph/
├── index.html              # Single-page app shell
├── sunhours.html           # Peak Sun Hours reference & calculator
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (cache-first)
├── css/
│   ├── custom.css          # Custom overrides
│   └── themes.css          # Light/dark theme variables
├── js/
│   ├── app.js              # Entry point
│   ├── state.js            # Reactive state (Proxy)
│   ├── calc.js             # Pure calculation functions
│   ├── ui.js               # DOM rendering & tooltips
│   ├── onboarding.js       # Guided intro modal
│   ├── themes.js           # Night/Day theme toggle
│   ├── layout.js           # Phone/Desktop layout toggle
│   ├── sunhours.js         # Sun hours calculator
│   └── format.js           # ₱ currency formatting
├── data/
│   └── philippine-sun-hours.json
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── tests/
    └── calc.test.js        # Unit tests
```

---

## Philippine Market Defaults

The app ships with current market rates for the Philippines. **App default: ₱15/kWh** (commercial baseline). Use Quick Presets to switch:

| Parameter | Residential | Commercial | Notes |
|-----------|-------------|------------|-------|
| **Electricity Rate** | ₱20/kWh | ₱15/kWh | Meralco blended rate |
| **Solar Price** | ₱80,000/kW | ₱50,000/kW | Installed cost per kW |
| **Battery Price** | ₱30,000/kWh | ₱15,000/kWh | LFP lithium batteries |
| **Peak Sun Hours** | 4.0 hrs/day | 4.0 hrs/day | Philippine average |
| **Loan Term** | 60 months | 60 months | 5-year financing |

### Quick Presets

| Preset | System Size | Solar Price | Typical Night Load |
|--------|-------------|-------------|-------------------|
| 🏠 **Residential** | 25 kW | ₱80,000/kW | 1.5 kW (AC, fridge, fans) |
| 🏢 **Commercial** | 100 kW | ₱50,000/kW | 15 kW (lights, servers, security) |
| 🔋 **Battery Only** | — | — | 5 kW (existing solar + storage) |
| 📋 **Spreadsheet** | 300 kW | ₱40,000/kW | Reference data from Excel model |

---

## How the Math Works

### Solar Savings
```
Daily Energy = Solar Capacity (kW) × Peak Sun Hours (hrs)
Annual Energy = Daily Energy × Operating Days/Year
Annual Savings = Annual Energy (kWh) × Electricity Rate (₱/kWh)
```

### Battery Sizing
```
Required Battery (kWh) = Nighttime Load (kW) × Duration (hrs)
Extra Solar Needed (kW) = Required Battery ÷ Peak Sun Hours
```

### ROI & Payback
```
Total CAPEX = (Total Solar kW × Price/kW) + (Battery kWh × Price/kWh) + Misc Costs
Simple ROI = (Annual Savings ÷ Total CAPEX) × 100%
Payback = Total CAPEX ÷ Annual Savings
```

### Loan Amortization
Standard annuity formula:
```
Monthly Payment = P × [r(1+r)^n] / [(1+r)^n - 1]
where P = principal, r = monthly rate, n = months
```

---

## Development Milestones

Development is broken into 7 milestones. Each produces a reviewable, testable deliverable. See the [PRD Section 13](./Project_Requirements_Document.md#13-milestones--deliverables) for full acceptance criteria and the [Milestone Execution Rules](./Project_Requirements_Document.md#12-milestone-execution-rules) before starting any milestone.

> **Known Issues:** See [Project Notes](./Project_Notes.md) for problems encountered and resolutions.

---

### ✅ Milestone 1: Calculation Engine (MVP Foundation)
> **Status: COMPLETE** — `node tests/calc.test.js` → 155/155 pass

All formulas implemented and verified. No UI required.

- [x] `calc.js` — CAPEX, ROI, payback, amortization, battery charge %, all section results
- [x] `tests/calc.test.js` — 155 tests, 0 failures
- [x] `format.js` — Philippine peso formatting (`₱146,000.00`)
- [x] `state.js` — Proxy-based reactive state; Quick Presets (Residential, Commercial, Battery Only, Spreadsheet)

**Key formula decisions:**
- `pvSystemCost = (solarCapacityKW + pvForBatteryKW) × solarPricePerKW` — all PV panels (daytime + battery-charging) priced together
- `totalCapex = totalPVCapex + batteryCost` — `extraSolarCost` shown in Section 3 as informational breakdown only
- `batteryChargePercent = (pvForBatteryKW × peakSunHours / batteryCapacityKWh) × 100`

**Known resolved issues (see Project Notes):**
- Problem 12: Battery model restructured to use `batteryCapacityKWh` and `pvForBatteryKW` as direct user inputs
- Problem 13: `pvTotalCapacityKW` missing from `defaultResults` caused startup crash — fixed

---

### ✅ Milestone 2: Core UI + Section Forms (MVP Usable)
> **Status: COMPLETE** — All deliverables implemented; 155/155 tests pass

- [x] Section 1 — Status Quo: rate, schedule, daily consumption → **inline annual + monthly cost**
- [x] Section 2 — PhotoVoltaic System: capacity, sun hours, pricing → **inline PV cost + generation + daily savings**
- [x] Section 3 — Battery Storage: battery capacity, PV for battery → **inline battery cost, charge %, extra PV cost**
- [x] Section 4 — Financing: loan terms → **inline amortization + interest**
- [x] Results Dashboard — 11 KPIs, each referencing its source section (tappable)
- [x] Phase 2.7 — "Reset to Defaults" button — clears localStorage and resets all 18 inputs to defaults

**Key resolved issues:**
- Problem 13: `pvTotalCapacityKW` missing from `defaultResults` caused startup crash that silenced all updates — fixed
- Tooltip `ReferenceError` (missing import) and preset load DOM sync fixed in `app.js`

---

### ✅ Milestone 3: Tooltips, Onboarding & Sun Hours
> **Status: COMPLETE** — All 4 phases implemented; 155/155 tests pass

- [x] Phase 3.1 — Tooltip on every field (❓ icon, one open at a time; click away closes)
- [x] Phase 3.2 — Onboarding modal — 4-slide guide; shows once per browser session (sessionStorage); re-opens via Help button
- [x] Phase 3.3 — Sun hours calculator — region + orientation + tilt → estimated PSH; "Use This Value" populates Section 2
- [x] Phase 3.4 — External reference links in `peakSunHoursPerDay` tooltip: Global Solar Atlas, NREL PVWatts, NREL Solar Maps

**Key decisions:**
- Onboarding uses `sessionStorage` (not localStorage) so it shows on every new browser session, not just once ever
- `rate-tip` HTML bug fixed (unclosed tooltip div)
- Sun hours modal options updated to match PRD: North orientation (-0.6 hrs), Latitude-matched tilt (+0.1 hrs)

---

### ⬜ Milestone 4: PWA, Themes & Layout
> **Status: NOT STARTED**

- [ ] Service worker — app works fully offline after first load
- [ ] Night/Day theme toggle — persists in localStorage, detects system preference
- [ ] Phone/Desktop/Auto layout toggle in header

---

### ⬜ Milestone 5: Polish & Accessibility (Release Candidate)
> **Status: NOT STARTED**

- [ ] Responsive layout at 375px / 768px / 1024px+
- [ ] KPI conditional coloring (green/yellow/red thresholds)
- [ ] Edge cases handled (division by zero, loan > CAPEX, rate < 1 hint)
- [ ] Accessibility: tab order, ARIA labels, focus trapping, 44px touch targets
- [ ] Lighthouse PWA ≥ 90, Accessibility ≥ 90

---

### ⬜ Milestone 6: Narrative Summary (Story Mode)
> **Status: NOT STARTED**

All data woven into a plain-language story: Problem → Hypothesis → Evidence → Verdict.

- [ ] Narrative generator — 7 structured paragraphs from all computed fields
- [ ] Part 1 — The Problem: electricity rate, annual cost
- [ ] Part 2 — The Hypothesis: PV capacity, daily generation, daily savings, PV cost
- [ ] Part 3 — Battery Storage (hidden if batteryCapacityKWh = 0)
- [ ] Part 4 — Total CAPEX
- [ ] Part 5 — The Return: annual savings, ROI %, payback
- [ ] Part 6 — Financing (hidden if cash purchase)
- [ ] Part 7 — The Verdict: green/yellow/red conclusion
- [ ] "Copy to Clipboard" — full narrative as plain text
- [ ] "Export as .txt" — downloads `solarcalc-report-YYYY-MM-DD.txt`

---

### ⬜ Milestone 7: Save Specifications
> **Status: NOT STARTED**

Named scenario save/load with a dropdown selector at the top of the page.

- [ ] **Spec Selector** — dropdown + Save + Save As… always visible at top of page
- [ ] **Save As…** — name prompt → saves to `localStorage` → becomes active spec
- [ ] **Save** — silently overwrites current active spec
- [ ] **Load** — select from dropdown → restores all 18 inputs and recalculates
- [ ] **Manage panel** — delete (with confirmation), rename, export as JSON, import from JSON
- [ ] Max 20 specs per device

---

## Running Tests

```bash
node tests/calc.test.js
```

Current results: **155 tests, 0 failures** ✅

Tests verify:
- All individual calc functions
- `calculateAll()` integration (Spreadsheet Scenarios A, B, C + home defaults)
- pvSystemCost includes both daytime and battery-charging panels
- Battery charge percent calculation
- Zero-interest and standard loan amortization (₱14M @ 12% → ₱311,422.27/mo)
- Division-by-zero guards
- format.js and state.js reactive state

---

## Spreadsheet Origin

This app is based on the `250915 SOLAR ROI .xlsx` spreadsheet which models solar ROI for a 300 kW commercial installation in the Philippines. The app generalizes this model to support any system size — from residential 5 kW setups to large commercial plants.

---

## Contributing

1. Fork the repo
2. Make changes (no build step — edit files directly)
3. Test with `node tests/calc.test.js`
4. Open a PR

---

## License

MIT

---

## Related Documents

- [Project Requirements Document](./Project_Requirements_Document.md) — full technical spec
- [Project Notes](./Project_Notes.md) — problems encountered and resolutions
