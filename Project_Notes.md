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

#### Problem 11b: Missing `annualConsumptionKWh` and `dailySavings` Fields
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

#### Problem 12: Battery Model Restructure (v1.4.0)
**Issue:** The original battery model auto-calculated required battery kWh from nighttime load × duration, and auto-calculated extra solar from that. This made the UI feel passive — users couldn't directly control battery size or solar allocation, and the nighttime reference values felt like rigid inputs rather than guidance.

**Resolution (PRD v1.4.0):** Battery inputs restructured so `batteryCapacityKWh` and `pvForBatteryKW` are primary user inputs. `nighttimeLoadKW` and `nighttimeDurationHours` become reference-only guidance fields. The battery charge percent now shows how much of the battery the allocated PV can fill per day — giving direct feedback on whether the solar allocation is adequate.

**Code changes:**
- `calc.js`: `calculateAll()` uses `batteryCapacityKWh` and `pvForBatteryKW` directly from inputs
- `state.js`: `defaultInputs` updated to include both new fields; nighttime fields kept as reference
- `tests/calc.test.js`: All battery tests updated to use `batteryCapacityKWh` and `pvForBatteryKW`
- New field `batteryChargePercent` = `(pvForBatteryKW × peakSunHoursPerDay / batteryCapacityKWh) × 100`

---

#### Problem 13: Results Not Updating When Inputs Change (OPEN — 2026-03-16)
**Issue:** User reports that after changing input field values, the results panels and KPI dashboard do not update.

**Code investigation findings:** The reactive chain was traced end-to-end and is structurally correct:
1. `bindInputHandlers` attaches `input` event listeners to all 17 input fields
2. On change: parses float value → calls `onChange(id, numValue)`
3. `initializeUI` passes `(id, value) => { state.inputs[id] = value; }` as the callback
4. Proxy `set` on `state.inputs` → fires `onInputChange` → runs `calculateAll(inputs)`
5. Each result key is set on `state.results` via Proxy → fires `onResultsChange`
6. `changeCallback('results', ...)` → `app.js` `onChange` handler → `updateAllKPIs(this.state.results)`
7. `updateAllKPIs` updates all DOM KPI and section result elements

**Two confirmed bugs found and fixed in `app.js` (2026-03-16):**

**Bug A — Missing `toggleTooltip` import:**
`bindTooltipButtons()` called `toggleTooltip(tooltipId)` but it was not in the import list from `ui.js`. This caused a `ReferenceError: toggleTooltip is not defined` every time a tooltip button was clicked.
- **Fix:** Added `toggleTooltip` to the import statement in `app.js`
- **Impact:** Only affected tooltip buttons; would not prevent input→results updates

**Bug B — Preset load does not sync DOM inputs:**
`loadPreset()` called `this.state.loadPreset(presetName)` which correctly updated state via Proxy (triggering recalculation and KPI updates), but never called `updateAllInputs(this.state.inputs)`. As a result, the DOM input fields continued to display the old values while all calculations used the preset values — creating a mismatch between what the user sees and what is being calculated.
- **Fix:** Added `updateAllInputs(this.state.inputs)` after `this.state.loadPreset(presetName)` in `app.js`
- **Impact:** After loading any Quick Preset, input fields now visually reflect the preset values

**Status: Results still not updating — deeper diagnosis required**

Both bugs above were fixed but the problem persists. The most likely remaining causes are **environment-level**, not code-level:

**Cause A — Opening via `file://` protocol (most likely):**
The app uses ES modules (`import`/`export`). Browsers block cross-origin module loading from `file://`. Opening `index.html` directly via double-click or `open index.html` will load the HTML/CSS but all JS modules will silently fail to import. The app renders but is completely non-functional (no reactive state, no event handlers, no calculations).
- **Diagnostic:** Check browser console for `CORS` or `Failed to fetch` errors
- **Fix:** Must serve via HTTP. Run `python3 -m http.server 8000` then open `http://localhost:8000`

**Cause B — Service worker serving stale cached JS:**
Once the service worker is registered (on first load), it may serve cached versions of JS files that predate the `batteryCapacityKWh`/`pvForBatteryKW` restructure. Subsequent code changes are not picked up.
- **Diagnostic:** Check DevTools → Application → Service Workers; look for "Waiting to activate" state
- **Fix:** DevTools → Application → Service Workers → "Skip waiting" and "Update", then hard reload; or unregister the service worker and reload

