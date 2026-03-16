/**
 * narrative.js - Narrative Summary Generator (Milestone 6: Story Mode)
 * Generates a plain-language story from all computed fields.
 * Structure: Problem → Hypothesis → Evidence → Verdict
 */

import { formatPeso, formatPercent, formatYears, formatWithUnit } from './format.js';

/**
 * Generate the full narrative story
 * @param {Object} inputs - Current input values
 * @param {Object} results - Calculation results from calc.js
 * @returns {Object} Narrative parts and full text
 */
export function generateNarrative(inputs, results) {
  const parts = {
    part1: generatePart1Problem(inputs, results),
    part2: generatePart2Hypothesis(inputs, results),
    part3: generatePart3Battery(inputs, results),
    part4: generatePart4Capex(inputs, results),
    part5: generatePart5Return(inputs, results),
    part6: generatePart6Financing(inputs, results),
    part7: generatePart7Verdict(inputs, results)
  };

  // Combine all parts into full narrative
  const fullText = [
    parts.part1,
    parts.part2,
    parts.part3,
    parts.part4,
    parts.part5,
    parts.part6,
    parts.part7
  ].filter(Boolean).join('\n\n');

  return {
    parts,
    fullText,
    hasBattery: results.batteryCapacityKWh > 0,
    hasFinancing: results.hasFinancing,
    verdict: getVerdict(results)
  };
}

/**
 * Part 1 — The Problem: Your current electricity situation
 */
function generatePart1Problem(inputs, results) {
  const rate = inputs.electricityRate || 0;
  const annualCost = results.effectiveAnnualCost || 0;
  const monthlyCost = results.projectedMonthlyCost || 0;
  const annualConsumption = results.annualConsumptionKWh || 0;

  let text = `THE PROBLEM: YOUR CURRENT ELECTRICITY COSTS\n`;
  text += `========================================\n\n`;

  text += `You currently pay an electricity rate of ${formatPeso(rate)}/kWh. `;
  text += `Based on your consumption pattern of ${Math.round(annualConsumption).toLocaleString()} kWh per year, `;
  text += `you are spending approximately ${formatPeso(annualCost)} annually — `;
  text += `or about ${formatPeso(monthlyCost)} every month — just to keep the lights on.\n\n`;

  text += `This is your baseline. Every year you delay going solar, this money leaves your pocket `;
  text += `and goes to your utility provider. Over a typical 25-year solar system lifespan, `;
  text += `that's ${formatPeso(annualCost * 25)} in electricity bills — and rates only go up.`;

  return text;
}

/**
 * Part 2 — The Hypothesis: Your solar solution
 */
function generatePart2Hypothesis(inputs, results) {
  const solarCapacity = inputs.solarCapacityKW || 0;
  const pvForBattery = inputs.pvForBatteryKW || 0;
  const totalCapacity = results.pvTotalCapacityKW || 0;
  const sunHours = inputs.peakSunHoursPerDay || 0;
  const dailyGen = results.dailyGenerationKWh || 0;
  const dailySavings = results.dailySavings || 0;
  const pvCost = results.pvSystemCost || 0;
  const totalPVCapex = results.totalPVCapex || 0;
  const miscCosts = inputs.miscInfraCosts || 0;

  let text = `THE HYPOTHESIS: YOUR PROPOSED SOLAR SYSTEM\n`;
  text += `=========================================\n\n`;

  text += `You are considering a solar photovoltaic system with ${totalCapacity.toFixed(1)} kW total capacity. `;
  
  if (pvForBattery > 0) {
    text += `This includes ${solarCapacity.toFixed(1)} kW for daytime power generation `;
    text += `plus an additional ${pvForBattery.toFixed(1)} kW dedicated to charging your battery storage. `;
  } else {
    text += `This system is sized for daytime power generation. `;
  }
  
  text += `With ${sunHours} peak sun hours per day in your location, `;
  text += `your panels will generate approximately ${Math.round(dailyGen).toLocaleString()} kWh daily.\n\n`;

  text += `Every day, the sun provides free energy worth ${formatPeso(dailySavings)}. `;
  text += `Over a year, that's real money staying in your business instead of going to the grid.\n\n`;

  text += `The solar equipment costs ${formatPeso(pvCost)}`;
  if (miscCosts > 0) {
    text += `, plus ${formatPeso(miscCosts)} in miscellaneous infrastructure costs`;
    text += ` (permitting, wiring, roof work), bringing the total PV CAPEX to ${formatPeso(totalPVCapex)}`;
  }
  text += `.`;

  return text;
}

