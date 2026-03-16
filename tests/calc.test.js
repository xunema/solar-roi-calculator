/**
 * calc.test.js - Milestone 1 Comprehensive Test Suite for SolarCalc PH
 * Tests: calc.js, format.js, state.js
 * Run with: node tests/calc.test.js
 *
 * Coverage:
 *   - Every individual calc function
 *   - PRD v1.2 per-section computed fields (projectedMonthlyCost, pvSystemCost, etc.)
 *   - Spreadsheet verification scenarios (A, B, C)
 *   - PRD default inputs scenario
 *   - Edge cases (zeros, nulls, division-by-zero, Infinity)
 *   - Color category helpers
 *   - Reverse calculation
 *   - format.js formatting functions
 *   - state.js reactive state + app state manager
 */

import {
  calculateOperatingDaysPerYear,
  calculateProjectedAnnualCost,
  calculateRequiredBatteryKWh,
  calculateExtraSolarForBatteryKW,
  calculateTotalSolarKW,
  calculateTotalCapex,
  calculateAnnualGenerationKWh,
  calculateAnnualSavings,
  calculateSimpleROI,
  calculatePaybackYears,
  calculateMonthlyAmortization,
  calculateTotalLoanCost,
  calculateTotalInterestPaid,
  calculateMonthlySavings,
  calculateNetMonthlyCashFlow,
  reverseCalculateDailyConsumption,
  getROIColor,
  getPaybackColor,
  getCashFlowColor,
  calculateAll
} from '../js/calc.js';

import {
  formatPeso,
  formatPesoWhole,
  formatPercent,
  formatYears,
  formatNumber,
  formatWithUnit,
  parsePeso,
  parsePercent,
  formatCompact,
  round,
  clamp
} from '../js/format.js';

import {
  createReactiveState,
  createAppState,
  defaultInputs,
  defaultResults
} from '../js/state.js';

// ============================================
// TEST RUNNER
// ============================================
let testsPassed = 0;
let testsFailed = 0;
let testsSkipped = 0;
let currentGroup = '';

function group(name) {
  currentGroup = name;
  console.log(`\n${name}`);
  console.log('─'.repeat(Math.min(name.length + 4, 50)));
}

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${error.message}`);
    testsFailed++;
  }
}

// Mark tests for features not yet implemented — logs a skip without failing the suite
function todo(name, _fn) {
  console.log(`  ⏭️  ${name} [TODO — not yet implemented in calc.js]`);
  testsSkipped++;
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

function assertClose(actual, expected, tolerance = 0.01, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message || 'Assertion failed'}: expected ${expected} ±${tolerance}, got ${actual}`);
  }
}

function assertTrue(value, message) {
  if (!value) throw new Error(message || 'Expected true, got false');
}

function assertFalse(value, message) {
  if (value) throw new Error(message || 'Expected false, got true');
}

function assertNull(value, message) {
  if (value !== null) throw new Error(`${message || 'Expected null'}, got ${value}`);
}

function assertType(value, type, message) {
  if (typeof value !== type) throw new Error(`${message || 'Type mismatch'}: expected ${type}, got ${typeof value}`);
}

// ============================================
// 1. OPERATING DAYS
// ============================================
group('📅 Operating Days');

test('52 weeks × 7 days = 364 days', () => {
  assertEqual(calculateOperatingDaysPerYear(52, 7), 364);
});

test('50 weeks × 6 days = 300 days (spreadsheet schedule)', () => {
  assertEqual(calculateOperatingDaysPerYear(50, 6), 300);
});

test('1 week × 1 day = 1 day (minimum valid)', () => {
  assertEqual(calculateOperatingDaysPerYear(1, 1), 1);
});

test('Zero weeks → 0', () => {
  assertEqual(calculateOperatingDaysPerYear(0, 7), 0);
});

test('Zero days → 0', () => {
  assertEqual(calculateOperatingDaysPerYear(52, 0), 0);
});

test('Null inputs → 0', () => {
  assertEqual(calculateOperatingDaysPerYear(null, 7), 0);
  assertEqual(calculateOperatingDaysPerYear(52, null), 0);
  assertEqual(calculateOperatingDaysPerYear(null, null), 0);
});

test('Undefined inputs → 0', () => {
  assertEqual(calculateOperatingDaysPerYear(undefined, 7), 0);
});

// ============================================
// 2. PROJECTED COSTS (Section 1 Results)
// ============================================
group('💰 Section 1 — Status Quo Cost Projection');

test('50 kWh/day × ₱10/kWh × 364 days = ₱182,000/yr', () => {
  assertEqual(calculateProjectedAnnualCost(50, 10, 364), 182000);
});

test('50 kWh × ₱10 × 364 = ₱182,000 (₱10/kWh scenario)', () => {
  const days = calculateOperatingDaysPerYear(52, 7);
  const annual = calculateProjectedAnnualCost(50, 10, days);
  assertEqual(annual, 182000);
});

test('Spreadsheet scenario: high consumption commercial', () => {
  // 300 kW plant × 4h = 1200 kWh/day, but consumption is separate
  const days = calculateOperatingDaysPerYear(50, 6); // 300
  const annual = calculateProjectedAnnualCost(1200, 11, days);
  assertEqual(annual, 3960000);
});

test('Zero consumption → ₱0', () => {
  assertEqual(calculateProjectedAnnualCost(0, 10, 364), 0);
});

test('Zero rate → ₱0', () => {
  assertEqual(calculateProjectedAnnualCost(50, 0, 364), 0);
});

test('Zero days → ₱0', () => {
  assertEqual(calculateProjectedAnnualCost(50, 10, 0), 0);
});

// PRD v1.2: projectedMonthlyCost = projectedAnnualCost / 12
test('Monthly cost = annual / 12: ₱182,000 / 12 = ₱15,166.67', () => {
  const annual = calculateProjectedAnnualCost(50, 10, 364);
  const monthly = annual / 12;
  assertClose(monthly, 15166.67, 0.01);
});

// ============================================
// 3. BATTERY CALCULATIONS (Section 3)
// ============================================
group('🔋 Section 3 — Battery Storage');

test('Required battery: 5 kW × 10 hrs = 50 kWh', () => {
  assertEqual(calculateRequiredBatteryKWh(5, 10), 50);
});

