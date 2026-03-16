/**
 * ui.js - DOM manipulation and rendering for SolarCalc PH
 * Handles all UI updates and user interactions
 */

import { formatPeso, formatPercent, formatYears, formatWithUnit, formatForInput } from './format.js';

/**
 * Color classes for Tailwind CSS
 */
const colorClasses = {
  green: {
    text: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200'
  },
  yellow: {
    text: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200'
  },
  red: {
    text: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200'
  },
  gray: {
    text: 'text-gray-900',
    bg: 'bg-gray-50',
    border: 'border-gray-200'
  }
};

/**
 * Get color class based on color name
 * @param {string} color - Color name ('green', 'yellow', 'red', 'gray')
 * @param {string} type - Class type ('text', 'bg', 'border')
 * @returns {string} Tailwind CSS class
 */
export function getColorClass(color, type = 'text') {
  return colorClasses[color]?.[type] || colorClasses.gray[type];
}

/**
 * Update an input field value
 * @param {string} id - Input element ID
 * @param {*} value - Value to set
 */
export function updateInputValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.value = formatForInput(value);
  }
}

/**
 * Update a KPI display element
 * @param {string} id - Element ID
 * @param {string} value - Formatted value to display
 * @param {string} color - Color category for styling
 */
export function updateKPIDisplay(id, value, color = 'gray') {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;

    // Remove all Tailwind text-color-shade classes (e.g., text-gray-400, text-green-600)
    // before applying the new color so classes don't accumulate.
    element.className = element.className
      .replace(/\btext-[a-z]+-\d+\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    element.classList.add(getColorClass(color, 'text'));
  }
}

/**
 * Update battery info display
 * @param {Object} results - Calculation results
 */
export function updateBatteryDisplay(results) {
  const requiredEl = document.getElementById('requiredBatteryKWh');
  if (requiredEl) {
    // Show "0 kWh" without decimal when zero
    requiredEl.textContent = results.requiredBatteryKWh === 0 
      ? '0 kWh' 
      : formatWithUnit(results.requiredBatteryKWh, 'kWh', 1);
  }
}

/**
 * Show or hide edge-case warning banners (M5 — Phase 5.3)
 * @param {Object} results - Calculation results
 */
export function updateWarnings(results) {
  const rateWarn = document.getElementById('rateWarning');
  if (rateWarn) {
    rateWarn.classList.toggle('hidden', !results.warnRateTooLow);
  }

  const loanWarn = document.getElementById('loanWarning');
  if (loanWarn) {
    loanWarn.classList.toggle('hidden', !results.warnLoanExceedsCapex);
  }
}

/**
 * Update financing section visibility
 * @param {boolean} hasFinancing - Whether financing is active
 */
export function updateFinancingVisibility(hasFinancing) {
  const financingSection = document.getElementById('financingSection');
  if (financingSection) {
    if (hasFinancing) {
      financingSection.classList.remove('hidden');
    } else {
      financingSection.classList.add('hidden');
    }
  }
}

/**
 * Update Section 1 (Status Quo) results panel
 * @param {Object} results - Calculation results
 */
export function updateSection1Results(results) {
  const annualCostEl = document.getElementById('section1-annualCost');
  const monthlyCostEl = document.getElementById('section1-monthlyCost');
  const operatingDaysEl = document.getElementById('section1-operatingDays');
  const dailyKWhEl = document.getElementById('section1-dailyKWh');
  const annualConsumptionEl = document.getElementById('section1-annualConsumption');
  
  if (annualCostEl) annualCostEl.textContent = formatPeso(results.effectiveAnnualCost);
  if (monthlyCostEl) monthlyCostEl.textContent = formatPeso(results.projectedMonthlyCost);
  if (operatingDaysEl) operatingDaysEl.textContent = results.operatingDaysPerYear + ' days';
  if (dailyKWhEl) dailyKWhEl.textContent = Math.round(results.dailyEnergyConsumptionKWh || 0) + ' kWh';
  if (annualConsumptionEl) {
    const annualConsumption = Math.round(results.annualConsumptionKWh || 0).toLocaleString();
    annualConsumptionEl.textContent = annualConsumption + ' kWh';
  }
}

