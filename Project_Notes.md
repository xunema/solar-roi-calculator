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
**Issue:** The spreadsheet models battery as a separate line item (400 kWh LFP @ ₱8,000/kWh = ₱3,200,000) with its own ROI calculation. The PRD integrates battery into the photovoltaic system calculation via nighttime load/duration inputs that auto-calculate required battery kWh and extra solar capacity.

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

#### Problem 6: Section Naming — "Solar System" vs "PhotoVoltaic System"
**Issue:** "Solar System" is ambiguous — it could refer to the planetary solar system, or it's too generic for a technical calculator. Users and sales reps use "PV system" or "photovoltaic system" as the industry-standard term.

**Resolution:** Renamed Section 2 from "Solar System" to "PhotoVoltaic System" across all documents. Internal field names retain `solar` prefix (e.g., `solarCapacityKW`) for brevity since they're not user-facing.

---

#### Problem 7: No Immediate Feedback Per Section
**Issue:** Users had to scroll to the main KPI dashboard to see the impact of any input change. For a 4-section form, this creates a disconnect — especially on mobile where the dashboard may be far from the current section.

**Resolution:** Added inline results panels to each section:
- **Section 1:** Shows projected annual cost AND monthly cost immediately below inputs
- **Section 2:** Shows PV equipment cost, total PV CAPEX, daily and annual generation
- **Section 3:** Shows required battery kWh, battery cost, extra PV needed
- **Section 4:** Shows monthly amortization, total loan cost, total interest

Each section's results update in real time. The main Results Dashboard still aggregates everything and now includes source-section references so users can tap a KPI to jump to the relevant section.

---

