/**
 * Contact Manager
 * 
 * Handles CRUD operations for contacts and their associated conversations.
 * Each contact has isolated message storage based on their mode (learner/pre-trained).
 */

import { Contact, ContactMessage, ContactMode, ContactSummary } from '../types/contact';
import { PersonalityTraits, ModelParameters, ModelProfile, DEFAULT_PERSONALITY, DEFAULT_MODEL_PARAMETERS } from '../types/settings';

// ────────────────────────────────────────
// STORAGE KEYS
// ────────────────────────────────────────

const STORAGE_KEYS = {
  CONTACTS: 'aimi_contacts',
  ACTIVE_CONTACT: 'aimi_active_contact',
  CONTACT_MESSAGES_PREFIX: 'aimi_contact_messages_',
} as const;

// ────────────────────────────────────────
// CONTACT OPERATIONS
// ────────────────────────────────────────

/**
 * Load all contacts from storage
 */
export function loadContacts(): Contact[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (!stored) return [];
    
    const contacts = JSON.parse(stored);
    // Convert date strings back to Date objects
    return contacts.map((contact: any) => ({
      ...contact,
      createdAt: new Date(contact.createdAt),
      updatedAt: new Date(contact.updatedAt),
      lastMessageAt: contact.lastMessageAt ? new Date(contact.lastMessageAt) : undefined,
    }));
  } catch (error) {
    console.error('Failed to load contacts:', error);
    return [];
  }
}

/**
 * Save contacts to storage
 */
export function saveContacts(contacts: Contact[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  } catch (error) {
    console.error('Failed to save contacts:', error);
  }
}

/**
 * Create a new contact
 */
