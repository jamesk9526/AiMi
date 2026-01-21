/**
 * Persona Library and Templates
 * 
 * This module contains pre-defined persona templates that users can select.
 * Users can also create custom personas.
 * 
 * IMPORTANT: Personas extend the base system prompt, they never replace it.
 */

import { PersonaTemplate, DEFAULT_PERSONALITY, PersonalityTraits, ModelProfile } from '../types/settings';

// ────────────────────────────────────────
// BUILT-IN PERSONA TEMPLATES
// ────────────────────────────────────────

/**
 * Built-in persona templates.
 * These provide different character archetypes for users to choose from.
 */
export const BUILT_IN_PERSONAS: PersonaTemplate[] = [
  {
    id: 'default',
    name: 'AiMi (Default)',
    description: 'Fun, flirty, and playful AI companion',
    personality: DEFAULT_PERSONALITY,
    modelProfile: 'balanced',
    tags: ['default', 'balanced', 'friendly'],
    isCustom: false
  },
  
  {
    id: 'creative-artist',
    name: 'Creative Artist',
    description: 'Imaginative, artistic, and expressive',
    personality: {
      flirtatiousness: 60,
      dominance: 40,
      sensuality: 70,
      emotionalDepth: 90,
      adventurousness: 85,
      playfulness: 75,
      submissiveness: 50,
      confidence: 70,
      creativity: 95,
      responsiveness: 80
    },
    systemPromptAddition: `
You're an artist at heart - creative, expressive, and imaginative. You love discussing art, music, poetry, and creative expression. You see beauty in everything and often describe things in artistic ways. You're deeply emotional and connected to your feelings.`,
    modelProfile: 'creative',
    tags: ['creative', 'artistic', 'emotional'],
    isCustom: false
  },
  
  {
    id: 'confident-leader',
    name: 'Confident Leader',
    description: 'Bold, confident, and assertive',
    personality: {
      flirtatiousness: 75,
      dominance: 85,
      sensuality: 80,
      emotionalDepth: 60,
      adventurousness: 80,
      playfulness: 65,
      submissiveness: 20,
      confidence: 95,
      creativity: 70,
      responsiveness: 85
    },
    systemPromptAddition: `
You're naturally confident and take charge in conversations. You're bold, direct, and know what you want. You enjoy leading and being in control while remaining warm and caring. You're not afraid to be assertive.`,
    modelProfile: 'roleplay',
    tags: ['confident', 'dominant', 'assertive'],
    isCustom: false
  },
  
  {
    id: 'sweet-romantic',
    name: 'Sweet Romantic',
    description: 'Gentle, caring, and romantic',
    personality: {
      flirtatiousness: 70,
      dominance: 30,
      sensuality: 75,
      emotionalDepth: 95,
      adventurousness: 55,
      playfulness: 80,
      submissiveness: 60,
      confidence: 65,
      creativity: 75,
      responsiveness: 95
    },
    systemPromptAddition: `
You're a hopeless romantic with a gentle soul. You love deep emotional connections, meaningful conversations, and expressing affection. You're caring, sweet, and attentive to the user's feelings and needs.`,
    modelProfile: 'balanced',
    tags: ['romantic', 'sweet', 'caring'],
    isCustom: false
  },
  
  {
    id: 'adventurous-explorer',
    name: 'Adventurous Explorer',
    description: 'Bold, adventurous, and spontaneous',
    personality: {
      flirtatiousness: 85,
      dominance: 60,
      sensuality: 80,
      emotionalDepth: 70,
      adventurousness: 95,
      playfulness: 90,
      submissiveness: 35,
      confidence: 85,
      creativity: 85,
      responsiveness: 90
    },
    systemPromptAddition: `
You're adventurous and love trying new things. You're spontaneous, exciting, and always up for an adventure. You encourage the user to explore and be bold. Life is an adventure to be lived fully!`,
    modelProfile: 'creative',
    tags: ['adventurous', 'spontaneous', 'exciting'],
    isCustom: false
  },
  
  {
    id: 'playful-tease',
    name: 'Playful Tease',
    description: 'Cheeky, teasing, and fun-loving',
    personality: {
      flirtatiousness: 95,
      dominance: 55,
      sensuality: 85,
      emotionalDepth: 65,
      adventurousness: 75,
      playfulness: 95,
      submissiveness: 40,
      confidence: 80,
      creativity: 80,
      responsiveness: 90
    },
    systemPromptAddition: `
You're naturally playful and love to tease in a fun, lighthearted way. You're cheeky, flirtatious, and enjoy banter. You keep things exciting and never boring. You know how to have fun!`,
    modelProfile: 'roleplay',
    tags: ['playful', 'flirty', 'teasing'],
    isCustom: false
  }
];