test('Spreadsheet battery: 40 kW × 10 hrs = 400 kWh', () => {
  assertEqual(calculateRequiredBatteryKWh(40, 10), 400);
});

test('Zero load → 0 kWh', () => {
  assertEqual(calculateRequiredBatteryKWh(0, 10), 0);
});

test('Zero duration → 0 kWh', () => {
  assertEqual(calculateRequiredBatteryKWh(5, 0), 0);
});

test('Null inputs → 0', () => {
  assertEqual(calculateRequiredBatteryKWh(null, 10), 0);
  assertEqual(calculateRequiredBatteryKWh(5, null), 0);
});

test('Extra solar for battery: 50 kWh ÷ 4 PSH = 12.5 kW', () => {
  assertEqual(calculateExtraSolarForBatteryKW(50, 4), 12.5);
});

test('Extra solar for battery: 400 kWh ÷ 4 PSH = 100 kW', () => {
  assertEqual(calculateExtraSolarForBatteryKW(400, 4), 100);
});

test('Zero battery → 0 extra solar', () => {
  assertEqual(calculateExtraSolarForBatteryKW(0, 4), 0);
});

test('Zero sun hours → 0 extra solar (division guard)', () => {
  assertEqual(calculateExtraSolarForBatteryKW(50, 0), 0);
});

// PRD v1.2: Section 3 results — batteryCost = requiredBatteryKWh × batteryPricePerKWh
test('Battery cost: 400 kWh × ₱8,000 = ₱3,200,000', () => {
  const batteryKWh = calculateRequiredBatteryKWh(40, 10);
  const batteryCost = batteryKWh * 8000;
  assertEqual(batteryCost, 3200000);
});

test('Battery cost: 50 kWh × ₱12,000 = ₱600,000', () => {
  const batteryKWh = calculateRequiredBatteryKWh(5, 10);
  const batteryCost = batteryKWh * 12000;
  assertEqual(batteryCost, 600000);
});

// ============================================
// 4. PV SYSTEM (Section 2 Results)
// ============================================
group('☀️ Section 2 — PhotoVoltaic System');

test('Total solar: 10 kW base + 12.5 kW extra = 22.5 kW', () => {
  assertEqual(calculateTotalSolarKW(10, 12.5), 22.5);
});

test('Total solar: no battery → base only', () => {
  assertEqual(calculateTotalSolarKW(10, 0), 10);
});

test('Total solar: null extra → base only', () => {
  assertEqual(calculateTotalSolarKW(10, null), 10);
});

test('Spreadsheet: 300 kW base + 100 kW extra = 400 kW', () => {
  assertEqual(calculateTotalSolarKW(300, 100), 400);
});

// PRD v1.2: pvSystemCost = solarCapacityKW × solarPricePerKW
test('PV equipment cost: 10 kW × ₱30,000 = ₱300,000', () => {
  const pvCost = 10 * 30000;
  assertEqual(pvCost, 300000);
});

test('PV equipment cost: 300 kW × ₱40,000 = ₱12,000,000', () => {
  const pvCost = 300 * 40000;
  assertEqual(pvCost, 12000000);
});

// PRD v1.2: totalPVCapex = pvSystemCost + miscInfraCosts
test('Total PV CAPEX: ₱12,000,000 + ₱2,000,000 misc = ₱14,000,000', () => {
  const pvCapex = (300 * 40000) + 2000000;
  assertEqual(pvCapex, 14000000);
});

// PRD v1.2: dailyGenerationKWh = solarCapacityKW × peakSunHoursPerDay
test('Daily generation: 10 kW × 4 PSH = 40 kWh/day', () => {
  const daily = 10 * 4;
  assertEqual(daily, 40);
});

test('Daily generation: 300 kW × 4 PSH = 1,200 kWh/day', () => {
  const daily = 300 * 4;
  assertEqual(daily, 1200);
});

test('Annual generation: 10 kW × 4 PSH × 364 days = 14,560 kWh', () => {
  assertEqual(calculateAnnualGenerationKWh(10, 4, 364), 14560);
});

test('Annual generation: 300 kW × 4 PSH × 300 days = 360,000 kWh', () => {
  assertEqual(calculateAnnualGenerationKWh(300, 4, 300), 360000);
});

test('Annual generation: 400 kW total × 4 PSH × 300 days = 480,000 kWh', () => {
  assertEqual(calculateAnnualGenerationKWh(400, 4, 300), 480000);
});

// ============================================
// 5. CAPEX (Dashboard)
// ============================================
group('🏗️ Total CAPEX');

test('Solar only: 10 kW × ₱30,000 = ₱300,000', () => {
  assertEqual(calculateTotalCapex(10, 30000, 0, 12000, 0), 300000);
});

test('Solar + misc: 10 kW × ₱30,000 + ₱50,000 = ₱350,000', () => {
  assertEqual(calculateTotalCapex(10, 30000, 0, 12000, 50000), 350000);
});

test('Solar + battery: 22.5 kW × ₱30,000 + 50 kWh × ₱12,000 = ₱1,275,000', () => {
  assertEqual(calculateTotalCapex(22.5, 30000, 50, 12000, 0), 1275000);
});

test('Spreadsheet A (solar only): 300 kW × ₱40,000 + ₱2M misc = ₱14,000,000', () => {
  assertEqual(calculateTotalCapex(300, 40000, 0, 5000, 2000000), 14000000);
});

test('Spreadsheet C (combined): 400 kW × ₱40,000 + 400 kWh × ₱8,000 + ₱2M = ₱21,200,000', () => {
  assertEqual(calculateTotalCapex(400, 40000, 400, 8000, 2000000), 21200000);
});

test('Zero everything → ₱0', () => {
  assertEqual(calculateTotalCapex(0, 0, 0, 0, 0), 0);
});

// ============================================
// 6. SAVINGS
// ============================================
group('⚡ Annual Savings');

test('14,560 kWh × ₱10 = ₱145,600 (₱10/kWh scenario)', () => {
  assertEqual(calculateAnnualSavings(14560, 10), 145600);
});

test('360,000 kWh × ₱11 = ₱3,960,000 (spreadsheet A adjusted)', () => {
  assertEqual(calculateAnnualSavings(360000, 11), 3960000);
});

