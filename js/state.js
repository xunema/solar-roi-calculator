/**
 * state.js - Reactive state management for SolarCalc PH
 * Uses Proxy-based change detection for real-time updates
 */

import { calculateAll } from './calc.js';

/**
 * Default input values based on PRD specifications
 */
export const defaultInputs = {
  // Section 1: Status Quo
  electricityRate: 10.00,
  operatingWeeksPerYear: 52,
  operatingDaysPerWeek: 7,
  dailyEnergyConsumptionKWh: 50,
  annualBill: null, // null means use projected cost
  
  // Section 2: PhotoVoltaic System
  solarCapacityKW: 10,
  peakSunHoursPerDay: 4.0,
  solarPricePerKW: 30000,
  miscInfraCosts: 0,
  batteryPricePerKWh: 12000,
  
  // Section 3: Battery Storage
  nighttimeLoadKW: 0,
  nighttimeDurationHours: 0,
  
  // Section 4: Financing
  loanPrincipal: 0,
  annualInterestRate: 0,
  loanTermMonths: 60
};

/**
 * Default calculated results (initial state)
 */
export const defaultResults = {
  // Section 1: Status Quo
  operatingDaysPerYear: 364,
  annualConsumptionKWh: 18200,
  dailyEnergyConsumptionKWh: 50,
  projectedAnnualCost: 182000,
  projectedMonthlyCost: 15166.67,
  effectiveAnnualCost: 182000,
  // Section 2: PhotoVoltaic System
  pvSystemCost: 300000,
  totalPVCapex: 300000,
  dailyGenerationKWh: 40,
  dailySavings: 400,
  annualGenerationKWh: 14560,
  totalSolarKW: 10,
  // Section 3: Battery Storage
  requiredBatteryKWh: 0,
  batteryCost: 0,
  extraSolarForBatteryKW: 0,
  solarPricePerKW: 30000,
  // Section 4: Financing
  monthlyAmortization: 0,
  totalLoanCost: 0,
  totalInterestPaid: 0,
  // Dashboard KPIs
  totalCapex: 300000,
  annualSavings: 145600,
  simpleROI: 48.53,
  paybackYears: 2.06,
  monthlySavings: 12133.33,
  netMonthlyCashFlow: 12133.33,
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
          electricityRate: 11,
          operatingWeeksPerYear: 52,
          operatingDaysPerWeek: 7,
          dailyEnergyConsumptionKWh: 30,
          solarCapacityKW: 5,
          peakSunHoursPerDay: 4,
          solarPricePerKW: 20000,      // ₱20,000/kW for residential
          miscInfraCosts: 25000,        // Lower misc costs for small residential
          batteryPricePerKWh: 12000,    // ₱12,000/kWh LFP battery
          nighttimeLoadKW: 1.5,         // Aircon + fridge + 24/7 appliances
          nighttimeDurationHours: 8,    // 10pm - 6am typical
          loanPrincipal: 125000,        // 50% financing of ~₱125k system
          annualInterestRate: 8,
          loanTermMonths: 60
        },
        commercial: {
          electricityRate: 10,
          operatingWeeksPerYear: 50,
          operatingDaysPerWeek: 6,
          dailyEnergyConsumptionKWh: 500,
          solarCapacityKW: 100,
          peakSunHoursPerDay: 4,
          solarPricePerKW: 15000,       // ₱15,000/kW for commercial (economies of scale)
          miscInfraCosts: 300000,       // Higher misc for commercial installation
          batteryPricePerKWh: 10000,    // ₱10,000/kWh bulk battery pricing
          nighttimeLoadKW: 15,          // Security lights, servers, refrigeration
          nighttimeDurationHours: 12,   // 6pm - 6am typical for commercial
          loanPrincipal: 1800000,       // 60% financing of ~₱1.8M system
          annualInterestRate: 10,
          loanTermMonths: 60
        },
        batteryOnly: {
          electricityRate: 11,
          operatingWeeksPerYear: 52,
          operatingDaysPerWeek: 7,
          dailyEnergyConsumptionKWh: 40,
          solarCapacityKW: 0,
          peakSunHoursPerDay: 4,
          solarPricePerKW: 30000,
          miscInfraCosts: 0,
          batteryPricePerKWh: 8000,
          nighttimeLoadKW: 5,
          nighttimeDurationHours: 10,
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
