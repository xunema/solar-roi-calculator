/**
 * calc.js - Pure calculation functions for SolarCalc PH
 * No DOM manipulation - just math and logic
 */

/**
 * Calculate operating days per year
 * @param {number} weeksPerYear - Operating weeks per year (1-52)
 * @param {number} daysPerWeek - Operating days per week (1-7)
 * @returns {number} Total operating days per year
 */
export function calculateOperatingDaysPerYear(weeksPerYear, daysPerWeek) {
  return (weeksPerYear || 0) * (daysPerWeek || 0);
}

/**
 * Calculate projected annual cost from daily consumption
 * @param {number} dailyConsumptionKWh - Daily energy consumption in kWh
 * @param {number} electricityRate - Electricity rate in ₱/kWh
 * @param {number} operatingDaysPerYear - Total operating days per year
 * @returns {number} Projected annual cost in ₱
 */
export function calculateProjectedAnnualCost(dailyConsumptionKWh, electricityRate, operatingDaysPerYear) {
  return (dailyConsumptionKWh || 0) * (electricityRate || 0) * (operatingDaysPerYear || 0);
}

/**
 * Calculate required battery capacity
 * @param {number} nighttimeLoadKW - Nighttime load in kW
 * @param {number} nighttimeDurationHours - Nighttime duration in hours
 * @returns {number} Required battery capacity in kWh
 */
export function calculateRequiredBatteryKWh(nighttimeLoadKW, nighttimeDurationHours) {
  return (nighttimeLoadKW || 0) * (nighttimeDurationHours || 0);
}

/**
 * Calculate extra solar capacity needed for battery charging
 * @param {number} requiredBatteryKWh - Required battery capacity in kWh
 * @param {number} peakSunHoursPerDay - Peak sun hours per day
 * @returns {number} Extra solar capacity needed in kW
 */
export function calculateExtraSolarForBatteryKW(requiredBatteryKWh, peakSunHoursPerDay) {
  if (!requiredBatteryKWh || !peakSunHoursPerDay) return 0;
  return requiredBatteryKWh / peakSunHoursPerDay;
}

/**
 * Calculate total solar capacity including battery charging
 * @param {number} solarCapacityKW - Base solar capacity in kW
 * @param {number} extraSolarForBatteryKW - Extra solar for battery in kW
 * @returns {number} Total solar capacity in kW
 */
export function calculateTotalSolarKW(solarCapacityKW, extraSolarForBatteryKW) {
  return (solarCapacityKW || 0) + (extraSolarForBatteryKW || 0);
}

/**
 * Calculate total CAPEX (Capital Expenditure)
 * @param {number} totalSolarKW - Total solar capacity in kW
 * @param {number} solarPricePerKW - Solar price per kW in ₱
 * @param {number} requiredBatteryKWh - Required battery capacity in kWh
 * @param {number} batteryPricePerKWh - Battery price per kWh in ₱
 * @param {number} miscInfraCosts - Miscellaneous infrastructure costs in ₱
 * @returns {number} Total CAPEX in ₱
 */
export function calculateTotalCapex(totalSolarKW, solarPricePerKW, requiredBatteryKWh, batteryPricePerKWh, miscInfraCosts) {
  const solarCost = (totalSolarKW || 0) * (solarPricePerKW || 0);
  const batteryCost = (requiredBatteryKWh || 0) * (batteryPricePerKWh || 0);
  const miscCosts = miscInfraCosts || 0;
  return solarCost + batteryCost + miscCosts;
}

/**
 * Calculate annual energy generation
 * @param {number} totalSolarKW - Total solar capacity in kW
 * @param {number} peakSunHoursPerDay - Peak sun hours per day
 * @param {number} operatingDaysPerYear - Operating days per year
 * @returns {number} Annual energy generation in kWh
 */
export function calculateAnnualGenerationKWh(totalSolarKW, peakSunHoursPerDay, operatingDaysPerYear) {
  return (totalSolarKW || 0) * (peakSunHoursPerDay || 0) * (operatingDaysPerYear || 0);
}