/**
 * Part 3 — Battery Storage (hidden if no battery)
 */
function generatePart3Battery(inputs, results) {
  const batteryKWh = results.batteryCapacityKWh || 0;
  
  if (batteryKWh === 0) {
    return null;
  }

  const batteryCost = results.batteryCost || 0;
  const pvForBattery = inputs.pvForBatteryKW || 0;
  const chargePercent = results.batteryChargePercent || 0;
  const dailyCharge = results.dailyChargeCapacityKWh || 0;
  const nighttimeLoad = inputs.nighttimeLoadKW || 0;
  const nighttimeDuration = inputs.nighttimeDurationHours || 0;

  let text = `BATTERY STORAGE: POWER AFTER DARK\n`;
  text += `=================================\n\n`;

  text += `You've included ${batteryKWh.toFixed(1)} kWh of battery storage at a cost of ${formatPeso(batteryCost)}. `;
  
  if (nighttimeLoad > 0 && nighttimeDuration > 0) {
    text += `This is sized to power a ${nighttimeLoad} kW nighttime load for ${nighttimeDuration} hours. `;
  }
  
  text += `The ${pvForBattery.toFixed(1)} kW of solar panels dedicated to charging can fill `;
  text += `approximately ${dailyCharge.toFixed(1)} kWh into the batteries each day.\n\n`;

  text += `Daily charge capacity: ${chargePercent.toFixed(1)}% of battery capacity`;
  if (chargePercent >= 100) {
    text += ` — your batteries will reach full charge during the day, providing complete nighttime coverage.`;
  } else if (chargePercent >= 70) {
    text += ` — good coverage for most of your nighttime needs.`;
  } else if (chargePercent >= 40) {
    text += ` — partial coverage; you may still draw some grid power at night.`;
  } else {
    text += ` — limited coverage; consider adding more solar capacity for battery charging.`;
  }

  return text;
}

/**
 * Part 4 — Total CAPEX
 */
function generatePart4Capex(inputs, results) {
  const totalCapex = results.totalCapex || 0;
  const pvCost = results.pvSystemCost || 0;
  const batteryCost = results.batteryCost || 0;
  const miscCosts = inputs.miscInfraCosts || 0;

  let text = `TOTAL INVESTMENT (CAPEX)\n`;
  text += `========================\n\n`;

  text += `Your total upfront investment is ${formatPeso(totalCapex)}. This breaks down as:\n\n`;
  
  text += `  • Solar panels & equipment: ${formatPeso(pvCost)}\n`;
  if (batteryCost > 0) {
    text += `  • Battery storage:          ${formatPeso(batteryCost)}\n`;
  }
  if (miscCosts > 0) {
    text += `  • Infrastructure/misc:      ${formatPeso(miscCosts)}\n`;
  }
  
  text += `  ─────────────────────────────\n`;
  text += `  • Total:                    ${formatPeso(totalCapex)}\n\n`;

  text += `This is the amount you need to recover through electricity savings before your system `;
  text += `starts generating pure profit.`;

  return text;
}

/**
 * Part 5 — The Return: Savings and ROI
 */
function generatePart5Return(inputs, results) {
  const annualSavings = results.annualSavings || 0;
  const monthlySavings = results.monthlySavings || 0;
  const simpleROI = results.simpleROI || 0;
  const paybackYears = results.paybackYears;
  const totalCapex = results.totalCapex || 0;

  let text = `THE RETURN: YOUR SOLAR DIVIDEND\n`;
  text += `===============================\n\n`;

  text += `Your solar system will save you ${formatPeso(annualSavings)} every year — `;
  text += `that's ${formatPeso(monthlySavings)} per month that stays in your pocket instead of `;
  text += `going to your electricity provider.\n\n`;

  text += `Key metrics:\n`;
  text += `  • Simple ROI: ${formatPercent(simpleROI)} per year\n`;
  
  if (paybackYears === Infinity || paybackYears > 100) {
    text += `  • Payback period: Cannot calculate (no savings)\n`;
  } else {
    text += `  • Payback period: ${formatYears(paybackYears)}\n`;
  }
  text += `\n`;

  if (paybackYears !== Infinity && paybackYears <= 25) {
    const lifetimeSavings = (annualSavings * 25) - totalCapex;
    text += `Over the 25-year lifespan of your system, after recovering your initial investment, `;
    text += `you will have generated approximately ${formatPeso(lifetimeSavings)} in net savings. `;
    text += `After payback, every peso saved is pure profit.`;
  } else if (paybackYears === Infinity || paybackYears > 100) {
    text += `Warning: With current inputs, your system is not generating savings. `;
    text += `Review your electricity rate, system size, and sun hours.`;
  } else {
    text += `Note: Your payback period exceeds the typical 25-year system lifespan. `;
    text += `Consider reducing costs or increasing system size for better returns.`;
  }

  return text;
}