**Cause C — Stale localStorage with old field names:**
If `solarCalcState` in localStorage was saved before the battery model restructure, it won't contain `batteryCapacityKWh` or `pvForBatteryKW`. Those fields fall back to `defaultInputs` values, creating silent state/DOM mismatch.
- **Diagnostic:** DevTools → Application → Local Storage → look at `solarCalcState` key
- **Fix:** Delete `solarCalcState` from localStorage, or use the "Reset to Defaults" button (planned for M2)

**Cause D — `defaultResults` in `state.js` has wrong hardcoded values:**
After the home defaults were changed (₱20/kWh, 1kW solar, 10 kWh/day), the hardcoded `defaultResults` in `state.js` was not updated. It still contains stale values (e.g., `annualConsumptionKWh: 18200` should be `3640`, `dailySavings: 400` should be `80`). This only affects the initial display before any input change fires — it is NOT why updates don't propagate.

**Root cause confirmed via browser console (2026-03-16):**

```
Uncaught TypeError: results.pvTotalCapacityKW is undefined
    at updateSection2Results (ui.js:138)
    at updateAllSectionResults (ui.js:243)
    at updateAllKPIs (ui.js:277)
    at setupUI (app.js:146)
```

`pvTotalCapacityKW` was added to the `calculateAll()` return object in `calc.js` as part of the v1.4.0 battery restructure, but was **never added to `defaultResults` in `state.js`**.

**Why this breaks everything (not just Section 2):**
On startup, `setupUI()` calls `updateAllKPIs(this.state.results)` using the hardcoded `defaultResults` — before any user input has fired. `updateSection2Results` reads `results.pvTotalCapacityKW`, which is `undefined`. Calling `.toFixed(1)` on `undefined` throws an uncaught `TypeError` that crashes the entire function. Because the crash is uncaught, the `updateAllKPIs` call in the `onChange` listener is also broken — **no results ever update in response to any input change**, not just the one field that caused the crash.

**Fix applied:** Added `pvTotalCapacityKW: 2` to `defaultResults` in `state.js` (1 kW solar + 1 kW pvForBattery = 2 kW total with home defaults).

**Pattern this exposes:** Any time a new field is added to `calculateAll()`'s return object in `calc.js`, it must also be:
1. Added to `defaultResults` in `state.js` (with a correct computed value matching the home defaults)
2. Handled in the relevant `updateSectionXResults()` function in `ui.js` defensively (null/undefined check before calling number methods)

This rule has been added to the PRD as a standing development requirement (see PRD Section 12 "Milestone Execution Rules").

**Status: RESOLVED ✅**

---

### 2026-03-17 — Milestone 2 Completion

#### M2 Phase 2.7: Reset to Defaults Button

**Implementation:** Added `bindResetButton()` method to `SolarCalcApp` in `app.js`. The handler:
1. Calls `this.state.resetInputs()` — sets all 18 inputs back to `defaultInputs` via Proxy (triggering recalculation)
2. Calls `localStorage.removeItem('solarCalcState')` — clears persisted state so next page load also starts fresh
3. Calls `updateAllInputs(this.state.inputs)` — force-syncs all DOM input fields to show default values

The button (`id="resetDefaults"`) was already in `index.html` at the bottom of the Quick Presets card. `bindResetButton()` is called from `setupUI()` alongside `bindPresetButtons()`.

**M2 Checklist — All items verified:**
- [x] All 4 section inline result panels present and updating
- [x] All 11 KPI cards present and updating
- [x] All 18 input fields bound to state
- [x] Quick Presets load correctly and sync DOM inputs
- [x] Reset to Defaults clears localStorage and restores all defaults
- [x] 155/155 tests passing
- [x] No console errors on startup

**M2 Status: COMPLETE ✅**

---

### 2026-03-17 — Milestone 3 Completion

#### M3: Tooltips, Onboarding & Sun Hours

**Phase 3.1 — Tooltip system:**
All 17 input fields have `❓` buttons with tooltip divs. `bindTooltipButtons()` in `app.js` handles show/hide via `toggleTooltip()` / `hideAllTooltips()` in `ui.js`. One tooltip open at a time. Fixed HTML bug: `rate-tip` tooltip div was unclosed, causing the field container to close prematurely. Added `</div>` to properly close the tooltip before the field container.

