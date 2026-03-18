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
  toggleSpecLimitWarning,
  bindNarrativeScrollButtons
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

import {
  initPackages,
  loadPackages,
  savePackage,
  deletePackage,
  getPackageById,
  getActivePackageId,
  setActivePackageId,
  dismissActiveBanner,
  validatePackage,
  packageNameExists,
  searchPackages,
  sortPackages,
  exportPackagesAsJson,
  exportPackagesAsCsv,
  exportSinglePackageAsJson,
  importPackagesFromJson,
  importPackagesFromCsv,
  getPackageSummary
} from './packages.js';

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
    
    // M8: Package Manager state
    this.packageManagerOpen = false;
    this.currentPackageView = 'list';
    this.currentPackageId = null;
    this.packageTags = [];
    this.packageFormDirty = false;
    
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    // Initialize M8: Packages module
    initPackages();
    
    // Set up state change listeners
    this.setupStateListeners();
    
    // Load saved state if available
    this.loadSavedState();
    
    // Initialize UI
    this.setupUI();
    
    // Initialize M8: Package UI
    this.initPackagesUI();
    
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
      } else if (type === 'inputs') {
        // M8: Check if package inputs were modified
        this.checkPackageModified(property);
      }
    });
  }

  /**
   * M8: Check if package-related inputs were modified and update banner
   */
  checkPackageModified(property) {
    // Fields that trigger "modified" state
    const packageFields = ['solarCapacityKW', 'solarPricePerKW', 'miscInfraCosts'];
    
    if (packageFields.includes(property)) {
      const activeId = getActivePackageId();
      if (activeId) {
        // Get the current package to compare values
        const pkg = getPackageById(activeId);
        if (pkg) {
          // Calculate what the values should be
          const expectedSolarPricePerKW = pkg.systemSizeKw > 0 
            ? pkg.priceTotal / pkg.systemSizeKw 
            : 0;
          
          const inputs = this.state.inputs;
          
          // Check if any value differs from package
          const isModified = 
            Math.abs(inputs.solarCapacityKW - pkg.systemSizeKw) > 0.001 ||
            Math.abs(inputs.solarPricePerKW - expectedSolarPricePerKW) > 0.001 ||
            inputs.miscInfraCosts !== 0;
          
          if (isModified) {
            this.updatePackageBanner(true);
          }
        }
      }
    }
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

    // Initialize M8: Package Manager bindings
    this.bindPackageButtons();

    // Bind narrative section scroll buttons (M6)
    bindNarrativeScrollButtons();
    
    // M8: Check and show package banner if needed
    this.updatePackageBanner();
    
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
        // M8: Reset package banner on defaults
        dismissActiveBanner();
        this.updatePackageBanner();
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
    
    // M8: Handle activePackageId from spec
    if (spec.activePackageId) {
      const pkg = getPackageById(spec.activePackageId);
      if (pkg) {
        // Package exists - set as active but don't re-apply (values already loaded from spec)
        setActivePackageId(spec.activePackageId);
      } else {
        // Package no longer exists
        setActivePackageId(spec.activePackageId);
      }
      this.updatePackageBanner();
    } else {
      // No active package in spec
      dismissActiveBanner();
    }
    
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

  // ==========================================
  // M8: Solar Package Manager Methods
  // ==========================================

  /**
   * Initialize Package Manager UI
   */
  initPackagesUI() {
    this.renderPackageList();
  }

  /**
   * Bind package-related button handlers
   */
  bindPackageButtons() {
    // Open package manager
    const packagesBtn = document.getElementById('packagesBtn');
    if (packagesBtn) {
      packagesBtn.addEventListener('click', () => this.openPackageManager());
    }

    // Close package manager
    const closeBtn = document.getElementById('closePackageManager');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closePackageManager());
    }

    // Tab navigation
    const tabList = document.getElementById('tabList');
    const tabDetail = document.getElementById('tabDetail');
    const tabForm = document.getElementById('tabForm');
    
    if (tabList) tabList.addEventListener('click', () => this.switchPackageView('list'));
    if (tabDetail) tabDetail.addEventListener('click', () => this.switchPackageView('detail'));
    if (tabForm) tabForm.addEventListener('click', () => this.switchPackageView('form'));

    // Add package button
    const addBtn = document.getElementById('addPackageBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.startAddPackage());
    }

    // Search and sort
    const searchInput = document.getElementById('packageSearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderPackageList());
    }

    const sortSelect = document.getElementById('packageSort');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => this.renderPackageList());
    }

    // Form handlers
    const form = document.getElementById('packageForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handlePackageFormSubmit(e));
    }

    const cancelBtn = document.getElementById('cancelPackageForm');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.handlePackageFormCancel());
    }

    // Live compute price per watt
    const priceInput = document.getElementById('pkgPriceTotal');
    const sizeInput = document.getElementById('pkgSystemSizeKw');
    if (priceInput) priceInput.addEventListener('input', () => this.updatePricePerWatt());
    if (sizeInput) sizeInput.addEventListener('input', () => this.updatePricePerWatt());

    // Tags input
    const tagsInput = document.getElementById('pkgTagsInput');
    if (tagsInput) {
      tagsInput.addEventListener('keydown', (e) => {
        if (e.key === ',' || e.key === 'Enter') {
          e.preventDefault();
          this.addTagFromInput();
        }
      });
      tagsInput.addEventListener('blur', () => this.addTagFromInput());
    }

    // Financing toggle
    const hasFinancingCheckbox = document.getElementById('pkgHasFinancing');
    if (hasFinancingCheckbox) {
      hasFinancingCheckbox.addEventListener('change', () => this.toggleFinancingFields());
    }

    // Financing inputs - live compute monthly payment
    const financingInputs = ['pkgLoanPrincipal', 'pkgInterestRate', 'pkgLoanTerm'];
    financingInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.updatePackageMonthlyPayment());
      }
    });

    // Notes character count
    const notesInput = document.getElementById('pkgNotes');
    if (notesInput) {
      notesInput.addEventListener('input', () => this.updateNotesCount());
    }

    // Detail view actions
    const applyBtn = document.getElementById('applyPackageBtn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyCurrentPackage());
    }

    const editBtn = document.getElementById('editPackageBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => this.editCurrentPackage());
    }

    const exportSingleBtn = document.getElementById('exportSinglePackage');
    if (exportSingleBtn) {
      exportSingleBtn.addEventListener('click', () => this.exportSinglePackage());
    }

    const copyBtn = document.getElementById('copyPackageJson');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyPackageJson());
    }

    // Import/Export
    const exportJsonBtn = document.getElementById('exportPackagesJson');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => this.exportPackagesJson());
    }

    const exportCsvBtn = document.getElementById('exportPackagesCsv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => this.exportPackagesCsv());
    }

    const importBtn = document.getElementById('importPackagesBtn');
    if (importBtn) {
      importBtn.addEventListener('change', (e) => this.handleImportPackages(e.target.files[0]));
    }

    // Banner actions
    const dismissBanner = document.getElementById('dismissPackageBanner');
    if (dismissBanner) {
      dismissBanner.addEventListener('click', () => {
        dismissActiveBanner();
        this.updatePackageBanner();
      });
    }

    const viewPackageBtn = document.getElementById('viewPackageBtn');
    if (viewPackageBtn) {
      viewPackageBtn.addEventListener('click', () => {
        const activeId = getActivePackageId();
        if (!activeId) return;
        
        // Check if package still exists
        const pkg = getPackageById(activeId);
        if (!pkg) {
          alert('This package no longer exists.');
          return;
        }
        
        this.currentPackageId = activeId;
        this.openPackageManager();
        this.switchPackageView('detail');
      });
    }

    // Package list event delegation
    const packageList = document.getElementById('packageList');
    if (packageList) {
      packageList.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('[data-package-view]');
        const editBtn = e.target.closest('[data-package-edit]');
        const deleteBtn = e.target.closest('[data-package-delete]');

        if (viewBtn) {
          this.currentPackageId = viewBtn.dataset.packageView;
          this.switchPackageView('detail');
        } else if (editBtn) {
          this.currentPackageId = editBtn.dataset.packageEdit;
          this.editCurrentPackage();
        } else if (deleteBtn) {
          const id = deleteBtn.dataset.packageDelete;
          this.deletePackage(id);
        }
      });
    }

    // Close on backdrop click
    const modal = document.getElementById('packageManagerModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closePackageManager();
        }
      });
    }
  }

  /**
   * Open the package manager modal
   */
  openPackageManager() {
    this.packageManagerOpen = true;
    const modal = document.getElementById('packageManagerModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
    this.switchPackageView('list');
    this.renderPackageList();
  }

  /**
   * Close the package manager modal
   */
  closePackageManager() {
    this.packageManagerOpen = false;
    const modal = document.getElementById('packageManagerModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    this.currentPackageId = null;
    this.packageTags = [];
    this.packageFormDirty = false;
  }

  /**
   * Switch between package views (list, detail, form)
   */
  switchPackageView(view) {
    this.currentPackageView = view;

    // Hide all views
    document.getElementById('viewList')?.classList.add('hidden');
    document.getElementById('viewDetail')?.classList.add('hidden');
    document.getElementById('viewForm')?.classList.add('hidden');

    // Reset tab styles
    const tabs = ['tabList', 'tabDetail', 'tabForm'];
    tabs.forEach(tabId => {
      const tab = document.getElementById(tabId);
      if (tab) {
        tab.className = 'flex-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-b-2 border-transparent';
      }
    });

    // Show selected view
    const selectedView = document.getElementById(`view${view.charAt(0).toUpperCase() + view.slice(1)}`);
    if (selectedView) {
      selectedView.classList.remove('hidden');
    }

    // Highlight selected tab
    const selectedTab = document.getElementById(`tab${view.charAt(0).toUpperCase() + view.slice(1)}`);
    if (selectedTab) {
      selectedTab.className = 'flex-1 py-3 text-sm font-medium text-teal-600 border-b-2 border-teal-600 bg-teal-50 dark:bg-slate-800/50';
    }

    // View-specific setup
    if (view === 'list') {
      this.renderPackageList();
    } else if (view === 'detail') {
      this.renderPackageDetail();
    } else if (view === 'form') {
      this.renderPackageForm();
    }
  }

  /**
   * Render the package list
   */
  renderPackageList() {
    const listEl = document.getElementById('packageList');
    const emptyEl = document.getElementById('packageListEmpty');
    const noResultsEl = document.getElementById('packageNoResults');
    
    if (!listEl) return;

    const searchQuery = document.getElementById('packageSearch')?.value || '';
    const sortBy = document.getElementById('packageSort')?.value || 'date';

    let packages = loadPackages();
    packages = searchPackages(searchQuery, packages);
    packages = sortPackages(packages, sortBy);

    // Show/hide empty states
    if (packages.length === 0 && !searchQuery) {
      listEl.innerHTML = '';
      emptyEl?.classList.remove('hidden');
      noResultsEl?.classList.add('hidden');
      return;
    }

    if (packages.length === 0 && searchQuery) {
      listEl.innerHTML = '';
      emptyEl?.classList.add('hidden');
      noResultsEl?.classList.remove('hidden');
      return;
    }

    emptyEl?.classList.add('hidden');
    noResultsEl?.classList.add('hidden');

    // Render packages
    const activeId = getActivePackageId();
    listEl.innerHTML = packages.map(pkg => {
      const summary = getPackageSummary(pkg);
      const isActive = pkg.id === activeId;
      return `
        <div class="bg-white dark:bg-slate-800 rounded-lg border ${isActive ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-200 dark:border-slate-700'} p-3">
          <div class="flex justify-between items-start mb-2">
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white truncate">${this.escapeHtml(pkg.name)} ${isActive ? '<span class="text-teal-600 text-xs">● Active</span>' : ''}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                ${summary.systemSize} • ${summary.priceTotal} • ${summary.pricePerWatt}
              </div>
            </div>
          </div>
          ${pkg.tags?.length > 0 ? `
            <div class="flex flex-wrap gap-1 mb-2">
              ${pkg.tags.slice(0, 4).map(tag => `
                <span class="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded">${this.escapeHtml(tag)}</span>
              `).join('')}
              ${pkg.tags.length > 4 ? `<span class="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 text-xs rounded">+${pkg.tags.length - 4}</span>` : ''}
            </div>
          ` : ''}
          <div class="flex justify-between items-center text-xs text-gray-400">
            <span>Added ${summary.dateAdded}</span>
            <div class="flex gap-1">
              <button data-package-view="${pkg.id}" class="px-2 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded transition">View</button>
              <button data-package-edit="${pkg.id}" class="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition">Edit</button>
              <button data-package-delete="${pkg.id}" class="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition">Del</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render package detail view
   */
  renderPackageDetail() {
    const contentEl = document.getElementById('detailContent');
    if (!contentEl || !this.currentPackageId) return;

    const pkg = getPackageById(this.currentPackageId);
    if (!pkg) {
      contentEl.innerHTML = '<p class="text-gray-500 text-center">Package not found</p>';
      return;
    }

    // Calculate what will be applied
    const pricePerKW = pkg.systemSizeKw > 0 ? Math.round(pkg.priceTotal / pkg.systemSizeKw) : 0;

    contentEl.innerHTML = `
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${this.escapeHtml(pkg.name)}</h3>
          ${pkg.panelBrand ? `<p class="text-sm text-gray-600 dark:text-gray-400">${this.escapeHtml(pkg.panelBrand)} ${pkg.panelModel ? `- ${this.escapeHtml(pkg.panelModel)}` : ''}</p>` : ''}
        </div>

        <!-- What Gets Applied Box -->
        <div class="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 p-3 rounded-lg">
          <h4 class="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-2">✅ When Applied, Fills These Fields:</h4>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Section 2 → Solar Capacity:</span>
              <span class="font-medium text-gray-900 dark:text-white">${pkg.systemSizeKw} kW</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Section 2 → Solar Price/kW:</span>
              <span class="font-medium text-teal-700 dark:text-teal-400">₱${pricePerKW.toLocaleString()}/kW</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Section 2 → Misc Costs:</span>
              <span class="font-medium text-gray-900 dark:text-white">₱0 (all-in price)</span>
            </div>
            ${pkg.hasFinancing ? `
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Section 4 → Loan Principal:</span>
                <span class="font-medium text-orange-700 dark:text-orange-400">₱${(pkg.loanPrincipal || 0).toLocaleString()}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg space-y-2">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">System Size</div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">${pkg.systemSizeKw} kWp</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Total Price</div>
              <div class="text-lg font-semibold text-teal-600">₱${pkg.priceTotal.toLocaleString()}</div>
            </div>
          </div>
          <div class="pt-2 border-t border-gray-200 dark:border-slate-600">
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500 dark:text-gray-400">Price per kW:</span>
              <span class="text-sm font-bold text-teal-700 dark:text-teal-400">
                ₱${pkg.systemSizeKw > 0 ? Math.round(pkg.priceTotal / pkg.systemSizeKw).toLocaleString() : 0}/kW
              </span>
            </div>
            <div class="text-xs text-gray-400 mt-1">This is what populates Section 2 "Solar Price/kW"</div>
          </div>
          ${pkg.estimatedKwhPerYear ? `
            <div class="pt-2 border-t border-gray-200 dark:border-slate-600">
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500 dark:text-gray-400">Est. Annual Generation:</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">${pkg.estimatedKwhPerYear.toLocaleString()} kWh/yr</span>
              </div>
            </div>
          ` : ''}
        </div>

        ${pkg.supplier ? `
          <div>
            <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Supplier</h4>
            <div class="space-y-1 text-sm">
              <p class="text-gray-900 dark:text-white font-medium">${this.escapeHtml(pkg.supplier)}</p>
              ${pkg.contactName ? `<p class="text-gray-600 dark:text-gray-400">${this.escapeHtml(pkg.contactName)}</p>` : ''}
              ${pkg.contactEmail ? `<p><a href="mailto:${this.escapeHtml(pkg.contactEmail)}" class="text-teal-600 hover:underline">${this.escapeHtml(pkg.contactEmail)}</a></p>` : ''}
              ${pkg.contactPhone ? `<p><a href="tel:${this.escapeHtml(pkg.contactPhone)}" class="text-teal-600 hover:underline">${this.escapeHtml(pkg.contactPhone)}</a></p>` : ''}
            </div>
          </div>
        ` : ''}

        <div class="grid grid-cols-2 gap-4 text-sm">
          ${pkg.warrantyYears ? `
            <div>
              <span class="text-gray-500 dark:text-gray-400">Warranty:</span>
              <span class="text-gray-900 dark:text-white">${pkg.warrantyYears} years</span>
            </div>
          ` : ''}
          <div>
            <span class="text-gray-500 dark:text-gray-400">Added:</span>
            <span class="text-gray-900 dark:text-white">${pkg.dateAdded}</span>
          </div>
        </div>

        ${pkg.sourceUrl ? `
          <div>
            <a href="${this.escapeHtml(pkg.sourceUrl)}" target="_blank" rel="noopener" class="text-sm text-teal-600 hover:underline break-all">↗ View Source
            </a>
          </div>
        ` : ''}

        ${pkg.notes ? `
          <div>
            <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Notes</h4>
            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${this.escapeHtml(pkg.notes)}</p>
          </div>
        ` : ''}

        ${pkg.tags?.length > 0 ? `
          <div>
            <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tags</h4>
            <div class="flex flex-wrap gap-2">
              ${pkg.tags.map(tag => `
                <span class="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs rounded">${this.escapeHtml(tag)}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${pkg.hasFinancing ? `
          <div class="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
            <h4 class="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wide mb-2">🏦 Financing Available</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Loan Amount:</span>
                <span class="text-gray-900 dark:text-white font-medium">₱${(pkg.loanPrincipal || 0).toLocaleString()}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Down Payment:</span>
                <span class="text-gray-900 dark:text-white font-medium">₱${(pkg.downPayment || 0).toLocaleString()}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Interest Rate:</span>
                <span class="text-gray-900 dark:text-white font-medium">${pkg.annualInterestRate || 0}%</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Term:</span>
                <span class="text-gray-900 dark:text-white font-medium">${pkg.loanTermMonths || 60} months</span>
              </div>
            </div>
            <div class="mt-2 pt-2 border-t border-orange-200 dark:border-orange-800">
              <span class="text-orange-700 dark:text-orange-400 font-medium">Est. Monthly Payment: ₱${this.calculateMonthlyPayment(pkg.loanPrincipal, pkg.annualInterestRate, pkg.loanTermMonths).toLocaleString()}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render package form (add/edit)
   */
  renderPackageForm() {
    const isEdit = !!this.currentPackageId;
    const pkg = isEdit ? getPackageById(this.currentPackageId) : null;

    // Set form values
    document.getElementById('pkgId').value = pkg?.id || '';
    document.getElementById('pkgName').value = pkg?.name || '';
    document.getElementById('pkgPanelBrand').value = pkg?.panelBrand || '';
    document.getElementById('pkgPanelModel').value = pkg?.panelModel || '';
    document.getElementById('pkgWattPeak').value = pkg?.wattPeak || '';
    document.getElementById('pkgSystemSizeKw').value = pkg?.systemSizeKw || '';
    document.getElementById('pkgPriceTotal').value = pkg?.priceTotal || '';
    document.getElementById('pkgEstimatedKwh').value = pkg?.estimatedKwhPerYear || '';
    document.getElementById('pkgSupplier').value = pkg?.supplier || '';
    document.getElementById('pkgContactName').value = pkg?.contactName || '';
    document.getElementById('pkgContactEmail').value = pkg?.contactEmail || '';
    document.getElementById('pkgContactPhone').value = pkg?.contactPhone || '';
    document.getElementById('pkgWarranty').value = pkg?.warrantyYears || '';
    document.getElementById('pkgSourceUrl').value = pkg?.sourceUrl || '';
    document.getElementById('pkgNotes').value = pkg?.notes || '';

    // Financing
    const hasFinancingEl = document.getElementById('pkgHasFinancing');
    if (hasFinancingEl) {
      hasFinancingEl.checked = pkg?.hasFinancing || false;
    }
    const loanPrincipalEl = document.getElementById('pkgLoanPrincipal');
    if (loanPrincipalEl) loanPrincipalEl.value = pkg?.loanPrincipal || '';
    const downPaymentEl = document.getElementById('pkgDownPayment');
    if (downPaymentEl) downPaymentEl.value = pkg?.downPayment || '';
    const interestRateEl = document.getElementById('pkgInterestRate');
    if (interestRateEl) interestRateEl.value = pkg?.annualInterestRate || '';
    const loanTermEl = document.getElementById('pkgLoanTerm');
    if (loanTermEl) loanTermEl.value = pkg?.loanTermMonths || '';
    this.toggleFinancingFields();
    this.updatePackageMonthlyPayment();

    // Tags
    this.packageTags = pkg?.tags ? [...pkg.tags] : [];
    this.renderTags();

    // Update computed fields
    this.updatePricePerWatt();
    this.updateNotesCount();

    // Clear validation errors
    this.clearFormErrors();

    this.packageFormDirty = false;
  }

  /**
   * Start adding a new package
   */
  startAddPackage() {
    this.currentPackageId = null;
    this.packageTags = [];
    this.switchPackageView('form');
  }

  /**
   * Edit the current package
   */
  editCurrentPackage() {
    if (!this.currentPackageId) return;
    this.switchPackageView('form');
  }

  /**
   * Delete a package
   */
  deletePackage(id) {
    const pkg = getPackageById(id);
    if (!pkg) return;

    if (!confirm(`Delete "${pkg.name}"? This cannot be undone.`)) return;

    if (deletePackage(id)) {
      this.renderPackageList();
      this.updatePackageBanner();
    }
  }

  /**
   * Handle package form submission
   */
  handlePackageFormSubmit(e) {
    e.preventDefault();

    const pkgData = {
      id: document.getElementById('pkgId').value || undefined,
      name: document.getElementById('pkgName').value,
      panelBrand: document.getElementById('pkgPanelBrand').value,
      panelModel: document.getElementById('pkgPanelModel').value,
      wattPeak: document.getElementById('pkgWattPeak').value,
      systemSizeKw: document.getElementById('pkgSystemSizeKw').value,
      priceTotal: document.getElementById('pkgPriceTotal').value,
      estimatedKwhPerYear: document.getElementById('pkgEstimatedKwh').value,
      supplier: document.getElementById('pkgSupplier').value,
      contactName: document.getElementById('pkgContactName').value,
      contactEmail: document.getElementById('pkgContactEmail').value,
      contactPhone: document.getElementById('pkgContactPhone').value,
      warrantyYears: document.getElementById('pkgWarranty').value,
      sourceUrl: document.getElementById('pkgSourceUrl').value,
      notes: document.getElementById('pkgNotes').value,
      tags: this.packageTags,
      hasFinancing: document.getElementById('pkgHasFinancing').checked,
      loanPrincipal: document.getElementById('pkgLoanPrincipal').value,
      downPayment: document.getElementById('pkgDownPayment').value,
      annualInterestRate: document.getElementById('pkgInterestRate').value,
      loanTermMonths: document.getElementById('pkgLoanTerm').value
    };

    // Validate
    const validation = validatePackage(pkgData);
    if (!validation.isValid) {
      this.showFormErrors(validation.errors);
      return;
    }

    // Check for duplicate name (warning only)
    const isEdit = !!pkgData.id;
    if (packageNameExists(pkgData.name, isEdit ? pkgData.id : null)) {
      document.getElementById('pkgNameWarning')?.classList.remove('hidden');
    } else {
      document.getElementById('pkgNameWarning')?.classList.add('hidden');
    }

    try {
      const saved = savePackage(pkgData);
      this.currentPackageId = saved.id;
      this.packageFormDirty = false;
      this.switchPackageView('detail');
    } catch (e) {
      alert('Failed to save: ' + e.message);
    }
  }

  /**
   * Handle form cancel with unsaved changes check
   */
  handlePackageFormCancel() {
    if (this.packageFormDirty) {
      if (!confirm('Discard unsaved changes?')) return;
    }

    if (this.currentPackageId) {
      this.switchPackageView('detail');
    } else {
      this.switchPackageView('list');
    }
  }

  /**
   * Apply current package to calculator
   */
  applyCurrentPackage() {
    if (!this.currentPackageId) return;

    // Create applyPreset function that updates state
    const applyPreset = (values) => {
      if (values.solarCapacityKW !== undefined) {
        this.state.inputs.solarCapacityKW = values.solarCapacityKW;
      }
      if (values.solarPricePerKW !== undefined) {
        this.state.inputs.solarPricePerKW = values.solarPricePerKW;
      }
      if (values.miscInfraCosts !== undefined) {
        this.state.inputs.miscInfraCosts = values.miscInfraCosts;
      }
      if (values.loanPrincipal !== undefined) {
        this.state.inputs.loanPrincipal = values.loanPrincipal;
      }
      if (values.annualInterestRate !== undefined) {
        this.state.inputs.annualInterestRate = values.annualInterestRate;
      }
      if (values.loanTermMonths !== undefined) {
        this.state.inputs.loanTermMonths = values.loanTermMonths;
      }
    };

    const result = applyPackageToCalculator(this.currentPackageId, applyPreset);

    if (result.success) {
      this.closePackageManager();
      this.updatePackageBanner();

      // Scroll to Section 2 and highlight
      const section2 = document.querySelectorAll('section')[1];
      if (section2) {
        section2.scrollIntoView({ behavior: 'smooth', block: 'start' });
        section2.style.transition = 'box-shadow 0.3s';
        section2.style.boxShadow = '0 0 0 4px rgba(20, 184, 166, 0.5)';
        setTimeout(() => {
          section2.style.boxShadow = '';
        }, 1500);
      }
    } else {
      alert('Failed to apply package: ' + result.error);
    }
  }

  /**
   * Update package banner visibility
   * @param {boolean} isModified - Whether the package has been modified
   */
  updatePackageBanner(isModified = false) {
    const banner = document.getElementById('packageBanner');
    const bannerText = document.getElementById('packageBannerText');
    
    if (!banner || !bannerText) return;

    const activeId = getActivePackageId();
    if (!activeId) {
      banner.classList.add('hidden');
      return;
    }

    const pkg = getPackageById(activeId);
    if (!pkg) {
      // Package was deleted
      bannerText.innerHTML = `
        <span class="opacity-80">Package no longer exists — values from saved spec are loaded.</span>
      `;
      banner.classList.remove('hidden');
      return;
    }

    const kwhText = pkg.estimatedKwhPerYear 
      ? `Supplier est: ${pkg.estimatedKwhPerYear.toLocaleString()} kWh/yr. ` 
      : '';

    const modifiedText = isModified ? ' <span class="opacity-80">(modified)</span>' : '';

    // Build financing info if package has financing
    let financingText = '';
    if (pkg.hasFinancing && pkg.loanPrincipal > 0) {
      const monthlyPayment = this.calculateMonthlyPayment(
        pkg.loanPrincipal, 
        pkg.annualInterestRate, 
        pkg.loanTermMonths
      );
      
      // Get current monthly savings from state
      const monthlySavings = this.state.results?.monthlySavings || 0;
      const netCashFlow = monthlySavings - monthlyPayment;
      
      const cashFlowIcon = netCashFlow >= 0 ? '✅' : '⚠️';
      const cashFlowColor = netCashFlow >= 0 ? 'text-green-300' : 'text-yellow-300';
      
      financingText = `
        <span class="block mt-1 text-sm">
          🏦 Financing: ₱${monthlyPayment.toLocaleString()}/mo @ ${pkg.annualInterestRate}% 
          <span class="${cashFlowColor}">${cashFlowIcon} Net: ₱${netCashFlow.toLocaleString()}/mo</span>
        </span>
      `;
    }

    bannerText.innerHTML = `
      <strong>"${this.escapeHtml(pkg.name)}"</strong>${modifiedText} applied. 
      ${kwhText}Misc costs set to ₱0 — adjust if needed.
      ${financingText}
    `;
    banner.classList.remove('hidden');
  }

  /**
   * Update price per kW display (shown in package form)
   */
  updatePricePerWatt() {
    const price = parseFloat(document.getElementById('pkgPriceTotal')?.value) || 0;
    const size = parseFloat(document.getElementById('pkgSystemSizeKw')?.value) || 0;
    
    const display = document.getElementById('pkgPricePerWattDisplay');
    if (display) {
      if (size > 0) {
        const pricePerKW = Math.round(price / size);
        display.value = `₱${pricePerKW.toLocaleString()}/kW`;
      } else {
        display.value = '—';
      }
    }
  }

  /**
   * Add a tag from input
   */
  addTagFromInput() {
    const input = document.getElementById('pkgTagsInput');
    if (!input) return;

    const value = input.value.trim();
    if (!value) return;

    // Split on commas
    const newTags = value.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
    
    for (const tag of newTags) {
      if (!this.packageTags.includes(tag) && this.packageTags.length < 20) {
        this.packageTags.push(tag);
      }
    }

    input.value = '';
    this.renderTags();
    this.packageFormDirty = true;
  }

  /**
   * Remove a tag
   */
  removeTag(tag) {
    this.packageTags = this.packageTags.filter(t => t !== tag);
    this.renderTags();
    this.packageFormDirty = true;
  }

  /**
   * Render tag pills
   */
  renderTags() {
    const container = document.getElementById('pkgTags');
    if (!container) return;

    container.innerHTML = this.packageTags.map(tag => `
      <span class="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-xs rounded">
        ${this.escapeHtml(tag)}
        <button type="button" onclick="window.app.removeTag('${tag}')" class="hover:text-teal-900 dark:hover:text-teal-100">×</button>
      </span>
    `).join('');
  }

  /**
   * Update notes character count
   */
  updateNotesCount() {
    const notes = document.getElementById('pkgNotes')?.value || '';
    const countEl = document.getElementById('pkgNotesCount');
    if (countEl) {
      countEl.textContent = `(${notes.length}/1000)`;
    }
  }

  /**
   * Show form validation errors
   */
  showFormErrors(errors) {
    this.clearFormErrors();
    
    for (const [field, message] of Object.entries(errors)) {
      const errorEl = document.getElementById(`pkg${field.charAt(0).toUpperCase() + field.slice(1)}Error`);
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
      }
    }
  }

  /**
   * Clear form errors
   */
  clearFormErrors() {
    document.querySelectorAll('[id$="Error"]').forEach(el => {
      if (el.id.startsWith('pkg')) {
        el.classList.add('hidden');
      }
    });
    document.getElementById('pkgNameWarning')?.classList.add('hidden');
  }

  /**
   * Export all packages as JSON
   */
  exportPackagesJson() {
    const data = exportPackagesAsJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `solar-packages-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export all packages as CSV
   */
  exportPackagesCsv() {
    const data = exportPackagesAsCsv();
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `solar-packages-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export single package as JSON
   */
  exportSinglePackage() {
    if (!this.currentPackageId) return;
    
    const pkg = getPackageById(this.currentPackageId);
    if (!pkg) return;

    const data = exportSinglePackageAsJson(pkg);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    const safeName = pkg.name.replace(/[\\/:*?"<>|]/g, '-').substring(0, 60);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `package-${safeName}-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy package JSON to clipboard
   */
  async copyPackageJson() {
    if (!this.currentPackageId) return;
    
    const pkg = getPackageById(this.currentPackageId);
    if (!pkg) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(pkg, null, 2));
      const feedback = document.getElementById('copyFeedbackPackage');
      if (feedback) {
        feedback.classList.remove('hidden');
        setTimeout(() => feedback.classList.add('hidden'), 2000);
      }
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  }

  /**
   * Handle import packages
   */
  async handleImportPackages(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      let result;
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        result = importPackagesFromCsv(e.target.result);
      } else {
        result = importPackagesFromJson(e.target.result);
      }

      if (result.success) {
        let message = `Imported ${result.new} new, updated ${result.updated} existing.`;
        if (result.skippedRows > 0) {
          message += ` Skipped ${result.skippedRows} invalid rows.`;
        }
        alert(message);
        this.renderPackageList();
      } else {
        alert('Import failed: ' + (result.error || 'Unknown error'));
      }
    };
    reader.readAsText(file);

    // Reset file input
    document.getElementById('importPackagesBtn').value = '';
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Toggle financing fields visibility based on checkbox
   */
  toggleFinancingFields() {
    const checkbox = document.getElementById('pkgHasFinancing');
    const fields = document.getElementById('pkgFinancingFields');
    
    if (checkbox && fields) {
      const isEnabled = checkbox.checked;
      fields.classList.toggle('opacity-50', !isEnabled);
      fields.classList.toggle('pointer-events-none', !isEnabled);
      
      if (isEnabled) {
        // Auto-calculate loan principal as 50% of total price if empty
        const loanInput = document.getElementById('pkgLoanPrincipal');
        const priceInput = document.getElementById('pkgPriceTotal');
        if (loanInput && !loanInput.value && priceInput && priceInput.value) {
          const halfPrice = Math.round(parseFloat(priceInput.value) / 2 / 10000) * 10000;
          loanInput.value = halfPrice;
          this.updatePackageMonthlyPayment();
        }
      }
    }
  }

  /**
   * Calculate and display monthly payment for package financing
   */
  updatePackageMonthlyPayment() {
    const principal = parseFloat(document.getElementById('pkgLoanPrincipal')?.value) || 0;
    const rate = parseFloat(document.getElementById('pkgInterestRate')?.value) || 0;
    const months = parseInt(document.getElementById('pkgLoanTerm')?.value) || 0;
    
    const monthlyPayment = this.calculateMonthlyPayment(principal, rate, months);
    
    const display = document.getElementById('pkgMonthlyPayment');
    if (display) {
      display.textContent = `₱${monthlyPayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
  }

  /**
   * Calculate monthly amortization payment
   * @param {number} principal - Loan principal
   * @param {number} annualRate - Annual interest rate (%)
   * @param {number} months - Loan term in months
   * @returns {number} Monthly payment
   */
  calculateMonthlyPayment(principal, annualRate, months) {
    if (!principal || !months) return 0;
    
    const monthlyRate = (annualRate || 0) / 100 / 12;
    
    if (monthlyRate === 0) {
      return principal / months;
    }
    
    const payment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
      (Math.pow(1 + monthlyRate, months) - 1);
    
    return Math.round(payment * 100) / 100;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SolarCalcApp();
});

// Export for testing
export { SolarCalcApp };
export default SolarCalcApp;