#### Problem 8: Missing Monthly Cost Projection
**Issue:** The Status Quo section only showed projected annual cost. Most users think about electricity costs monthly (since that's how bills arrive). Showing only the annual figure requires mental division.

**Resolution:** Added `projectedMonthlyCost = projectedAnnualCost / 12` as both a section result and a Results Dashboard KPI. Both annual and monthly update when annual bill override is entered.

---

### 2026-03-16 — Milestone 1 Testing

#### Problem 9: calc.js Missing PRD v1.2 Per-Section Result Fields
**Issue:** The M1 test suite (`node tests/calc.test.js`) runs 148 tests. 143 pass, 0 fail, but **5 are TODO** — meaning `calculateAll()` in `calc.js` does not yet return the per-section intermediate computed fields added in PRD v1.2:

| Missing Field | Section | Formula | Status |
|---------------|---------|---------|--------|
| `projectedMonthlyCost` | Section 1 | `projectedAnnualCost / 12` | ⏭️ TODO |
| `pvSystemCost` | Section 2 | `solarCapacityKW × solarPricePerKW` | ⏭️ TODO |
| `totalPVCapex` | Section 2 | `pvSystemCost + miscInfraCosts` | ⏭️ TODO |
| `dailyGenerationKWh` | Section 2 | `solarCapacityKW × peakSunHoursPerDay` | ⏭️ TODO |
| `batteryCost` | Section 3 | `requiredBatteryKWh × batteryPricePerKWh` | ⏭️ TODO |

These fields are needed by the per-section inline results panels (PRD Section 5.3).

**Corrective Action:**
1. Open `js/calc.js`, find the `calculateAll()` function (line ~230)
2. Add the 5 missing computed fields inside the function body, after the existing calculations:
   ```javascript
   // PRD v1.2: Per-section result fields
   const projectedMonthlyCost = projectedAnnualCost / 12;
   const pvSystemCost = (solarCapacityKW || 0) * (solarPricePerKW || 0);
   const totalPVCapex = pvSystemCost + (miscInfraCosts || 0);
   const dailyGenerationKWh = (solarCapacityKW || 0) * (peakSunHoursPerDay || 0);
   const batteryCost = (requiredBatteryKWh || 0) * (batteryPricePerKWh || 0);
   ```
3. Add them to the return object:
   ```javascript
   return {
     // ... existing fields ...
     projectedMonthlyCost,
     pvSystemCost,
     totalPVCapex,
     dailyGenerationKWh,
     batteryCost,
   };
   ```
4. In `tests/calc.test.js`, change the 5 `todo(...)` calls to `test(...)` calls
5. Run `node tests/calc.test.js` — expect 148/148 pass, 0 TODO
6. Also update `state.js` `defaultResults` to include these 5 new fields with computed defaults

**Resolution:** Applied all 6 corrective actions. Added the 5 missing fields to `calculateAll()` in `calc.js`, updated `defaultResults` in `state.js`, converted `todo()` → `test()` in test suite.

**Verification:** `node tests/calc.test.js` → 148/148 pass ✅

---

#### Problem 10: "Solar System" Still Present in Code Files
**Issue:** PRD and docs were renamed to "PhotoVoltaic System" but `index.html`, `app.js`, and `state.js` still contained "Solar System" in UI-facing strings and comments.

**Files affected:**
- `index.html` line 224: `<!-- Section 2: Solar System -->` and line 228 heading text
- `js/app.js` line 30: `title: "Solar System Sizing"`
- `js/state.js` line 19: `// Section 2: Solar System`

**Resolution:** Renamed all occurrences to "PhotoVoltaic System" across all code files. Verified with grep — only historical references in Project Notes changelog remain.

---

#### Problem 11: Dark Mode Labels Lack Contrast
**Issue:** In Night/Dark mode, labels and secondary text used `text-gray-700` and `text-gray-600` which are too dark against the slate-800 card background. Users reported difficulty reading input labels.

**Specific issues:**
- Input labels (`text-gray-700`) appeared almost invisible in dark mode
- Helper text (`text-gray-500`) had insufficient contrast
- Section result labels were hard to read

**Resolution:** Added comprehensive dark mode CSS overrides in `index.html`:
- Labels: `#e2e8f0` (slate-200) for high contrast on slate-800
- Secondary text: `#94a3b8` (slate-400) for readable muted text
- Borders: `#475569` (slate-600) for better visibility
- Input placeholders: `#64748b` (slate-500)
- Tooltips: Updated to use dark theme colors

**Contrast ratios achieved:**
- Labels on cards: ~11:1 (exceeds WCAG AAA)
- Secondary text: ~7:1 (exceeds WCAG AA)
- Muted text: ~5:1 (meets WCAG AA)

---

#### Problem 11: Missing `annualConsumptionKWh` and `dailySavings` Fields
**Issue:** PRD Section 5.1 described a consumption chain (daily kWh → annual kWh → annual ₱) but the intermediate `annualConsumptionKWh` field was not in the computed fields table or code. Similarly, Section 2 lacked a `dailySavings` field to show per-day savings from PV generation.

**Resolution:** Added both fields to:
- PRD computed fields table (Section 5.2)
- `calc.js` → `calculateAll()` return object
- `state.js` → `defaultResults`
- `tests/calc.test.js` — 4 new tests

Also added PRD clarifications:
- PV System CAPEX links to Dashboard Total CAPEX (Section 2 + Section 3)
- Annual Savings tooltip: dailySavings × operatingDaysPerYear
- Simple ROI = Annual Savings ÷ CAPEX (% recovered per year); Payback = inverse
- Monthly Savings = Annual Savings ÷ 12 (note)

---

#### Test Results Summary (2026-03-16) — UPDATED

```
═══════════════════════════════════════════════════════
 MILESTONE 1 TEST SUMMARY
═══════════════════════════════════════════════════════
  Total:   152
  ✅ Pass:  152
  ❌ Fail:  0
  ⏭️  TODO:  0
═══════════════════════════════════════════════════════
  🎉 All tests passed! M1 complete.
```

**Test coverage by module:**

| Module | Tests | Status |
|--------|-------|--------|
| `calc.js` — individual functions | 87 | ✅ All pass |
| `calc.js` — `calculateAll()` integration | 22 | ✅ All pass |
| `calc.js` — PRD v1.3 section fields | 11 | ✅ All pass |
| `format.js` — formatting & parsing | 22 | ✅ All pass |
| `state.js` — reactive state & app manager | 10 | ✅ All pass |

**Scenarios verified against spreadsheet:**
- Scenario A (Solar Only, 300 kW @ ₱10 and ₱11/kWh) ✅
- Scenario B (Battery Only, ROI 28.13%) ✅
- Scenario C (Combined, 400 kW total) ✅
- Loan (₱14M @ 12% / 60mo = ₱311,422.27/mo) ✅
- PRD defaults (10 kW residential) ✅

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
8. ~~**Dark Mode**~~ — Moved to V1.1 scope (Night/Day theme toggle)
