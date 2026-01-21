/**
 * Settings and Configuration Types
 * 
 * This file defines all settings, configurations, and types for the AI chat application.
 * All configurable parameters should be defined here to maintain a single source of truth.
 */

// ────────────────────────────────────────
// PERSONALITY TRAITS
// ────────────────────────────────────────

/**
 * Personality traits that define the AI companion's behavior.
 * Each trait is a value from 0-100 representing intensity.
 */
export interface PersonalityTraits {
  flirtatiousness: number;
  dominance: number;
  sensuality: number;
  emotionalDepth: number;
  adventurousness: number;
  playfulness: number;
  submissiveness: number;
  confidence: number;
  creativity: number;
  responsiveness: number;
}

// ────────────────────────────────────────
// AI MODEL CONFIGURATION
// ────────────────────────────────────────

/**
 * Model generation parameters that control AI behavior.
 * These affect the quality, creativity, and consistency of responses.
 */
export interface ModelParameters {
  /** Temperature: Controls randomness (0.1-2.0). Higher = more creative. */
  temperature: number;
  
  /** Top-p (nucleus sampling): Controls diversity (0.1-1.0). */
  topP: number;
  
  /** Repetition penalty: Prevents repetitive text (1.0-2.0). */
  repetitionPenalty: number;
  
  /** Max tokens: Maximum length of response. */
  maxTokens: number;
  
  /** Enable streaming: Show tokens as they generate. */
  streamingEnabled: boolean;
}

/**
 * Predefined model profiles for different use cases.
 */
export type ModelProfile = 'creative' | 'roleplay' | 'balanced' | 'safe' | 'strict';

/**
 * Model profile configurations with preset parameters.
 */
export interface ModelProfileConfig {
  name: string;
  description: string;
  parameters: ModelParameters;
}

// ────────────────────────────────────────
// CONTENT & SAFETY SETTINGS
// ────────────────────────────────────────

/**
 * Content mode settings for the application.
 */
export type ContentMode = 'safe' | 'mature' | 'adult';

/**
 * Safety and content control settings.
 */
export interface SafetySettings {
  /** Current content mode */
  contentMode: ContentMode;
  
  /** Enable content filtering */
  contentFilterEnabled: boolean;
  
  /** Show NSFW indicators */
  showNSFWIndicators: boolean;
  
  /** Require consent confirmation for adult content */
  requireConsentConfirmation: boolean;
  
  /** Enable audit logging (with user consent) */
  auditLoggingEnabled: boolean;
  
  /** Age verification completed */
  ageVerified: boolean;
}

// ────────────────────────────────────────
// PERSONA SYSTEM
// ────────────────────────────────────────

/**
 * Persona template for creating different AI characters.
 */
export interface PersonaTemplate {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  personality: PersonalityTraits;
  systemPromptAddition?: string; // Additional instructions for this persona
  modelProfile: ModelProfile;
  tags: string[];
  isCustom: boolean;
}

// ────────────────────────────────────────
// APPLICATION SETTINGS
// ────────────────────────────────────────

/**
 * Complete application settings.
 */
export interface AppSettings {
  // AI Configuration
  aiName: string;
  selectedModel: string;
  modelParameters: ModelParameters;
  modelProfile: ModelProfile;
  
  // Personality
  personality: PersonalityTraits;
  selectedPersona?: string; // ID of selected persona template
  
  // Connection
  ollamaBaseUrl: string;
  
  // Memory & Storage
  memoryEnabled: boolean;
  encryptionEnabled: boolean;
  cloudSyncEnabled: boolean;
  
  // Safety & Content
  safety: SafetySettings;
  
  // UI Preferences
  darkTheme: boolean;
  showTimestamps: boolean;
  showTypingIndicators: boolean;
  
  // Privacy
  allowTelemetry: boolean;
}

// ────────────────────────────────────────
// MESSAGE & CONVERSATION TYPES
// ────────────────────────────────────────