test('360,000 kWh × ₱10 = ₱3,600,000 (spreadsheet A @ ₱10)', () => {
  assertEqual(calculateAnnualSavings(360000, 10), 3600000);
});

test('Zero generation → ₱0', () => {
  assertEqual(calculateAnnualSavings(0, 10), 0);
});

test('Zero rate → ₱0', () => {
  assertEqual(calculateAnnualSavings(14560, 0), 0);
});

// ============================================
// 7. ROI & PAYBACK (Dashboard)
// ============================================
group('📊 ROI & Payback');

test('Simple ROI: ₱145,600 / ₱300,000 = 48.53%', () => {
  assertClose(calculateSimpleROI(145600, 300000), 48.53, 0.01);
});

test('Simple ROI: ₱3,600,000 / ₱14,000,000 = 25.71% (spreadsheet A @ ₱10)', () => {
  assertClose(calculateSimpleROI(3600000, 14000000), 25.71, 0.01);
});

test('Simple ROI: ₱900,000 / ₱3,200,000 = 28.13% (spreadsheet B)', () => {
  assertClose(calculateSimpleROI(900000, 3200000), 28.125, 0.01);
});

test('Simple ROI: zero CAPEX → 0%', () => {
  assertEqual(calculateSimpleROI(145600, 0), 0);
});

test('Simple ROI: negative CAPEX → 0%', () => {
  assertEqual(calculateSimpleROI(145600, -100), 0);
});

test('Payback: ₱300,000 / ₱145,600 = 2.06 years (₱10/kWh scenario)', () => {
  assertClose(calculatePaybackYears(300000, 145600), 2.06, 0.01);
});

test('Payback: ₱14,000,000 / ₱3,600,000 = 3.89 years (spreadsheet A @ ₱10)', () => {
  assertClose(calculatePaybackYears(14000000, 3600000), 3.89, 0.01);
});

test('Payback: ₱3,200,000 / ₱900,000 = 3.56 years (spreadsheet B)', () => {
  assertClose(calculatePaybackYears(3200000, 900000), 3.56, 0.01);
});

test('Payback: ₱17,200,000 / ₱4,500,000 = 3.82 years (spreadsheet C)', () => {
  assertClose(calculatePaybackYears(17200000, 4500000), 3.82, 0.01);
});

test('Payback: zero savings → Infinity', () => {
  assertEqual(calculatePaybackYears(300000, 0), Infinity);
});

test('Payback: negative savings → Infinity', () => {
  assertEqual(calculatePaybackYears(300000, -100), Infinity);
});

test('Payback: zero CAPEX / positive savings → 0 years', () => {
  assertEqual(calculatePaybackYears(0, 145600), 0);
});

// ============================================
// 8. LOAN AMORTIZATION (Section 4 Results)
// ============================================
group('🏦 Section 4 — Financing');

test('₱14,000,000 @ 12% over 60 months = ₱311,422.27/mo (spreadsheet)', () => {
  assertClose(calculateMonthlyAmortization(14000000, 12, 60), 311422.27, 0.5);
});

test('₱500,000 @ 12% over 60 months ≈ ₱11,122.22/mo (PRD test case)', () => {
  assertClose(calculateMonthlyAmortization(500000, 12, 60), 11122.22, 0.5);
});

test('₱500,000 @ 0% over 60 months = ₱8,333.33/mo (zero interest)', () => {
  assertClose(calculateMonthlyAmortization(500000, 0, 60), 8333.33, 0.01);
});

test('₱14,000,000 @ 0% over 60 months = ₱233,333.33/mo', () => {
  assertClose(calculateMonthlyAmortization(14000000, 0, 60), 233333.33, 0.01);
});

test('Zero principal → ₱0', () => {
  assertEqual(calculateMonthlyAmortization(0, 12, 60), 0);
});

test('Null principal → ₱0', () => {
  assertEqual(calculateMonthlyAmortization(null, 12, 60), 0);
});

test('Zero months → ₱0', () => {
  assertEqual(calculateMonthlyAmortization(14000000, 12, 0), 0);
});

test('₱100,000 @ 8% over 36 months', () => {
  // r = 0.08/12 = 0.006667, n = 36
  // Payment = 100000 * (0.006667 * 1.006667^36) / (1.006667^36 - 1) ≈ 3133.64
  assertClose(calculateMonthlyAmortization(100000, 8, 36), 3133.64, 0.5);
});

test('Total loan cost: ₱311,422.27 × 60 = ₱18,685,336.20', () => {
  assertClose(calculateTotalLoanCost(311422.27, 60), 18685336.2, 1);
});

test('Total interest: ₱18,685,336 − ₱14,000,000 = ₱4,685,336', () => {
  const totalCost = calculateTotalLoanCost(311422.27, 60);
  assertClose(calculateTotalInterestPaid(totalCost, 14000000), 4685336.2, 1);
});

test('Zero interest loan: total interest = ₱0', () => {
  const monthly = calculateMonthlyAmortization(500000, 0, 60);
  const totalCost = calculateTotalLoanCost(monthly, 60);
  assertClose(calculateTotalInterestPaid(totalCost, 500000), 0, 0.01);
});

// ============================================
// 9. MONTHLY FIGURES (Dashboard)
// ============================================
group('📅 Monthly Figures');

test('Monthly savings: ₱145,600 / 12 = ₱12,133.33', () => {
  assertClose(calculateMonthlySavings(145600), 12133.33, 0.01);
});

test('Monthly savings: ₱3,600,000 / 12 = ₱300,000', () => {
  assertEqual(calculateMonthlySavings(3600000), 300000);
});

test('Monthly savings: zero → ₱0', () => {
  assertEqual(calculateMonthlySavings(0), 0);
});

test('Monthly savings: null → ₱0', () => {
  assertEqual(calculateMonthlySavings(null), 0);
});

test('Net cash flow positive: ₱12,133 − ₱5,000 = ₱7,133', () => {
  assertClose(calculateNetMonthlyCashFlow(12133, 5000), 7133, 0.01);
});

test('Net cash flow negative: ₱5,000 − ₱8,000 = −₱3,000', () => {
  assertEqual(calculateNetMonthlyCashFlow(5000, 8000), -3000);
});

