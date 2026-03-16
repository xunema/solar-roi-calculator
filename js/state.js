/**
 * state.js - Reactive state management for SolarCalc PH
 * Uses Proxy-based change detection for real-time updates
 */

import { calculateAll } from './calc.js';

/**
 * Default input values based on PRD specifications
 */
export const defaultInputs = {
  // Section 1: Status Quo (Home defaults)
  electricityRate: 20.00,        // ₱20/kWh for residential
  operatingWeeksPerYear: 52,
  operatingDaysPerWeek: 7,
  dailyEnergyConsumptionKWh: 10, // 10 kWh/day typical small home
  annualBill: null, // null means use projected cost
  
  // Section 2: PhotoVoltaic System (Home defaults)
  solarCapacityKW: 1,            // 1 kW starter system
  peakSunHoursPerDay: 4.0,
  solarPricePerKW: 60000,        // ₱60,000/kW residential
  miscInfraCosts: 30000,         // Permits, installation overhead
  
  // Section 3: Battery Storage (Home defaults)
  batteryPricePerKWh: 30000,     // ₱30,000/kWh residential
  batteryCapacityKWh: 5,         // 5 kWh battery for nighttime backup
  pvForBatteryKW: 1,             // 1 kW dedicated to charging battery
  nighttimeLoadKW: 1,            // Reference: 1 kWh/hr nighttime consumption
  nighttimeDurationHours: 10,     // Reference: 10 hours of backup needed
  
  // Section 4: Financing
  loanPrincipal: 0,
  annualInterestRate: 0,
  loanTermMonths: 60
};

/**
 * Default calculated results (initial state)
 */
export const defaultResults = {
  // Section 1: Status Quo (Home defaults: 10kWh × 364 days × ₱20)
  operatingDaysPerYear: 364,
  annualConsumptionKWh: 3640,    // 10 × 364
  dailyEnergyConsumptionKWh: 10,
  projectedAnnualCost: 72800,    // 3640 × 20
  projectedMonthlyCost: 6066.67, // 72800 / 12
  effectiveAnnualCost: 72800,
  // Section 2: PhotoVoltaic System (Home defaults)
  pvSystemCost: 60000,           // 1 × 60000
  totalPVCapex: 90000,           // 60000 + 30000
  dailyGenerationKWh: 4,         // 1 × 4
  dailySavings: 80,              // 4 × 20
  annualGenerationKWh: 2912,     // 2 × 4 × 364
  totalSolarKW: 2,               // 1 + 1
  // Section 3: Battery Storage (Home defaults)
  requiredBatteryKWh: 10,        // 1 × 10 (reference)
  batteryCapacityKWh: 5,
  batteryCost: 150000,           // 5 × 30000
  pvForBatteryKW: 1,
  dailyChargeCapacityKWh: 4,     // 1 × 4
  extraSolarCost: 60000,         // 1 × 60000
  batteryChargePercent: 80,      // (4/5) × 100
  solarPricePerKW: 60000,
  // Section 4: Financing
  monthlyAmortization: 0,
  totalLoanCost: 0,
  totalInterestPaid: 0,
  // Dashboard KPIs (Home defaults)
  totalCapex: 300000,            // 90000 + 150000 + 60000
  annualSavings: 58240,          // 2912 × 20
  simpleROI: 19.41,              // (58240/300000) × 100
  paybackYears: 5.15,            // 300000 / 58240
  monthlySavings: 4853.33,       // 58240 / 12
  netMonthlyCashFlow: 4853.33,   // No loan = monthly savings
  // UI helpers
  roiColor: 'green',
  paybackColor: 'green',
  cashFlowColor: 'green',
  hasFinancing: false
};

/**
 * Default UI state
 */
export const defaultUIState = {
  theme: 'light', // 'light' | 'dark'
  layout: 'auto', // 'auto' | 'phone' | 'desktop'
  onboardingComplete: false,
  activeTooltip: null,
  showSunHoursModal: false
};

/**
 * Create a reactive state object with Proxy
 * @param {Object} initialState - Initial state values
 * @param {Function} onChange - Callback function when state changes
 * @returns {Proxy} Reactive state proxy
 */
export function createReactiveState(initialState, onChange) {
  const state = { ...initialState };
  
  return new Proxy(state, {
    set(target, property, value) {
      const oldValue = target[property];
      
      // Only trigger if value actually changed
      if (oldValue !== value) {
        target[property] = value;
        
        // Call onChange callback
        if (typeof onChange === 'function') {
          onChange(property, value, oldValue, target);
        }
      }
      
      return true;
    },
    
    get(target, property) {
      return target[property];
    }
  });
}