/**
 * Update Section 2 (PhotoVoltaic System) results panel
 * @param {Object} results - Calculation results
 */
export function updateSection2Results(results) {
  const pvTotalCapacityEl = document.getElementById('section2-pvTotalCapacity');
  const pvCostEl = document.getElementById('section2-pvSystemCost');
  const totalPVCapexEl = document.getElementById('section2-totalPVCapex');
  const dailyGenEl = document.getElementById('section2-dailyGeneration');
  const dailySavingsEl = document.getElementById('section2-dailySavings');
  const annualGenEl = document.getElementById('section2-annualGeneration');
  
  if (pvTotalCapacityEl) {
    pvTotalCapacityEl.textContent = results.pvTotalCapacityKW === 0 
      ? '0 kW' 
      : results.pvTotalCapacityKW.toFixed(1) + ' kW';
  }
  if (pvCostEl) pvCostEl.textContent = formatPeso(results.pvSystemCost);
  if (totalPVCapexEl) totalPVCapexEl.textContent = formatPeso(results.totalPVCapex);
  if (dailyGenEl) dailyGenEl.textContent = Math.round(results.dailyGenerationKWh) + ' kWh';
  if (dailySavingsEl) dailySavingsEl.textContent = formatPeso(results.dailySavings);
  if (annualGenEl) annualGenEl.textContent = Math.round(results.annualGenerationKWh).toLocaleString() + ' kWh';
}

/**
 * Update Section 3 (Battery Storage) results panel
 * @param {Object} results - Calculation results
 */
export function updateSection3Results(results) {
  const batteryKWhEl = document.getElementById('section3-batteryKWh');
  const batteryCostEl = document.getElementById('section3-batteryCost');
  const pvForBatteryEl = document.getElementById('section3-pvForBattery');
  const dailyChargeEl = document.getElementById('section3-dailyCharge');
  const extraSolarCostEl = document.getElementById('section3-extraSolarCost');
  const chargePercentEl = document.getElementById('section3-chargePercent');
  const noBatteryMsg = document.getElementById('section3-noBattery');
  
  if (batteryKWhEl) {
    batteryKWhEl.textContent = results.batteryCapacityKWh === 0 
      ? '0 kWh' 
      : results.batteryCapacityKWh.toFixed(1) + ' kWh';
  }
  if (batteryCostEl) batteryCostEl.textContent = formatPeso(results.batteryCost);
  
  if (pvForBatteryEl) {
    pvForBatteryEl.textContent = results.pvForBatteryKW === 0 
      ? '0 kW' 
      : results.pvForBatteryKW.toFixed(1) + ' kW';
  }
  
  if (dailyChargeEl) {
    dailyChargeEl.textContent = results.dailyChargeCapacityKWh === 0 
      ? '0 kWh' 
      : results.dailyChargeCapacityKWh.toFixed(1) + ' kWh';
  }
  
  if (extraSolarCostEl) extraSolarCostEl.textContent = formatPeso(results.extraSolarCost);
  
  if (chargePercentEl) {
    const percent = results.batteryChargePercent || 0;
    let colorClass = 'text-emerald-800';
    let indicator = '';
    if (percent >= 100) {
      indicator = ' ✓';
      colorClass = 'text-green-600';
    } else if (percent >= 50) {
      indicator = ' ⚠';
      colorClass = 'text-yellow-600';
    } else if (percent > 0) {
      indicator = ' ⚠';
      colorClass = 'text-red-600';
    }
    chargePercentEl.textContent = percent.toFixed(1) + '%' + indicator;
    chargePercentEl.className = 'text-lg font-bold ' + colorClass;
  }
  
  // Show/hide "No battery configured" message
  if (noBatteryMsg) {
    if (results.batteryCapacityKWh === 0) {
      noBatteryMsg.classList.remove('hidden');
    } else {
      noBatteryMsg.classList.add('hidden');
    }
  }
}

/**
 * Update Section 4 (Financing) results panel
 * Shows loan details if financing, cash purchase message if not
 * @param {Object} results - Calculation results
 */