/**
 * Part 6 — Financing (hidden if cash purchase)
 */
function generatePart6Financing(inputs, results) {
  if (!results.hasFinancing) {
    return null;
  }

  const principal = inputs.loanPrincipal || 0;
  const rate = inputs.annualInterestRate || 0;
  const term = inputs.loanTermMonths || 0;
  const monthlyPayment = results.monthlyAmortization || 0;
  const totalLoanCost = results.totalLoanCost || 0;
  const totalInterest = results.totalInterestPaid || 0;
  const monthlySavings = results.monthlySavings || 0;
  const netCashFlow = results.netMonthlyCashFlow || 0;

  let text = `FINANCING: CASH FLOW ANALYSIS\n`;
  text += `=============================\n\n`;

  text += `You are financing ${formatPeso(principal)} of the total cost `;
  text += `at ${rate}% annual interest over ${term} months (${(term/12).toFixed(1)} years).\n\n`;

  text += `Your monthly loan payment is ${formatPeso(monthlyPayment)}. `;
  text += `Compare this to your monthly electricity savings of ${formatPeso(monthlySavings)}:\n\n`;

  if (netCashFlow >= 0) {
    text += `  • Net monthly cash flow: +${formatPeso(netCashFlow)} (positive!)\n`;
    text += `  • Your solar savings cover your loan payment with money left over.\n`;
  } else {
    text += `  • Net monthly cash flow: ${formatPeso(netCashFlow)} (negative)\n`;
    text += `  • You pay ${formatPeso(Math.abs(netCashFlow))} more per month than you save.\n`;
  }
  
  text += `  • Total loan cost: ${formatPeso(totalLoanCost)}\n`;
  text += `  • Total interest paid: ${formatPeso(totalInterest)}\n\n`;

  const interestImpact = (totalInterest / results.totalCapex) * 100;
  text += `Financing adds ${formatPeso(totalInterest)} (${formatPercent(interestImpact)}) to your total cost. `;
  
  if (netCashFlow >= 0) {
    text += `However, since your solar savings cover the loan payment, `;
    text += `you're essentially paying for the system with money you would have spent on electricity anyway.`;
  } else {
    text += `With negative monthly cash flow, consider a larger system, better sun exposure, `;
    text += `or negotiating a lower interest rate.`;
  }

  return text;
}

/**
 * Part 7 — The Verdict: Final recommendation
 */
function generatePart7Verdict(inputs, results) {
  const verdict = getVerdict(results);
  const simpleROI = results.simpleROI || 0;
  const paybackYears = results.paybackYears;

  let text = `THE VERDICT: SHOULD YOU PROCEED?\n`;
  text += `===============================\n\n`;

  // Verdict header with color indicator
  if (verdict.recommendation === 'green') {
    text += `🟢 RECOMMENDED: Strong Financial Case\n\n`;
  } else if (verdict.recommendation === 'yellow') {
    text += `🟡 CAUTION: Moderate Financial Case\n\n`;
  } else {
    text += `🔴 NOT RECOMMENDED: Weak Financial Case\n\n`;
  }

  // Detailed explanation
  text += `${verdict.summary}\n\n`;

  // Key numbers summary
  text += `Summary:\n`;
  text += `  • Annual ROI: ${formatPercent(simpleROI)}\n`;
  if (paybackYears !== Infinity && paybackYears < 100) {
    text += `  • Payback period: ${formatYears(paybackYears)}\n`;
  }
  text += `  • Annual savings: ${formatPeso(results.annualSavings || 0)}\n`;
  text += `  • Total investment: ${formatPeso(results.totalCapex || 0)}\n\n`;

  // Actionable advice
  text += `Recommendation: ${verdict.advice}`;

  return text;
}

