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
  toggleTooltip,
  copyNarrativeToClipboard,
  exportNarrativeAsTxt,
  updateNarrativeFromResults,
  updateSpecSelector,
  updateSaveButtonState,
  toggleManageSpecsModal,
  renderSpecsList,
  toggleSpecLimitWarning
} from './ui.js';

import {
  getAllSpecs,
  createSpec,
  updateSpec,
  deleteSpec,
  renameSpec,
  getSpecById,
  specNameExists,
  isSpecLimitReached,
  exportSpecs,
  importSpecs,
  getFormattedSpecs
} from './specs.js';

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
    this.narrativeGenerated = false;
    this.activeSpecId = null;
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
        // Update narrative if already generated (M6)
        if (this.narrativeGenerated) {
          updateNarrativeFromResults(this.state.inputs, this.state.results);
        }
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

    // Bind narrative buttons (M6)
    this.bindNarrativeButtons();

    // Bind spec buttons (M7)
    this.bindSpecButtons();

    // Initialize specs UI (M7)
    this.initSpecsUI();
    
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
   * Bind narrative action buttons (M6)
   */
  bindNarrativeButtons() {
    // Generate narrative button (initial state)
    const generateBtn = document.getElementById('generateNarrativeBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.generateNarrative();
      });
    }

    // Copy to clipboard button
    const copyBtn = document.getElementById('copyNarrativeBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const success = await copyNarrativeToClipboard();
        const feedback = document.getElementById('copyFeedback');
        if (feedback) {
          feedback.classList.toggle('hidden', !success);
          if (success) {
            setTimeout(() => {
              feedback.classList.add('hidden');
            }, 3000);
          }
        }
      });
    }

    // Export as .txt button
    const exportBtn = document.getElementById('exportNarrativeBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        exportNarrativeAsTxt();
      });
    }
  }

  /**
   * Generate and reveal the narrative summary
   */
  generateNarrative() {
    // Hide initial state, show content
    const initialDiv = document.getElementById('narrative-initial');
    const contentDiv = document.getElementById('narrative-content');
    
    if (initialDiv) initialDiv.classList.add('hidden');
    if (contentDiv) contentDiv.classList.remove('hidden');
    
    // Generate narrative immediately
    updateNarrativeFromResults(this.state.inputs, this.state.results);
    
    // Mark as generated so future updates happen automatically
    this.narrativeGenerated = true;
    
    // Scroll to the narrative section
    document.getElementById('narrativeSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  /**
   * Initialize specs UI (M7)
   */
  initSpecsUI() {
    const specs = getFormattedSpecs();
    updateSpecSelector(specs, this.activeSpecId);
    updateSaveButtonState(!!this.activeSpecId);
  }

  /**
   * Bind spec-related buttons (M7)
   */
  bindSpecButtons() {
    // Spec selector dropdown - Load spec
    const selector = document.getElementById('specSelector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        const specId = e.target.value;
        if (specId) {
          this.loadSpec(specId);
        } else {
          this.activeSpecId = null;
          updateSaveButtonState(false);
        }
      });
    }

    // Save button - Overwrite current spec
    const saveBtn = document.getElementById('specSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (this.activeSpecId) {
          this.saveCurrentSpec();
        }
      });
    }

    // Save As button - Create new spec
    const saveAsBtn = document.getElementById('specSaveAsBtn');
    if (saveAsBtn) {
      saveAsBtn.addEventListener('click', () => {
        this.saveSpecAs();
      });
    }

    // Manage specs button - Open manage modal
    const manageBtn = document.getElementById('specManageBtn');
    if (manageBtn) {
      manageBtn.addEventListener('click', () => {
        this.openManageSpecs();
      });
    }

    // Close manage modal buttons
    const closeManageBtn = document.getElementById('closeManageSpecs');
    const closeManageBtn2 = document.getElementById('closeManageSpecsBtn');
    if (closeManageBtn) {
      closeManageBtn.addEventListener('click', () => toggleManageSpecsModal(false));
    }
    if (closeManageBtn2) {
      closeManageBtn2.addEventListener('click', () => toggleManageSpecsModal(false));
    }

    // Close modal on backdrop click
    const manageModal = document.getElementById('manageSpecsModal');
    if (manageModal) {
      manageModal.addEventListener('click', (e) => {
        if (e.target === manageModal) {
          toggleManageSpecsModal(false);
        }
      });
    }

    // Export specs button
    const exportSpecsBtn = document.getElementById('exportSpecsBtn');
    if (exportSpecsBtn) {
      exportSpecsBtn.addEventListener('click', () => {
        exportSpecs();
      });
    }

    // Import specs button
    const importSpecsBtn = document.getElementById('importSpecsBtn');
    if (importSpecsBtn) {
      importSpecsBtn.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          await this.handleImportSpecs(file);
          e.target.value = ''; // Reset input
        }
      });
    }

    // Spec list action buttons (delete, rename) - event delegation
    const specsList = document.getElementById('specsList');
    if (specsList) {
      specsList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('[data-spec-delete]');
        const renameBtn = e.target.closest('[data-spec-rename]');
        
        if (deleteBtn) {
          const specId = deleteBtn.getAttribute('data-spec-delete');
          this.handleDeleteSpec(specId);
        } else if (renameBtn) {
          const specId = renameBtn.getAttribute('data-spec-rename');
          this.handleRenameSpec(specId);
        }
      });
    }
  }

  /**
   * Save current inputs to active spec
   */
  saveCurrentSpec() {
    if (!this.activeSpecId) return;
    
    const updated = updateSpec(this.activeSpecId, this.state.inputs);
    if (updated) {
      this.initSpecsUI();
      alert('Specification saved!');
    }
  }

  /**
   * Save current inputs as a new spec
   */
  saveSpecAs() {
    if (isSpecLimitReached()) {
      alert('Maximum 20 specifications reached. Please delete some to save more.');
      return;
    }

    const name = prompt('Enter a name for this specification:');
    if (!name || !name.trim()) return;

    if (specNameExists(name)) {
      alert('A specification with this name already exists. Please choose a different name.');
      return;
    }

    const spec = createSpec(name, this.state.inputs);
    if (spec) {
      this.activeSpecId = spec.id;
      this.initSpecsUI();
      alert(`Specification "${spec.name}" saved!`);
    }
  }

  /**
   * Load a spec by ID
   * @param {string} specId - Spec ID to load
   */
  loadSpec(specId) {
    const spec = getSpecById(specId);
    if (!spec) return;

    // Load inputs from spec
    Object.keys(spec.inputs).forEach(key => {
      if (key in this.state.inputs) {
        this.state.inputs[key] = spec.inputs[key];
      }
    });

    this.activeSpecId = specId;
    updateAllInputs(this.state.inputs);
    updateSaveButtonState(true);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Open the manage specs modal
   */
  openManageSpecs() {
    const specs = getFormattedSpecs();
    renderSpecsList(specs, this.activeSpecId);
    toggleSpecLimitWarning(isSpecLimitReached());
    toggleManageSpecsModal(true);
  }

  /**
   * Handle delete spec action
   * @param {string} specId - Spec ID to delete
   */
  handleDeleteSpec(specId) {
    if (!confirm('Are you sure you want to delete this specification?')) return;

    if (deleteSpec(specId)) {
      if (this.activeSpecId === specId) {
        this.activeSpecId = null;
        updateSaveButtonState(false);
      }
      this.openManageSpecs(); // Refresh the list
      this.initSpecsUI(); // Refresh the dropdown
    }
  }

  /**
   * Handle rename spec action
   * @param {string} specId - Spec ID to rename
   */
  handleRenameSpec(specId) {
    const spec = getSpecById(specId);
    if (!spec) return;

    const newName = prompt('Enter new name:', spec.name);
    if (!newName || !newName.trim()) return;

    if (newName.trim() === spec.name) return; // No change

    if (specNameExists(newName)) {
      alert('A specification with this name already exists.');
      return;
    }

    if (renameSpec(specId, newName)) {
      this.openManageSpecs(); // Refresh the list
      this.initSpecsUI(); // Refresh the dropdown
    }
  }

  /**
   * Handle import specs from file
   * @param {File} file - JSON file to import
   */
  async handleImportSpecs(file) {
    const result = await importSpecs(file);
    
    if (result.success) {
      let message = `Imported ${result.imported} specification${result.imported !== 1 ? 's' : ''}.`;
      if (result.skipped > 0) {
        message += ` Skipped ${result.skipped} (duplicates or limit reached).`;
      }
      alert(message);
      this.initSpecsUI();
      this.openManageSpecs();
    } else {
      alert('Import failed: ' + (result.error || 'Unknown error'));
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SolarCalcApp();
});

// Export for testing
export { SolarCalcApp };
export default SolarCalcApp;
