/**
 * ContactSettingsModal Component
 * 
 * Modal for editing contact settings including mode switching between learner and pre-trained.
 */

import React, { useState, useEffect } from 'react';
import { Contact, ContactMode } from '../types/contact';
import '../styles/ContactSettingsModal.css';

interface ContactSettingsModalProps {
  isOpen: boolean;
  contact: Contact | null;
  onClose: () => void;
  onSave: (contactId: string, updates: Partial<Contact>) => void;
  onDelete: (contactId: string) => void;
  onClearMessages: (contactId: string) => void;
  onTogglePin: (contactId: string) => void;
}

export const ContactSettingsModal: React.FC<ContactSettingsModalProps> = ({
  isOpen,
  contact,
  onClose,
  onSave,
  onDelete,
  onClearMessages,
  onTogglePin,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<ContactMode>('learner');
  const [systemPromptAddition, setSystemPromptAddition] = useState('');

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setDescription(contact.description || '');
      setMode(contact.mode);
      setSystemPromptAddition(contact.systemPromptAddition || '');
    }
  }, [contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contact) return;
    
    if (!name.trim()) {
      alert('Please enter a name for the contact');
      return;
    }

    onSave(contact.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      mode,
      systemPromptAddition: systemPromptAddition.trim() || undefined,
    });

    onClose();
  };

  const handleDelete = () => {
    if (!contact) return;
    
    if (confirm(`Are you sure you want to delete "${contact.name}"? This will remove all conversation history.`)) {
      onDelete(contact.id);
      onClose();
    }
  };

  const handleClearMessages = () => {
    if (!contact) return;
    
    if (confirm(`Clear all conversation history with "${contact.name}"?`)) {
      onClearMessages(contact.id);
    }
  };

  const handleTogglePin = () => {
    if (!contact) return;
    onTogglePin(contact.id);
  };

  if (!isOpen || !contact) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="contact-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Contact Settings</h2>
          <button className="modal-close" onClick={onClose}>×</button>
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
                    Saves conversations and learns from interactions.
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
                    Doesn't save conversation history.
                  </div>
                </div>
              </button>
            </div>
            {mode !== contact.mode && (
              <div className="mode-warning">
                ⚠️ Changing mode will affect how conversations are stored.
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Custom Instructions</label>
            <textarea
              value={systemPromptAddition}
              onChange={(e) => setSystemPromptAddition(e.target.value)}
              placeholder="Add custom behavior instructions..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label>Contact Info</label>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Created:</span>
                <span className="info-value">{new Date(contact.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Messages:</span>
                <span className="info-value">{contact.messageCount}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Model:</span>
                <span className="info-value">{contact.model}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Profile:</span>
                <span className="info-value">{contact.modelProfile}</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Actions</label>
            <div className="action-buttons">
              <button type="button" className="btn-action" onClick={handleTogglePin}>
                {contact.isPinned ? '📌 Unpin' : '📍 Pin'} Contact
              </button>
              <button type="button" className="btn-action btn-warning" onClick={handleClearMessages}>
                🗑️ Clear History
              </button>
              <button type="button" className="btn-action btn-danger" onClick={handleDelete}>
                ❌ Delete Contact
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