/**
 * Get verdict based on ROI and payback
 */
function getVerdict(results) {
  const roi = results.simpleROI || 0;
  const payback = results.paybackYears;

  // Green: ROI >= 15% and payback <= 5 years
  if (roi >= 15 && payback <= 5) {
    return {
      recommendation: 'green',
      summary: `This solar investment shows strong returns. With a ${formatPercent(roi)} annual ROI ` +
               `and a ${formatYears(payback)} payback period, your system will pay for itself quickly ` +
               `and then generate pure savings for years to come.`,
      advice: `Proceed with confidence. Get multiple quotes to ensure competitive pricing, ` +
              `and verify installer credentials and warranties.`
    };
  }

  // Yellow: ROI 8-15% or payback 5-8 years
  if (roi >= 8 && payback <= 8) {
    return {
      recommendation: 'yellow',
      summary: `This solar investment shows moderate returns. The ${formatPercent(roi)} annual ROI ` +
               `and ${formatYears(payback)} payback period are acceptable but not exceptional. ` +
               `Your savings will materialize, but the timeline is longer.`,
      advice: `Consider negotiating better pricing, exploring financing options, or ` +
              `checking for government incentives. If your electricity rates are expected ` +
              `to rise significantly, this improves the case.`
    };
  }

  // Red: ROI < 8% or payback > 8 years
  return {
    recommendation: 'red',
    summary: `This solar investment shows weak returns. With only ${formatPercent(roi)} annual ROI ` +
             `and a ${payback === Infinity ? 'very long' : formatYears(payback)} payback period, ` +
             `the financial case is difficult to justify.`,
    advice: `Before proceeding, explore: (1) Lower equipment costs through more quotes, ` +
            `(2) Better financing terms, (3) Higher sun exposure locations, ` +
            `(4) Government incentives or net metering programs, or ` +
            `(5) Larger system size to benefit from economies of scale.`
  };
}

/**
 * Export narrative as a .txt file
 * @param {string} narrativeText - Full narrative text
 */
export function exportAsTxt(narrativeText) {
  const date = new Date().toISOString().split('T')[0];
  const filename = `solarcalc-report-${date}.txt`;
  
  const header = `SolarCalc PH — Solar ROI Analysis Report\n`;
  const separator = `=`.repeat(50) + `\n`;
  const timestamp = `Generated: ${new Date().toLocaleString('en-PH')}\n\n`;
  
  const fullContent = header + separator + timestamp + narrativeText;
  
  const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Copy narrative to clipboard
 * @param {string} narrativeText - Full narrative text
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(narrativeText) {
  const header = `SolarCalc PH — Solar ROI Analysis Report\n`;
  const separator = `=`.repeat(50) + `\n`;
  const timestamp = `Generated: ${new Date().toLocaleString('en-PH')}\n\n`;
  
  const fullContent = header + separator + timestamp + narrativeText;
  
  try {
    await navigator.clipboard.writeText(fullContent);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Update the narrative UI section
 * @param {Object} narrative - Narrative object from generateNarrative()
 */
export function updateNarrativeUI(narrative) {
  // Update each part in the UI
  const partIds = ['part1', 'part2', 'part3', 'part4', 'part5', 'part6', 'part7'];
  
  partIds.forEach(partId => {
    const element = document.getElementById(`narrative-${partId}`);
    if (element && narrative.parts[partId]) {
      element.textContent = narrative.parts[partId];
      element.classList.remove('hidden');
    } else if (element) {
      element.classList.add('hidden');
    }
  });

  // Update verdict badge
  const verdictBadge = document.getElementById('narrative-verdict-badge');
  if (verdictBadge) {
    const { recommendation } = narrative.verdict;
    const badgeClasses = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200'
    };
    const badgeText = {
      green: '🟢 Recommended',
      yellow: '🟡 Caution',
      red: '🔴 Not Recommended'
    };
    
    verdictBadge.className = `inline-block px-4 py-2 rounded-full text-sm font-semibold border ${badgeClasses[recommendation]}`;
    verdictBadge.textContent = badgeText[recommendation];
  }

  // Store narrative for export/copy
  window.currentNarrative = narrative;
}

export default {
  generateNarrative,
  exportAsTxt,
  copyToClipboard,
  updateNarrativeUI
};
