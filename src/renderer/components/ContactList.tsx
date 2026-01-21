/**
 * ContactList Component
 * 
 * Displays a list of contacts similar to a messaging app.
 * Shows contact avatars, names, last messages, and timestamps.
 */

import React from 'react';
import { ContactSummary } from '../types/contact';
import '../styles/ContactList.css';

interface ContactListProps {
  contacts: ContactSummary[];
  activeContactId: string | null;
  onSelectContact: (contactId: string) => void;
  onAddContact: () => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  activeContactId,
  onSelectContact,
  onAddContact,
}) => {
  const formatTime = (date?: Date): string => {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="contact-list">
      <div className="contact-list-header">
        <h2>Contacts</h2>
        <button className="add-contact-btn" onClick={onAddContact} title="Add New Contact">
          <span className="plus-icon">+</span>
        </button>
      </div>
      
      <div className="contact-list-items">
        {contacts.length === 0 ? (
          <div className="no-contacts">
            <p>No contacts yet</p>
            <p className="hint">Click + to add your first contact</p>
          </div>
        ) : (
          contacts.map(contact => (
            <div
              key={contact.id}
              className={`contact-item ${contact.id === activeContactId ? 'active' : ''}`}
              onClick={() => onSelectContact(contact.id)}
            >
              <div className="contact-avatar">
                {contact.avatar}
                {contact.isPinned && <span className="pin-indicator">📌</span>}
              </div>
              
              <div className="contact-info">
                <div className="contact-header">
                  <span className="contact-name">{contact.name}</span>
                  <span className="contact-time">{formatTime(contact.lastMessageAt)}</span>
                </div>
                
                <div className="contact-preview">
                  <span className="contact-mode-badge">{contact.mode}</span>
                  {contact.lastMessage && (
                    <span className="last-message">{contact.lastMessage}...</span>
                  )}
                </div>
              </div>
              
              {contact.unreadCount > 0 && (
                <div className="unread-badge">{contact.unreadCount}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