/**
 * Message interface with metadata.
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  image?: string;
  
  // Metadata
  metadata?: {
    model?: string;
    persona?: string;
    contentMode?: ContentMode;
    filtered?: boolean; // Was content filtered
    regenerated?: boolean; // Was this message regenerated
  };
}

/**
 * Conversation metadata for storage.
 */
export interface ConversationMetadata {
  id: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  
  // Settings at time of conversation
  model: string;
  persona?: string;
  contentMode: ContentMode;
  
  // Privacy flags
  isLocked: boolean;
  isPrivate: boolean;
  
  // Consent tracking
  consentGiven: boolean;
}

// ────────────────────────────────────────
// DEFAULT VALUES
// ────────────────────────────────────────

/**
 * Default personality traits (balanced).
 */
export const DEFAULT_PERSONALITY: PersonalityTraits = {
  flirtatiousness: 80,
  dominance: 50,
  sensuality: 85,
  emotionalDepth: 75,
  adventurousness: 70,
  playfulness: 90,
  submissiveness: 40,
  confidence: 85,
  creativity: 80,
  responsiveness: 95
};

/**
 * Default model parameters (balanced profile).
 */
export const DEFAULT_MODEL_PARAMETERS: ModelParameters = {
  temperature: 0.8,
  topP: 0.9,
  repetitionPenalty: 1.1,
  maxTokens: 500,
  streamingEnabled: false
};

/**
 * Model profile presets.
 */
export const MODEL_PROFILES: Record<ModelProfile, ModelProfileConfig> = {
  creative: {
    name: 'Creative',
    description: 'More imaginative and varied responses',
    parameters: {
      temperature: 1.2,
      topP: 0.95,
      repetitionPenalty: 1.05,
      maxTokens: 600,
      streamingEnabled: false
    }
  },
  roleplay: {
    name: 'Roleplay',
    description: 'Optimized for immersive roleplay experiences',
    parameters: {
      temperature: 1.0,
      topP: 0.92,
      repetitionPenalty: 1.1,
      maxTokens: 550,
      streamingEnabled: false
    }
  },
  balanced: {
    name: 'Balanced',
    description: 'Balanced creativity and consistency',
    parameters: {
      temperature: 0.8,
      topP: 0.9,
      repetitionPenalty: 1.1,
      maxTokens: 500,
      streamingEnabled: false
    }
  },
  safe: {
    name: 'Safe',
    description: 'More predictable and appropriate responses',
    parameters: {
      temperature: 0.6,
      topP: 0.85,
      repetitionPenalty: 1.15,
      maxTokens: 450,
      streamingEnabled: false
    }
  },
  strict: {
    name: 'Strict',
    description: 'Most consistent and filtered responses',
    parameters: {
      temperature: 0.4,
      topP: 0.8,
      repetitionPenalty: 1.2,
      maxTokens: 400,
      streamingEnabled: false
    }
  }
};

/**
 * Default safety settings (safe mode).
 */
export const DEFAULT_SAFETY_SETTINGS: SafetySettings = {
  contentMode: 'safe',
  contentFilterEnabled: true,
  showNSFWIndicators: true,
  requireConsentConfirmation: true,
  auditLoggingEnabled: false,
  ageVerified: false
};

/**
 * Default application settings.
 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  aiName: 'AiMi',
  selectedModel: 'llama2',
  modelParameters: DEFAULT_MODEL_PARAMETERS,
  modelProfile: 'balanced',
  personality: DEFAULT_PERSONALITY,
  ollamaBaseUrl: 'http://localhost:11434',
  memoryEnabled: true,
  encryptionEnabled: false, // TODO: Implement encryption
  cloudSyncEnabled: false,
  safety: DEFAULT_SAFETY_SETTINGS,
  darkTheme: true,
  showTimestamps: true,
  showTypingIndicators: true,
  allowTelemetry: false
};
