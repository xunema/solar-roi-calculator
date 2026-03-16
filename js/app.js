/**
 * app.js - Entry point for SolarCalc PH
 * Initializes state, UI, and coordinates all modules
 */

import { createAppState, loadStateFromStorage } from './state.js';
import {
  updateAllKPIs,
  updateAllInputs,
  applyTheme,
  applyLayout,
  toggleOnboardingModal,
  toggleSunHoursModal,
  updateOnboardingSlide,
  initializeUI,
  hideAllTooltips,
  updateAllSectionResults,
  toggleTooltip
} from './ui.js';

// Onboarding slides content
const onboardingSlides = [
  {
    title: "Welcome to SolarCalc PH",
    content: "Calculate your solar ROI in real-time. Enter your electricity costs, system specs, and financing details — and see your payback period, annual savings, and net cash flow instantly.<br><br>All calculations happen on your device. No signup, no internet required after first load."
  },
  {
    title: "Finding Your Electricity Rate",
    content: "Your <strong>blended rate</strong> = Total Bill ÷ Total kWh consumed.<br><br>Check your Meralco bill for both figures. <strong>Do not use just the Generation Charge</strong> — use the full bill total divided by total kWh.<br><br>Typical rates: Residential ₱20/kWh, Commercial ₱15/kWh."
  },
  {
    title: "Four Sections, One Answer",
    content: "<strong>1 — Status Quo:</strong> Your current electricity cost baseline<br><strong>2 — PhotoVoltaic System:</strong> Solar panel sizing and equipment cost<br><strong>3 — Battery Storage:</strong> Optional nighttime backup<br><strong>4 — Financing:</strong> Loan terms and monthly cash flow<br><br>Each section shows its own results panel. The Dashboard aggregates all KPIs. Tap any KPI to jump to its source section."
  },
  {
    title: "Getting Help",
    content: "Click the <strong>❓</strong> next to any field for context, benchmarks, and external resources.<br><br>Use the <strong>Calculate</strong> button on Peak Sun Hours to estimate PSH by region, orientation, and roof tilt.<br><br>Try <strong>Quick Presets</strong> to instantly load Residential, Commercial, or Spreadsheet scenarios.<br><br>Click <strong>❓ Help</strong> in the header to re-open this guide anytime."
  }
];

/**
 * Main application class
 */
class SolarCalcApp {
  constructor() {
    this.state = createAppState();
    this.currentSlide = 0;
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    // Set up state change listeners
    this.setupStateListeners();
    
    // Load saved state if available
    this.loadSavedState();
    
    // Initialize UI
    this.setupUI();
    
    // Check for first visit
    this.checkFirstVisit();
  }

  /**
   * Set up state change listeners
   */
  setupStateListeners() {
    // Listen for any state changes
    this.state.onChange((type, property, value, oldValue) => {
      if (type === 'results') {
        // Update KPIs when results change
        updateAllKPIs(this.state.results);
      } else if (type === 'ui') {
        // Handle UI state changes
        this.handleUIChange(property, value);
      }
    });
  }

  /**
   * Load saved state from localStorage.
   * If no saved theme, detect system prefers-color-scheme as fallback.
   */
  loadSavedState() {
    const saved = loadStateFromStorage();
    if (saved) {
      // Restore input values
      if (saved.inputs) {
        Object.keys(saved.inputs).forEach(key => {
          if (key in this.state.inputs) {
            this.state.inputs[key] = saved.inputs[key];
          }
        });
      }

      // Restore UI state
      if (saved.ui) {
        if (saved.ui.theme) {
          this.state.setTheme(saved.ui.theme);
        }
        if (saved.ui.layout) {
          this.state.setLayout(saved.ui.layout);
        }
        if (saved.ui.onboardingComplete !== undefined) {
          this.state.ui.onboardingComplete = saved.ui.onboardingComplete;
        }
      }

      // If no theme was saved, fall through to system preference below
      if (!saved.ui?.theme) {
        this._applySystemTheme();
      }
    } else {
      // No saved state at all — respect system preference
      this._applySystemTheme();
    }
  }

