/**
 * calc.test.js - Unit tests for SolarCalc PH calculation functions
 * Run with: node tests/calc.test.js
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

// Test runner
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}`);
    testsFailed++;
  }
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
  if (!value) {
    throw new Error(message || 'Expected true, got false');
  }
}

function assertFalse(value, message) {
  if (value) {
    throw new Error(message || 'Expected false, got true');
  }
}

// ============================================
// TESTS: Operating Days
// ============================================
console.log('\n📅 Operating Days Tests');
console.log('========================');

test('Calculate operating days: 52 weeks × 7 days = 364 days', () => {
  assertEqual(calculateOperatingDaysPerYear(52, 7), 364);
});

test('Calculate operating days: 50 weeks × 6 days = 300 days', () => {
  assertEqual(calculateOperatingDaysPerYear(50, 6), 300);
});

test('Calculate operating days with zeros returns 0', () => {
  assertEqual(calculateOperatingDaysPerYear(0, 7), 0);
  assertEqual(calculateOperatingDaysPerYear(52, 0), 0);
});

test('Calculate operating days with nulls returns 0', () => {
  assertEqual(calculateOperatingDaysPerYear(null, 7), 0);
  assertEqual(calculateOperatingDaysPerYear(52, null), 0);
});

// ============================================
// TESTS: Projected Annual Cost
// ============================================
console.log('\n💰 Projected Annual Cost Tests');
console.log('================================');

test('Calculate projected cost: 50 kWh/day × ₱10/kWh × 364 days', () => {
  const cost = calculateProjectedAnnualCost(50, 10, 364);
  assertEqual(cost, 182000);
});

test('Calculate projected cost with zero consumption returns 0', () => {
  assertEqual(calculateProjectedAnnualCost(0, 10, 364), 0);
});

test('Calculate projected cost with zero rate returns 0', () => {
  assertEqual(calculateProjectedAnnualCost(50, 0, 364), 0);
});

// ============================================
// TESTS: Battery Calculations
// ============================================
console.log('\n🔋 Battery Calculation Tests');
console.log('=============================');

test('Calculate required battery: 5 kW × 10 hrs = 50 kWh', () => {
  assertEqual(calculateRequiredBatteryKWh(5, 10), 50);
});

test('Calculate required battery with zeros returns 0', () => {
  assertEqual(calculateRequiredBatteryKWh(0, 10), 0);
  assertEqual(calculateRequiredBatteryKWh(5, 0), 0);
});

test('Calculate extra solar for battery: 50 kWh ÷ 4 hrs = 12.5 kW', () => {
  assertEqual(calculateExtraSolarForBatteryKW(50, 4), 12.5);
});

test('Calculate extra solar with zero battery returns 0', () => {
  assertEqual(calculateExtraSolarForBatteryKW(0, 4), 0);
});

test('Calculate extra solar with zero sun hours returns 0', () => {
  assertEqual(calculateExtraSolarForBatteryKW(50, 0), 0);
});

// ============================================
// TESTS: Solar Capacity
// ============================================
console.log('\n☀️ Solar Capacity Tests');
console.log('========================');

test('Calculate total solar: 10 kW + 12.5 kW = 22.5 kW', () => {
  assertEqual(calculateTotalSolarKW(10, 12.5), 22.5);
});

test('Calculate total solar with no extra battery solar', () => {
  assertEqual(calculateTotalSolarKW(10, 0), 10);
});

// ============================================
// TESTS: CAPEX
// ============================================
console.log('\n🏗️ CAPEX Tests');
console.log('================');

test('Calculate CAPEX: solar only', () => {
  // 10 kW × ₱30,000 = ₱300,000
  const capex = calculateTotalCapex(10, 30000, 0, 12000, 0);
  assertEqual(capex, 300000);
});

test('Calculate CAPEX: with battery', () => {
  // 22.5 kW × ₱30,000 + 50 kWh × ₱12,000 = ₱675,000 + ₱600,000 = ₱1,275,000
  const capex = calculateTotalCapex(22.5, 30000, 50, 12000, 0);
  assertEqual(capex, 1275000);
});

test('Calculate CAPEX: with misc costs', () => {
  // 10 kW × ₱30,000 + ₱50,000 misc = ₱350,000
  const capex = calculateTotalCapex(10, 30000, 0, 12000, 50000);
  assertEqual(capex, 350000);
});

// ============================================
// TESTS: Energy Generation & Savings
// ============================================
console.log('\n⚡ Generation & Savings Tests');
console.log('==============================');

test('Calculate annual generation: 10 kW × 4 hrs × 300 days', () => {
  assertEqual(calculateAnnualGenerationKWh(10, 4, 300), 12000);
});

test('Calculate annual savings: 12,000 kWh × ₱11/kWh', () => {
  assertEqual(calculateAnnualSavings(12000, 11), 132000);
});

// ============================================
// TESTS: ROI & Payback
// ============================================
console.log('\n📊 ROI & Payback Tests');
console.log('=======================');

test('Calculate simple ROI: ₱132,000 / ₱350,000 = 37.7%', () => {
  const roi = calculateSimpleROI(132000, 350000);
  assertClose(roi, 37.71, 0.1);
});

test('Calculate simple ROI with zero CAPEX returns 0', () => {
  assertEqual(calculateSimpleROI(132000, 0), 0);
});

test('Calculate payback: ₱350,000 / ₱132,000 = 2.65 years', () => {
  const payback = calculatePaybackYears(350000, 132000);
  assertClose(payback, 2.65, 0.01);
});

test('Calculate payback with zero savings returns Infinity', () => {
  const payback = calculatePaybackYears(350000, 0);
  assertFalse(isFinite(payback), 'Payback should be Infinity');
});

// ============================================
// TESTS: Loan Amortization
// ============================================
console.log('\n🏦 Loan Amortization Tests');
console.log('===========================');

test('Calculate amortization: ₱14,000,000 @ 12% over 60 months', () => {
  const payment = calculateMonthlyAmortization(14000000, 12, 60);
  assertClose(payment, 311422.27, 0.5, 'Monthly payment should be ~₱311,422.27');
});

test('Calculate amortization: zero interest (simple division)', () => {
  const payment = calculateMonthlyAmortization(14000000, 0, 60);
  assertClose(payment, 233333.33, 0.1, 'Monthly payment should be ~₱233,333.33');
});

test('Calculate amortization with zero principal returns 0', () => {
  assertEqual(calculateMonthlyAmortization(0, 12, 60), 0);
});

test('Calculate total loan cost: ₱311,422.27 × 60 months', () => {
  const total = calculateTotalLoanCost(311422.27, 60);
  assertClose(total, 18685336.2, 1, 'Total loan cost should be ~₱18,685,336');
});

test('Calculate total interest paid', () => {
  const totalCost = calculateTotalLoanCost(311422.27, 60);
  const interest = calculateTotalInterestPaid(totalCost, 14000000);
  assertClose(interest, 4685336.2, 1, 'Total interest should be ~₱4,685,336');
});

// ============================================
// TESTS: Monthly Figures
// ============================================
console.log('\n📅 Monthly Figures Tests');
console.log('=========================');

test('Calculate monthly savings: ₱132,000 / 12', () => {
  assertClose(calculateMonthlySavings(132000), 11000, 0.01);
});

test('Calculate net cash flow positive', () => {
  const cashflow = calculateNetMonthlyCashFlow(11000, 5000);
  assertEqual(cashflow, 6000);
});

test('Calculate net cash flow negative', () => {
  const cashflow = calculateNetMonthlyCashFlow(5000, 8000);
  assertEqual(cashflow, -3000);
});

// ============================================
// TESTS: Reverse Calculation
// ============================================
console.log('\n🔄 Reverse Calculation Tests');
console.log('=============================');

test('Reverse calculate daily consumption: ₱5,000,000 / (₱11 × 300 days)', () => {
  const daily = reverseCalculateDailyConsumption(5000000, 11, 300);
  assertClose(daily, 1515.15, 0.1);
});

test('Reverse calculate with missing values returns null', () => {
  assertEqual(reverseCalculateDailyConsumption(null, 11, 300), null);
  assertEqual(reverseCalculateDailyConsumption(5000000, null, 300), null);
  assertEqual(reverseCalculateDailyConsumption(5000000, 11, null), null);
});

// ============================================
// TESTS: Color Categories
// ============================================
console.log('\n🎨 Color Category Tests');
console.log('========================');

test('ROI color: >= 15% is green', () => {
  assertEqual(getROIColor(15), 'green');
  assertEqual(getROIColor(25), 'green');
});

test('ROI color: 8-14.9% is yellow', () => {
  assertEqual(getROIColor(8), 'yellow');
  assertEqual(getROIColor(14.9), 'yellow');
});

test('ROI color: < 8% is red', () => {
  assertEqual(getROIColor(7.9), 'red');
  assertEqual(getROIColor(0), 'red');
});

test('Payback color: <= 5 years is green', () => {
  assertEqual(getPaybackColor(5), 'green');
  assertEqual(getPaybackColor(3), 'green');
});

test('Payback color: 5.1-8 years is yellow', () => {
  assertEqual(getPaybackColor(5.1), 'yellow');
  assertEqual(getPaybackColor(8), 'yellow');
});

test('Payback color: > 8 years is red', () => {
  assertEqual(getPaybackColor(8.1), 'red');
  assertEqual(getPaybackColor(Infinity), 'red');
});

test('Cash flow color: positive is green', () => {
  assertEqual(getCashFlowColor(100), 'green');
  assertEqual(getCashFlowColor(0), 'green');
});

test('Cash flow color: negative is red', () => {
  assertEqual(getCashFlowColor(-100), 'red');
});

// ============================================
// TESTS: Complete Calculation
// ============================================
console.log('\n🧮 Complete Calculation Tests');
console.log('==============================');

test('Spreadsheet scenario A: Solar Only (300 kW)', () => {
  const inputs = {
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
  };
  
  const results = calculateAll(inputs);
  
  // CAPEX: (300 kW × ₱40,000) + ₱2,000,000 = ₱14,000,000
  assertClose(results.totalCapex, 14000000, 1, 'Total CAPEX');
  
  // Annual generation: 300 × 4 × 300 = 360,000 kWh
  assertEqual(results.annualGenerationKWh, 360000);
  
  // Annual savings: 360,000 × ₱11 = ₱3,960,000
  assertClose(results.annualSavings, 3960000, 1, 'Annual savings');
  
  // ROI: 3,960,000 / 14,000,000 = 28.3%
  assertClose(results.simpleROI, 28.29, 0.1, 'Simple ROI');
  
  // Payback: 14,000,000 / 3,960,000 = 3.54 years
  assertClose(results.paybackYears, 3.54, 0.01, 'Payback years');
});

test('Spreadsheet scenario C: Combined (Solar + Battery)', () => {
  const inputs = {
    electricityRate: 11,
    operatingWeeksPerYear: 50,
    operatingDaysPerWeek: 6,
    dailyEnergyConsumptionKWh: 0,
    solarCapacityKW: 300,
    peakSunHoursPerDay: 4,
    solarPricePerKW: 40000,
    miscInfraCosts: 2000000,
    batteryPricePerKWh: 8000, // Adjusted for realistic LFP pricing
    nighttimeLoadKW: 40,
    nighttimeDurationHours: 10,
    loanPrincipal: 0,
    annualInterestRate: 0,
    loanTermMonths: 60
  };
  
  const results = calculateAll(inputs);
  
  // Battery: 40 kW × 10 hrs = 400 kWh
  assertEqual(results.requiredBatteryKWh, 400);
  
  // Extra solar: 400 kWh / 4 hrs = 100 kW
  assertEqual(results.extraSolarForBatteryKW, 100);
  
  // Total solar: 300 + 100 = 400 kW
  assertEqual(results.totalSolarKW, 400);
  
  // Battery cost: 400 kWh × ₱8,000 = ₱3,200,000
  // Solar cost: 400 kW × ₱40,000 = ₱16,000,000
  // Misc: ₱2,000,000
  // Total: ₱21,200,000
  assertClose(results.totalCapex, 21200000, 1, 'Total CAPEX with battery');
});

test('Loan calculation from spreadsheet', () => {
  const inputs = {
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
  };
  
  const results = calculateAll(inputs);
  
  assertTrue(results.hasFinancing, 'Should have financing flag');
  assertClose(results.monthlyAmortization, 311422.27, 0.5, 'Monthly amortization');
  assertClose(results.totalInterestPaid, 4685336.2, 100, 'Total interest');
});

// ============================================
// TEST SUMMARY
// ============================================
console.log('\n' + '='.repeat(50));
console.log('TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Total tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log('='.repeat(50));

if (testsFailed > 0) {
  console.log('\n⚠️  Some tests failed!');
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
}