export function createContact(params: {
  name: string;
  description?: string;
  avatar?: string;
  mode: ContactMode;
  personality?: PersonalityTraits;
  model?: string;
  modelParameters?: ModelParameters;
  modelProfile?: ModelProfile;
  personaId?: string;
  systemPromptAddition?: string;
  tags?: string[];
}): Contact {
  const now = new Date();
  const contact: Contact = {
    id: `contact_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    name: params.name,
    description: params.description,
    avatar: params.avatar || '👤',
    mode: params.mode,
    personality: params.personality || DEFAULT_PERSONALITY,
    model: params.model || 'llama2',
    modelParameters: params.modelParameters || DEFAULT_MODEL_PARAMETERS,
    modelProfile: params.modelProfile || 'balanced',
    personaId: params.personaId,
    systemPromptAddition: params.systemPromptAddition,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
    tags: params.tags || [],
    isPinned: false,
  };
  
  const contacts = loadContacts();
  contacts.push(contact);
  saveContacts(contacts);
  
  return contact;
}

/**
 * Update an existing contact
 */
export function updateContact(contactId: string, updates: Partial<Contact>): Contact | null {
  const contacts = loadContacts();
  const index = contacts.findIndex(c => c.id === contactId);
  
  if (index === -1) return null;
  
  contacts[index] = {
    ...contacts[index],
    ...updates,
    updatedAt: new Date(),
  };
  
  saveContacts(contacts);
  return contacts[index];
}

/**
 * Delete a contact and all associated messages
 */
export function deleteContact(contactId: string): boolean {
  const contacts = loadContacts();
  const filtered = contacts.filter(c => c.id !== contactId);
  
  if (filtered.length === contacts.length) return false;
  
  saveContacts(filtered);
  
  // Delete associated messages
  localStorage.removeItem(`${STORAGE_KEYS.CONTACT_MESSAGES_PREFIX}${contactId}`);
  
  // If this was the active contact, clear it
  if (getActiveContactId() === contactId) {
    setActiveContactId(null);
  }
  
  return true;
}

/**
 * Get a contact by ID
 */
export function getContactById(contactId: string): Contact | null {
  const contacts = loadContacts();
  return contacts.find(c => c.id === contactId) || null;
}

/**
 * Toggle pin status for a contact
 */
export function toggleContactPin(contactId: string): boolean {
  const contact = getContactById(contactId);
  if (!contact) return false;
  
  updateContact(contactId, { isPinned: !contact.isPinned });
  return !contact.isPinned;
}

// ────────────────────────────────────────
// ACTIVE CONTACT MANAGEMENT
// ────────────────────────────────────────

/**
 * Get the currently active contact ID
 */
export function getActiveContactId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONTACT);
}

/**
 * Set the active contact
 */
export function setActiveContactId(contactId: string | null): void {
  if (contactId === null) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONTACT);
  } else {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CONTACT, contactId);
  }
}

// ────────────────────────────────────────
// MESSAGE OPERATIONS
// ────────────────────────────────────────

/**
 * Get message storage key for a contact
 */
function getMessageStorageKey(contactId: string): string {
  return `${STORAGE_KEYS.CONTACT_MESSAGES_PREFIX}${contactId}`;
}

/**
 * Load messages for a specific contact
 */
export function loadContactMessages(contactId: string): ContactMessage[] {
  const contact = getContactById(contactId);
  if (!contact) return [];
  
  // For pre-trained mode, don't load any saved messages
  if (contact.mode === 'pre-trained') {
    return [];
  }
  
  try {
    const key = getMessageStorageKey(contactId);
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const messages = JSON.parse(stored);
    // Convert date strings back to Date objects
    return messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch (error) {
    console.error('Failed to load contact messages:', error);
    return [];
  }
}

/**
 * Save messages for a specific contact
 */
export function saveContactMessages(contactId: string, messages: ContactMessage[]): void {
  const contact = getContactById(contactId);
  if (!contact) return;
  
  // For pre-trained mode, don't save messages
  if (contact.mode === 'pre-trained') {
    return;
  }
  
  try {
    const key = getMessageStorageKey(contactId);
    localStorage.setItem(key, JSON.stringify(messages));
    
    // Update contact metadata
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      updateContact(contactId, {
        messageCount: messages.length,
        lastMessageAt: lastMessage.timestamp,
      });
    }
  } catch (error) {
    console.error('Failed to save contact messages:', error);
  }
}

/**
 * Add a message to a contact's conversation
 */
export function addContactMessage(contactId: string, message: Omit<ContactMessage, 'id' | 'contactId' | 'timestamp'>): ContactMessage {
  const messages = loadContactMessages(contactId);
  
  const newMessage: ContactMessage = {
    ...message,
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    contactId,
    timestamp: new Date(),
  };
  
  messages.push(newMessage);
  saveContactMessages(contactId, messages);
  
  return newMessage;
}

/**
 * Clear all messages for a contact
 */
export function clearContactMessages(contactId: string): void {
  const key = getMessageStorageKey(contactId);
  localStorage.removeItem(key);
  updateContact(contactId, { messageCount: 0, lastMessageAt: undefined });
}

// ────────────────────────────────────────
// CONTACT SUMMARIES
// ────────────────────────────────────────

/**
 * Get contact summaries for list view
 */
export function getContactSummaries(): ContactSummary[] {
  const contacts = loadContacts();
  
  return contacts.map(contact => {
    const messages = loadContactMessages(contact.id);
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;
    
    return {
      id: contact.id,
      name: contact.name,
      avatar: contact.avatar,
      mode: contact.mode,
      lastMessage: lastMessage?.content.substring(0, 50),
      lastMessageAt: contact.lastMessageAt,
      unreadCount: 0, // TODO: Implement unread tracking
      isPinned: contact.isPinned,
    };
  }).sort((a, b) => {
    // Sort by pinned first, then by last message time
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    const aTime = a.lastMessageAt?.getTime() || 0;
    const bTime = b.lastMessageAt?.getTime() || 0;
    return bTime - aTime;
  });
}

// ────────────────────────────────────────
// MIGRATION & INITIALIZATION
// ────────────────────────────────────────

/**
 * Initialize contact system - creates default contact if none exist
 */
export function initializeContactSystem(): void {
  const contacts = loadContacts();
  
  if (contacts.length === 0) {
    // Create default contact
    const defaultContact = createContact({
      name: 'AiMi',
      description: 'Your AI companion',
      avatar: '💖',
      mode: 'learner',
      tags: ['default'],
    });
    
    setActiveContactId(defaultContact.id);
  } else if (!getActiveContactId()) {
    // Set first contact as active if none is set
    setActiveContactId(contacts[0].id);
  }
}

/**
 * Migrate old single-conversation data to contact-based system
 */
export async function migrateToContactSystem(): Promise<void> {
  // Check if migration is needed
  if (loadContacts().length > 0) {
    return; // Already migrated
  }
  
  // Try to load old messages from electron API
  try {
    if (window.electronAPI?.memory) {
      const result = await window.electronAPI.memory.load();
      
      if (result.success && result.messages && result.messages.length > 0) {
        // Create default contact
        const defaultContact = createContact({
          name: 'AiMi',
          description: 'Your AI companion (migrated)',
          avatar: '💖',
          mode: 'learner',
          tags: ['migrated'],
        });
        
        // Convert old messages to contact messages
        const contactMessages: ContactMessage[] = result.messages.map((msg: any) => ({
          id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          contactId: defaultContact.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          image: msg.image,
          metadata: msg.metadata,
        }));
        
        // Save migrated messages
        saveContactMessages(defaultContact.id, contactMessages);
        setActiveContactId(defaultContact.id);
        
        console.log('Successfully migrated conversation to contact system');
      }
    }
  } catch (error) {
    console.error('Failed to migrate to contact system:', error);
  }
  
  // Initialize with default contact if migration failed or no old data
  initializeContactSystem();
}