/**
 * Calculate annual savings from solar generation
 * @param {number} annualGenerationKWh - Annual energy generation in kWh
 * @param {number} electricityRate - Electricity rate in ₱/kWh
 * @returns {number} Annual savings in ₱
 */
export function calculateAnnualSavings(annualGenerationKWh, electricityRate) {
  return (annualGenerationKWh || 0) * (electricityRate || 0);
}

/**
 * Calculate simple ROI percentage
 * @param {number} annualSavings - Annual savings in ₱
 * @param {number} totalCapex - Total CAPEX in ₱
 * @returns {number} Simple ROI as percentage (e.g., 25.7 for 25.7%)
 */
export function calculateSimpleROI(annualSavings, totalCapex) {
  if (!totalCapex || totalCapex <= 0) return 0;
  return ((annualSavings || 0) / totalCapex) * 100;
}

/**
 * Calculate payback period in years
 * @param {number} totalCapex - Total CAPEX in ₱
 * @param {number} annualSavings - Annual savings in ₱
 * @returns {number} Payback period in years, or Infinity if no savings
 */
export function calculatePaybackYears(totalCapex, annualSavings) {
  if (!annualSavings || annualSavings <= 0) return Infinity;
  return (totalCapex || 0) / annualSavings;
}

/**
 * Calculate monthly loan amortization using standard annuity formula
 * @param {number} principal - Loan principal in ₱
 * @param {number} annualInterestRate - Annual interest rate as percentage (e.g., 12 for 12%)
 * @param {number} months - Loan term in months
 * @returns {number} Monthly amortization in ₱
 */
