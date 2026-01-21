/**
 * Age Verification Modal Component
 * 
 * This component displays an age verification and consent dialog.
 * Required for 18+ applications to ensure legal compliance.
 */

import React from 'react';
import '../styles/modal.css';

interface AgeVerificationModalProps {
  onVerify: () => void;
  onDecline: () => void;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({ onVerify, onDecline }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content age-verification-modal">
        <div className="modal-header">
          <h2>⚠️ Age Verification & Consent</h2>
        </div>
        
        <div className="modal-body">
          <div className="warning-box">
            <p><strong>IMPORTANT: This application is for adults only (18+)</strong></p>
          </div>
          
          <div className="terms-section">
            <h3>Terms of Use</h3>
            <ul>
              <li>You must be at least 18 years of age to use this application</li>
              <li>This application contains adult content and themes</li>
              <li>You consent to viewing potentially explicit content</li>
              <li>All interactions are with AI - not real persons</li>
              <li>Conversations are private and stored locally</li>
              <li>You have full control over content modes and filtering</li>
            </ul>
          </div>
          
          <div className="terms-section">
            <h3>Content Boundaries</h3>
            <ul>
              <li>✅ Adult content between consenting adults is allowed</li>
              <li>❌ Non-consensual scenarios are prohibited</li>
              <li>❌ Minor-coded content is prohibited</li>
              <li>❌ Illegal activities are prohibited</li>
            </ul>
          </div>
          
          <div className="terms-section">
            <h3>Your Control</h3>
            <ul>
              <li>You can adjust content modes (Safe, Mature, Adult)</li>
              <li>You can enable/disable content filtering at any time</li>
              <li>You can use the Panic Button for immediate safe mode</li>
              <li>You can configure AI personality and behavior</li>
            </ul>
          </div>
          
          <div className="consent-confirmation">
            <p><strong>By clicking "I Verify", you confirm that:</strong></p>
            <ul>
              <li>You are at least 18 years old</li>
              <li>You understand this application contains adult content</li>
              <li>You consent to viewing adult content</li>
              <li>You accept these terms of use</li>
            </ul>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-button decline-button" onClick={onDecline}>
            I Decline
          </button>
          <button className="modal-button verify-button" onClick={onVerify}>
            I Verify (18+)
          </button>
        </div>
      </div>
    </div>
  );
};
