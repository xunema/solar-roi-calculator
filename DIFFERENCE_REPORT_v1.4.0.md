# Difference Report: PRD v1.4.0 vs Current Implementation

**Date:** 2026-03-16  
**PRD Version:** 1.4.0  
**Implementation Status:** M3 Complete (Tooltips, Onboarding, Sun Hours)

---

## Executive Summary

The PRD v1.4.0 specifies a **major structural reorganization** of the Battery Storage section (Section 3) that has **not been implemented**. This change moves from an auto-calculated battery model to a user-defined battery model with separate PV allocation.

**Impact:** 18 input fields (was 16), new computed fields, updated formulas, UI restructuring.

---

## 1. Missing Input Fields

### 1.1 New Fields (Section 3)
| Field | PRD Location | Status | Notes |
|-------|-------------|--------|-------|
| `batteryCapacityKWh` | Section 3 | ❌ MISSING | User-defined battery size (replaces auto-calc) |
| `pvForBatteryKW` | Section 3 | ❌ MISSING | Dedicated PV capacity for battery charging |

### 1.2 Field to Move
| Field | Current Location | PRD Location | Status |
|-------|-----------------|--------------|--------|
| `batteryPricePerKWh` | Section 2 | Section 3 | ❌ NOT MOVED |

---

## 2. Missing Computed Fields

| Field | Formula | PRD Section | Status |
|-------|---------|-------------|--------|
| `pvTotalCapacityKW` | `solarCapacityKW + pvForBatteryKW` | Section 2 Results | ❌ MISSING |
| `dailyChargeCapacityKWh` | `pvForBatteryKW × peakSunHoursPerDay` | Section 3 | ❌ MISSING |
| `extraSolarCost` | `pvForBatteryKW × solarPricePerKW` | Section 3 | ❌ MISSING |

---

## 3. Formula Changes Required

### 3.1 Battery Cost (BREAKING CHANGE)
```javascript
// CURRENT (state.js line 24, calc.js line 266)
batteryCost = requiredBatteryKWh × batteryPricePerKWh

// PRD v1.4.0 REQUIRED
batteryCost = batteryCapacityKWh × batteryPricePerKWh
```
**Impact:** Battery cost now based on USER INPUT, not calculated from load.

### 3.2 Battery Charge Percentage (BREAKING CHANGE)
```javascript
// CURRENT (calc.js line 313-315)
batteryChargePercent = (extraSolarForBatteryKW × peakSunHoursPerDay / requiredBatteryKWh) × 100

// PRD v1.4.0 REQUIRED
batteryChargePercent = (dailyChargeCapacityKWh / batteryCapacityKWh) × 100
// where dailyChargeCapacityKWh = pvForBatteryKW × peakSunHoursPerDay
```

### 3.3 Total Solar Capacity
```javascript
// CURRENT (calc.js line 263)
totalSolarKW = solarCapacityKW + extraSolarForBatteryKW

// PRD v1.4.0 REQUIRED
totalSolarKW = solarCapacityKW + pvForBatteryKW
```

### 3.4 Total CAPEX
```javascript
// CURRENT (calc.js line 266)
totalCapex = totalSolarKW × solarPricePerKW + requiredBatteryKWh × batteryPricePerKWh + miscInfraCosts

// PRD v1.4.0 REQUIRED
totalCapex = totalPVCapex + batteryCost + extraSolarCost
// where:
//   totalPVCapex = (solarCapacityKW × solarPricePerKW) + miscInfraCosts
//   batteryCost = batteryCapacityKWh × batteryPricePerKWh
//   extraSolarCost = pvForBatteryKW × solarPricePerKW
```

---

## 4. Preset Updates Required

### 4.1 Residential Preset
```javascript
// CURRENT (state.js lines 206-220)
electricityRate: 20,  // ❌ Should be 15 (use app default)
// MISSING: batteryCapacityKWh: 12
// MISSING: pvForBatteryKW: 3

// PRD v1.4.0 REQUIRED
electricityRate: 15,  // Uses app default
batteryCapacityKWh: 12,  // 1.5 kW × 8 hours
pvForBatteryKW: 3,  // 12 kWh ÷ 4 peak sun hours
```

### 4.2 Commercial Preset
```javascript
// CURRENT (state.js lines 222-236)
// MISSING: batteryCapacityKWh: 180
// MISSING: pvForBatteryKW: 45

// PRD v1.4.0 REQUIRED
operatingDaysPerWeek: 5,  // Already correct
dailyEnergyConsumptionKWh: 100,  // Already correct
batteryCapacityKWh: 180,  // 15 kW × 12 hours
pvForBatteryKW: 45,  // 180 kWh ÷ 4 peak sun hours
```

### 4.3 Battery Only Preset
```javascript
// CURRENT (state.js lines 238-252)
// MISSING: batteryCapacityKWh: 50
// MISSING: pvForBatteryKW: 12.5

// PRD v1.4.0 REQUIRED
batteryCapacityKWh: 50,  // 5 kW × 10 hours
pvForBatteryKW: 12.5,  // 50 kWh ÷ 4 peak sun hours
```

### 4.4 Spreadsheet Preset
```javascript
// CURRENT (state.js lines 254-269)
// MISSING: batteryCapacityKWh: 0
// MISSING: pvForBatteryKW: 0

// PRD v1.4.0 REQUIRED
batteryCapacityKWh: 0,  // Spreadsheet has no battery
pvForBatteryKW: 0,  // Spreadsheet has no battery
```