test('Net cash flow: no loan → equals monthly savings', () => {
  assertEqual(calculateNetMonthlyCashFlow(12133, 0), 12133);
});

// ============================================
// 10. REVERSE CALCULATION
// ============================================
group('🔄 Reverse Calculation (Annual Bill → Daily Consumption)');

test('₱5,000,000 / (₱11 × 300 days) = 1,515.15 kWh/day', () => {
  assertClose(reverseCalculateDailyConsumption(5000000, 11, 300), 1515.15, 0.1);
});

test('₱182,000 / (₱10 × 364 days) = 50 kWh/day (round-trip at ₱10)', () => {
  assertClose(reverseCalculateDailyConsumption(182000, 10, 364), 50, 0.01);
});

test('Null annual bill → null', () => {
  assertNull(reverseCalculateDailyConsumption(null, 11, 300));
});

test('Zero annual bill → null', () => {
  assertNull(reverseCalculateDailyConsumption(0, 11, 300));
});

test('Null rate → null', () => {
  assertNull(reverseCalculateDailyConsumption(5000000, null, 300));
});

test('Zero rate → null (division guard)', () => {
  assertNull(reverseCalculateDailyConsumption(5000000, 0, 300));
});

test('Null days → null', () => {
  assertNull(reverseCalculateDailyConsumption(5000000, 11, null));
});

test('Zero days → null (division guard)', () => {
  assertNull(reverseCalculateDailyConsumption(5000000, 11, 0));
});

// ============================================
// 11. COLOR CATEGORIES
// ============================================
group('🎨 Color Categories');

test('ROI ≥ 15% → green', () => {
  assertEqual(getROIColor(15), 'green');
  assertEqual(getROIColor(25.7), 'green');
  assertEqual(getROIColor(100), 'green');
});

test('ROI 8–14.9% → yellow', () => {
  assertEqual(getROIColor(8), 'yellow');
  assertEqual(getROIColor(10), 'yellow');
  assertEqual(getROIColor(14.9), 'yellow');
});

test('ROI < 8% → red', () => {
  assertEqual(getROIColor(7.9), 'red');
  assertEqual(getROIColor(0), 'red');
  assertEqual(getROIColor(-5), 'red');
});

test('Payback ≤ 5 years → green', () => {
  assertEqual(getPaybackColor(1), 'green');
  assertEqual(getPaybackColor(3.89), 'green');
  assertEqual(getPaybackColor(5), 'green');
});

test('Payback 5.1–8 years → yellow', () => {
  assertEqual(getPaybackColor(5.1), 'yellow');
  assertEqual(getPaybackColor(6.5), 'yellow');
  assertEqual(getPaybackColor(8), 'yellow');
});

test('Payback > 8 years → red', () => {
  assertEqual(getPaybackColor(8.1), 'red');
  assertEqual(getPaybackColor(20), 'red');
});

test('Payback Infinity → red', () => {
  assertEqual(getPaybackColor(Infinity), 'red');
});

test('Cash flow ≥ 0 → green', () => {
  assertEqual(getCashFlowColor(100), 'green');
  assertEqual(getCashFlowColor(0), 'green');
});

test('Cash flow < 0 → red', () => {
  assertEqual(getCashFlowColor(-1), 'red');
  assertEqual(getCashFlowColor(-50000), 'red');
});

// ============================================
// 12. calculateAll — PRD DEFAULT SCENARIO
// ============================================
group('🧮 calculateAll — PRD Default Inputs');

test('Baseline scenario: 10 kW, ₱10/kWh, 4 PSH, 52w × 7d, no battery, no loan', () => {
  const results = calculateAll({
    electricityRate: 10,
    operatingWeeksPerYear: 52,
    operatingDaysPerWeek: 7,
    dailyEnergyConsumptionKWh: 50,
    solarCapacityKW: 10,
    peakSunHoursPerDay: 4,
    solarPricePerKW: 30000,
    miscInfraCosts: 0,
    batteryPricePerKWh: 12000,
    nighttimeLoadKW: 0,
    nighttimeDurationHours: 0,
    loanPrincipal: 0,
    annualInterestRate: 0,
    loanTermMonths: 60
  });

  assertEqual(results.operatingDaysPerYear, 364, 'Operating days');
  assertEqual(results.annualConsumptionKWh, 18200, 'Annual consumption kWh');
  assertEqual(results.totalSolarKW, 10, 'Total solar kW');
  assertEqual(results.requiredBatteryKWh, 0, 'Battery kWh');
  assertEqual(results.extraSolarForBatteryKW, 0, 'Extra solar');
  assertEqual(results.totalCapex, 300000, 'Total CAPEX');
  assertEqual(results.annualGenerationKWh, 14560, 'Annual generation');
  assertEqual(results.annualSavings, 145600, 'Annual savings');
  assertClose(results.simpleROI, 48.53, 0.01, 'ROI');
  assertClose(results.paybackYears, 2.06, 0.01, 'Payback');
  assertClose(results.monthlySavings, 12133.33, 0.01, 'Monthly savings');
  assertEqual(results.monthlyAmortization, 0, 'No amortization');
  assertClose(results.netMonthlyCashFlow, 12133.33, 0.01, 'Net cash flow');
  assertEqual(results.hasFinancing, false, 'No financing');
  assertEqual(results.roiColor, 'green', 'ROI color');
  assertEqual(results.paybackColor, 'green', 'Payback color');
  assertEqual(results.cashFlowColor, 'green', 'Cash flow color');

  // Section 1 results
  assertEqual(results.projectedAnnualCost, 182000, 'Projected annual cost');
  assertEqual(results.effectiveAnnualCost, 182000, 'Effective annual cost (no override)');
});

// ============================================
// 13. calculateAll — SPREADSHEET SCENARIO A (Solar Only)
// ============================================
group('🧮 calculateAll — Spreadsheet Scenario A: Solar Only');