export function updateSection4Results(results) {
  const section4Results = document.getElementById('section4-results');
  const cashPurchaseMsg = document.getElementById('section4-cashPurchase');
  const monthlyPaymentEl = document.getElementById('section4-monthlyPayment');
  const totalLoanCostEl = document.getElementById('section4-totalLoanCost');
  const totalInterestEl = document.getElementById('section4-totalInterest');
  
  if (results.hasFinancing) {
    // Show loan results, hide cash purchase message
    if (section4Results) section4Results.classList.remove('hidden');
    if (cashPurchaseMsg) cashPurchaseMsg.classList.add('hidden');
    
    // Update loan values
    if (monthlyPaymentEl) monthlyPaymentEl.textContent = formatPeso(results.monthlyAmortization);
    if (totalLoanCostEl) totalLoanCostEl.textContent = formatPeso(results.totalLoanCost);
    if (totalInterestEl) totalInterestEl.textContent = formatPeso(results.totalInterestPaid);
  } else {
    // Hide loan results, show cash purchase message
    if (section4Results) section4Results.classList.add('hidden');
    if (cashPurchaseMsg) cashPurchaseMsg.classList.remove('hidden');
  }
}

/**
 * Update all section results panels
 * @param {Object} results - Calculation results from calc.js
 */
export function updateAllSectionResults(results) {
  updateSection1Results(results);
  updateSection2Results(results);
  updateSection3Results(results);
  updateSection4Results(results);
}

/**
 * Update all KPI displays based on calculation results
 * @param {Object} results - Calculation results from calc.js
 */
export function updateAllKPIs(results) {
  // Main KPIs
  updateKPIDisplay('totalCapex', formatPeso(results.totalCapex));
  updateKPIDisplay('projectedAnnualCost', formatPeso(results.effectiveAnnualCost), 'red');
  updateKPIDisplay('projectedMonthlyCost', formatPeso(results.projectedMonthlyCost), 'red');
  updateKPIDisplay('annualGenerationKWh', Math.round(results.annualGenerationKWh).toLocaleString() + ' kWh', 'blue');
  updateKPIDisplay('annualSavings', formatPeso(results.annualSavings), 'green');
  updateKPIDisplay('monthlySavings', formatPeso(results.monthlySavings));
  updateKPIDisplay('simpleROI', formatPercent(results.simpleROI), results.roiColor);
  updateKPIDisplay('paybackYears', formatYears(results.paybackYears), results.paybackColor);
  
  // Financing KPIs (conditional)
  if (results.hasFinancing) {
    updateKPIDisplay('monthlyAmortization', formatPeso(results.monthlyAmortization), 'orange');
    updateKPIDisplay('netMonthlyCashFlow', formatPeso(results.netMonthlyCashFlow), results.cashFlowColor);
    updateKPIDisplay('totalInterestPaid', formatPeso(results.totalInterestPaid), 'red');
  }
  
  // Battery info
  updateBatteryDisplay(results);
  
  // Financing visibility
  updateFinancingVisibility(results.hasFinancing);

  // Edge case warnings (M5)
  updateWarnings(results);

  // Update all section results panels (M2)
  updateAllSectionResults(results);
}

/**
 * Update all input fields from state
 * @param {Object} inputs - Current input values
 */
export function updateAllInputs(inputs) {
  const inputIds = [
    'electricityRate',
    'operatingWeeksPerYear',
    'operatingDaysPerWeek',
    'dailyEnergyConsumptionKWh',
    'annualBill',
    'solarCapacityKW',
    'peakSunHoursPerDay',
    'solarPricePerKW',
    'miscInfraCosts',
    'batteryPricePerKWh',
    'batteryCapacityKWh',
    'pvForBatteryKW',
    'nighttimeLoadKW',
    'nighttimeDurationHours',
    'loanPrincipal',
    'annualInterestRate',
    'loanTermMonths'
  ];
  
  inputIds.forEach(id => {
    if (id in inputs) {
      updateInputValue(id, inputs[id]);
    }
  });
}

/**
 * Toggle tooltip visibility
 * @param {string} tooltipId - ID of tooltip element
 * @param {boolean|null} forceState - Force show (true), hide (false), or toggle (null)
 * @returns {boolean} New visibility state
 */