**Phase 3.2 — Onboarding modal:**
Updated all 4 slide contents to be more informative:
1. Welcome — what the app does
2. Finding Your Electricity Rate — blended rate = Total Bill ÷ Total kWh (not just Generation Charge)
3. Four Sections, One Answer — brief overview of each section
4. Getting Help — tooltips, Calculate button, Quick Presets, Help button

Changed `checkFirstVisit()` from checking `state.ui.onboardingComplete` (localStorage-backed) to `sessionStorage.getItem('onboardingShown')`. This shows the guide once per browser session. Users can re-open via Help button anytime.

**Phase 3.3 — Sun hours calculator:**
Updated modal to match PRD spec:
- Added North orientation option (-0.6 hrs adjustment)
- Replaced tilt options with PRD-spec values: Standard 10–20° (0), Flat 0–10° (-0.1), Latitude-matched +0.1 (optimal), Steep 30–45° (-0.2)
- Renamed "Apply to Calculator" → "Use This Value"
- Updated external reference links: Global Solar Atlas, PVWatts, NREL Maps with usage instructions

**Phase 3.4 — External reference links:**
`sunhours-tip` tooltip updated to match PRD spec: PSH definition, Philippine average (4.0–4.5 hrs conservative), links to Global Solar Atlas, PVWatts, NREL Maps.

**M3 Status: COMPLETE ✅**

---

---

### 2026-03-17 — Milestone 4 Completion

#### M4: PWA, Themes & Layout

**Phase 4.1 — Service Worker (`sw.js`):**
Expanded from 2 cached URLs to full asset list: index.html, sunhours.html, manifest.json, css/themes.css, all 5 JS modules. Bumped `CACHE_NAME` to `solarcalc-ph-v2` to force cache refresh on existing installs. Added separate `RUNTIME_CACHE` for external CDN assets (Tailwind, Google Fonts) with network-first + cache fallback strategy. Added `self.skipWaiting()` on install and `self.clients.claim()` on activate so new SW takes effect immediately.

**Phase 4.2 — Night/Day Theme Toggle:**
- `applyTheme()` in `ui.js` now updates `#themeIcon`: shows 🌙 in light mode (switch to dark), ☀️ in dark mode (switch to light).
- `loadSavedState()` in `app.js` now calls `_applySystemTheme()` when no saved theme preference exists — detects `prefers-color-scheme: dark` on first load.
- System preference listener in `initializeUI()` fixed: now checks `localStorage` for a saved theme rather than using `onboardingComplete` as a proxy.

**Phase 4.3 — Phone/Desktop/Auto Layout Toggle:**
- `applyLayout()` in `ui.js` now updates `#layoutIcon`: 📐 for auto, 📱 for phone, 🖥️ for desktop.

**Phase 4.4 — `css/themes.css`:**
Created `css/themes.css` with CSS custom properties for both themes (using `--sc-*` prefix). Dark mode overrides (`.dark body`, `.dark .card`, `.dark .input-field`, label/text overrides, tooltips, placeholders) moved from inline `<style>` in `index.html` to `themes.css`. Linked via `<link rel="stylesheet" href="css/themes.css">` in head.

**M4 Checklist — All items verified:**
- [x] Service worker registers and caches all app assets
- [x] Theme toggle switches between light/dark with correct icon update
- [x] Theme persists across page reloads (saved in localStorage on `beforeunload`)
- [x] System `prefers-color-scheme` detected on first load (no saved state)
- [x] Layout toggle cycles Auto→Phone→Desktop with icon update
- [x] `css/themes.css` created with CSS custom properties + dark mode overrides
- [x] 155/155 tests passing
- [x] No new console errors introduced

**M4 Status: COMPLETE ✅**

---

### 2026-03-17 — Milestone 5 Completion

#### M5: Polish & Accessibility

**Phase 5.1 — Responsive Polish:**
Existing responsive layout already handled: `grid-cols-1 md:grid-cols-2` for section forms, `lg:flex` for the sidebar. Verified: single column on 375px, 2-col form on 768px+, sidebar visible on 1024px+.

**Phase 5.2 — KPI Conditional Coloring:**
Fixed a latent bug in `updateKPIDisplay()` in `ui.js`: the original regex `replace(/text-\w+-600/g, '')` only removed `-600` shade classes, so initial `text-gray-400` classes accumulated rather than being replaced. Changed to `replace(/\btext-[a-z]+-\d+\b/g, '')` which cleanly removes any text-color-shade class (gray-400, green-600, etc.) before applying the new color. ROI and Payback KPIs now correctly show green/yellow/red on every update.