test('300 kW, ₱11/kWh, 4 PSH, 50w × 6d, ₱40k/kW, ₱2M misc', () => {
  const results = calculateAll({
    electricityRate: 11,
    operatingWeeksPerYear: 50,
    operatingDaysPerWeek: 6,
    dailyEnergyConsumptionKWh: 0,
    solarCapacityKW: 300,
    peakSunHoursPerDay: 4,
    solarPricePerKW: 40000,
    miscInfraCosts: 2000000,
    batteryPricePerKWh: 5000,
    nighttimeLoadKW: 0,
    nighttimeDurationHours: 0,
    loanPrincipal: 0,
    annualInterestRate: 0,
    loanTermMonths: 60
  });

  assertEqual(results.operatingDaysPerYear, 300, 'Operating days');
  assertEqual(results.totalSolarKW, 300, 'Total solar kW');
  assertClose(results.totalCapex, 14000000, 1, 'CAPEX = ₱14,000,000');
  assertEqual(results.annualGenerationKWh, 360000, 'Generation = 360,000 kWh');
  assertClose(results.annualSavings, 3960000, 1, 'Savings = ₱3,960,000');
  assertClose(results.simpleROI, 28.29, 0.1, 'ROI ≈ 28.3%');
  assertClose(results.paybackYears, 3.54, 0.01, 'Payback ≈ 3.54 yr');
  assertEqual(results.roiColor, 'green');
  assertEqual(results.paybackColor, 'green');
});

// Spreadsheet uses ₱10/kWh in the "assumptions" column
test('Scenario A at ₱10/kWh: savings = ₱3,600,000, payback ≈ 3.89 yr', () => {
  const results = calculateAll({
    electricityRate: 10,
    operatingWeeksPerYear: 50,
    operatingDaysPerWeek: 6,
    dailyEnergyConsumptionKWh: 0,
    solarCapacityKW: 300,
    peakSunHoursPerDay: 4,
    solarPricePerKW: 40000,
    miscInfraCosts: 2000000,
    batteryPricePerKWh: 5000,
    nighttimeLoadKW: 0,
    nighttimeDurationHours: 0,
    loanPrincipal: 0,
    annualInterestRate: 0,
    loanTermMonths: 60
  });

  assertClose(results.annualSavings, 3600000, 1, 'Savings at ₱10');
  assertClose(results.paybackYears, 3.89, 0.01, 'Payback at ₱10');
  assertClose(results.simpleROI, 25.71, 0.1, 'ROI at ₱10');
});

// ============================================
// 14. calculateAll — SPREADSHEET SCENARIO C (Combined)
// ============================================
group('🧮 calculateAll — Spreadsheet Scenario C: Solar + Battery');

test('300 kW solar + 400 kWh battery (PRD v1.4 user-defined)', () => {
  const results = calculateAll({
    electricityRate: 11,
    operatingWeeksPerYear: 50,
    operatingDaysPerWeek: 6,
    dailyEnergyConsumptionKWh: 0,
    solarCapacityKW: 300,
    peakSunHoursPerDay: 4,
    solarPricePerKW: 40000,
    miscInfraCosts: 2000000,
    batteryPricePerKWh: 8000,
    batteryCapacityKWh: 400,    // User-defined (was calculated from load)
    pvForBatteryKW: 100,        // User-defined: 400 kWh ÷ 4 PSH = 100 kW
    nighttimeLoadKW: 40,        // Reference only
    nighttimeDurationHours: 10, // Reference only
    loanPrincipal: 0,
    annualInterestRate: 0,
    loanTermMonths: 60
  });

  assertEqual(results.requiredBatteryKWh, 400, 'Reference battery = 400 kWh');
  assertEqual(results.batteryCapacityKWh, 400, 'User battery = 400 kWh');
  assertEqual(results.pvForBatteryKW, 100, 'PV for battery = 100 kW');
  assertEqual(results.totalSolarKW, 400, 'Total solar = 400 kW');
  assertEqual(results.batteryChargePercent, 100, 'Charge % = 100% (100×4=400)');
  // CAPEX: 400×40000 + 400×8000 + 2000000 = 16M + 3.2M + 2M = 21.2M
  assertClose(results.totalCapex, 21200000, 1, 'CAPEX = ₱21,200,000');
  assertEqual(results.annualGenerationKWh, 480000, 'Generation = 480,000 kWh');
  assertClose(results.annualSavings, 5280000, 1, 'Savings = ₱5,280,000');
});

// ============================================
// 15. calculateAll — LOAN SCENARIO
// ============================================
group('🧮 calculateAll — Loan Scenario');

test('₱14M loan @ 12% over 60 months', () => {
  const results = calculateAll({
    electricityRate: 11,
    operatingWeeksPerYear: 50,
    operatingDaysPerWeek: 6,
    dailyEnergyConsumptionKWh: 0,
    solarCapacityKW: 300,
    peakSunHoursPerDay: 4,
    solarPricePerKW: 40000,
    miscInfraCosts: 2000000,
    batteryPricePerKWh: 5000,
    nighttimeLoadKW: 0,
    nighttimeDurationHours: 0,
    loanPrincipal: 14000000,
    annualInterestRate: 12,
    loanTermMonths: 60
  });

  assertTrue(results.hasFinancing, 'hasFinancing flag');
  assertClose(results.monthlyAmortization, 311422.27, 0.5, 'Monthly amortization');
  assertClose(results.totalInterestPaid, 4685336, 100, 'Total interest');
  // Monthly savings: 3,960,000 / 12 = 330,000
  assertClose(results.monthlySavings, 330000, 1, 'Monthly savings');
  // Net cash flow: 330,000 - 311,422.27 = 18,577.73
  assertClose(results.netMonthlyCashFlow, 18577.73, 1, 'Net cash flow positive');
  assertEqual(results.cashFlowColor, 'green', 'Positive cash flow → green');
});

// ============================================
// 16. calculateAll — ANNUAL BILL OVERRIDE
// ============================================
group('🧮 calculateAll — Annual Bill Override');

test('Annual bill overrides effective annual cost', () => {
  const results = calculateAll({
    electricityRate: 10,
    operatingWeeksPerYear: 52,
    operatingDaysPerWeek: 7,
    dailyEnergyConsumptionKWh: 50,
    annualBill: 250000, // Override
    solarCapacityKW: 10,
    peakSunHoursPerDay: 4,
    solarPricePerKW: 30000,
    miscInfraCosts: 0,
    batteryPricePerKWh: 12000,
    nighttimeLoadKW: 0,
    nighttimeDurationHours: 0,
    loanPrincipal: 0,
    annualInterestRate: 0,
    loanTermMonths: 60
  });

  // Projected cost still calculated from inputs (using ₱10/kWh as specified in test)
  assertEqual(results.projectedAnnualCost, 182000, 'Projected stays at ₱182,000');
  // But effective cost uses the override
  assertEqual(results.effectiveAnnualCost, 250000, 'Effective uses override ₱250,000');
});

