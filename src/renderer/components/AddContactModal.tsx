/**
 * AddContactModal Component
 * 
 * Modal for creating a new contact/agent with customizable settings.
 */

import React, { useState } from 'react';
import { ContactMode } from '../types/contact';
import { PersonalityTraits, DEFAULT_PERSONALITY, ModelProfile } from '../types/settings';
import { PersonaTemplate } from '../types/settings';
import '../styles/AddContactModal.css';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (contact: {
    name: string;
    description?: string;
    avatar?: string;
    mode: ContactMode;
    personality?: PersonalityTraits;
    modelProfile?: ModelProfile;
    personaId?: string;
    systemPromptAddition?: string;
  }) => void;
  availablePersonas?: PersonaTemplate[];
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  availablePersonas = [],
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [mode, setMode] = useState<ContactMode>('learner');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [systemPromptAddition, setSystemPromptAddition] = useState('');

  const avatarOptions = ['👤', '💖', '😊', '🤖', '🌟', '💫', '🎭', '🎨', '🎵', '🌸', '🔥', '⚡'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter a name for the contact');
      return;
    }

    const selectedPersona = availablePersonas.find(p => p.id === selectedPersonaId);

    onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      avatar,
      mode,
      personality: selectedPersona?.personality || DEFAULT_PERSONALITY,
      modelProfile: selectedPersona?.modelProfile || 'balanced',
      personaId: selectedPersonaId || undefined,
      systemPromptAddition: systemPromptAddition.trim() || undefined,
    });

    // Reset form
    setName('');
    setDescription('');
    setAvatar('👤');
    setMode('learner');
    setSelectedPersonaId('');
    setSystemPromptAddition('');
    onClose();
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setAvatar('👤');
    setMode('learner');
    setSelectedPersonaId('');
    setSystemPromptAddition('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="add-contact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Contact</h2>
          <button className="modal-close" onClick={handleCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter contact name"
              maxLength={50}
              required
            />
          </div>

          <div className="form-group">
            <label>Avatar</label>
            <div className="avatar-picker">
              {avatarOptions.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={`avatar-option ${avatar === emoji ? 'selected' : ''}`}
                  onClick={() => setAvatar(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label>Contact Mode *</label>
            <div className="mode-selection">
              <button
                type="button"
                className={`mode-option ${mode === 'learner' ? 'selected' : ''}`}
                onClick={() => setMode('learner')}
              >
                <div className="mode-icon">🎓</div>
                <div className="mode-details">
                  <div className="mode-name">Learner</div>
                  <div className="mode-description">
                    Saves conversations and learns from interactions. Acts like getting to know someone new.
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={`mode-option ${mode === 'pre-trained' ? 'selected' : ''}`}
                onClick={() => setMode('pre-trained')}
              >
                <div className="mode-icon">⚡</div>
                <div className="mode-details">
                  <div className="mode-name">Pre-trained</div>
                  <div className="mode-description">
                    Doesn't save conversation history. Fresh start each time.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {availablePersonas.length > 0 && (
            <div className="form-group">
              <label>Persona Template (Optional)</label>
              <select
                value={selectedPersonaId}
                onChange={(e) => setSelectedPersonaId(e.target.value)}
              >
                <option value="">Custom (use default personality)</option>
                {availablePersonas.map(persona => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name} - {persona.description}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Custom Instructions (Optional)</label>
            <textarea
              value={systemPromptAddition}
              onChange={(e) => setSystemPromptAddition(e.target.value)}
              placeholder="Add custom behavior instructions for this contact..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