export function calculateMonthlyAmortization(principal, annualInterestRate, months) {
  principal = principal || 0;
  months = months || 0;
  
  if (principal <= 0 || months <= 0) return 0;
  if (!annualInterestRate || annualInterestRate <= 0) return principal / months;
  
  const monthlyRate = (annualInterestRate / 100) / 12;
  const payment = principal * (
    (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
    (Math.pow(1 + monthlyRate, months) - 1)
  );
  
  return payment;
}

/**
 * Calculate total loan cost over the loan term
 * @param {number} monthlyAmortization - Monthly payment in ₱
 * @param {number} months - Loan term in months
 * @returns {number} Total loan cost in ₱
 */
export function calculateTotalLoanCost(monthlyAmortization, months) {
  return (monthlyAmortization || 0) * (months || 0);
}

/**
 * Calculate total interest paid over loan term
 * @param {number} totalLoanCost - Total loan cost in ₱
 * @param {number} principal - Original principal in ₱
 * @returns {number} Total interest paid in ₱
 */
export function calculateTotalInterestPaid(totalLoanCost, principal) {
  return (totalLoanCost || 0) - (principal || 0);
}

/**
 * Calculate monthly savings from annual savings
 * @param {number} annualSavings - Annual savings in ₱
 * @returns {number} Monthly savings in ₱
 */
export function calculateMonthlySavings(annualSavings) {
  return (annualSavings || 0) / 12;
}

/**
 * Calculate net monthly cash flow
 * @param {number} monthlySavings - Monthly savings in ₱
 * @param {number} monthlyAmortization - Monthly loan payment in ₱
 * @returns {number} Net monthly cash flow in ₱
 */
export function calculateNetMonthlyCashFlow(monthlySavings, monthlyAmortization) {
  return (monthlySavings || 0) - (monthlyAmortization || 0);
}

/**
 * Reverse calculate daily energy consumption from annual bill
 * @param {number} annualBill - Annual electricity bill in ₱
 * @param {number} electricityRate - Electricity rate in ₱/kWh
 * @param {number} operatingDaysPerYear - Operating days per year
 * @returns {number|null} Daily consumption in kWh, or null if cannot calculate
 */
export function reverseCalculateDailyConsumption(annualBill, electricityRate, operatingDaysPerYear) {
  if (!annualBill || !electricityRate || !operatingDaysPerYear) return null;
  if (electricityRate <= 0 || operatingDaysPerYear <= 0) return null;
  const annualKWh = annualBill / electricityRate;
  return annualKWh / operatingDaysPerYear;
}

/**
 * Get ROI color category for UI
 * @param {number} roi - ROI percentage
 * @returns {string} Color category: 'green', 'yellow', or 'red'
 */
export function getROIColor(roi) {
  if (roi >= 15) return 'green';
  if (roi >= 8) return 'yellow';
  return 'red';
}

/**
 * Get Payback color category for UI
 * @param {number} paybackYears - Payback period in years
 * @returns {string} Color category: 'green', 'yellow', or 'red'
 */
export function getPaybackColor(paybackYears) {
  if (!isFinite(paybackYears)) return 'red';
  if (paybackYears <= 5) return 'green';
  if (paybackYears <= 8) return 'yellow';
  return 'red';
}

/**
 * Get Cash Flow color category for UI
 * @param {number} cashFlow - Net monthly cash flow in ₱
 * @returns {string} Color category: 'green' or 'red'
 */
export function getCashFlowColor(cashFlow) {
  return cashFlow >= 0 ? 'green' : 'red';
}

/**
 * Main calculation function - processes all inputs and returns complete results
 * @param {Object} inputs - Raw input values
 * @returns {Object} Complete calculation results
 */
export function calculateAll(inputs) {
  const {
    electricityRate = 0,
    operatingWeeksPerYear = 0,
    operatingDaysPerWeek = 0,
    dailyEnergyConsumptionKWh = 0,
    annualBill = null,
    solarCapacityKW = 0,
    peakSunHoursPerDay = 0,
    solarPricePerKW = 0,
    miscInfraCosts = 0,
    batteryPricePerKWh = 0,
    batteryCapacityKWh = 0,
    pvForBatteryKW = 0,
    nighttimeLoadKW = 0,
    nighttimeDurationHours = 0,
    loanPrincipal = 0,
    annualInterestRate = 0,
    loanTermMonths = 0
  } = inputs;

  // Step 1: Calculate operating days
  const operatingDaysPerYear = calculateOperatingDaysPerYear(operatingWeeksPerYear, operatingDaysPerWeek);

  // Step 2: Calculate projected annual cost
  let projectedAnnualCost = calculateProjectedAnnualCost(dailyEnergyConsumptionKWh, electricityRate, operatingDaysPerYear);
  
  // If annual bill is provided, use it instead (but keep projected for reference)
  const effectiveAnnualCost = annualBill !== null && annualBill !== undefined ? annualBill : projectedAnnualCost;

  // Step 3: Battery calculations (PRD v1.4.0)
  // Reference calculation (for guidance only)
  const requiredBatteryKWh = calculateRequiredBatteryKWh(nighttimeLoadKW, nighttimeDurationHours);
  // User-defined battery capacity (primary input)
  const effectiveBatteryCapacityKWh = batteryCapacityKWh || 0;
  // Daily charge capacity from allocated PV
  const dailyChargeCapacityKWh = (pvForBatteryKW || 0) * (peakSunHoursPerDay || 0);
  // Battery charge percentage
  const batteryChargePercent = effectiveBatteryCapacityKWh > 0
    ? (dailyChargeCapacityKWh / effectiveBatteryCapacityKWh) * 100
    : 0;

  // Step 4: Total solar capacity (PRD v1.4.0: user-defined pvForBatteryKW)
  const totalSolarKW = calculateTotalSolarKW(solarCapacityKW, pvForBatteryKW);
  // PV Total Capacity for Section 2 display
  const pvTotalCapacityKW = (solarCapacityKW || 0) + (pvForBatteryKW || 0);

  // Step 5: CAPEX calculations (PRD v1.6.0)
  // pvSystemCost = ALL solar panels × price (daytime + battery-charging panels combined)
  const pvSystemCost = totalSolarKW * (solarPricePerKW || 0);
  const totalPVCapex = pvSystemCost + (miscInfraCosts || 0);
  const batteryCost = effectiveBatteryCapacityKWh * (batteryPricePerKWh || 0);
  // extraSolarCost is informational only (breakdown of battery-dedicated PV cost within pvSystemCost)
  const extraSolarCost = (pvForBatteryKW || 0) * (solarPricePerKW || 0);
  const totalCapex = totalPVCapex + batteryCost; // extraSolarCost already included in pvSystemCost

  // Step 6: Energy generation and savings
  const annualGenerationKWh = calculateAnnualGenerationKWh(totalSolarKW, peakSunHoursPerDay, operatingDaysPerYear);
  const annualSavings = calculateAnnualSavings(annualGenerationKWh, electricityRate);

  // Step 7: ROI metrics
  const simpleROI = calculateSimpleROI(annualSavings, totalCapex);
  const paybackYears = calculatePaybackYears(totalCapex, annualSavings);

  // Step 8: Monthly figures
  const monthlySavings = calculateMonthlySavings(annualSavings);
  const monthlyAmortization = calculateMonthlyAmortization(loanPrincipal, annualInterestRate, loanTermMonths);
  const netMonthlyCashFlow = calculateNetMonthlyCashFlow(monthlySavings, monthlyAmortization);
  const totalLoanCost = calculateTotalLoanCost(monthlyAmortization, loanTermMonths);
  const totalInterestPaid = calculateTotalInterestPaid(totalLoanCost, loanPrincipal);

  // Step 9: Per-section result fields
  const annualConsumptionKWh = (dailyEnergyConsumptionKWh || 0) * operatingDaysPerYear;
  const projectedMonthlyCost = projectedAnnualCost / 12;
  const dailyGenerationKWh = totalSolarKW * (peakSunHoursPerDay || 0); // ALL panels: solarCapacityKW + pvForBatteryKW
  const dailySavings = dailyGenerationKWh * (electricityRate || 0);

  return {
    // Section 1: Status Quo results
    operatingDaysPerYear,
    annualConsumptionKWh,
    dailyEnergyConsumptionKWh,
    projectedAnnualCost,
    projectedMonthlyCost,
    effectiveAnnualCost,

    // Section 2: PhotoVoltaic System results
    pvTotalCapacityKW,       // NEW: Total PV capacity including battery PV
    pvSystemCost,
    totalPVCapex,
    dailyGenerationKWh,
    dailySavings,
    annualGenerationKWh,
    totalSolarKW,
    solarPricePerKW,         // Needed for extra PV cost calculation in Section 3

    // Section 3: Battery Storage results (PRD v1.4.0)
    batteryCapacityKWh: effectiveBatteryCapacityKWh,
    batteryCost,
    pvForBatteryKW,
    dailyChargeCapacityKWh,
    extraSolarCost,
    batteryChargePercent,
    requiredBatteryKWh,      // Reference calculation for guidance
    // Backward compatibility (deprecated but kept for tests)
    extraSolarForBatteryKW: pvForBatteryKW,

    // Section 4: Financing results
    monthlyAmortization,
    totalLoanCost,
    totalInterestPaid,

    // Dashboard KPIs
    totalCapex,
    annualSavings,
    simpleROI,
    paybackYears,
    monthlySavings,
    netMonthlyCashFlow,

    // Color categories for UI
    roiColor: getROIColor(simpleROI),
    paybackColor: getPaybackColor(paybackYears),
    cashFlowColor: getCashFlowColor(netMonthlyCashFlow),

    // Financing flag
    hasFinancing: loanPrincipal > 0,

    // Edge case warnings (M5 — Phase 5.3)
    warnRateTooLow: electricityRate > 0 && electricityRate < 1,
    warnLoanExceedsCapex: (loanPrincipal || 0) > 0 && totalCapex > 0 && (loanPrincipal || 0) > totalCapex
  };
}

// Default export for convenience
export default {
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
};
