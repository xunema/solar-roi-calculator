# Project Notes: SolarCalc PH

> **Purpose:** This document tracks problems encountered during development and their corrections. Updated as issues arise and are resolved.

---

## Session Log

### 2026-03-16 — Project Initialization

#### Problem 1: Spreadsheet Data Extraction
**Issue:** The source spreadsheet (`250915 SOLAR ROI .xlsx`) is a binary `.xlsx` file that cannot be directly read by text-based tools. Cell layout mixes assumptions text (column B), input parameters (columns J-K), secondary scenario data (columns N-O), and loan calculations (columns R-V) in a non-obvious arrangement.

**Resolution:** Used Python `openpyxl` to extract all cell values programmatically. Mapped each cell reference to the corresponding PRD field to ensure no data was lost in translation.

**Key Mappings Discovered:**
| Spreadsheet Cell | Value | PRD Field |
|-----------------|-------|-----------|
| K4 | 11 ₱/kWh | `electricityRate` (PRD default: 10) |
| K5 | 50 weeks | `operatingWeeksPerYear` (PRD default: 52) |
| K6 | 6 days | `operatingDaysPerWeek` (PRD default: 7) |
| K7 | 4 hours | `peakSunHoursPerDay` (matches PRD) |
| K8 | ₱40,000/kW | `solarPricePerKW` (PRD default: 30,000) |
| K9 | ₱5,000/kWh | `batteryPricePerKWh` (PRD default: 12,000) |
| K10 | ₱2,000,000 | `miscInfraCosts` (PRD default: 0) |
| K13 | 300 kW | `solarCapacityKW` (PRD default: 10) |
| S5 | 60 months | `loanTermMonths` (matches PRD) |
| S6 | ₱14,000,000 | `loanPrincipal` (PRD default: 0) |
| V5 | 12% | `annualInterestRate` (PRD default: 0) |

---

#### Problem 2: Default Values Discrepancy
**Issue:** The PRD sets conservative residential defaults (10 kW system, ₱30,000/kW, ₱12,000/kWh battery) while the spreadsheet models a large commercial installation (300 kW system, ₱40,000/kW, ₱5,000/kWh battery). The app targets multiple personas so defaults must serve the common case.

**Resolution:** PRD defaults are kept as-is (residential-friendly). The spreadsheet values serve as test/verification data for commercial scenarios. Users can adjust to match their situation.

---

#### Problem 3: Spreadsheet Has Features Not in V1 PRD
**Issue:** The spreadsheet contains several calculations not covered in the V1 scope:

1. **GEOP sheet** — Generation cost (₱8.1/kWh) vs GEOP market rate (₱6.5/kWh) comparison. The spreadsheet has a separate "GEOP" tab.
2. **Excess Energy Sold** — Cell K31 shows 5 kW excess energy, with weekly/yearly generation and revenue (K35-K37: 400 kWh/week, 20,800 kWh/year, ₱104,000/year).
3. **Loan Modifier** — Cell K11 shows a 0.4 (40%) loan modifier applied to CAPEX, calculating a partial-loan scenario (₱14M × 0.4 = ₱5.6M financed).
4. **Secondary Scenario** — Columns N-O model a different cost structure (₱9/kWh rate, ₱5M/year cost, 13-year contract).
5. **Years After ROI** — Cells O13/O15 calculate how many productive years remain after payback, and total savings during that period.

**Resolution:** All marked as out-of-scope for V1. Documented here for future reference. The "Years After ROI" and "Excess Energy" features are strong candidates for V2.

---

#### Problem 4: Battery Model Simplification
**Issue:** The spreadsheet models battery as a separate line item (400 kWh LFP @ ₱8,000/kWh = ₱3,200,000) with its own ROI calculation. The PRD integrates battery into the solar system calculation via nighttime load/duration inputs that auto-calculate required battery kWh and extra solar capacity.

**Resolution:** The PRD approach is more user-friendly and better suited for the app's target personas. The spreadsheet's separate battery ROI can be verified by setting solar capacity to 0 and entering only battery parameters.

---

#### Problem 5: Amortization Formula Verification
**Issue:** Need to verify the app's amortization formula matches the spreadsheet's loan calculations.

**Spreadsheet values:**
- Principal: ₱14,000,000
- Annual rate: 12% (V5)
- Term: 60 months (S5)
- Monthly payment: ₱311,422.27 (V8)
- Total payable: ₱18,685,336.06 (V9)
- Total interest: ₱4,685,336.06 (V10)

**Verification:**
```
r = 0.12 / 12 = 0.01
n = 60
Payment = 14,000,000 × (0.01 × 1.01^60) / (1.01^60 - 1)
        = 14,000,000 × (0.01 × 1.8167) / (1.8167 - 1)
        = 14,000,000 × 0.018167 / 0.8167
        = 14,000,000 × 0.022244
        = ₱311,422.27 ✓
```

**Resolution:** Standard annuity formula confirmed. The PRD's `calcAmortization` function spec is correct.

---

## Patterns & Conventions

### Naming
- App name: **SolarCalc PH** (as per PRD)
- Repo: `solarcalc-ph` (or `solar-roi-calculator` for current local directory)
- All state fields use camelCase
- localStorage not used in V1

### Currency Formatting
- Philippine Peso: `₱` prefix, comma thousands, period decimal, 2 decimal places
- Percentages: 1 decimal place
- Years: 1 decimal place

### Color Coding Rules
- ROI: Green ≥ 15%, Yellow 8–14.9%, Red < 8%
- Payback: Green ≤ 5yr, Yellow 5.1–8yr, Red > 8yr
- Cash flow: Green positive, Red negative

---

## Future Considerations (V2+)

1. **GEOP Comparison** — The spreadsheet's GEOP sheet suggests users want to compare solar savings against market energy rates
2. **Excess Energy Revenue** — Net metering / feed-in tariff calculations for surplus generation
3. **Loan Modifier** — Partial financing (e.g., 40% of CAPEX financed, 60% cash)
4. **Multi-Scenario Comparison** — Side-by-side comparison of different system configurations
5. **Years After ROI** — Show total savings over system lifetime beyond payback period
6. **LFP Battery Degradation** — Model capacity fade over 10+ year lifespan (spreadsheet notes 3,000–6,000 cycles)
7. **PDF Export** — Generate client-ready proposal documents
8. **Dark Mode** — Tailwind `dark:` classes