export function toggleTooltip(tooltipId, forceState = null) {
  const tooltip = document.getElementById(tooltipId);
  if (!tooltip) return false;
  
  const isActive = tooltip.classList.contains('active');
  const shouldShow = forceState !== null ? forceState : !isActive;
  
  if (shouldShow) {
    tooltip.classList.add('active');
  } else {
    tooltip.classList.remove('active');
  }
  
  return shouldShow;
}

/**
 * Hide all tooltips
 */
export function hideAllTooltips() {
  document.querySelectorAll('.tooltip').forEach(tooltip => {
    tooltip.classList.remove('active');
  });
}

/**
 * Apply theme to document
 * @param {string} theme - 'light' or 'dark'
 */
export function applyTheme(theme) {
  const html = document.documentElement;

  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }

  // Update toggle icon: shows what you'll switch TO
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

/**
 * Apply layout mode
 * @param {string} layout - 'auto', 'phone', or 'desktop'
 */
export function applyLayout(layout) {
  const body = document.body;
  body.setAttribute('data-layout', layout);

  // Update toggle icon to reflect current layout mode
  const layoutIcon = document.getElementById('layoutIcon');
  if (layoutIcon) {
    const icons = { auto: '📐', phone: '📱', desktop: '🖥️' };
    layoutIcon.textContent = icons[layout] || '📐';
  }
}

/**
 * Get input element values as an object
 * @returns {Object} Current input values
 */
export function getInputValues() {
  const inputs = {};
  const inputIds = [
    'electricityRate',
    'operatingWeeksPerYear',
    'operatingDaysPerWeek',
    'dailyEnergyConsumptionKWh',
    'annualBill',
    'solarCapacityKW',
    'peakSunHoursPerDay',
    'solarPricePerKW',
    'miscInfraCosts',
    'batteryPricePerKWh',
    'batteryCapacityKWh',
    'pvForBatteryKW',
    'nighttimeLoadKW',
    'nighttimeDurationHours',
    'loanPrincipal',
    'annualInterestRate',
    'loanTermMonths'
  ];
  
  inputIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      const value = element.value;
      // Parse numbers
      if (value === '' || value === null) {
        inputs[id] = null;
      } else {
        const numValue = parseFloat(value);
        inputs[id] = isNaN(numValue) ? null : numValue;
      }
    }
  });
  
  return inputs;
}

/**
 * Bind input change handlers
 * @param {Function} onChange - Callback when any input changes
 */
export function bindInputHandlers(onChange) {
  const inputIds = [
    'electricityRate',
    'operatingWeeksPerYear',
    'operatingDaysPerWeek',
    'dailyEnergyConsumptionKWh',
    'annualBill',
    'solarCapacityKW',
    'peakSunHoursPerDay',
    'solarPricePerKW',
    'miscInfraCosts',
    'batteryPricePerKWh',
    'batteryCapacityKWh',
    'pvForBatteryKW',
    'nighttimeLoadKW',
    'nighttimeDurationHours',
    'loanPrincipal',
    'annualInterestRate',
    'loanTermMonths'
  ];
  
  inputIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', (e) => {
        const value = e.target.value;
        const numValue = value === '' ? null : parseFloat(value);
        onChange(id, isNaN(numValue) ? null : numValue);
      });
    }
  });
}

/**
 * Bind button click handlers
 * @param {Object} handlers - Object mapping button IDs to handler functions
 */
export function bindButtonHandlers(handlers) {
  Object.entries(handlers).forEach(([id, handler]) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('click', handler);
    }
  });
}

/**
 * Show/hide the onboarding modal
 * @param {boolean} show - Whether to show the modal
 */
export function toggleOnboardingModal(show) {
  const modal = document.getElementById('onboardingModal');
  if (modal) {
    if (show) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }
}

/**
 * Show/hide the sun hours calculator modal
 * @param {boolean} show - Whether to show the modal
 */
export function toggleSunHoursModal(show) {
  const modal = document.getElementById('sunHoursModal');
  if (modal) {
    if (show) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }
}

/**
 * Update the onboarding slide content
 * @param {number} slideIndex - Current slide index (0-based)
 * @param {Array} slides - Array of slide objects with title and content
 */