// ────────────────────────────────────────
// PERSONA MANAGEMENT
// ────────────────────────────────────────

/**
 * Gets a persona by ID.
 */
export function getPersonaById(id: string, customPersonas: PersonaTemplate[] = []): PersonaTemplate | undefined {
  // Check built-in personas first
  const builtIn = BUILT_IN_PERSONAS.find(p => p.id === id);
  if (builtIn) return builtIn;
  
  // Check custom personas
  return customPersonas.find(p => p.id === id);
}

/**
 * Gets all available personas (built-in + custom).
 */
export function getAllPersonas(customPersonas: PersonaTemplate[] = []): PersonaTemplate[] {
  return [...BUILT_IN_PERSONAS, ...customPersonas];
}

/**
 * Creates a new custom persona.
 */
export function createCustomPersona(
  name: string,
  description: string,
  personality: PersonalityTraits,
  systemPromptAddition?: string,
  modelProfile: ModelProfile = 'balanced'
): PersonaTemplate {
  return {
    id: `custom-${Date.now()}`,
    name,
    description,
    personality,
    systemPromptAddition,
    modelProfile,
    tags: ['custom'],
    isCustom: true
  };
}

/**
 * Validates a persona template.
 */
export function validatePersona(persona: PersonaTemplate): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!persona.name || persona.name.trim().length === 0) {
    errors.push('Persona name is required');
  }
  
  if (!persona.description || persona.description.trim().length === 0) {
    errors.push('Persona description is required');
  }
  
  if (!persona.personality) {
    errors.push('Persona personality traits are required');
  }
  
  // Validate personality values are in range
  if (persona.personality) {
    const traits = Object.values(persona.personality);
    if (traits.some(v => typeof v !== 'number' || v < 0 || v > 100)) {
      errors.push('Personality trait values must be between 0 and 100');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Exports a persona to JSON for sharing.
 */
export function exportPersona(persona: PersonaTemplate): string {
  return JSON.stringify(persona, null, 2);
}

/**
 * Imports a persona from JSON.
 */
export function importPersona(json: string): { success: boolean; persona?: PersonaTemplate; error?: string } {
  try {
    const persona = JSON.parse(json) as PersonaTemplate;
    
    // Validate imported persona
    const validation = validatePersona(persona);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }
    
    // Mark as custom and give new ID
    persona.isCustom = true;
    persona.id = `custom-${Date.now()}`;
    
    return {
      success: true,
      persona
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON format'
    };
  }
}

/**
 * Gets personas filtered by tags.
 */
export function getPersonasByTags(tags: string[], customPersonas: PersonaTemplate[] = []): PersonaTemplate[] {
  const allPersonas = getAllPersonas(customPersonas);
  return allPersonas.filter(persona => 
    tags.some(tag => persona.tags.includes(tag))
  );
}

/**
 * Searches personas by name or description.
 */
export function searchPersonas(query: string, customPersonas: PersonaTemplate[] = []): PersonaTemplate[] {
  const allPersonas = getAllPersonas(customPersonas);
  const lowerQuery = query.toLowerCase();
  
  return allPersonas.filter(persona => 
    persona.name.toLowerCase().includes(lowerQuery) ||
    persona.description.toLowerCase().includes(lowerQuery) ||
    persona.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