**Phase 5.3 — Edge Case Handling:**
- Added `warnRateTooLow` flag to `calculateAll()` (true when `0 < rate < 1`)
- Added `warnLoanExceedsCapex` flag (true when `loanPrincipal > totalCapex`)
- Both flags added to `defaultResults` in `state.js` (Rule 1 compliance)
- `updateWarnings()` added to `ui.js`, called from `updateAllKPIs()`
- Warning divs `#rateWarning` and `#loanWarning` added to `index.html` with `role="alert"` — hidden by default, shown reactively
- `formatYears()` already handles `Infinity` → returns "—" (was already correct)
- 6 new tests: 161/161 pass

**Phase 5.4 — Accessibility:**
- Onboarding modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="onboardingTitle"`
- Sun Hours modal: same ARIA pattern, `id="sunHoursTitle"` on the h2
- Header icon buttons: `aria-label` added (theme toggle, layout toggle, help)
- Emoji icons inside buttons: `aria-hidden="true"` (decorative)
- All 11 KPI cards: `role="button"`, `tabindex="0"`, Enter/Space keyboard handler in `bindKPICardHandlers()`
- Touch targets: icon buttons now `p-3` + `min-w-[44px] min-h-[44px]`; close button gets same
- `prefers-reduced-motion` rule added to `css/themes.css` — disables all transitions/animations

**M5 Checklist — All items verified:**
- [x] KPI colors: ROI Green ≥ 15%, Yellow 8–14.9%, Red < 8%
- [x] KPI colors: Payback Green ≤ 5yr, Yellow 5.1–8yr, Red > 8yr
- [x] "Did you mean ₱12/kWh?" hint when rate < 1
- [x] "Loan exceeds system cost" warning when loan > CAPEX
- [x] Infinity payback displays "—"
- [x] ARIA roles on modals
- [x] KPI cards keyboard navigable
- [x] `prefers-reduced-motion` disables transitions
- [x] 161/161 tests passing

**M5 Status: COMPLETE ✅**

---

### 2026-03-17 — Milestone 6 Completion

#### M6: Narrative Summary (Story Mode)

**Phase 6.1 — Narrative Generator (`js/narrative.js`):**
Created new module with `generateNarrative(inputs, results)` function that produces a 7-part plain-language story from all computed fields:

| Part | Title | Content | Conditional |
|------|-------|---------|-------------|
| 1 | The Problem | Current electricity rate, annual/monthly costs | Always shown |
| 2 | The Hypothesis | PV capacity, daily generation, daily savings, equipment costs | Always shown |
| 3 | Battery Storage | Battery capacity, charge %, nighttime coverage | Hidden if battery = 0 |
| 4 | Total CAPEX | Investment breakdown with itemized costs | Always shown |
| 5 | The Return | Annual savings, ROI %, payback, lifetime savings | Always shown |
| 6 | Financing | Loan analysis, cash flow, interest impact | Hidden if no financing |
| 7 | The Verdict | Green/yellow/red recommendation with actionable advice | Always shown |

**Verdict thresholds:**
- 🟢 **Green (Recommended):** ROI ≥ 15% AND payback ≤ 5 years
- 🟡 **Yellow (Caution):** ROI 8–15% AND payback ≤ 8 years
- 🔴 **Red (Not Recommended):** ROI < 8% OR payback > 8 years

**Phase 6.2 — UI Integration:**
- New Section 5 card in `index.html` with color-coded narrative parts
- **Generate Button UX**: Initial state shows prominent "✨ Generate Narrative Summary" button with explanation text
- When clicked: hides initial state, reveals narrative content, scrolls to section
- After generation: narrative updates automatically when any input changes (reactive)
- Copy/Export buttons only appear after narrative is generated (inside revealed content)
- **Section back-references**: Each part has clickable header button that scrolls to source section
- Verdict badge updates dynamically based on calculation results
- `updateNarrativeFromResults()` in `ui.js` bridges calc → narrative → DOM

**Phase 6.3 — Verdict Logic (Updated per PRD v1.5):**
Changed from ROI-based to payback + cash flow-based verdicts:
- 🟢 **Green**: payback ≤ 4 years AND (no financing OR cash flow buffer ≥ 20%)
- 🟡 **Yellow**: payback 4-6 years OR (financed AND cash flow buffer < 20%)
- 🔴 **Red**: payback > 6 years OR (financed AND negative monthly cash flow)

Added financing-specific metrics:
- `cashFlowBufferPct`: % of monthly savings remaining after loan payment
- `loanShareOfSavingsPct`: % of solar savings consumed by loan

**Phase 6.4 — Export Format:**
- Updated to match PRD spec with footer: "Generated by SolarCalc PH | {url}"
- Clean plain text output (no HTML tags)

**Bug Fix — Console Error on Load:**
Removed `updateNarrativeFromResults(inputs, results)` call from `updateAllKPIs()` — the function doesn't have `inputs` in scope. Narrative updates are properly handled in `app.js` state change listener instead.

**Phase 6.3 — Export Functions:**
- `copyToClipboard()` — copies full narrative with header/timestamp
- `exportAsTxt()` — downloads `solarcalc-report-YYYY-MM-DD.txt`
- Both include report header, generation timestamp, and full 7-part story
- Copy feedback shows "✓ Copied to clipboard!" for 3 seconds

**Phase 6.4 — Service Worker Update:**
- Added `js/narrative.js` to `APP_ASSETS` cache list
- Bumped cache version if needed for offline functionality

**M6 Checklist — All items verified:**
- [x] `js/narrative.js` created with pure narrative generation functions
- [x] 7-part story structure implemented with proper conditional sections
- [x] Color-coded verdict system (green/yellow/red) with actionable advice
- [x] Copy to Clipboard button working with visual feedback
- [x] Export as .txt working with proper filename format
- [x] Battery section hidden when batteryCapacityKWh = 0
- [x] Financing section hidden when no loan
- [x] 161/161 tests passing
- [x] No new console errors introduced

**M6 Status: COMPLETE ✅**

---

### 2026-03-17 — Milestone 7 Completion

#### M7: Save Specifications

**Phase 7.0 — Spec Selector UI:**
- Dark bar at very top of page (above header) with:
  - Dropdown showing current spec (or "— Unsaved —")
  - 💾 Save button (disabled when no active spec)
  - "Save As…" button
  - ⚙️ Manage button

**Phase 7.1 — Save As…:**
- Prompts for name with validation
- Checks for duplicate names
- Checks 20-spec limit
- Creates new spec with generated ID and timestamp
- Becomes active spec automatically

**Phase 7.2 — Save (Overwrite):**
- Silent overwrite of current active spec
- Updates `savedAt` timestamp
- Alert confirmation to user

**Phase 7.3 — Load via Dropdown:**
- Selecting spec from dropdown loads all 18 inputs
- Calls `updateAllInputs()` and triggers recalculation
- Scrolls to top of page
- Sets as active spec

**Phase 7.4 — Manage Panel:**
- Modal with list of all specs
- Each spec card shows: name, summary (system size), date, Active badge
- Actions per spec: ✏️ Rename, 🗑️ Delete
- Delete requires confirmation

**Phase 7.5 — Rename:**
- Inline prompt with current name
- Duplicate name validation
- Updates both localStorage and UI

**Phase 7.6 — Export as JSON:**
- Downloads `solarcalc-specs-YYYY-MM-DD.json`
- Contains export metadata (date, version) and specs array
- Accessible from Manage panel

**Phase 7.7 — Import from JSON:**
- File input accepts `.json` files
- Skips duplicates by name
- Respects 20-spec limit
- Shows results: imported count, skipped count

**Data Structure:**
```javascript
{
  id: "spec_timestamp_random",
  name: "Home 5kW With Battery",
  savedAt: "2026-03-17T01:30:00.000Z",
  inputs: { /* all 18 input values */ }
}
```

**Storage:** `localStorage` key `solarCalcSpecs` (array of spec objects)

**M7 Checklist — All items verified:**
- [x] Spec Selector visible at top of page
- [x] Save As… creates new named spec
- [x] Save overwrites active spec
- [x] Dropdown loads spec and updates all inputs
- [x] Manage panel lists all specs with actions
- [x] Delete with confirmation works
- [x] Rename updates spec name
- [x] Export downloads valid JSON
- [x] Import merges specs (skips duplicates)
- [x] 20-spec limit enforced
- [x] 161/161 tests passing

**M7 Status: COMPLETE ✅**

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