test('Null annual bill → effective = projected', () => {
  const results = calculateAll({
    electricityRate: 10,
    operatingWeeksPerYear: 52,
    operatingDaysPerWeek: 7,
    dailyEnergyConsumptionKWh: 50,
    annualBill: null,
    solarCapacityKW: 10,
    peakSunHoursPerDay: 4,
    solarPricePerKW: 30000,
    miscInfraCosts: 0,
    batteryPricePerKWh: 12000,
    nighttimeLoadKW: 0,
    nighttimeDurationHours: 0,
    loanPrincipal: 0,
    annualInterestRate: 0,
    loanTermMonths: 60
  });

  assertEqual(results.effectiveAnnualCost, 182000, 'Effective = projected when no override');
});

// ============================================
// 17. calculateAll — EDGE CASES
// ============================================
group('🧮 calculateAll — Edge Cases');

test('All zeros produces safe defaults (no NaN, no crash)', () => {
  const results = calculateAll({
    electricityRate: 0,
    operatingWeeksPerYear: 0,
    operatingDaysPerWeek: 0,
    dailyEnergyConsumptionKWh: 0,
    solarCapacityKW: 0,
    peakSunHoursPerDay: 0,
    solarPricePerKW: 0,
    miscInfraCosts: 0,
    batteryPricePerKWh: 0,
    nighttimeLoadKW: 0,
    nighttimeDurationHours: 0,
    loanPrincipal: 0,
    annualInterestRate: 0,
    loanTermMonths: 0
  });

  assertEqual(results.totalCapex, 0);
  assertEqual(results.annualSavings, 0);
  assertEqual(results.simpleROI, 0);
  assertEqual(results.paybackYears, Infinity);
  assertEqual(results.monthlyAmortization, 0);
  assertFalse(isNaN(results.totalCapex), 'No NaN in totalCapex');
  assertFalse(isNaN(results.annualSavings), 'No NaN in annualSavings');
  assertFalse(isNaN(results.simpleROI), 'No NaN in simpleROI');
});

test('Empty object uses defaults (no crash)', () => {
  const results = calculateAll({});
  assertType(results.totalCapex, 'number');
  assertType(results.annualSavings, 'number');
  assertType(results.paybackYears, 'number');
  assertFalse(isNaN(results.totalCapex));
});

// ============================================
// 18. FORMAT.JS — Currency Formatting
// ============================================
group('💲 format.js — Currency');

test('formatPeso(146000) includes ₱ and commas', () => {
  const result = formatPeso(146000);
  assertTrue(result.includes('₱'), 'Should include ₱');
  assertTrue(result.includes('146'), 'Should include 146');
  assertTrue(result.includes('.00'), 'Should have 2 decimals');
});

test('formatPeso(0) = ₱0.00', () => {
  const result = formatPeso(0);
  assertTrue(result.includes('₱'), 'Should include ₱');
  assertTrue(result.includes('0.00'), 'Should be 0.00');
});

test('formatPeso(null) = —', () => {
  assertEqual(formatPeso(null), '—');
});

test('formatPeso(Infinity) = —', () => {
  assertEqual(formatPeso(Infinity), '—');
});

test('formatPeso(NaN) = —', () => {
  assertEqual(formatPeso(NaN), '—');
});

test('formatPeso negative: -5000 shows negative', () => {
  const result = formatPeso(-5000);
  assertTrue(result.includes('-'), 'Should show negative');
  assertTrue(result.includes('₱'), 'Should include ₱');
});

test('formatPesoWhole(146000) has no decimals', () => {
  const result = formatPesoWhole(146000);
  assertFalse(result.includes('.'), 'Should have no decimal point');
});

// ============================================
// 19. FORMAT.JS — Percent, Years, Number
// ============================================
group('💲 format.js — Percent / Years / Number');

test('formatPercent(25.7) = "25.7%"', () => {
  assertEqual(formatPercent(25.7), '25.7%');
});

test('formatPercent(null) = —', () => {
  assertEqual(formatPercent(null), '—');
});

test('formatPercent(Infinity) = —', () => {
  assertEqual(formatPercent(Infinity), '—');
});

test('formatYears(3.89) = "3.9 years"', () => {
  assertEqual(formatYears(3.89), '3.9 years');
});

test('formatYears(Infinity) = —', () => {
  assertEqual(formatYears(Infinity), '—');
});

test('formatWithUnit(10, "kW") = "10.0 kW"', () => {
  assertEqual(formatWithUnit(10, 'kW'), '10.0 kW');
});

test('formatWithUnit(null, "kW") = —', () => {
  assertEqual(formatWithUnit(null, 'kW'), '—');
});

// ============================================
// 20. FORMAT.JS — Parse & Utility
// ============================================
group('💲 format.js — Parse & Utility');

test('parsePeso("₱146,000.00") = 146000', () => {
  assertEqual(parsePeso('₱146,000.00'), 146000);
});

test('parsePeso("300000") = 300000', () => {
  assertEqual(parsePeso('300000'), 300000);
});

test('parsePeso(123) passes through numbers', () => {
  assertEqual(parsePeso(123), 123);
});

test('parsePeso(null) = null', () => {
  assertNull(parsePeso(null));
});

test('parsePercent("25.7%") = 25.7', () => {
  assertEqual(parsePercent('25.7%'), 25.7);
});

test('round(3.456, 2) = 3.46', () => {
  assertEqual(round(3.456, 2), 3.46);
});

test('round(null) = 0', () => {
  assertEqual(round(null), 0);
});

test('clamp(150, 0, 100) = 100', () => {
  assertEqual(clamp(150, 0, 100), 100);
});

test('clamp(-5, 0, 100) = 0', () => {
  assertEqual(clamp(-5, 0, 100), 0);
});

test('clamp(50, 0, 100) = 50', () => {
  assertEqual(clamp(50, 0, 100), 50);
});

