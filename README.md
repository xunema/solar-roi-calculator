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

All calculations happen in real time as you type. No server, no signup, no internet required after first load.

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
> *GitHub Pages URL will go here after deployment*

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

## Philippine Defaults

The app ships with sensible defaults for the Philippine market:

| Parameter | Default | Notes |
|-----------|---------|-------|
| Electricity Rate | ₱10.00/kWh | Blended rate (Total Bill ÷ Total kWh) |
| Peak Sun Hours | 4.0 hrs/day | Philippine average effective output |
| Solar Price | ₱30,000/kW | Commercial benchmark; residential ₱30k–₱50k |
| Battery Price | ₱12,000/kWh | LFP batteries, 10+ year lifespan |
| Loan Term | 60 months | 5-year standard financing |

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

Development is broken into 6 milestones. Each produces a reviewable, testable deliverable. See the [PRD Section 11](./Project_Requirements_Document.md#11-milestones--deliverables) for full acceptance criteria.

### Milestone 1: Calculation Engine (MVP Foundation)
> All math works — verifiable via command line, no UI needed yet.

- [ ] `calc.js` — all formulas (CAPEX, ROI, payback, amortization, projected costs)
- [ ] `tests/calc.test.js` — unit tests pass via `node tests/calc.test.js`
- [ ] `format.js` — Philippine peso formatting (`₱146,000.00`)
- [ ] `state.js` — Proxy-based reactive state triggers recalculation

**Test:** `node tests/calc.test.js` — all green.

### Milestone 2: Core UI + Section Forms (MVP Usable)
> All 4 sections render with inputs. Each section shows its own results. Dashboard aggregates everything.

- [ ] Section 1 — Status Quo: rate, schedule, daily consumption → **inline annual + monthly cost**
- [ ] Section 2 — PhotoVoltaic System: capacity, sun hours, pricing → **inline PV cost + generation + daily savings**
- [ ] Section 3 — Battery Storage: load, duration → **inline battery sizing + cost + extra PV allocation**
- [ ] Section 4 — Financing: loan terms → **inline amortization + interest**
- [ ] Results Dashboard — 11 KPIs, each referencing its source section (tappable)

**Test:** Open in browser. Change any input — all section results and dashboard KPIs update instantly.

### Milestone 3: Tooltips, Onboarding & Sun Hours
> Help system complete. New users can self-onboard without external research.

- [ ] Tooltip on every field (❓ icon, one open at a time)
- [ ] Onboarding modal — 4-slide guide (blended rate, annual usage, defaults)
- [ ] Sun hours calculator — region/city dropdown → peak sun hours estimate
- [ ] External reference links (NREL, PVWatts) in tooltips

**Test:** Click every ❓. Open/close onboarding. Use sun hours calculator for 3 different regions.

### Milestone 4: PWA, Themes & Layout
> Installable, offline-capable, with night/day mode and layout control.

- [ ] Service worker — app works fully offline after first load
- [ ] Night/Day theme toggle — persists in localStorage, detects system preference
- [ ] Phone/Desktop/Auto layout toggle in header

**Test:** Install as PWA. Toggle airplane mode — app still works. Switch themes. Switch layouts.

### Milestone 5: Polish & Accessibility (Release Candidate)
> Production-ready. Lighthouse audits pass.

- [ ] Responsive layout at 375px / 768px / 1024px+
- [ ] KPI conditional coloring (green/yellow/red thresholds)
- [ ] Edge cases handled (division by zero, loan > CAPEX, rate < 1 hint)
- [ ] Accessibility: tab order, ARIA labels, focus trapping, 44px touch targets
- [ ] Lighthouse PWA ≥ 90, Accessibility ≥ 90

**Test:** Run Lighthouse. Tab through entire app. Test all edge cases from PRD Section 12.

### Milestone 6: Narrative Summary (Story Mode)
> All data woven into a plain-language story: Problem → Hypothesis → Evidence → Verdict.

- [ ] Narrative generator assembles all computed fields into 7 structured paragraphs
- [ ] Part 1 — The Problem: electricity rate, consumption, annual/monthly cost
- [ ] Part 2 — The Hypothesis: PV capacity, daily generation, daily savings, PV cost
- [ ] Part 3 — Battery Storage: battery sizing, extra PV allocation, battery cost (hidden if no battery)
- [ ] Part 4 — Total CAPEX: PV System (Section 2) + Battery (Section 3)
- [ ] Part 5 — The Return: annual savings, Simple ROI %, payback period
- [ ] Part 6 — Financing: loan payment, interest, net cash flow (hidden if cash purchase)
- [ ] Part 7 — The Verdict: green/yellow/red conclusion based on ROI
- [ ] "Copy to Clipboard" for sharing the narrative as plain text
- [ ] Real-time updates as inputs change

**Test:** Read the narrative for residential (no battery), commercial (with battery), and financed scenarios. Verify all numbers match the Dashboard KPIs. Copy to clipboard and paste into a text editor.

---

## Running Tests

```bash
node tests/calc.test.js
```

Tests verify:
- Basic payback calculation
- Battery cost integration
- Zero-interest and standard loan amortization
- Division-by-zero guards

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
