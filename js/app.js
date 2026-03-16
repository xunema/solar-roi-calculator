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
  hideAllTooltips
} from './ui.js';

// Onboarding slides content
const onboardingSlides = [
  {
    title: "Welcome to SolarCalc PH",
    content: "Calculate your solar ROI in real-time. This app helps you understand the financial benefits of installing solar panels and battery storage for your home or business."
  },
  {
    title: "Find Your Electricity Rate",
    content: "Look at your Meralco or utility bill. Divide your <strong>Total Bill Amount</strong> by <strong>Total kWh Consumed</strong> to get your blended rate per kWh. Typical range: ₱9-12/kWh."
  },
  {
    title: "Solar System Sizing",
    content: "Enter your desired solar capacity in kW. For reference: A typical Philippine home uses 3-10 kW systems. Use our Sun Hours Calculator to find your location's peak sun hours."
  },
  {
    title: "You're Ready!",
    content: "Adjust any value and see results update instantly. Try the Quick Presets to explore different scenarios. All calculations happen on your device—no data is sent anywhere."
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
   * Load saved state from localStorage
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
   * Check if this is first visit and show onboarding
   */
  checkFirstVisit() {
    if (!this.state.ui.onboardingComplete) {
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
        this.state.toggleTooltip(tooltipId);
      });
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