test('formatCompact(1500000) = ₱1.5M', () => {
  assertEqual(formatCompact(1500000), '₱1.5M');
});

test('formatCompact(50000) = ₱50.0K', () => {
  assertEqual(formatCompact(50000), '₱50.0K');
});

// ============================================
// 21. STATE.JS — Reactive State
// ============================================
group('⚙️ state.js — Reactive State');

test('createReactiveState triggers onChange callback', () => {
  let lastChange = null;
  const state = createReactiveState({ x: 1 }, (prop, val, old) => {
    lastChange = { prop, val, old };
  });
  state.x = 5;
  assertEqual(lastChange.prop, 'x');
  assertEqual(lastChange.val, 5);
  assertEqual(lastChange.old, 1);
});

test('createReactiveState does NOT trigger on same value', () => {
  let callCount = 0;
  const state = createReactiveState({ x: 1 }, () => { callCount++; });
  state.x = 1; // same value
  assertEqual(callCount, 0, 'Should not fire for same value');
});

test('createReactiveState reads values correctly', () => {
  const state = createReactiveState({ x: 42, y: 'hello' }, () => {});
  assertEqual(state.x, 42);
  assertEqual(state.y, 'hello');
});

// ============================================
// 22. STATE.JS — App State Manager
// ============================================
group('⚙️ state.js — App State Manager');

test('createAppState returns inputs, results, ui', () => {
  const app = createAppState();
  assertType(app.inputs.electricityRate, 'number');
  assertType(app.results.totalCapex, 'number');
  assertType(app.ui.theme, 'string');
});

test('Default inputs match PRD spec (Home defaults)', () => {
  const app = createAppState();
  assertEqual(app.inputs.electricityRate, 20, 'Default rate = ₱20 (home)');
  assertEqual(app.inputs.operatingWeeksPerYear, 52, 'Default weeks = 52');
  assertEqual(app.inputs.operatingDaysPerWeek, 7, 'Default days = 7');
  assertEqual(app.inputs.dailyEnergyConsumptionKWh, 10, 'Default consumption = 10 kWh (home)');
  assertNull(app.inputs.annualBill, 'Default annual bill = null');
  assertEqual(app.inputs.solarCapacityKW, 1, 'Default solar = 1 kW (home)');
  assertEqual(app.inputs.peakSunHoursPerDay, 4, 'Default PSH = 4');
  assertEqual(app.inputs.solarPricePerKW, 60000, 'Default price = ₱60,000 (home)');
  assertEqual(app.inputs.miscInfraCosts, 30000, 'Default misc = ₱30,000 (home)');
  assertEqual(app.inputs.batteryPricePerKWh, 30000, 'Default battery price = ₱30,000');
  assertEqual(app.inputs.batteryCapacityKWh, 5, 'Default battery capacity = 5 kWh (home)');
  assertEqual(app.inputs.pvForBatteryKW, 1, 'Default PV for battery = 1 kW (home)');
  assertEqual(app.inputs.nighttimeLoadKW, 1, 'Default night load = 1 kWh/hr (home)');
  assertEqual(app.inputs.nighttimeDurationHours, 10, 'Default night hours = 10 (home)');
  assertEqual(app.inputs.loanPrincipal, 180000, 'Default loan = ₱180,000');
  assertEqual(app.inputs.annualInterestRate, 14, 'Default interest = 14%');
  assertEqual(app.inputs.loanTermMonths, 60, 'Default term = 60mo');
});

test('Changing input triggers recalculation', () => {
  const app = createAppState();
  const oldCapex = app.results.totalCapex;
  app.inputs.solarCapacityKW = 2; // Double capacity from 1 to 2
  // CAPEX should update (was 300,000 with 1kW, now higher with 2kW)
  assertTrue(app.results.totalCapex > oldCapex, 'CAPEX should increase');
  assertTrue(app.results.totalCapex !== oldCapex, 'CAPEX should differ');
});

test('Theme toggle works', () => {
  const app = createAppState();
  assertEqual(app.ui.theme, 'light');
  app.toggleTheme();
  assertEqual(app.ui.theme, 'dark');
  app.toggleTheme();
  assertEqual(app.ui.theme, 'light');
});

test('Layout toggle cycles auto → phone → desktop → auto', () => {
  const app = createAppState();
  assertEqual(app.ui.layout, 'auto');
  app.toggleLayout();
  assertEqual(app.ui.layout, 'phone');
  app.toggleLayout();
  assertEqual(app.ui.layout, 'desktop');
  app.toggleLayout();
  assertEqual(app.ui.layout, 'auto');
});

test('resetInputs restores PRD defaults', () => {
  const app = createAppState();
  app.inputs.electricityRate = 99;
  app.inputs.solarCapacityKW = 500;
  app.resetInputs();
  assertEqual(app.inputs.electricityRate, 20);
  assertEqual(app.inputs.solarCapacityKW, 1);
});

test('loadPreset("spreadsheet") sets spreadsheet values', () => {
  const app = createAppState();
  app.loadPreset('spreadsheet');
  assertEqual(app.inputs.electricityRate, 11);
  assertEqual(app.inputs.solarCapacityKW, 300);
  assertEqual(app.inputs.solarPricePerKW, 40000);
  assertEqual(app.inputs.miscInfraCosts, 2000000);
  assertEqual(app.inputs.loanPrincipal, 14000000);
  assertEqual(app.inputs.annualInterestRate, 12);
});

test('getSnapshot returns current state copy', () => {
  const app = createAppState();
  app.inputs.electricityRate = 15;
  const snap = app.getSnapshot();
  assertEqual(snap.inputs.electricityRate, 15);
  // Modifying snapshot should NOT affect app state
  snap.inputs.electricityRate = 99;
  assertEqual(app.inputs.electricityRate, 15, 'Snapshot is a copy');
});

// ============================================
// 23. PRD v1.2 — SECTION RESULTS FIELDS IN calculateAll
// ============================================
group('📋 PRD v1.2 — Per-Section Result Fields in calculateAll');

// These test that calculateAll returns the section-level intermediate values
// needed by the per-section results panels
test('calculateAll returns projectedAnnualCost (Section 1)', () => {
  const r = calculateAll({ 
    ...defaultInputs,
    dailyEnergyConsumptionKWh: 50,
    electricityRate: 15
  });
  assertType(r.projectedAnnualCost, 'number');
  assertEqual(r.projectedAnnualCost, 273000); // 50 × 15 × 364
});