/**
 * Create the application state manager
 * @returns {Object} State manager with inputs, results, and UI state
 */
export function createAppState() {
  let changeCallback = null;
  let resultsCallback = null;
  
  // Callback when inputs change - recalculate results
  const onInputChange = (property, value, oldValue, inputs) => {
    // Recalculate all results
    const newResults = calculateAll(inputs);
    
    // Update results state
    Object.keys(newResults).forEach(key => {
      state.results[key] = newResults[key];
    });
    
    // Call external change callback if set
    if (typeof changeCallback === 'function') {
      changeCallback('inputs', property, value, oldValue);
    }
  };
  
  // Callback when results change
  const onResultsChange = (property, value, oldValue, results) => {
    if (typeof resultsCallback === 'function') {
      resultsCallback(property, value, oldValue, results);
    }
    
    if (typeof changeCallback === 'function') {
      changeCallback('results', property, value, oldValue);
    }
  };
  
  // Callback when UI state changes
  const onUIChange = (property, value, oldValue, ui) => {
    if (typeof changeCallback === 'function') {
      changeCallback('ui', property, value, oldValue);
    }
  };
  
  // Create reactive states
  const inputs = createReactiveState({ ...defaultInputs }, onInputChange);
  const results = createReactiveState({ ...defaultResults }, onResultsChange);
  const ui = createReactiveState({ ...defaultUIState }, onUIChange);
  
  const state = { inputs, results, ui };
  
  return {
    inputs,
    results,
    ui,
    
    /**
     * Set the change callback function
     * @param {Function} callback - Function called on any state change
     */
    onChange(callback) {
      changeCallback = callback;
    },
    
    /**
     * Set the results change callback function
     * @param {Function} callback - Function called when results change
     */
    onResultsChange(callback) {
      resultsCallback = callback;
    },
    
    /**
     * Reset inputs to default values
     */
    resetInputs() {
      Object.keys(defaultInputs).forEach(key => {
        inputs[key] = defaultInputs[key];
      });
    },
    
    /**
     * Load a preset configuration
     * @param {string} presetName - Name of the preset to load
     */
    loadPreset(presetName) {
      const presets = {
        residential: {
          electricityRate: 15,          // Uses app default
          operatingWeeksPerYear: 52,
          operatingDaysPerWeek: 7,
          dailyEnergyConsumptionKWh: 5, // Typical small home
          solarCapacityKW: 5,
          peakSunHoursPerDay: 4,
          solarPricePerKW: 80000,       // ₱80,000/kW retail/residential pricing
          miscInfraCosts: 50000,        // Permits, inspection, small job overhead
          batteryPricePerKWh: 30000,    // ₱30,000/kWh consumer battery
          batteryCapacityKWh: 12,       // 1.5 kW × 8 hours
          pvForBatteryKW: 3,            // 12 kWh ÷ 4 peak sun hours
          nighttimeLoadKW: 1.5,         // Reference: Aircon + fridge + 24/7 appliances
          nighttimeDurationHours: 8,    // Reference: 10pm - 6am typical
          loanPrincipal: 200000,        // ~50% financing
          annualInterestRate: 8,
          loanTermMonths: 60
        },
        commercial: {
          electricityRate: 15,          // Uses app default
          operatingWeeksPerYear: 52,
          operatingDaysPerWeek: 5,      // 5 days/week (business days)
          dailyEnergyConsumptionKWh: 100, // 100 employees × 1 kWh/person/day
          solarCapacityKW: 100,
          peakSunHoursPerDay: 4,
          solarPricePerKW: 50000,       // ₱50,000/kW commercial bulk pricing
          miscInfraCosts: 500000,       // Commercial permitting, engineering
          batteryPricePerKWh: 12000,    // ₱12,000/kWh commercial LFP
          batteryCapacityKWh: 180,      // 15 kW × 12 hours
          pvForBatteryKW: 45,           // 180 kWh ÷ 4 peak sun hours
          nighttimeLoadKW: 15,          // Reference: Security lights, servers, refrigeration
          nighttimeDurationHours: 12,   // Reference: 6pm - 6am typical
          loanPrincipal: 2500000,       // ~50% financing
          annualInterestRate: 10,
          loanTermMonths: 60
        },
        batteryOnly: {
          electricityRate: 15,          // Uses app default
          operatingWeeksPerYear: 52,
          operatingDaysPerWeek: 7,
          dailyEnergyConsumptionKWh: 40,
          solarCapacityKW: 0,           // Existing system — adding only battery
          peakSunHoursPerDay: 4,
          solarPricePerKW: 50000,       // Mid-range pricing
          miscInfraCosts: 0,
          batteryPricePerKWh: 25000,    // Mid-range between residential and commercial
          batteryCapacityKWh: 50,       // 5 kW × 10 hours
          pvForBatteryKW: 12.5,         // 50 kWh ÷ 4 peak sun hours
          nighttimeLoadKW: 5,           // Reference: Moderate backup load
          nighttimeDurationHours: 10,   // Reference: Evening + early morning
          loanPrincipal: 400000,
          annualInterestRate: 0,
          loanTermMonths: 60
        },
        spreadsheet: {
          electricityRate: 11,
          operatingWeeksPerYear: 50,
          operatingDaysPerWeek: 6,
          dailyEnergyConsumptionKWh: 818, // ~300kW * 4h / 300days * 365/300
          solarCapacityKW: 300,
          peakSunHoursPerDay: 4,
          solarPricePerKW: 40000,
          miscInfraCosts: 2000000,
          batteryPricePerKWh: 5000,
          batteryCapacityKWh: 0,          // Spreadsheet has no battery
          pvForBatteryKW: 0,              // Spreadsheet has no battery
          nighttimeLoadKW: 0,
          nighttimeDurationHours: 0,
          loanPrincipal: 14000000,
          annualInterestRate: 12,
          loanTermMonths: 60
        }
      };
      
      const preset = presets[presetName];
      if (preset) {
        Object.keys(preset).forEach(key => {
          if (key in inputs) {
            inputs[key] = preset[key];
          }
        });
      }
    },
    
    /**
     * Get current state snapshot
     * @returns {Object} Current state values
     */
    getSnapshot() {
      return {
        inputs: { ...inputs },
        results: { ...results },
        ui: { ...ui }
      };
    },
    
    /**
     * Toggle between light and dark theme
     */
    toggleTheme() {
      ui.theme = ui.theme === 'light' ? 'dark' : 'light';
    },
    
    /**
     * Set theme explicitly
     * @param {string} theme - 'light' or 'dark'
     */
    setTheme(theme) {
      if (theme === 'light' || theme === 'dark') {
        ui.theme = theme;
      }
    },
    
    /**
     * Set layout mode
     * @param {string} layout - 'auto', 'phone', or 'desktop'
     */
    setLayout(layout) {
      if (['auto', 'phone', 'desktop'].includes(layout)) {
        ui.layout = layout;
      }
    },
    
    /**
     * Toggle layout between phone and desktop
     */
    toggleLayout() {
      const layouts = ['auto', 'phone', 'desktop'];
      const currentIndex = layouts.indexOf(ui.layout);
      const nextIndex = (currentIndex + 1) % layouts.length;
      ui.layout = layouts[nextIndex];
    },
    
    /**
     * Mark onboarding as complete
     */
    completeOnboarding() {
      ui.onboardingComplete = true;
    },
    
    /**
     * Show or hide the sun hours modal
     * @param {boolean} show - Whether to show the modal
     */
    setShowSunHoursModal(show) {
      ui.showSunHoursModal = Boolean(show);
    },
    
    /**
     * Set active tooltip
     * @param {string|null} tooltipId - ID of active tooltip or null to hide
     */
    setActiveTooltip(tooltipId) {
      ui.activeTooltip = tooltipId;
    },
    
    /**
     * Toggle a tooltip on/off
     * @param {string} tooltipId - ID of tooltip to toggle
     */
    toggleTooltip(tooltipId) {
      ui.activeTooltip = ui.activeTooltip === tooltipId ? null : tooltipId;
    },
    
    /**
     * Update peak sun hours from sun hours calculator
     * @param {number} hours - Calculated peak sun hours
     */
    setPeakSunHours(hours) {
      inputs.peakSunHoursPerDay = hours;
      ui.showSunHoursModal = false;
    }
  };
}

/**
 * Load state from localStorage (if available)
 * @returns {Object|null} Parsed state or null
 */
export function loadStateFromStorage() {
  try {
    const saved = localStorage.getItem('solarCalcState');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
  }
  return null;
}

/**
 * Save state to localStorage
 * @param {Object} state - State object to save
 */
export function saveStateToStorage(state) {
  try {
    localStorage.setItem('solarCalcState', JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
}

// Default export
export default {
  defaultInputs,
  defaultResults,
  defaultUIState,
  createReactiveState,
  createAppState,
  loadStateFromStorage,
  saveStateToStorage
};
