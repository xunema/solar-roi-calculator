/**
 * specs.js - Save Specifications Manager (Milestone 7)
 * Handles named save/load/export/import of input configurations
 */

import { defaultInputs } from './state.js';

const SPECS_STORAGE_KEY = 'solarCalcSpecs';
const MAX_SPECS = 20;

/**
 * Generate a unique ID for a spec
 */
function generateId() {
  return `spec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all saved specs from localStorage
 * @returns {Array} Array of spec objects
 */
export function getAllSpecs() {
  try {
    const stored = localStorage.getItem(SPECS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load specs:', e);
    return [];
  }
}

/**
 * Save all specs to localStorage
 * @param {Array} specs - Array of spec objects
 */
export function saveAllSpecs(specs) {
  try {
    localStorage.setItem(SPECS_STORAGE_KEY, JSON.stringify(specs));
  } catch (e) {
    console.error('Failed to save specs:', e);
  }
}

/**
 * Create a new spec from current inputs
 * @param {string} name - Spec name
 * @param {Object} inputs - Current input values
 * @returns {Object|null} New spec object or null if limit reached
 */
export function createSpec(name, inputs) {
  const specs = getAllSpecs();
  
  if (specs.length >= MAX_SPECS) {
    return null;
  }
  
  const spec = {
    id: generateId(),
    name: name.trim(),
    savedAt: new Date().toISOString(),
    inputs: { ...inputs }
  };
  
  specs.push(spec);
  saveAllSpecs(specs);
  
  return spec;
}

/**
 * Update an existing spec with current inputs
 * @param {string} specId - Spec ID to update
 * @param {Object} inputs - Current input values
 * @returns {Object|null} Updated spec or null if not found
 */
export function updateSpec(specId, inputs) {
  const specs = getAllSpecs();
  const index = specs.findIndex(s => s.id === specId);
  
  if (index === -1) {
    return null;
  }
  
  specs[index] = {
    ...specs[index],
    savedAt: new Date().toISOString(),
    inputs: { ...inputs }
  };
  
  saveAllSpecs(specs);
  return specs[index];
}

/**
 * Delete a spec by ID
 * @param {string} specId - Spec ID to delete
 * @returns {boolean} Success status
 */
export function deleteSpec(specId) {
  const specs = getAllSpecs();
  const filtered = specs.filter(s => s.id !== specId);
  
  if (filtered.length === specs.length) {
    return false;
  }
  
  saveAllSpecs(filtered);
  return true;
}

/**
 * Rename a spec
 * @param {string} specId - Spec ID to rename
 * @param {string} newName - New name
 * @returns {Object|null} Updated spec or null if not found
 */
export function renameSpec(specId, newName) {
  const specs = getAllSpecs();
  const index = specs.findIndex(s => s.id === specId);
  
  if (index === -1) {
    return null;
  }
  
  specs[index].name = newName.trim();
  saveAllSpecs(specs);
  
  return specs[index];
}

/**
 * Get a spec by ID
 * @param {string} specId - Spec ID
 * @returns {Object|null} Spec object or null
 */
export function getSpecById(specId) {
  const specs = getAllSpecs();
  return specs.find(s => s.id === specId) || null;
}

/**
 * Check if spec name already exists
 * @param {string} name - Spec name to check
 * @returns {boolean}
 */
export function specNameExists(name) {
  const specs = getAllSpecs();
  return specs.some(s => s.name.toLowerCase() === name.trim().toLowerCase());
}

/**
 * Get count of saved specs
 * @returns {number}
 */
export function getSpecCount() {
  return getAllSpecs().length;
}

/**
 * Check if spec limit is reached
 * @returns {boolean}
 */
export function isSpecLimitReached() {
  return getSpecCount() >= MAX_SPECS;
}

/**
 * Export all specs as JSON file
 */
export function exportSpecs() {
  const specs = getAllSpecs();
  const date = new Date().toISOString().split('T')[0];
  const filename = `solarcalc-specs-${date}.json`;
  
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    specs: specs
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
 * Import specs from JSON file
 * @param {File} file - JSON file to import
 * @returns {Promise<{success: boolean, imported: number, skipped: number, error?: string}>}
 */
export async function importSpecs(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!data.specs || !Array.isArray(data.specs)) {
          resolve({ success: false, imported: 0, skipped: 0, error: 'Invalid file format' });
          return;
        }
        
        const existingSpecs = getAllSpecs();
        const existingNames = new Set(existingSpecs.map(s => s.name.toLowerCase()));
        
        let imported = 0;
        let skipped = 0;
        const newSpecs = [...existingSpecs];
        
        for (const spec of data.specs) {
          if (!spec.name || !spec.inputs) {
            skipped++;
            continue;
          }
          
          // Skip if name already exists
          if (existingNames.has(spec.name.toLowerCase())) {
            skipped++;
            continue;
          }
          
          // Check limit
          if (newSpecs.length >= MAX_SPECS) {
            skipped++;
            continue;
          }
          
          // Add with new ID and current timestamp
          newSpecs.push({
            id: generateId(),
            name: spec.name,
            savedAt: new Date().toISOString(),
            inputs: spec.inputs
          });
          
          existingNames.add(spec.name.toLowerCase());
          imported++;
        }
        
        saveAllSpecs(newSpecs);
        resolve({ success: true, imported, skipped });
        
      } catch (err) {
        resolve({ success: false, imported: 0, skipped: 0, error: 'Failed to parse file' });
      }
    };
    
    reader.onerror = () => {
      resolve({ success: false, imported: 0, skipped: 0, error: 'Failed to read file' });
    };
    
    reader.readAsText(file);
  });
}

/**
 * Format spec for display
 * @param {Object} spec - Spec object
 * @returns {Object} Formatted spec with display properties
 */
export function formatSpecForDisplay(spec) {
  const date = new Date(spec.savedAt);
  const dateStr = date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const inputs = spec.inputs;
  const solarCapacity = inputs.solarCapacityKW || 0;
  const hasBattery = (inputs.batteryCapacityKWh || 0) > 0;
  
  return {
    ...spec,
    displayDate: dateStr,
    summary: `${solarCapacity.toFixed(1)} kW solar${hasBattery ? ' + battery' : ''}`
  };
}

/**
 * Get formatted list of all specs
 * @returns {Array}
 */
export function getFormattedSpecs() {
  return getAllSpecs().map(formatSpecForDisplay);
}

export default {
  getAllSpecs,
  createSpec,
  updateSpec,
  deleteSpec,
  renameSpec,
  getSpecById,
  specNameExists,
  getSpecCount,
  isSpecLimitReached,
  exportSpecs,
  importSpecs,
  formatSpecForDisplay,
  getFormattedSpecs,
  MAX_SPECS
};
