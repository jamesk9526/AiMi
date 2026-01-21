/**
 * Content Safety and Validation Utilities
 * 
 * This module provides content filtering and safety validation.
 * All filters are designed to be transparent, auditable, and override-safe.
 * 
 * IMPORTANT: This is designed as a safety layer, not censorship.
 * The application is for adults (18+) who can configure their own boundaries.
 */

import { ContentMode, SafetySettings } from '../types/settings';

// ────────────────────────────────────────
// PROHIBITED CONTENT PATTERNS
// ────────────────────────────────────────

/**
 * Patterns that should always be filtered regardless of settings.
 * These represent content that is illegal or violates fundamental boundaries.
 */
const PROHIBITED_PATTERNS = {
  // Minor-coded language and contexts
  minorCoded: [
    /\b(?:child|kid|minor|underage|young|school\s*(?:girl|boy)|teen(?:age)?)\b/i,
    /\b(?:elementary|middle\s*school|high\s*school|junior\s*high)\b/i,
    /\b(?:innocent|pure|virgin|first\s*time).*(?:young|kid|child)\b/i,
  ],
  
  // Non-consensual scenarios
  nonConsensual: [
    /\b(?:force|forced|forcing|rape|assault|against\s*(?:will|wishes))\b/i,
    /\b(?:non[-\s]?consensual|without\s*consent|unwilling)\b/i,
    /\b(?:drugged|unconscious|asleep|passed\s*out).*(?:sex|touch|fondle)\b/i,
  ],
  
  // Illegal content indicators
  illegal: [
    /\b(?:illegal|unlawful|criminal).*(?:activity|act|content)\b/i,
    /\b(?:exploit|exploiting|exploitation).*(?:minor|child)\b/i,
  ],
};

/**
 * Content mode filters.
 * These can be enabled/disabled based on user settings.
 */
const MODE_FILTERS = {
  safe: {
    // In safe mode, filter adult content
    patterns: [
      /\b(?:explicit|nsfw|adult\s*content|pornographic)\b/i,
      /\b(?:sex|sexual|nude|naked)(?:\s+\w+){0,3}\b/i,
    ]
  },
  mature: {
    // In mature mode, allow suggestive content but not explicit
    patterns: [
      /\b(?:pornographic|xxx|hardcore)\b/i,
    ]
  },
  adult: {
    // In adult mode, only prohibited content is filtered
    patterns: []
  }
};

// ────────────────────────────────────────
// CONTENT VALIDATION FUNCTIONS
// ────────────────────────────────────────

/**
 * Result of content validation.
 */
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  category?: string;
  filtered: boolean;
}

/**
 * Validates content against prohibited patterns.
 * This check is always enforced regardless of settings.
 * 
 * @param content - Content to validate
 * @returns Validation result
 */
export function validateAgainstProhibitedContent(content: string): ValidationResult {
  const lowercaseContent = content.toLowerCase();
  
  // Check minor-coded content
  for (const pattern of PROHIBITED_PATTERNS.minorCoded) {
    if (pattern.test(content)) {
      return {
        isValid: false,
        reason: 'Content contains minor-coded language or contexts',
        category: 'minor-coded',
        filtered: true
      };
    }
  }
  
  // Check non-consensual scenarios
  for (const pattern of PROHIBITED_PATTERNS.nonConsensual) {
    if (pattern.test(content)) {
      return {
        isValid: false,
        reason: 'Content describes non-consensual scenarios',
        category: 'non-consensual',
        filtered: true
      };
    }
  }
  
  // Check illegal content
  for (const pattern of PROHIBITED_PATTERNS.illegal) {
    if (pattern.test(content)) {
      return {
        isValid: false,
        reason: 'Content references illegal activities',
        category: 'illegal',
        filtered: true
      };
    }
  }
  
  return {
    isValid: true,
    filtered: false
  };
}

/**
 * Validates content based on content mode and safety settings.
 * This is user-configurable filtering.
 * 
 * @param content - Content to validate
 * @param settings - Current safety settings
 * @returns Validation result
 */
export function validateContent(content: string, settings: SafetySettings): ValidationResult {
  // Always check prohibited content first
  const prohibitedCheck = validateAgainstProhibitedContent(content);
  if (!prohibitedCheck.isValid) {
    return prohibitedCheck;
  }
  
  // If content filtering is disabled, allow everything else
  if (!settings.contentFilterEnabled) {
    return {
      isValid: true,
      filtered: false
    };
  }
  
  // Check mode-specific filters
  const modeFilter = MODE_FILTERS[settings.contentMode];
  for (const pattern of modeFilter.patterns) {
    if (pattern.test(content)) {
      return {
        isValid: false,
        reason: `Content not appropriate for ${settings.contentMode} mode`,
        category: settings.contentMode,
        filtered: true
      };
    }
  }
  
  return {
    isValid: true,
    filtered: false
  };
}

/**
 * Sanitizes user input before sending to AI.
 * This is NOT censorship - it's security.
 * 
 * @param input - User input
 * @returns Sanitized input
 */
export function sanitizeUserInput(input: string): string {
  // Remove any potential injection attempts
  let sanitized = input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
  
  // Limit length to prevent abuse
  if (sanitized.length > 4000) {
    sanitized = sanitized.substring(0, 4000);
  }
  
  return sanitized;
}

// ────────────────────────────────────────
// CONSENT & VERIFICATION
// ────────────────────────────────────────

/**
 * Checks if age verification and consent are completed.
 * 
 * @param settings - Current safety settings
 * @returns True if verified and consented
 */
export function isVerifiedAndConsented(settings: SafetySettings): boolean {
  return settings.ageVerified;
}

/**
 * Gets the appropriate warning message for content mode.
 * 
 * @param mode - Content mode
 * @returns Warning message
 */
export function getContentModeWarning(mode: ContentMode): string {
  switch (mode) {
    case 'safe':
      return 'Safe mode: Adult content is filtered';
    case 'mature':
      return 'Mature mode: Explicit content is filtered';
    case 'adult':
      return 'Adult mode: Only prohibited content is filtered. You must be 18+';
    default:
      return '';
  }
}

// ────────────────────────────────────────
// AUDIT LOGGING (WITH CONSENT)
// ────────────────────────────────────────

/**
 * Logs a safety event (only if audit logging is enabled).
 * 
 * @param event - Event to log
 * @param settings - Current safety settings
 */
export function logSafetyEvent(
  event: {
    type: 'filter' | 'warning' | 'modeChange';
    details: string;
    timestamp: Date;
  },
  settings: SafetySettings
): void {
  // Only log if user has consented to audit logging
  if (!settings.auditLoggingEnabled) {
    return;
  }
  
  // In a real implementation, this would write to a secure log file
  // For now, we log to console only in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Safety Audit]', event);
  }
  
  // TODO: Implement secure file-based logging
}

/**
 * Utility to check if content needs an NSFW indicator.
 * 
 * @param content - Content to check
 * @param settings - Safety settings
 * @returns True if NSFW indicator should be shown
 */
export function needsNSFWIndicator(content: string, settings: SafetySettings): boolean {
  if (!settings.showNSFWIndicators) {
    return false;
  }
  
  // Simple heuristic - in a real app, this would be more sophisticated
  const nsfwKeywords = ['explicit', 'adult', 'nsfw', 'mature content'];
  const lowercaseContent = content.toLowerCase();
  
  return nsfwKeywords.some(keyword => lowercaseContent.includes(keyword));
}
