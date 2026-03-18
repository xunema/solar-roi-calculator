/**
 * packages.js - Solar Package Database Manager (Milestone 8)
 * Handles CRUD, import/export, and preset application for solar supplier quotes
 */

import { defaultInputs } from './state.js';

const PACKAGES_STORAGE_KEY = 'solar_packages';
const ACTIVE_PACKAGE_KEY = 'solar_active_package';

// Sample seed data for first-time users
const SEED_PACKAGES = [
  {
    id: 'pkg_seed_001',
    name: 'Jinko 5kW Residential — Cash',
    panelBrand: 'Jinko Solar',
    panelModel: 'Tiger Neo N-Type 400W',
    wattPeak: 400,
    systemSizeKw: 5,
    priceTotal: 400000,
    pricePerWatt: 80,
    estimatedKwhPerYear: 7300,
    supplier: 'SunBright PH',
    contactName: 'Maria Santos',
    contactEmail: 'maria@sunbrightph.com',
    contactPhone: '+63 912 345 6789',
    warrantyYears: 25,
    dateAdded: new Date().toISOString().split('T')[0],
    sourceUrl: '',
    notes: 'Cash purchase. Includes hybrid inverter and mounting. Negotiated 5% discount.',
    tags: ['residential', 'cebu', 'mono-perc', 'tier-1', 'cash'],
    // No financing - zeros out loan fields when applied
    hasFinancing: false,
    loanPrincipal: 0,
    annualInterestRate: 0,
    loanTermMonths: 60,
    downPayment: 0,
    // No battery - zeros out battery fields when applied
    batteryCapacityKWh: 0,
    batteryPricePerKWh: 0,
    pvForBatteryKW: 0,
    nighttimeLoadKW: 0,
    nighttimeDurationHours: 0
  },
  {
    id: 'pkg_seed_002',
    name: 'LONGi 100kW Commercial — With Financing',
    panelBrand: 'LONGi Solar',
    panelModel: 'Hi-MO 6 580W',
    wattPeak: 580,
    systemSizeKw: 100,
    priceTotal: 5000000,
    pricePerWatt: 50,
    estimatedKwhPerYear: 146000,
    supplier: 'SolarEdge Philippines',
    contactName: 'Juan dela Cruz',
    contactEmail: 'juan@solaredgeph.com',
    contactPhone: '+63 917 000 1234',
    warrantyYears: 25,
    dateAdded: new Date().toISOString().split('T')[0],
    sourceUrl: '',
    notes: 'Commercial rooftop with net metering. 60% financing at 10% over 5 years.',
    tags: ['commercial', 'metro-manila', 'mono-perc', 'volume', 'financing'],
    // With financing - populates loan fields
    hasFinancing: true,
    loanPrincipal: 3000000,
    annualInterestRate: 10,
    loanTermMonths: 60,
    downPayment: 2000000,
    // No battery - zeros out battery fields when applied
    batteryCapacityKWh: 0,
    batteryPricePerKWh: 0,
    pvForBatteryKW: 0,
    nighttimeLoadKW: 0,
    nighttimeDurationHours: 0
  }
];

// Module-level active package tracking
let activePackageId = null;

/**
 * Initialize packages module - seed data if needed
 */
export function initPackages() {
  const existing = localStorage.getItem(PACKAGES_STORAGE_KEY);
  if (!existing || existing === '[]') {
    // First time - seed with sample packages
    try {
      localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(SEED_PACKAGES));
    } catch (e) {
      console.warn('Failed to seed packages:', e);
    }
  }
  
  // Load active package ID from storage
  try {
    const stored = localStorage.getItem(ACTIVE_PACKAGE_KEY);
    if (stored) {
      activePackageId = stored;
    }
  } catch (e) {
    console.warn('Failed to load active package:', e);
  }
}

/**
 * Load all packages from localStorage
 * @returns {Array} Array of package objects
 */
