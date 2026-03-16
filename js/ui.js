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
    
    // Update color classes
    element.className = element.className.replace(/text-\w+-600/g, '');
    element.classList.add(getColorClass(color, 'text'));
  }
}

/**
 * Update battery info display
 * @param {Object} results - Calculation results
 */
export function updateBatteryDisplay(results) {
  const requiredEl = document.getElementById('requiredBatteryKWh');
  const extraEl = document.getElementById('extraSolarKW');
  
  if (requiredEl) {
    requiredEl.textContent = formatWithUnit(results.requiredBatteryKWh, 'kWh', 1);
  }
  
  if (extraEl) {
    extraEl.textContent = formatWithUnit(results.extraSolarForBatteryKW, 'kW', 1);
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
 * Update all KPI displays based on calculation results
 * @param {Object} results - Calculation results from calc.js
 */
export function updateAllKPIs(results) {
  // Main KPIs
  updateKPIDisplay('totalCapex', formatPeso(results.totalCapex));
  updateKPIDisplay('projectedAnnualCost', formatPeso(results.effectiveAnnualCost), 'red');
  updateKPIDisplay('annualSavings', formatPeso(results.annualSavings), 'green');
  updateKPIDisplay('simpleROI', formatPercent(results.simpleROI), results.roiColor);
  updateKPIDisplay('paybackYears', formatYears(results.paybackYears), results.paybackColor);
  updateKPIDisplay('monthlySavings', formatPeso(results.monthlySavings));
  
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
}

/**
 * Apply layout mode
 * @param {string} layout - 'auto', 'phone', or 'desktop'
 */
export function applyLayout(layout) {
  const body = document.body;
  body.setAttribute('data-layout', layout);
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
  
  // Listen for system theme changes
  if (window.matchMedia) {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', (e) => {
      if (!state.ui.onboardingComplete) {
        // Only auto-switch if user hasn't manually set preference
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
  updateFinancingVisibility,
  updateAllKPIs,
  updateAllInputs,
  toggleTooltip,
  hideAllTooltips,
  applyTheme,
  applyLayout,
  getInputValues,
  bindInputHandlers,
  bindButtonHandlers,
  toggleOnboardingModal,
  toggleSunHoursModal,
  updateOnboardingSlide,
  initializeUI
};
