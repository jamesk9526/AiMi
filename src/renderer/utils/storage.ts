/**
 * Storage and Encryption Utilities
 * 
 * This module handles local storage with optional encryption.
 * All sensitive data should be encrypted at rest.
 * 
 * TODO: Implement actual encryption (currently using base64 as placeholder)
 */

import { AppSettings, DEFAULT_APP_SETTINGS } from '../types/settings';

// ────────────────────────────────────────
// STORAGE KEYS
// ────────────────────────────────────────

const STORAGE_KEYS = {
  SETTINGS: 'aimi_settings',
  CUSTOM_PERSONAS: 'aimi_custom_personas',
  ENCRYPTION_ENABLED: 'aimi_encryption_enabled',
  AGE_VERIFIED: 'aimi_age_verified',
} as const;

// ────────────────────────────────────────
// ENCRYPTION (PLACEHOLDER)
// ────────────────────────────────────────

/**
 * Simple encryption (placeholder).
 * TODO: Implement proper encryption using Web Crypto API or similar.
 * 
 * For production, use:
 * - AES-GCM for encryption
 * - PBKDF2 for key derivation
 * - Secure random IV generation
 */
function encrypt(data: string): string {
  // Placeholder: In production, use proper encryption
  return btoa(data);
}

/**
 * Simple decryption (placeholder).
 * TODO: Implement proper decryption.
 */
function decrypt(encryptedData: string): string {
  // Placeholder: In production, use proper decryption
  try {
    return atob(encryptedData);
  } catch {
    return encryptedData; // Return as-is if not encrypted
  }
}

// ────────────────────────────────────────
// STORAGE FUNCTIONS
// ────────────────────────────────────────

/**
 * Saves data to localStorage with optional encryption.
 */
function saveToStorage<T>(key: string, data: T, shouldEncrypt: boolean = false): void {
  try {
    const jsonData = JSON.stringify(data);
    const dataToStore = shouldEncrypt ? encrypt(jsonData) : jsonData;
    localStorage.setItem(key, dataToStore);
  } catch (error) {
    console.error(`Failed to save to storage: ${key}`, error);
  }
}

/**
 * Loads data from localStorage with optional decryption.
 */
function loadFromStorage<T>(key: string, defaultValue: T, shouldDecrypt: boolean = false): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    
    const jsonData = shouldDecrypt ? decrypt(stored) : stored;
    return JSON.parse(jsonData) as T;
  } catch (error) {
    console.error(`Failed to load from storage: ${key}`, error);
    return defaultValue;
  }
}

/**
 * Removes data from localStorage.
 */
