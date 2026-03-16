# SolarCalc PH ☀️

**"Know your payback before you pay."**

A Progressive Web App (PWA) for calculating solar photovoltaic and battery storage return-on-investment, tailored for the Philippine market.

---

## What It Does

SolarCalc PH takes your electricity rate, solar system specs, optional battery storage, and financing details — then instantly calculates:

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
├── index.html          # Single-page app shell
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (cache-first)
├── css/
│   └── custom.css      # Custom styles
├── js/
│   ├── app.js          # Entry point
│   ├── state.js        # Reactive state (Proxy)
│   ├── calc.js         # Pure calculation functions
│   ├── ui.js           # DOM rendering & tooltips
│   ├── onboarding.js   # Guided intro modal
│   └── format.js       # ₱ currency formatting
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── tests/
    └── calc.test.js    # Unit tests
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
