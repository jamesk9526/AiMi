/**
 * Contact System Types
 * 
 * Defines the structure for a contact-based messaging system where each
 * contact represents a unique AI agent/partner with individual settings
 * and conversation history.
 */

import { PersonalityTraits, ModelParameters, ModelProfile, PersonaTemplate } from './settings';

/**
 * Contact mode determines how the AI behaves with this contact.
 */
export type ContactMode = 'learner' | 'pre-trained';

/**
 * Contact represents an individual AI agent/partner with unique settings.
 */
export interface Contact {
  /** Unique identifier for the contact */
  id: string;
  
  /** Display name for the contact */
  name: string;
  
  /** Optional description/bio */
  description?: string;
  
  /** Avatar URL or emoji */
  avatar?: string;
  
  /** Contact mode - learner saves conversations, pre-trained doesn't */
  mode: ContactMode;
  
  /** Personality traits specific to this contact */
  personality: PersonalityTraits;
  
  /** AI model to use for this contact */
  model: string;
  
  /** Model parameters for this contact */
  modelParameters: ModelParameters;
  
  /** Model profile */
  modelProfile: ModelProfile;
  
  /** Optional persona template this contact is based on */
  personaId?: string;
  
  /** Custom system prompt additions for this contact */
  systemPromptAddition?: string;
  
  /** Metadata */
  createdAt: Date;
  updatedAt: Date;
  
  /** Last message timestamp */
  lastMessageAt?: Date;
  
  /** Message count for this contact */
  messageCount: number;
  
  /** Tags for organization */
  tags: string[];
  
  /** Whether this contact is pinned/favorited */
  isPinned: boolean;
}

/**
 * Message with contact association
 */
export interface ContactMessage {
  id: string;
  contactId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  image?: string;
  
  metadata?: {
    model?: string;
    filtered?: boolean;
    regenerated?: boolean;
  };
}

/**
 * Contact summary for list view
 */
export interface ContactSummary {
  id: string;
  name: string;
  avatar?: string;
  mode: ContactMode;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  isPinned: boolean;
}