export function loadPackages() {
  try {
    const stored = localStorage.getItem(PACKAGES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load packages:', e);
    return [];
  }
}

/**
 * Save all packages to localStorage
 * @param {Array} packages - Array of package objects
 */
function saveAllPackages(packages) {
  try {
    localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      throw new Error('Storage full — unable to save. Free up space by deleting unused packages.');
    }
    console.error('Failed to save packages:', e);
    throw e;
  }
}

/**
 * Generate a unique package ID
 */
function generateId() {
  return `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Normalize tags (lowercase, trim, deduplicate)
 * @param {string[]} tags - Array of tag strings
 * @returns {string[]} Normalized tags
 */
function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map(t => t.toLowerCase().trim()).filter(t => t.length > 0))];
}

/**
 * Calculate price per watt
 * @param {number} priceTotal - Total price in pesos
 * @param {number} systemSizeKw - System size in kW
 * @returns {number|null} Price per watt or null
 */
function calculatePricePerWatt(priceTotal, systemSizeKw) {
  if (!systemSizeKw || systemSizeKw <= 0) return null;
  return priceTotal / (systemSizeKw * 1000);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email) return true; // Empty is valid
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
function isValidUrl(url) {
  if (!url) return true; // Empty is valid
  return /^https?:\/\/.+/i.test(url);
}

/**
 * Sanitize filename for export
 * @param {string} name - Package name
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(name) {
  return name
    .replace(/[\\/:*?"<>|]/g, '-')
    .substring(0, 60);
}

/**
 * Validate a package object
 * @param {Object} pkg - Package to validate
 * @returns {Object} Validation result with errors
 */
export function validatePackage(pkg) {
  const errors = {};
  
  // Required fields
  if (!pkg.name || pkg.name.trim().length === 0) {
    errors.name = 'Package name is required';
  } else if (pkg.name.trim().length > 100) {
    errors.name = 'Name must be 100 characters or less';
  }
  
  if (pkg.systemSizeKw === undefined || pkg.systemSizeKw === null || pkg.systemSizeKw === '') {
    errors.systemSizeKw = 'System size is required';
  } else if (parseFloat(pkg.systemSizeKw) <= 0) {
    errors.systemSizeKw = 'System size must be greater than 0';
  } else if (parseFloat(pkg.systemSizeKw) > 100000) {
    errors.systemSizeKw = 'System size cannot exceed 100,000 kW';
  }
  
  if (pkg.priceTotal === undefined || pkg.priceTotal === null || pkg.priceTotal === '') {
    errors.priceTotal = 'Total price is required';
  } else if (parseFloat(pkg.priceTotal) <= 0) {
    errors.priceTotal = 'Total price must be greater than 0';
  }
  
  // Optional field validations
  if (pkg.contactEmail && !isValidEmail(pkg.contactEmail)) {
    errors.contactEmail = 'Invalid email format';
  }
  
  if (pkg.sourceUrl && !isValidUrl(pkg.sourceUrl)) {
    errors.sourceUrl = 'URL must start with http:// or https://';
  }
  
  if (pkg.warrantyYears !== undefined && pkg.warrantyYears !== null && pkg.warrantyYears !== '') {
    const warranty = parseInt(pkg.warrantyYears);
    if (isNaN(warranty) || warranty < 0 || warranty > 50) {
      errors.warrantyYears = 'Warranty must be between 0 and 50 years';
    }
  }
  
  if (pkg.wattPeak !== undefined && pkg.wattPeak !== null && pkg.wattPeak !== '') {
    const wattPeak = parseFloat(pkg.wattPeak);
    if (isNaN(wattPeak) || wattPeak < 0 || wattPeak > 5000) {
      errors.wattPeak = 'Watt-peak must be between 0 and 5000W';
    }
  }
  
  if (pkg.notes && pkg.notes.length > 1000) {
    errors.notes = 'Notes must be 1000 characters or less';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Check if package name already exists (case-insensitive)
 * @param {string} name - Name to check
 * @param {string} excludeId - Optional ID to exclude (for edits)
 * @returns {boolean}
 */
export function packageNameExists(name, excludeId = null) {
  const packages = loadPackages();
  return packages.some(p => 
    p.name.toLowerCase() === name.trim().toLowerCase() && 
    p.id !== excludeId
  );
}

/**
 * Save a package (create new or update existing)
 * @param {Object} pkg - Package object to save
 * @returns {Object} Saved package
 * @throws {Error} If validation fails or storage is full
 */
export function savePackage(pkg) {
  const packages = loadPackages();
  
  const isNew = !pkg.id;
  const id = pkg.id || generateId();
  
  // Calculate price per watt
  const pricePerWatt = calculatePricePerWatt(
    parseFloat(pkg.priceTotal) || 0,
    parseFloat(pkg.systemSizeKw) || 0
  );
  
  const packageToSave = {
    id,
    name: (pkg.name || '').trim(),
    panelBrand: (pkg.panelBrand || '').trim(),
    panelModel: (pkg.panelModel || '').trim(),
    wattPeak: parseFloat(pkg.wattPeak) || 0,
    systemSizeKw: parseFloat(pkg.systemSizeKw) || 0,
    priceTotal: parseFloat(pkg.priceTotal) || 0,
    pricePerWatt: pricePerWatt || 0,
    estimatedKwhPerYear: parseFloat(pkg.estimatedKwhPerYear) || 0,
    supplier: (pkg.supplier || '').trim(),
    contactName: (pkg.contactName || '').trim(),
    contactEmail: (pkg.contactEmail || '').trim(),
    contactPhone: (pkg.contactPhone || '').trim(),
    warrantyYears: parseInt(pkg.warrantyYears) || 0,
    dateAdded: pkg.dateAdded || new Date().toISOString().split('T')[0],
    sourceUrl: (pkg.sourceUrl || '').trim(),
    notes: (pkg.notes || '').trim(),
    tags: normalizeTags(pkg.tags || []),
    // Battery fields
    batteryCapacityKWh: parseFloat(pkg.batteryCapacityKWh) || 0,
    batteryPricePerKWh: parseFloat(pkg.batteryPricePerKWh) || 6000,
    pvForBatteryKW: parseFloat(pkg.pvForBatteryKW) || 0,
    nighttimeLoadKW: parseFloat(pkg.nighttimeLoadKW) || 0,
    nighttimeDurationHours: parseFloat(pkg.nighttimeDurationHours) || 0,
    // Financing fields
    hasFinancing: Boolean(pkg.hasFinancing),
    loanPrincipal: parseFloat(pkg.loanPrincipal) || 0,
    annualInterestRate: parseFloat(pkg.annualInterestRate) || 0,
    loanTermMonths: parseInt(pkg.loanTermMonths) || 60,
    downPayment: parseFloat(pkg.downPayment) || 0
  };
  
  if (isNew) {
    packages.push(packageToSave);
  } else {
    const index = packages.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Package not found');
    }
    packages[index] = packageToSave;
  }
  
  saveAllPackages(packages);
  return packageToSave;
}

/**
 * Delete a package by ID
 * @param {string} id - Package ID to delete
 * @returns {boolean} Success status
 */
export function deletePackage(id) {
  const packages = loadPackages();
  const filtered = packages.filter(p => p.id !== id);
  
  if (filtered.length === packages.length) {
    return false;
  }
  
  saveAllPackages(filtered);
  
  // If this was the active package, dismiss the banner
  if (activePackageId === id) {
    dismissActiveBanner();
  }
  
  return true;
}

/**
 * Get a single package by ID
 * @param {string} id - Package ID
 * @returns {Object|null} Package object or null
 */
export function getPackageById(id) {
  const packages = loadPackages();
  return packages.find(p => p.id === id) || null;
}

/**
 * Get the currently active package ID
 * @returns {string|null}
 */
export function getActivePackageId() {
  return activePackageId;
}

/**
 * Set the active package ID
 * @param {string|null} id - Package ID or null
 */
export function setActivePackageId(id) {
  activePackageId = id;
  if (id) {
    try {
      localStorage.setItem(ACTIVE_PACKAGE_KEY, id);
    } catch (e) {
      console.warn('Failed to save active package:', e);
    }
  } else {
    try {
      localStorage.removeItem(ACTIVE_PACKAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear active package:', e);
    }
  }
}

/**
 * Dismiss the active package banner
 */
export function dismissActiveBanner() {
  setActivePackageId(null);
}

/**
 * Apply a package to the calculator
 * @param {string} id - Package ID to apply
 * @param {Function} applyPreset - Function to apply preset values
 * @returns {Object} Result with success status and package name
 */
/**
 * Package application presets - defines complete calculator state
 */
export const PACKAGE_PRESETS = {
  // Solar only - zeros out battery and financing
  solarOnly: {
    batteryCapacityKWh: 0,
    pvForBatteryKW: 0,
    nighttimeLoadKW: 0,
    nighttimeDurationHours: 0,
    loanPrincipal: 0,
    annualInterestRate: 0
  },
  // Solar + Battery - zeros out financing
  solarWithBattery: {
    loanPrincipal: 0,
    annualInterestRate: 0
  },
  // Solar + Financing - zeros out battery
  solarWithFinancing: {
    batteryCapacityKWh: 0,
    pvForBatteryKW: 0,
    nighttimeLoadKW: 0,
    nighttimeDurationHours: 0
  },
  // Complete system - all fields populated
  complete: {}
};

export function applyPackageToCalculator(id, applyPreset) {
  const pkg = getPackageById(id);
  if (!pkg) {
    return { success: false, error: 'Package not found' };
  }
  
  // Calculate derived values for the calculator
  const solarCapacityKW = pkg.systemSizeKw;
  const solarPricePerKW = pkg.systemSizeKw > 0 ? pkg.priceTotal / pkg.systemSizeKw : 0;
  
  // Determine which preset base to use
  const hasBattery = pkg.batteryCapacityKWh > 0;
  const hasFinancing = pkg.hasFinancing && pkg.loanPrincipal > 0;
  
  let basePreset = PACKAGE_PRESETS.solarOnly;
  if (hasBattery && hasFinancing) {
    basePreset = PACKAGE_PRESETS.complete;
  } else if (hasBattery) {
    basePreset = PACKAGE_PRESETS.solarWithBattery;
  } else if (hasFinancing) {
    basePreset = PACKAGE_PRESETS.solarWithFinancing;
  }
  
  // Build complete preset values starting from base
  const presetValues = {
    ...basePreset,
    solarCapacityKW,
    solarPricePerKW,
    miscInfraCosts: 0,  // Package priceTotal is all-in
    // Battery fields if present in package
    batteryCapacityKWh: pkg.batteryCapacityKWh || 0,
    batteryPricePerKWh: pkg.batteryPricePerKWh || 6000,
    pvForBatteryKW: pkg.pvForBatteryKW || 0,
    nighttimeLoadKW: pkg.nighttimeLoadKW || 0,
    nighttimeDurationHours: pkg.nighttimeDurationHours || 0
  };
  
  // Add financing values if package has financing
  if (hasFinancing) {
    presetValues.loanPrincipal = pkg.loanPrincipal;
    presetValues.annualInterestRate = pkg.annualInterestRate || 0;
    presetValues.loanTermMonths = pkg.loanTermMonths || 60;
  }
  
  // Apply to calculator using the same function as Quick Presets
  applyPreset(presetValues);
  
  // Set as active package
  setActivePackageId(id);
  
  return { 
    success: true, 
    name: pkg.name,
    estimatedKwhPerYear: pkg.estimatedKwhPerYear,
    hasFinancing: pkg.hasFinancing,
    loanPrincipal: pkg.loanPrincipal,
    annualInterestRate: pkg.annualInterestRate,
    loanTermMonths: pkg.loanTermMonths
  };
}

/**
 * Search and filter packages
 * @param {string} query - Search query (space-separated terms)
 * @param {Array} packages - Array of packages to search
 * @returns {Array} Filtered packages
 */
export function searchPackages(query, packages) {
  if (!query || !query.trim()) return packages;
  
  const terms = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
  if (terms.length === 0) return packages;
  
  return packages.filter(pkg => {
    const searchableText = [
      pkg.name,
      pkg.panelBrand,
      pkg.panelModel,
      pkg.supplier,
      ...(pkg.tags || [])
    ].join(' ').toLowerCase();
    
    // AND logic - all terms must match
    return terms.every(term => searchableText.includes(term));
  });
}

/**
 * Sort packages by various criteria
 * @param {Array} packages - Array of packages
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted packages
 */
export function sortPackages(packages, sortBy) {
  const sorted = [...packages];
  
  switch (sortBy) {
    case 'date':
      sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      break;
    case 'priceTotal':
      sorted.sort((a, b) => a.priceTotal - b.priceTotal);
      break;
    case 'pricePerWatt':
      sorted.sort((a, b) => (a.pricePerWatt || Infinity) - (b.pricePerWatt || Infinity));
      break;
    case 'kwhPerYear':
      sorted.sort((a, b) => (b.estimatedKwhPerYear || 0) - (a.estimatedKwhPerYear || 0));
      break;
    case 'systemSize':
      sorted.sort((a, b) => b.systemSizeKw - a.systemSizeKw);
      break;
    default:
      // Default to date
      sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  }
  
  return sorted;
}

/**
 * Export all packages as JSON
 * @returns {string} JSON string with UTF-8 BOM
 */
export function exportPackagesAsJson() {
  const packages = loadPackages();
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    packages: packages
  };
  
  // UTF-8 BOM for Excel compatibility
  return '\uFEFF' + JSON.stringify(data, null, 2);
}

/**
 * Export all packages as CSV
 * @returns {string} CSV string with UTF-8 BOM
 */
export function exportPackagesAsCsv() {
  const packages = loadPackages();
  
  const headers = [
    'id', 'name', 'panelBrand', 'panelModel', 'wattPeak', 'systemSizeKw', 
    'priceTotal', 'pricePerWatt', 'estimatedKwhPerYear', 'supplier', 
    'contactName', 'contactEmail', 'contactPhone', 'warrantyYears',
    'dateAdded', 'sourceUrl', 'notes', 'tags',
    'batteryCapacityKWh', 'batteryPricePerKWh', 'pvForBatteryKW', 'nighttimeLoadKW', 'nighttimeDurationHours',
    'hasFinancing', 'loanPrincipal', 'annualInterestRate', 'loanTermMonths', 'downPayment'
  ];
  
  const escapeCsv = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const rows = packages.map(pkg => [
    pkg.id,
    pkg.name,
    pkg.panelBrand,
    pkg.panelModel,
    pkg.wattPeak,
    pkg.systemSizeKw,
    pkg.priceTotal,
    pkg.pricePerWatt,
    pkg.estimatedKwhPerYear,
    pkg.supplier,
    pkg.contactName,
    pkg.contactEmail,
    pkg.contactPhone,
    pkg.warrantyYears,
    pkg.dateAdded,
    pkg.sourceUrl,
    pkg.notes,
    (pkg.tags || []).join('|'),
    pkg.batteryCapacityKWh,
    pkg.batteryPricePerKWh,
    pkg.pvForBatteryKW,
    pkg.nighttimeLoadKW,
    pkg.nighttimeDurationHours,
    pkg.hasFinancing ? '1' : '0',
    pkg.loanPrincipal,
    pkg.annualInterestRate,
    pkg.loanTermMonths,
    pkg.downPayment
  ].map(escapeCsv).join(','));
  
  // UTF-8 BOM for Excel compatibility
  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
}

/**
 * Export a single package as JSON
 * @param {Object} pkg - Package to export
 * @returns {string} JSON string with UTF-8 BOM
 */
export function exportSinglePackageAsJson(pkg) {
  return '\uFEFF' + JSON.stringify(pkg, null, 2);
}

/**
 * Import packages from JSON
 * @param {string} jsonString - JSON string to import
 * @returns {Object} Import result with counts
 */
export function importPackagesFromJson(jsonString) {
  let data;
  try {
    data = JSON.parse(jsonString);
  } catch (e) {
    return { success: false, error: 'Invalid file format' };
  }
  
  if (!data.packages || !Array.isArray(data.packages)) {
    return { success: false, error: 'Invalid file format' };
  }
  
  return mergePackages(data.packages);
}

/**
 * Import packages from CSV
 * @param {string} csvString - CSV string to import
 * @returns {Object} Import result with counts
 */
export function importPackagesFromCsv(csvString) {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) {
    return { success: false, error: 'No valid records found' };
  }
  
  const headers = parseCsvLine(lines[0]);
  const expectedHeaders = [
    'id', 'name', 'panelBrand', 'panelModel', 'wattPeak', 'systemSizeKw', 
    'priceTotal', 'pricePerWatt', 'estimatedKwhPerYear', 'supplier', 
    'contactName', 'contactEmail', 'contactPhone', 'warrantyYears',
    'dateAdded', 'sourceUrl', 'notes', 'tags'
  ];
  
  // Basic header validation
  if (!headers.includes('id') || !headers.includes('name')) {
    return { success: false, error: 'Invalid CSV format' };
  }
  
  const packages = [];
  let skippedRows = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    
    // Skip rows with wrong column count
    if (values.length !== headers.length) {
      skippedRows++;
      continue;
    }
    
    const pkg = {};
    headers.forEach((header, index) => {
      const value = values[index];
      
      switch (header) {
        case 'wattPeak':
        case 'systemSizeKw':
        case 'priceTotal':
        case 'pricePerWatt':
        case 'estimatedKwhPerYear':
          pkg[header] = parseFloat(value) || 0;
          break;
        case 'warrantyYears':
        case 'loanTermMonths':
          pkg[header] = parseInt(value) || 0;
          break;
        case 'hasFinancing':
          pkg[header] = value === '1' || value === 'true' || value === true;
          break;
        case 'loanPrincipal':
        case 'annualInterestRate':
        case 'downPayment':
        case 'batteryCapacityKWh':
        case 'batteryPricePerKWh':
        case 'pvForBatteryKW':
        case 'nighttimeLoadKW':
        case 'nighttimeDurationHours':
          pkg[header] = parseFloat(value) || 0;
          break;
        case 'tags':
          pkg[header] = value ? value.split('|').map(t => t.trim()).filter(t => t) : [];
          break;
        default:
          pkg[header] = value || '';
      }
    });
    
    packages.push(pkg);
  }
  
  const result = mergePackages(packages);
  result.skippedRows = skippedRows;
  return result;
}

/**
 * Parse a CSV line respecting quoted fields
 * @param {string} line - CSV line
 * @returns {string[]} Array of values
 */
function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

/**
 * Merge imported packages with existing ones
 * @param {Array} importedPackages - Packages to import
 * @returns {Object} Merge result
 */
function mergePackages(importedPackages) {
  const existingPackages = loadPackages();
  const existingIds = new Set(existingPackages.map(p => p.id));
  
  let newCount = 0;
  let updatedCount = 0;
  
  for (const imported of importedPackages) {
    // Normalize the imported package
    const normalized = {
      id: imported.id || generateId(),
      name: (imported.name || 'Unnamed Package').trim(),
      panelBrand: (imported.panelBrand || '').trim(),
      panelModel: (imported.panelModel || '').trim(),
      wattPeak: parseFloat(imported.wattPeak) || 0,
      systemSizeKw: parseFloat(imported.systemSizeKw) || 0,
      priceTotal: parseFloat(imported.priceTotal) || 0,
      pricePerWatt: calculatePricePerWart(imported.priceTotal, imported.systemSizeKw) || 0,
      estimatedKwhPerYear: parseFloat(imported.estimatedKwhPerYear) || 0,
      supplier: (imported.supplier || '').trim(),
      contactName: (imported.contactName || '').trim(),
      contactEmail: (imported.contactEmail || '').trim(),
      contactPhone: (imported.contactPhone || '').trim(),
      warrantyYears: parseInt(imported.warrantyYears) || 0,
      dateAdded: imported.dateAdded || new Date().toISOString().split('T')[0],
      sourceUrl: (imported.sourceUrl || '').trim(),
      notes: (imported.notes || '').trim(),
      tags: normalizeTags(imported.tags || []),
      // Battery fields
      batteryCapacityKWh: parseFloat(imported.batteryCapacityKWh) || 0,
      batteryPricePerKWh: parseFloat(imported.batteryPricePerKWh) || 6000,
      pvForBatteryKW: parseFloat(imported.pvForBatteryKW) || 0,
      nighttimeLoadKW: parseFloat(imported.nighttimeLoadKW) || 0,
      nighttimeDurationHours: parseFloat(imported.nighttimeDurationHours) || 0,
      // Financing fields
      hasFinancing: Boolean(imported.hasFinancing),
      loanPrincipal: parseFloat(imported.loanPrincipal) || 0,
      annualInterestRate: parseFloat(imported.annualInterestRate) || 0,
      loanTermMonths: parseInt(imported.loanTermMonths) || 60,
      downPayment: parseFloat(imported.downPayment) || 0
    };
    
    if (existingIds.has(normalized.id)) {
      // Update existing
      const index = existingPackages.findIndex(p => p.id === normalized.id);
      if (index !== -1) {
        existingPackages[index] = normalized;
        updatedCount++;
      }
    } else {
      // Add new
      existingPackages.push(normalized);
      existingIds.add(normalized.id);
      newCount++;
    }
  }
  
  saveAllPackages(existingPackages);
  
  return {
    success: true,
    new: newCount,
    updated: updatedCount,
    total: existingPackages.length
  };
}

// Fix typo in function name
function calculatePricePerWart(priceTotal, systemSizeKw) {
  return calculatePricePerWatt(priceTotal, systemSizeKw);
}

/**
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
export function formatPackageDate(dateStr) {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get formatted package summary for display
 * @param {Object} pkg - Package object
 * @returns {Object} Formatted summary
 */
export function getPackageSummary(pkg) {
  return {
    id: pkg.id,
    name: pkg.name,
    systemSize: `${pkg.systemSizeKw} kWp`,
    priceTotal: `₱${(pkg.priceTotal || 0).toLocaleString()}`,
    pricePerWatt: pkg.pricePerWatt ? `₱${pkg.pricePerWatt.toFixed(0)}/W` : '—',
    kwhPerYear: pkg.estimatedKwhPerYear ? `${pkg.estimatedKwhPerYear.toLocaleString()} kWh/yr` : '',
    tags: pkg.tags || [],
    dateAdded: formatPackageDate(pkg.dateAdded),
    isActive: pkg.id === activePackageId
  };
}

// Default export
export default {
  initPackages,
  loadPackages,
  savePackage,
  deletePackage,
  getPackageById,
  applyPackageToCalculator,
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
  formatPackageDate,
  getPackageSummary,
  normalizeTags
};