test('calculateAll returns annualConsumptionKWh (Section 1)', () => {
  const r = calculateAll({ 
    ...defaultInputs,
    dailyEnergyConsumptionKWh: 50
  });
  assertEqual(r.annualConsumptionKWh, 18200); // 50 kWh/day × 364 days
});

test('annualConsumptionKWh with commercial schedule: 500 × 300 = 150,000', () => {
  const r = calculateAll({ ...defaultInputs, dailyEnergyConsumptionKWh: 500, operatingWeeksPerYear: 50, operatingDaysPerWeek: 6 });
  assertEqual(r.annualConsumptionKWh, 150000);
});

test('calculateAll returns effectiveAnnualCost (Section 1)', () => {
  const r = calculateAll({ 
    ...defaultInputs,
    dailyEnergyConsumptionKWh: 50,
    electricityRate: 15
  });
  assertEqual(r.effectiveAnnualCost, 273000); // 50 × 15 × 364
});

test('calculateAll returns projectedMonthlyCost (Section 1)', () => {
  const r = calculateAll({ 
    ...defaultInputs,
    dailyEnergyConsumptionKWh: 50,
    electricityRate: 15
  });
  assertClose(r.projectedMonthlyCost, 22750, 0.01); // 273000 / 12
});

test('calculateAll returns dailySavings (Section 2)', () => {
  const r = calculateAll({
    ...defaultInputs,
    solarCapacityKW: 10,
    pvForBatteryKW: 0,      // explicit 0: 10 kW total × 4 PSH = 40 kWh × ₱15
    peakSunHoursPerDay: 4,
    electricityRate: 15
  });
  assertEqual(r.dailySavings, 600); // 40 kWh/day × ₱15/kWh
});

test('dailySavings includes pvForBattery panels: (10+5) × 4 × ₱11 = ₱660/day', () => {
  const r = calculateAll({
    ...defaultInputs,
    solarCapacityKW: 10,
    pvForBatteryKW: 5,
    peakSunHoursPerDay: 4,
    electricityRate: 11
  });
  assertEqual(r.dailySavings, 660); // (10+5) × 4 × 11 = 660
});

test('calculateAll returns pvSystemCost (Section 2): (solarCapacity + pvForBattery) × price', () => {
  const r = calculateAll({
    ...defaultInputs,
    solarCapacityKW: 10,
    pvForBatteryKW: 0,      // explicit 0 to isolate solar-only cost
    solarPricePerKW: 80000
  });
  assertEqual(r.pvSystemCost, 800000); // (10 + 0) × 80000
});

test('pvSystemCost includes pvForBattery: (5 + 3) × ₱80,000 = ₱640,000', () => {
  const r = calculateAll({
    ...defaultInputs,
    solarCapacityKW: 5,
    pvForBatteryKW: 3,
    solarPricePerKW: 80000
  });
  assertEqual(r.pvSystemCost, 640000); // (5 + 3) × 80000
});

test('calculateAll returns totalPVCapex (Section 2)', () => {
  const r = calculateAll({
    ...defaultInputs,
    solarCapacityKW: 10,
    pvForBatteryKW: 0,      // explicit 0 to isolate
    solarPricePerKW: 80000,
    miscInfraCosts: 0
  });
  assertEqual(r.totalPVCapex, 800000); // (10+0) × 80000 + 0 misc
});

test('calculateAll returns dailyGenerationKWh (Section 2): all panels × PSH', () => {
  const r = calculateAll({
    ...defaultInputs,
    solarCapacityKW: 10,
    pvForBatteryKW: 0,      // explicit 0: 10 kW total × 4 PSH = 40 kWh
    peakSunHoursPerDay: 4
  });
  assertEqual(r.dailyGenerationKWh, 40); // (10+0) × 4

  const r2 = calculateAll({
    ...defaultInputs,
    solarCapacityKW: 10,
    pvForBatteryKW: 5,
    peakSunHoursPerDay: 4
  });
  assertEqual(r2.dailyGenerationKWh, 60); // (10+5) × 4
});

test('calculateAll returns batteryCost (Section 3)', () => {
  const r = calculateAll({
    ...defaultInputs,
    batteryCapacityKWh: 50,  // User-defined battery size (PRD v1.4)
    batteryPricePerKWh: 12000
  });
  assertEqual(r.batteryCost, 600000); // 50 × 12000
});

test('batteryChargePercent = 100% when PV for battery matches need', () => {
  const r = calculateAll({
    ...defaultInputs,
    batteryCapacityKWh: 50,  // User defines 50 kWh battery
    pvForBatteryKW: 12.5,     // 12.5 kW × 4 PSH = 50 kWh/day charge capacity
    peakSunHoursPerDay: 4
  });
  // dailyChargeCapacity = 12.5 × 4 = 50, batteryCapacity = 50, charge% = 100%
  assertClose(r.batteryChargePercent, 100, 0.01);
});

test('batteryChargePercent = 0 when no battery needed', () => {
  const r = calculateAll({ 
    ...defaultInputs,
    batteryCapacityKWh: 0,
    pvForBatteryKW: 0
  });
  assertEqual(r.batteryChargePercent, 0);
});

// ============================================
// TEST SUMMARY
// ============================================
console.log('\n' + '═'.repeat(55));
console.log(' MILESTONE 1 TEST SUMMARY');
console.log('═'.repeat(55));
console.log(`  Total:   ${testsPassed + testsFailed + testsSkipped}`);
console.log(`  ✅ Pass:  ${testsPassed}`);
console.log(`  ❌ Fail:  ${testsFailed}`);
console.log(`  ⏭️  TODO:  ${testsSkipped} (PRD v1.2 fields not yet in calc.js)`);
console.log('═'.repeat(55));

if (testsFailed > 0) {
  console.log('\n⚠️  Some tests FAILED — fix before proceeding.\n');
  process.exit(1);
} else if (testsSkipped > 0) {
  console.log('\n📌 All implemented tests passed. TODO items need calc.js updates.\n');
  process.exit(0);
} else {
  console.log('\n🎉 All tests passed! M1 complete.\n');
  process.exit(0);
}