  /**
   * Set theme from OS/browser prefers-color-scheme if available
   */
  _applySystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.state.setTheme('dark');
    }
  }

  /**
   * Save current state to localStorage
   */
  saveState() {
    const snapshot = this.state.getSnapshot();
    // Only save inputs and UI state (not results, which are derived)
    const toSave = {
      inputs: snapshot.inputs,
      ui: {
        theme: snapshot.ui.theme,
        layout: snapshot.ui.layout,
        onboardingComplete: snapshot.ui.onboardingComplete
      }
    };
    
    try {
      localStorage.setItem('solarCalcState', JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  /**
   * Set up UI and event handlers
   */
  setupUI() {
    // Apply initial theme and layout
    applyTheme(this.state.ui.theme);
    applyLayout(this.state.ui.layout);
    
    // Update UI with current state
    updateAllInputs(this.state.inputs);
    updateAllKPIs(this.state.results);
    
    // Initialize UI event handlers
    initializeUI(this.state, {
      toggleTheme: () => this.toggleTheme(),
      toggleLayout: () => this.toggleLayout(),
      showOnboarding: () => this.showOnboarding(),
      showSunHoursModal: () => this.showSunHoursModal(),
      closeModals: () => this.closeModals()
    });
    
    // Bind preset buttons
    this.bindPresetButtons();

    // Bind reset button
    this.bindResetButton();

    // Bind modal buttons
    this.bindModalButtons();

    // Bind tooltip buttons
    this.bindTooltipButtons();
    
    // Save state on page unload
    window.addEventListener('beforeunload', () => {
      this.saveState();
    });
  }

  /**
   * Check if this is first visit this session and show onboarding
   * Uses sessionStorage so it shows once per browser session, not once ever.
   * The Help button lets users re-open it anytime.
   */
  checkFirstVisit() {
    if (!sessionStorage.getItem('onboardingShown')) {
      sessionStorage.setItem('onboardingShown', '1');
      setTimeout(() => {
        this.showOnboarding();
      }, 500);
    }
  }

  /**
   * Handle UI state changes
   */
  handleUIChange(property, value) {
    switch (property) {
      case 'theme':
        applyTheme(value);
        this.saveState();
        break;
      case 'layout':
        applyLayout(value);
        this.saveState();
        break;
      case 'onboardingComplete':
        this.saveState();
        break;
      case 'showSunHoursModal':
        toggleSunHoursModal(value);
        break;
      case 'activeTooltip':
        if (!value) {
          hideAllTooltips();
        }
        break;
    }
  }

  /**
   * Toggle theme between light and dark
   */
  toggleTheme() {
    this.state.toggleTheme();
  }

  /**
   * Toggle layout mode
   */
  toggleLayout() {
    this.state.toggleLayout();
  }

  /**
   * Show onboarding modal
   */
  showOnboarding() {
    this.currentSlide = 0;
    updateOnboardingSlide(this.currentSlide, onboardingSlides);
    toggleOnboardingModal(true);
  }

  /**
   * Hide onboarding modal
   */
  hideOnboarding() {
    toggleOnboardingModal(false);
    // Focus first input after onboarding dismiss
    setTimeout(() => {
      const firstInput = document.getElementById('electricityRate');
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }, 100);
  }

  /**
   * Show sun hours calculator modal
   */
  showSunHoursModal() {
    this.state.setShowSunHoursModal(true);
  }

  /**
   * Close all modals
   */
  closeModals() {
    // If onboarding is open, mark as complete before closing
    const onboardingModal = document.getElementById('onboardingModal');
    if (onboardingModal && !onboardingModal.classList.contains('hidden')) {
      this.state.completeOnboarding();
    }
    this.hideOnboarding();
    this.state.setShowSunHoursModal(false);
  }

  /**
   * Go to next onboarding slide
   */
  nextSlide() {
    if (this.currentSlide < onboardingSlides.length - 1) {
      this.currentSlide++;
      updateOnboardingSlide(this.currentSlide, onboardingSlides);
    } else {
      // Last slide - complete onboarding
      this.state.completeOnboarding();
      this.hideOnboarding();
    }
  }

  /**
   * Go to previous onboarding slide
   */
  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      updateOnboardingSlide(this.currentSlide, onboardingSlides);
    }
  }

  /**
   * Load a preset configuration
   * @param {string} presetName - Name of the preset
   */
  loadPreset(presetName) {
    this.state.loadPreset(presetName);
    updateAllInputs(this.state.inputs);
  }

  /**
   * Bind preset button handlers
   */
  bindPresetButtons() {
    const presets = ['residential', 'commercial', 'batteryOnly', 'spreadsheet'];
    
    presets.forEach(preset => {
      const btn = document.getElementById(`preset-${preset}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.loadPreset(preset);
        });
      }
    });
  }

  /**
   * Bind reset to defaults button
   */
  bindResetButton() {
    const btn = document.getElementById('resetDefaults');
    if (btn) {
      btn.addEventListener('click', () => {
        this.state.resetInputs();
        localStorage.removeItem('solarCalcState');
        updateAllInputs(this.state.inputs);
      });
    }
  }

  /**
   * Bind modal button handlers
   */
  bindModalButtons() {
    // Onboarding navigation
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextSlide());
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevSlide());
    }
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => this.closeModals());
    });
  }

  /**
   * Bind tooltip toggle buttons
   */
  bindTooltipButtons() {
    document.querySelectorAll('[data-tooltip]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tooltipId = btn.getAttribute('data-tooltip');
        
        // Hide all other tooltips first (only one open at a time)
        hideAllTooltips();
        
        // Toggle the clicked tooltip
        const isNowActive = toggleTooltip(tooltipId);
        if (isNowActive) {
          this.state.ui.activeTooltip = tooltipId;
        } else {
          this.state.ui.activeTooltip = null;
        }
      });
    });
    
    // Close tooltips when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.tooltip') && !e.target.closest('[data-tooltip]')) {
        hideAllTooltips();
        this.state.ui.activeTooltip = null;
      }
    });
    
    // ESC key to close tooltips and modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideAllTooltips();
        this.state.ui.activeTooltip = null;
        this.closeModals();
      }
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SolarCalcApp();
});

// Export for testing
export { SolarCalcApp };
export default SolarCalcApp;