---

## 5. UI Changes Required

### 5.1 Section 2 — PhotoVoltaic System

#### Input Changes
- ❌ **REMOVE:** Battery Price/kWh input (move to Section 3)

#### Results Panel Changes (index.html lines 431-455)
```html
<!-- CURRENT -->
PV Equipment Cost
Total PV CAPEX
Daily Generation
Daily Savings
Annual Generation

<!-- PRD v1.4.0 REQUIRED -->
PV Total Capacity      ← NEW (solarCapacityKW + pvForBatteryKW)
PV Equipment Cost
Total PV CAPEX
Daily Generation
Daily Savings
Annual Generation
```

### 5.2 Section 3 — Battery Storage

#### Input Changes (index.html lines 459-530)
```html
<!-- CURRENT INPUTS -->
Nighttime Load
Nighttime Duration

<!-- PRD v1.4.0 REQUIRED -->
Battery Price/kWh      ← MOVED FROM SECTION 2
Battery Capacity       ← NEW INPUT
PV for Battery         ← NEW INPUT
Nighttime Load         ← REFERENCE ONLY
Nighttime Duration     ← REFERENCE ONLY
```

#### Results Panel Changes
```html
<!-- CURRENT -->
Required Battery
Battery Cost
Extra PV for Charging
Extra PV Cost
Battery Charge %

<!-- PRD v1.4.0 REQUIRED -->
Battery Capacity         ← User input (not auto-calculated)
Battery Cost             ← batteryCapacityKWh × batteryPricePerKWh
PV for Battery           ← User input for dedicated charging
Extra PV Cost            ← pvForBatteryKW × solarPricePerKW
Daily Charge Capacity    ← pvForBatteryKW × peakSunHoursPerDay
Battery Charge %         ← (dailyChargeCapacity / batteryCapacity) × 100
── Reference Calculation ──
Required Battery (Ref)   ← nighttimeLoadKW × nighttimeDurationHours (reference only)
```

---

## 6. Default Values Changes

### 6.1 Default Inputs (state.js lines 11-34)
```javascript
// CURRENT
electricityRate: 15.00,  // ✅ Correct
solarPricePerKW: 30000,  // ❌ PRD: 80000 (residential default)
batteryPricePerKWh: 12000,  // ❌ PRD: 30000 (residential default)
// MISSING: batteryCapacityKWh: 0
// MISSING: pvForBatteryKW: 0

// PRD v1.4.0 REQUIRED
electricityRate: 15,
solarPricePerKW: 80000,  // Residential suggested default
miscInfraCosts: 0,
batteryPricePerKWh: 30000,  // Now in Section 3
batteryCapacityKWh: 0,
pvForBatteryKW: 0,
nighttimeLoadKW: 0,
nighttimeDurationHours: 0,
```

---

## 7. Test Updates Required

The test file (`tests/calc.test.js`) uses hardcoded expected values that will change:

1. **Battery Cost calculations** — Now use `batteryCapacityKWh` instead of `requiredBatteryKWh`
2. **Total CAPEX calculations** — Now include `extraSolarCost` separately
3. **Battery Charge Percent** — New formula using `pvForBatteryKW`

**Estimated tests to update:** ~30-40 tests (of 154 total)

---

## 8. Implementation Checklist

### Phase 1: Core Logic
- [ ] Add `batteryCapacityKWh` and `pvForBatteryKW` to defaultInputs
- [ ] Move `batteryPricePerKWh` default to 30000 (residential)
- [ ] Update `calculateAll()` in calc.js with new formulas
- [ ] Add new computed fields: `pvTotalCapacityKW`, `dailyChargeCapacityKWh`, `extraSolarCost`
- [ ] Update presets with new fields

### Phase 2: UI Structure
- [ ] Move Battery Price input from Section 2 to Section 3
- [ ] Add Battery Capacity input in Section 3
- [ ] Add PV for Battery input in Section 3
- [ ] Update Section 2 Results: Add PV Total Capacity
- [ ] Update Section 3 Results: New layout with Daily Charge Capacity

### Phase 3: Testing
- [ ] Update test expectations for new formulas
- [ ] Verify all 154 tests pass
- [ ] Manual testing of presets

---

## 9. Backward Compatibility

**Breaking Changes:**
1. Battery cost calculation changes from auto-calculated to user-defined
2. Existing saved states won't have `batteryCapacityKWh` or `pvForBatteryKW`

**Migration Strategy:**
```javascript
// On load, if batteryCapacityKWh is undefined, initialize from requiredBatteryKWh
if (savedState.batteryCapacityKWh === undefined) {
  savedState.batteryCapacityKWh = savedState.requiredBatteryKWh || 0;
}
if (savedState.pvForBatteryKW === undefined) {
  savedState.pvForBatteryKW = savedState.extraSolarForBatteryKW || 0;
}
```

---

## 10. Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `js/state.js` | ~40 lines | New fields, updated presets, new defaults |
| `js/calc.js` | ~50 lines | New formulas, new computed fields |
| `js/ui.js` | ~30 lines | New result displays |
| `index.html` | ~100 lines | Restructure Section 2 & 3 inputs/results |
| `tests/calc.test.js` | ~100 lines | Update test expectations |

---

**End of Report**