export function updateOnboardingSlide(slideIndex, slides) {
  const slide = slides[slideIndex];
  if (!slide) return;
  
  const titleEl = document.querySelector('#onboardingContent h2');
  const contentEl = document.getElementById('slideContent');
  
  if (titleEl) titleEl.textContent = slide.title;
  if (contentEl) contentEl.innerHTML = slide.content;
  
  // Update dots
  for (let i = 0; i < slides.length; i++) {
    const dot = document.getElementById(`dot${i}`);
    if (dot) {
      dot.className = `w-2 h-2 rounded-full ${i === slideIndex ? 'bg-teal-600' : 'bg-gray-300'}`;
    }
  }
  
  // Update buttons
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (prevBtn) {
    prevBtn.classList.toggle('hidden', slideIndex === 0);
  }
  
  if (nextBtn) {
    nextBtn.textContent = slideIndex === slides.length - 1 ? 'Get Started →' : 'Next →';
  }
}

/**
 * Scroll to a section smoothly
 * @param {number} sectionNumber - Section number (1-4)
 */
export function scrollToSection(sectionNumber) {
  const sections = document.querySelectorAll('section');
  const targetSection = sections[sectionNumber - 1];
  
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Add a brief highlight effect
    targetSection.style.transition = 'box-shadow 0.3s';
    targetSection.style.boxShadow = '0 0 0 4px rgba(20, 184, 166, 0.5)';
    
    setTimeout(() => {
      targetSection.style.boxShadow = '';
    }, 1500);
  }
}

/**
 * Bind KPI card click handlers for section navigation
 */
export function bindKPICardHandlers() {
  document.querySelectorAll('.kpi-card').forEach(card => {
    const navigate = () => {
      const sectionNumber = parseInt(card.getAttribute('data-section'));
      if (sectionNumber && sectionNumber >= 1 && sectionNumber <= 4) {
        scrollToSection(sectionNumber);
      }
    };

    card.addEventListener('click', navigate);

    // Keyboard: Enter or Space activates the card (matches role="button" expectation)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate();
      }
    });
  });
}

/**
 * Initialize the UI - set up all event listeners
 * @param {Object} state - App state manager
 * @param {Object} actions - Action handlers
 */
export function initializeUI(state, actions) {
  // Bind input handlers
  bindInputHandlers((id, value) => {
    state.inputs[id] = value;
  });
  
  // Bind button handlers
  bindButtonHandlers({
    'themeToggle': actions.toggleTheme,
    'layoutToggle': actions.toggleLayout,
    'helpBtn': actions.showOnboarding,
    'sunHoursBtn': actions.showSunHoursModal
  });
  
  // Bind KPI card click handlers (M2)
  bindKPICardHandlers();
  
  // Close modals on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        actions.closeModals();
      }
    });
  });
  
  // Close tooltips when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.tooltip') && !e.target.closest('[data-tooltip]')) {
      hideAllTooltips();
    }
  });
  
  // Listen for system theme changes — only auto-switch if user has not
  // manually saved a theme preference in localStorage yet
  if (window.matchMedia) {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', (e) => {
      try {
        const saved = localStorage.getItem('solarCalcState');
        const hasSavedTheme = saved && JSON.parse(saved)?.ui?.theme;
        if (!hasSavedTheme) {
          state.setTheme(e.matches ? 'dark' : 'light');
        }
      } catch {
        state.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

// Default export
export default {
  getColorClass,
  updateInputValue,
  updateKPIDisplay,
  updateBatteryDisplay,
  updateWarnings,
  updateFinancingVisibility,
  updateSection1Results,
  updateSection2Results,
  updateSection3Results,
  updateSection4Results,
  updateAllSectionResults,
  updateAllKPIs,
  updateAllInputs,
  toggleTooltip,
  hideAllTooltips,
  applyTheme,
  applyLayout,
  scrollToSection,
  bindKPICardHandlers,
  getInputValues,
  bindInputHandlers,
  bindButtonHandlers,
  toggleOnboardingModal,
  toggleSunHoursModal,
  updateOnboardingSlide,
  initializeUI
};
