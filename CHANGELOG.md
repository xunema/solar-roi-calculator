# Changelog

All notable changes to SolarCalc PH will be documented in this file.

## [Unreleased] - 2026-03-18

### Changed

#### Quick Preset Renames
- **Residential** → `Residential 30kWh/day — Work from Home` — subtext now shows ₱13,650/mo, AC/fridge/fans, 5 household members, 7 days/wk
- **Commercial** → `Commercial 230kWh/day — 100 Employees` — subtext now shows ₱50,000/mo, 5 days/wk, 52 weeks/yr, ₱10/kWh
- **Battery Only** → `Battery Only — Brownout Backup` — redesigned for pure grid-charged backup; `solarCapacityKW` and `pvForBatteryKW` both set to 0 (no solar panels)

#### Removed
- **Spreadsheet preset** — Excel reference preset retired; no longer shown in Quick Presets

### Added

#### Battery Savings (Section 3)
- `dailyBatterySavings` — daily charge capacity × electricity rate (₱/day)
- `annualBatterySavings` — dailyBatterySavings × operating days/year (₱/yr)
- `monthlyBatterySavings` — annualBatterySavings ÷ 12 (₱/mo)
- Three new result cards displayed in Section 3 results panel

---

## [Unreleased] - M2 Complete

### Changed

#### Electricity Rates Updated
- **Default rate**: ₱10/kWh → **₱15/kWh** (commercial baseline)
- **Residential preset**: ₱11/kWh → **₱20/kWh**
- **Commercial preset**: ₱10/kWh → **₱15/kWh**
- **Battery Only preset**: ₱11/kWh → **₱18/kWh**

#### Solar Pricing Presets Updated
- **Residential**: ₱35,000/kW → **₱20,000/kW**
- **Commercial**: ₱30,000/kW → **₱15,000/kW**

### Added

#### Section Results Panels (M2)
- **Section 1 (Status Quo)**: Operating Days, Annual Consumption, Daily kWh, Projected Annual/Monthly Cost
- **Section 2 (PhotoVoltaic System)**: PV Equipment Cost, Total PV CAPEX, Daily Generation, Daily Savings, Annual Generation
- **Section 3 (Battery Storage)**: Battery Capacity, Battery Cost, Extra PV for Charging, Total Solar Capacity, Extra PV Cost, "No battery needed" message
- **Section 4 (Financing)**: Monthly Payment, Total Loan Cost, Total Interest, Cash Purchase indicator

#### KPI Dashboard Enhancements
- Added **Annual Generation** KPI (was missing from PRD)
- All 11 KPIs now display with section source badges
- Click any KPI card to scroll to source section
- Hover effects and highlight animations

#### Nighttime Load Tooltip Enhanced
Detailed guidance for typical loads:
- **Residential**: AC (0.75-1.5 kW), Refrigerator (0.05-0.1 kW), Fans (0.05-0.08 kW), Routers/Chargers (0.02-0.05 kW)
- **Commercial**: Security Lights (0.2-0.5 kW), Servers (0.3-1 kW), Refrigeration (0.5-2 kW), CCTV (0.05-0.2 kW), Emergency Lighting (0.1-0.3 kW)

### Fixed

#### Naming Consistency
- Renamed "Solar System" → "PhotoVoltaic System" throughout (PRD v1.2)

---

## [1.2.0] - 2026-03-16 - M2: Core UI + Section Forms

### Added
- Per-section inline results panels
- Projected Monthly Cost calculation
- KPI-to-section navigation (tap KPI → scroll to source)
- 5 new computed fields: `pvSystemCost`, `totalPVCapex`, `dailyGenerationKWh`, `dailySavings`, `batteryCost`
- Results Dashboard expanded from 9 to 11 KPIs

### Changed
- "Solar System" → "PhotoVoltaic System" (industry-standard terminology)

---

## [1.1.0] - 2026-03-16 - M1: Calculation Engine

### Added
- Projected Annual Cost calculation
- Daily Energy Consumption input
- Sun Hours Per Day Calculator with Philippine regional data
- Peak sun hours tooltip with external reference links
- Night/Day theme toggle
- Phone/Desktop layout toggle
- 148 unit tests (all passing)

---

## [1.0.0] - 2026-03-16 - Initial Release

### Added
- PWA foundation with service worker
- 4 input sections: Status Quo, Solar System, Battery Storage, Financing
- Real-time calculation engine
- Philippine market defaults
- Onboarding modal