function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove from storage: ${key}`, error);
  }
}

// ────────────────────────────────────────
// SETTINGS MANAGEMENT
// ────────────────────────────────────────

/**
 * Loads application settings from storage.
 */
export function loadSettings(): AppSettings {
  const encryptionEnabled = loadFromStorage(
    STORAGE_KEYS.ENCRYPTION_ENABLED,
    false,
    false
  );
  
  return loadFromStorage(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_APP_SETTINGS,
    encryptionEnabled
  );
}

/**
 * Saves application settings to storage.
 */
export function saveSettings(settings: AppSettings): void {
  // Save encryption preference separately
  saveToStorage(STORAGE_KEYS.ENCRYPTION_ENABLED, settings.encryptionEnabled, false);
  
  // Save settings with encryption if enabled
  saveToStorage(STORAGE_KEYS.SETTINGS, settings, settings.encryptionEnabled);
}

/**
 * Resets settings to default.
 */
export function resetSettings(): void {
  removeFromStorage(STORAGE_KEYS.SETTINGS);
  removeFromStorage(STORAGE_KEYS.ENCRYPTION_ENABLED);
}

// ────────────────────────────────────────
// PERSONA STORAGE
// ────────────────────────────────────────

/**
 * Loads custom personas from storage.
 */
export function loadCustomPersonas(): any[] {
  const settings = loadSettings();
  return loadFromStorage(
    STORAGE_KEYS.CUSTOM_PERSONAS,
    [],
    settings.encryptionEnabled
  );
}

/**
 * Saves custom personas to storage.
 */
export function saveCustomPersonas(personas: any[]): void {
  const settings = loadSettings();
  saveToStorage(
    STORAGE_KEYS.CUSTOM_PERSONAS,
    personas,
    settings.encryptionEnabled
  );
}

// ────────────────────────────────────────
// AGE VERIFICATION
// ────────────────────────────────────────

/**
 * Checks if age verification is completed.
 */
export function isAgeVerified(): boolean {
  return loadFromStorage(STORAGE_KEYS.AGE_VERIFIED, false, false);
}

/**
 * Sets age verification status.
 */
export function setAgeVerified(verified: boolean): void {
  saveToStorage(STORAGE_KEYS.AGE_VERIFIED, verified, false);
}

// ────────────────────────────────────────
// DATA EXPORT & IMPORT
// ────────────────────────────────────────

/**
 * Exports all user data for backup.
 */
export function exportAllData(): string {
  const settings = loadSettings();
  const customPersonas = loadCustomPersonas();
  
  const exportData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    settings,
    customPersonas,
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Imports user data from backup.
 */
export function importAllData(jsonData: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonData);
    
    if (!data.version) {
      return { success: false, error: 'Invalid backup format' };
    }
    
    if (data.settings) {
      saveSettings(data.settings);
    }
    
    if (data.customPersonas) {
      saveCustomPersonas(data.customPersonas);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to parse backup data' };
  }
}

/**
 * Clears all user data (for privacy/reset).
 */
export function clearAllData(): void {
  resetSettings();
  removeFromStorage(STORAGE_KEYS.CUSTOM_PERSONAS);
  removeFromStorage(STORAGE_KEYS.AGE_VERIFIED);
}

// ────────────────────────────────────────
// CLOUD SYNC (PLACEHOLDER)
// ────────────────────────────────────────

/**
 * TODO: Implement cloud sync functionality.
 * This should be opt-in and use end-to-end encryption.
 */
export async function syncToCloud(): Promise<{ success: boolean; error?: string }> {
  // Placeholder for future cloud sync implementation
  return { success: false, error: 'Cloud sync not yet implemented' };
}

/**
 * TODO: Implement cloud sync functionality.
 */
export async function syncFromCloud(): Promise<{ success: boolean; error?: string }> {
  // Placeholder for future cloud sync implementation
  return { success: false, error: 'Cloud sync not yet implemented' };
}

// ────────────────────────────────────────
// MIGRATION UTILITIES
// ────────────────────────────────────────

/**
 * Migrates old storage format to new format.
 * This ensures backward compatibility.
 */
export function migrateOldStorage(): void {
  // Migrate old individual localStorage items to new settings object
  const oldKeys = {
    ollamaBaseUrl: 'ollamaBaseUrl',
    aimiName: 'aimiName',
    aimiPersonality: 'aimiPersonality',
    aimiSelectedModel: 'aimiSelectedModel',
    aimiMemoryEnabled: 'aimiMemoryEnabled',
  };
  
  try {
    // Check if new settings already exist
    if (localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      return; // Already migrated
    }
    
    // Load old settings
    const settings = { ...DEFAULT_APP_SETTINGS };
    
    if (localStorage.getItem(oldKeys.ollamaBaseUrl)) {
      settings.ollamaBaseUrl = localStorage.getItem(oldKeys.ollamaBaseUrl) || settings.ollamaBaseUrl;
    }
    
    if (localStorage.getItem(oldKeys.aimiName)) {
      settings.aiName = localStorage.getItem(oldKeys.aimiName) || settings.aiName;
    }
    
    if (localStorage.getItem(oldKeys.aimiPersonality)) {
      try {
        settings.personality = JSON.parse(localStorage.getItem(oldKeys.aimiPersonality) || '{}');
      } catch {
        // Use default
      }
    }
    
    if (localStorage.getItem(oldKeys.aimiSelectedModel)) {
      settings.selectedModel = localStorage.getItem(oldKeys.aimiSelectedModel) || settings.selectedModel;
    }
    
    if (localStorage.getItem(oldKeys.aimiMemoryEnabled)) {
      settings.memoryEnabled = localStorage.getItem(oldKeys.aimiMemoryEnabled) === 'true';
    }
    
    // Save migrated settings
    saveSettings(settings);
    
    // Clean up old keys
    Object.values(oldKeys).forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('Successfully migrated old storage to new format');
  } catch (error) {
    console.error('Failed to migrate old storage:', error);
  }
}
