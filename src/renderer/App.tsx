import React, { useState, useEffect, useRef } from 'react';
import {
  PersonalityTraits,
  AppSettings,
  ModelParameters,
  ModelProfile,
  SafetySettings,
  ContentMode,
  Message,
  DEFAULT_APP_SETTINGS,
  MODEL_PROFILES,
  PersonaTemplate
} from './types/settings';
import { loadSettings, saveSettings, migrateOldStorage, isAgeVerified, setAgeVerified } from './utils/storage';
import { generateSystemPrompt } from './utils/promptSystem';
import { validateContent, sanitizeUserInput, ValidationResult } from './utils/contentSafety';
import { getPersonaById, getAllPersonas } from './utils/personaLibrary';
import { AgeVerificationModal } from './components/AgeVerificationModal';
import { ContactList } from './components/ContactList';
import { AddContactModal } from './components/AddContactModal';
import { ContactSettingsModal } from './components/ContactSettingsModal';
import { Contact, ContactMessage, ContactSummary } from './types/contact';
import {
  loadContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  toggleContactPin,
  getActiveContactId,
  setActiveContactId,
  loadContactMessages,
  saveContactMessages,
  clearContactMessages,
  getContactSummaries,
  migrateToContactSystem,
  initializeContactSystem,
} from './utils/contactManager';

interface ElectronAPI {
  ollama: {
    chat: (params: { 
      model: string; 
      messages: any[]; 
      images?: string[]; 
      baseUrl?: string;
      options?: {
        temperature?: number;
        top_p?: number;
        repeat_penalty?: number;
        num_predict?: number;
      };
    }) => Promise<any>;
    listModels: (params?: { baseUrl?: string }) => Promise<any>;
    checkConnection: (params?: { baseUrl?: string }) => Promise<any>;
  };
  window: {
    setMode: (mode: 'phone' | 'desktop') => Promise<any>;
  };
  memory: {
    save: (params: { messages: any[] }) => Promise<any>;
    load: () => Promise<any>;
    clear: () => Promise<any>;
  };
  images: {
    getRandom: () => Promise<any>;
    list: () => Promise<any>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

const App: React.FC = () => {
  // Migrate old storage format and load settings
  useEffect(() => {
    migrateOldStorage();
    // Initialize contact system
    const initContacts = async () => {
      await migrateToContactSystem();
      initializeContactSystem();
      const activeId = getActiveContactId();
      setActiveContactIdState(activeId);
      setContacts(getContactSummaries());
    };
    initContacts();
  }, []);

  // State management with new AppSettings
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState<string>(() => 
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(!isAgeVerified());
  const [selectedPersona, setSelectedPersona] = useState<PersonaTemplate | undefined>(() => {
    if (settings.selectedPersona) {
      return getPersonaById(settings.selectedPersona);
    }
    return undefined;
  });
  const [customPersonas] = useState<PersonaTemplate[]>([]);
  
  // Contact system state
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [activeContactId, setActiveContactIdState] = useState<string | null>(null);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showContactSettingsModal, setShowContactSettingsModal] = useState(false);
  const [selectedContactForSettings, setSelectedContactForSettings] = useState<Contact | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  // Save settings whenever they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Constants for multi-message timing
  const MULTI_MESSAGE_DELAY_MIN = 1500;
  const MULTI_MESSAGE_DELAY_RANGE = 1000;
  const TYPING_INDICATOR_DURATION = 800;
  const IMAGE_DELAY_MIN = 1000;
  const IMAGE_DELAY_RANGE = 1000;
  const IMAGE_TYPING_DURATION = 600;

  useEffect(() => {
    checkConnection(settings.ollamaBaseUrl);
    const interval = setInterval(() => checkConnection(settings.ollamaBaseUrl), 30000);
    return () => clearInterval(interval);
  }, [settings.ollamaBaseUrl]);

  // Load conversation memory on startup
  useEffect(() => {
    const loadMemory = async () => {
      if (settings.memoryEnabled && activeContactId) {
        try {
          // Load messages from contact storage
          const contactMessages = loadContactMessages(activeContactId);
          // Convert to Message format
          const loadedMessages: Message[] = contactMessages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            image: msg.image,
          }));
          setMessages(loadedMessages);
        } catch (err) {
          console.error('Failed to load contact messages:', err);
        }
      }
    };
    loadMemory();
  }, [settings.memoryEnabled, activeContactId]);

  // Auto-save conversation memory when messages change
  useEffect(() => {
    const saveMemory = async () => {
      if (settings.memoryEnabled && messages.length > 0 && activeContactId) {
        try {
          // Convert to ContactMessage format and save
          const contactMessages: ContactMessage[] = messages.map((msg) => ({
            id: msg.id,
            contactId: activeContactId,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            image: msg.image,
          }));
          saveContactMessages(activeContactId, contactMessages);
        } catch (err) {
          console.error('Failed to save contact messages:', err);
        }
      }
    };
    saveMemory();
  }, [messages, settings.memoryEnabled, activeContactId]);

  useEffect(() => {
    // Update time every minute for iOS status bar
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showHeaderMenu && headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setShowHeaderMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHeaderMenu]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const checkConnection = async (url: string) => {
    try {
      const result = await window.electronAPI.ollama.checkConnection({ baseUrl: url });
      setIsConnected(result.connected);
      if (!result.connected) {
        setError(`Cannot reach Ollama at ${url}. Please start Ollama or update the URL.`);
        setAvailableModels([]);
      } else {
        setError(null);
        // Fetch available models when connected
        fetchAvailableModels(url);
      }
    } catch (err) {
      setIsConnected(false);
      setError(`Failed to connect to Ollama at ${url}`);
      setAvailableModels([]);
    }
  };

  const fetchAvailableModels = async (url: string) => {
    try {
      console.log('Fetching models from:', url);
      const result = await window.electronAPI.ollama.listModels({ baseUrl: url });
      console.log('Models result:', result);
      if (result.success && result.data && result.data.models) {
        const modelNames = result.data.models.map((model: any) => model.name);
        console.log('Model names:', modelNames);
        setAvailableModels(modelNames);
        // If current selected model is not in the list, select the first available
        if (modelNames.length > 0 && !modelNames.includes(settings.selectedModel)) {
          setSettings(prev => ({ ...prev, selectedModel: modelNames[0] }));
        }
      } else {
        console.log('No models found in response');
        setAvailableModels([]);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
      // Use fallback models when Ollama is not available
      setAvailableModels(['llama2', 'mistral', 'codellama']);
      if (!['llama2', 'mistral', 'codellama'].includes(settings.selectedModel)) {
        setSettings(prev => ({ ...prev, selectedModel: 'llama2' }));
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAgeVerify = () => {
    setAgeVerified(true);
    setShowAgeVerification(false);
  };

  const handleAgeDecline = () => {
    // User declined age verification - exit app
    if (window.electronAPI?.window) {
      alert('You must be 18+ to use this application.');
      window.close();
    } else {
      alert('You must be 18+ to use this application.');
    }
  };

  const handlePanicButton = () => {
    // Immediately switch to safe mode
    setSettings(prev => ({
      ...prev,
      safety: {
        ...prev.safety,
        contentMode: 'safe',
        contentFilterEnabled: true
      },
      modelProfile: 'safe',
      modelParameters: MODEL_PROFILES.safe.parameters
    }));
    setError('Switched to safe mode');
    setTimeout(() => setError(null), 3000);
  };

  const handleClearMemory = async () => {
    if (activeContactId) {
      clearContactMessages(activeContactId);
      setMessages([]);
      setContacts(getContactSummaries());
    }
  };

  const handleMemoryToggle = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, memoryEnabled: enabled }));
  };

  // Contact handlers
  const handleSelectContact = (contactId: string) => {
    if (contactId === activeContactId) return;
    
    // Switch to new contact
    setActiveContactId(contactId);
    setActiveContactIdState(contactId);
    
    // Load messages for this contact
    const contactMessages = loadContactMessages(contactId);
    const loadedMessages: Message[] = contactMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      image: msg.image,
    }));
    setMessages(loadedMessages);
    
    // Update contact settings from the contact's data
    const contact = getContactById(contactId);
    if (contact) {
      setSettings(prev => ({
        ...prev,
        aiName: contact.name,
        personality: contact.personality,
        selectedModel: contact.model,
        modelParameters: contact.modelParameters,
        modelProfile: contact.modelProfile,
      }));
    }
    
    setSidebarOpen(false);
  };

  const handleCreateContact = (contactData: {
    name: string;
    description?: string;
    avatar?: string;
    mode: 'learner' | 'pre-trained';
    personality?: PersonalityTraits;
    modelProfile?: ModelProfile;
    personaId?: string;
    systemPromptAddition?: string;
  }) => {
    const newContact = createContact({
      ...contactData,
      model: settings.selectedModel,
      modelParameters: settings.modelParameters,
    });
    
    setContacts(getContactSummaries());
    handleSelectContact(newContact.id);
    setShowAddContactModal(false);
  };

  const handleUpdateContactSettings = (contactId: string, updates: Partial<Contact>) => {
    updateContact(contactId, updates);
    setContacts(getContactSummaries());
    
    // If updating the active contact, refresh its settings
    if (contactId === activeContactId) {
      const contact = getContactById(contactId);
      if (contact) {
        setSettings(prev => ({
          ...prev,
          aiName: contact.name,
          personality: contact.personality,
          selectedModel: contact.model,
          modelParameters: contact.modelParameters,
          modelProfile: contact.modelProfile,
        }));
      }
    }
    
    setShowContactSettingsModal(false);
    setSelectedContactForSettings(null);
  };

  const handleDeleteContact = (contactId: string) => {
    if (confirm('Are you sure you want to delete this contact? All messages will be lost.')) {
      deleteContact(contactId);
      setContacts(getContactSummaries());
      
      // If deleting active contact, switch to another
      if (contactId === activeContactId) {
        const remaining = loadContacts();
        if (remaining.length > 0) {
          handleSelectContact(remaining[0].id);
        } else {
          // Create a default contact
          const defaultContact = createContact({
            name: 'AiMi',
            description: 'Your AI companion',
            avatar: '💖',
            mode: 'learner',
            model: settings.selectedModel,
            modelParameters: settings.modelParameters,
          });
          setContacts(getContactSummaries());
          handleSelectContact(defaultContact.id);
        }
      }
      
      setShowContactSettingsModal(false);
      setSelectedContactForSettings(null);
    }
  };

  const handleToggleContactPin = (contactId: string) => {
    toggleContactPin(contactId);
    setContacts(getContactSummaries());
  };

  const handleOpenContactSettings = (contactId: string) => {
    const contact = getContactById(contactId);
    if (contact) {
      setSelectedContactForSettings(contact);
      setShowContactSettingsModal(true);
    }
  };

  const handleClearContactMessages = (contactId: string) => {
    if (confirm('Are you sure you want to clear all messages for this contact?')) {
      clearContactMessages(contactId);
      setContacts(getContactSummaries());
      
      if (contactId === activeContactId) {
        setMessages([]);
      }
    }
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setSelectedImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && !selectedImage) return;
    if (!isConnected) {
      setError(`Cannot send message: Ollama is not connected at ${settings.ollamaBaseUrl}`);
      return;
    }

    // Sanitize user input
    const sanitizedInput = sanitizeUserInput(inputValue.trim());

    // Validate user input
    const inputValidation = validateContent(sanitizedInput, settings.safety);
    if (!inputValidation.isValid) {
      setError(`Message blocked: ${inputValidation.reason}`);
      setTimeout(() => setError(null), 5000);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: sanitizedInput,
      timestamp: new Date(),
      image: selectedImage || undefined,
      metadata: {
        model: settings.selectedModel,
        persona: settings.selectedPersona,
        contentMode: settings.safety.contentMode
      }
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setSelectedImage(null);
    setIsTyping(true);
    setError(null);

    try {
      // Build conversation context with memory if enabled
      const contextMessages = settings.memoryEnabled 
        ? messages.slice(-10) // Last 10 messages for context
        : [];

      const messagesToSend = [
        {
          role: 'system',
          content: generateSystemPrompt(
            settings.personality, 
            settings.aiName, 
            settings.safety, 
            selectedPersona
          )
        },
        ...contextMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
      ];

      messagesToSend.push({
        role: 'user',
        content: userMessage.content || 'What do you see in this image?',
      });

      const images = selectedImage ? [selectedImage.split(',')[1]] : undefined;

      // Build options with model parameters
      const options = {
        temperature: settings.modelParameters.temperature,
        top_p: settings.modelParameters.topP,
        repeat_penalty: settings.modelParameters.repetitionPenalty,
        num_predict: settings.modelParameters.maxTokens
      };

      const result = await window.electronAPI.ollama.chat({
        model: settings.selectedModel,
        messages: messagesToSend,
        images,
        baseUrl: settings.ollamaBaseUrl,
        options
      });

      setIsTyping(false);

      if (result.success) {
        const responseContent = result.data.message.content;
        
        // Validate AI response
        const responseValidation = validateContent(responseContent, settings.safety);
        if (!responseValidation.isValid) {
          setError(`AI response filtered: ${responseValidation.reason}. Try adjusting content mode in settings.`);
          // Add a filtered message
          const filteredMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '[Response filtered due to content policy. Please adjust your content mode in settings if this was unexpected.]',
            timestamp: new Date(),
            metadata: {
              model: settings.selectedModel,
              persona: settings.selectedPersona,
              contentMode: settings.safety.contentMode,
              filtered: true
            }
          };
          setMessages((prev) => [...prev, filteredMessage]);
          return;
        }
        
        // Decide if this should be a multi-message response (30% chance)
        const shouldSplitMessage = Math.random() < 0.3 && responseContent.length > 100;
        
        if (shouldSplitMessage) {
          // Split the message into 2-3 parts naturally
          const messageParts = splitIntoNaturalParts(responseContent);
          
          // Send first message immediately
          const firstMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: messageParts[0],
            timestamp: new Date(),
            metadata: {
              model: settings.selectedModel,
              persona: settings.selectedPersona,
              contentMode: settings.safety.contentMode
            }
          };
          setMessages((prev) => [...prev, firstMessage]);
          
          // Queue remaining messages with delays
          for (let i = 1; i < messageParts.length; i++) {
            await new Promise(resolve => setTimeout(resolve, MULTI_MESSAGE_DELAY_MIN + Math.random() * MULTI_MESSAGE_DELAY_RANGE));
            setIsTyping(true);
            await new Promise(resolve => setTimeout(resolve, TYPING_INDICATOR_DURATION));
            
            const nextMessage: Message = {
              id: (Date.now() + i + 1).toString(),
              role: 'assistant',
              content: messageParts[i],
              timestamp: new Date(),
              metadata: {
                model: settings.selectedModel,
                persona: settings.selectedPersona,
                contentMode: settings.safety.contentMode
              }
            };
            
            setMessages((prev) => [...prev, nextMessage]);
            setIsTyping(false);
          }
        } else {
          // Single message response
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseContent,
            timestamp: new Date(),
            metadata: {
              model: settings.selectedModel,
              persona: settings.selectedPersona,
              contentMode: settings.safety.contentMode
            }
          };
          setMessages((prev) => [...prev, aiMessage]);
        }
        
        // 30% chance to send a random image after the message(s)
        if (window.electronAPI?.images && Math.random() < 0.3) {
          try {
            const imageResult = await window.electronAPI.images.getRandom();
            if (imageResult.success && imageResult.image) {
              await new Promise(resolve => setTimeout(resolve, IMAGE_DELAY_MIN + Math.random() * IMAGE_DELAY_RANGE));
              setIsTyping(true);
              await new Promise(resolve => setTimeout(resolve, IMAGE_TYPING_DURATION));
              
              const imageMessage: Message = {
                id: (Date.now() + 100).toString(),
                role: 'assistant',
                content: '', // Empty content, just image
                timestamp: new Date(),
                image: imageResult.image,
                metadata: {
                  model: settings.selectedModel,
                  persona: settings.selectedPersona,
                  contentMode: settings.safety.contentMode
                }
              };
              setMessages((prev) => [...prev, imageMessage]);
              setIsTyping(false);
            }
          } catch (err) {
            console.error('Failed to get random image:', err);
          }
        }
      } else {
        setError(result.error || 'Failed to get response from AI');
      }
    } catch (err: any) {
      setIsTyping(false);
      setError(err.message || 'An error occurred while sending message');
    }
  };

  // Helper function to split message into natural parts
  const splitIntoNaturalParts = (text: string): string[] => {
    // Split at sentence boundaries, but try to avoid common abbreviations
    // This regex looks for sentence-ending punctuation followed by whitespace or newlines
    // It also tries to avoid splitting on common abbreviations
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/g).filter(s => s.trim());
    
    if (sentences.length <= 1) {
      return [text];
    }
    
    // Group sentences into 2-3 message parts
    const numParts = Math.min(3, Math.ceil(sentences.length / 2));
    const parts: string[] = [];
    const sentencesPerPart = Math.ceil(sentences.length / numParts);
    
    for (let i = 0; i < numParts; i++) {
      const start = i * sentencesPerPart;
      const end = Math.min(start + sentencesPerPart, sentences.length);
      const part = sentences.slice(start, end).join(' ').trim();
      if (part) {
        parts.push(part);
      }
    }
    
    return parts.length > 0 ? parts : [text];
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleApplyBaseUrl = () => {
    const trimmed = settings.ollamaBaseUrl.trim().replace(/\/+$/, '');
    const next = trimmed.length > 0 ? trimmed : 'http://localhost:11434';
    setSettings(prev => ({ ...prev, ollamaBaseUrl: next }));
    checkConnection(next);
  };

  const handlePersonalityChange = (trait: keyof PersonalityTraits, value: number) => {
    setSettings(prev => ({
      ...prev,
      personality: { ...prev.personality, [trait]: value }
    }));
  };

  const handleModelChange = (model: string) => {
    setSettings(prev => ({ ...prev, selectedModel: model }));
  };

  const handleAiNameChange = (value: string) => {
    const next = value.trim() || 'AiMi';
    setSettings(prev => ({ ...prev, aiName: next }));
  };

  const handleModelProfileChange = (profile: ModelProfile) => {
    setSettings(prev => ({
      ...prev,
      modelProfile: profile,
      modelParameters: MODEL_PROFILES[profile].parameters
    }));
  };

  const handleContentModeChange = (mode: ContentMode) => {
    setSettings(prev => ({
      ...prev,
      safety: { ...prev.safety, contentMode: mode }
    }));
  };

  const resetPersonality = () => {
    setSettings(prev => ({
      ...prev,
      personality: DEFAULT_APP_SETTINGS.personality
    }));
  };


  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleExpand = async () => {
    const nextMode: 'phone' | 'desktop' = isExpanded ? 'phone' : 'desktop';
    setIsExpanded(!isExpanded);
    try {
      await window.electronAPI.window.setMode(nextMode);
    } catch {
      // ignore if not available
    }
  };

  return (
    <>
      {showAgeVerification && (
        <AgeVerificationModal
          onVerify={handleAgeVerify}
          onDecline={handleAgeDecline}
        />
      )}
      
      {/* Contact Modals */}
      <AddContactModal
        isOpen={showAddContactModal}
        onClose={() => setShowAddContactModal(false)}
        onCreate={handleCreateContact}
        availablePersonas={getAllPersonas()}
      />
      
      <ContactSettingsModal
        isOpen={showContactSettingsModal}
        contact={selectedContactForSettings}
        onClose={() => {
          setShowContactSettingsModal(false);
          setSelectedContactForSettings(null);
        }}
        onSave={handleUpdateContactSettings}
        onDelete={handleDeleteContact}
        onClearMessages={handleClearContactMessages}
        onTogglePin={handleToggleContactPin}
      />
      
      <div className={`app ${isExpanded ? 'expanded' : ''}`}>
        <div className="title-bar">
          <h1>{settings.aiName}</h1>
        </div>
      
      {/* iOS Phone Frame - Desktop Only */}
      <div className="phone-frame-container">
        <div className="phone-mockup">
          <div className="phone-notch"></div>
          <div className="ios-status-bar">
            <div className="status-left">
              <span className="time">{currentTime}</span>
            </div>
            <div className="status-right">
              <span className="signal-icon">📶</span>
              <span className="wifi-icon">📡</span>
              <span className="battery-icon">🔋</span>
            </div>
          </div>

      {/* App Layout with Sidebar */}
      <div className="app-layout">
        <div className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <ContactList
            contacts={contacts}
            activeContactId={activeContactId}
            onSelectContact={handleSelectContact}
            onAddContact={() => setShowAddContactModal(true)}
          />
        </div>
        
        <div className="app-main">

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h2>Personality Settings</h2>
            <button className="reset-btn" onClick={resetPersonality}>Reset to Default</button>
          </div>

          <div className="settings-section">
            <label className="setting-label">AI Name</label>
            <div className="settings-input-row">
              <input
                className="ollama-url-input"
                type="text"
                value={settings.aiName}
                onChange={(e) => handleAiNameChange(e.target.value)}
                placeholder="AiMi"
              />
            </div>
          </div>

          <div className="settings-section">
            <label className="setting-label">Ollama URL</label>
            <div className="settings-input-row">
              <input
                className="ollama-url-input"
                type="text"
                value={settings.ollamaBaseUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, ollamaBaseUrl: e.target.value }))}
                onBlur={handleApplyBaseUrl}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyBaseUrl();
                  }
                }}
                placeholder="http://localhost:11434"
              />
            </div>
          </div>
          
          <div className="model-selection">
            <label className="setting-label">AI Model</label>
            <select
              value={settings.selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="model-select"
              disabled={!isConnected || availableModels.length === 0}
            >
              {availableModels.length > 0 ? (
                availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model} {!isConnected && ['llama2', 'mistral', 'codellama'].includes(model) ? '(fallback)' : ''}
                  </option>
                ))
              ) : (
                <option value={settings.selectedModel}>{settings.selectedModel} (connecting...)</option>
              )}
            </select>
          </div>

          <div className="model-selection">
            <label className="setting-label">Model Profile</label>
            <select
              value={settings.modelProfile}
              onChange={(e) => handleModelProfileChange(e.target.value as ModelProfile)}
              className="model-select"
            >
              {(Object.keys(MODEL_PROFILES) as ModelProfile[]).map((profile) => (
                <option key={profile} value={profile}>
                  {MODEL_PROFILES[profile].name} - {MODEL_PROFILES[profile].description}
                </option>
              ))}
            </select>
          </div>

          <div className="model-selection">
            <label className="setting-label">Content Mode</label>
            <select
              value={settings.safety.contentMode}
              onChange={(e) => handleContentModeChange(e.target.value as ContentMode)}
              className="model-select"
            >
              <option value="safe">Safe - No adult content</option>
              <option value="mature">Mature - Suggestive content allowed</option>
              <option value="adult">Adult (18+) - All content allowed</option>
            </select>
            <p className="memory-info" style={{ marginTop: '8px' }}>
              Current mode: {settings.safety.contentMode.toUpperCase()}
            </p>
          </div>
          
          <div className="memory-section">
            <label className="setting-label">Remember Conversations (Memory)</label>
            <div className="memory-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.memoryEnabled}
                  onChange={(e) => handleMemoryToggle(e.target.checked)}
                />
                <span>Enable conversation memory</span>
              </label>
              <button 
                className="clear-memory-btn"
                onClick={handleClearMemory}
                disabled={messages.length === 0}
              >
                Clear Conversation History
              </button>
            </div>
            <p className="memory-info">
              {settings.memoryEnabled 
                ? `✅ ${settings.aiName} will remember your conversations` 
                : '⚠️ Memory disabled - conversations won\'t be saved'}
            </p>
          </div>
          
          <div className="settings-grid">
            {(Object.keys(settings.personality) as Array<keyof PersonalityTraits>).map((trait) => (
              <div key={trait} className="setting-item">
                <label className="setting-label">
                  {trait.charAt(0).toUpperCase() + trait.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.personality[trait]}
                    onChange={(e) => handlePersonalityChange(trait, parseInt(e.target.value))}
                    className="personality-slider"
                  />
                  <span className="slider-value">{settings.personality[trait]}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="settings-footer">
            <p>Adjust these sliders to customize AiMi's personality and behavior</p>
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-info">
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle contacts"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                marginRight: '8px',
                padding: '4px'
              }}
            >
              ☰
            </button>
            <h2>
              {activeContactId && getContactById(activeContactId)?.avatar} {settings.aiName}
              <span className="status-indicator"></span>
              <span 
                className="content-mode-badge" 
                style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'normal',
                  backgroundColor: settings.safety.contentMode === 'safe' ? '#4CAF50' : 
                                  settings.safety.contentMode === 'mature' ? '#FF9800' : '#F44336',
                  color: 'white'
                }}
              >
                {settings.safety.contentMode.toUpperCase()}
              </span>
            </h2>
          </div>
          <div className="chat-header-actions" ref={headerMenuRef}>
            <button
              className="menu-toggle"
              onClick={() => setShowHeaderMenu((prev) => !prev)}
              aria-label="Open menu"
              aria-expanded={showHeaderMenu}
            >
              ⋯
            </button>
            {showHeaderMenu && (
              <div className="menu-dropdown" role="menu">
                <button
                  className="menu-item"
                  onClick={() => {
                    if (activeContactId) {
                      handleOpenContactSettings(activeContactId);
                    }
                    setShowHeaderMenu(false);
                  }}
                  role="menuitem"
                  title="Contact Settings"
                >
                  <span className="menu-icon">👤</span>
                  <span className="menu-label">Contact Settings</span>
                </button>
                <button
                  className="menu-item"
                  onClick={() => {
                    handlePanicButton();
                    setShowHeaderMenu(false);
                  }}
                  role="menuitem"
                  title="Panic Button - Switch to Safe Mode"
                >
                  <span className="menu-icon">🚨</span>
                  <span className="menu-label">Panic Mode</span>
                </button>
                <button
                  className="menu-item menu-item-desktop"
                  onClick={() => {
                    handleToggleExpand();
                    setShowHeaderMenu(false);
                  }}
                  role="menuitem"
                  title={isExpanded ? 'Switch to phone view' : 'Switch to desktop view'}
                >
                  <span className="menu-icon">{isExpanded ? '🗗' : '🗖'}</span>
                  <span className="menu-label">{isExpanded ? 'Phone view' : 'Desktop view'}</span>
                </button>
                <button
                  className="menu-item"
                  onClick={() => {
                    setShowSettings(!showSettings);
                    setShowHeaderMenu(false);
                  }}
                  role="menuitem"
                  title="Personality Settings"
                >
                  <span className="menu-icon">⚙️</span>
                  <span className="menu-label">Settings</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <div className="messages-area">
          {messages.length === 0 ? null : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className="message-content">
                    <div className="message-bubble">
                      {message.content}
                      {message.image && (
                        <img
                          src={message.image}
                          alt="Shared"
                          className="message-image"
                        />
                      )}
                    </div>
                    <div className="message-time">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message assistant">
                  <div className="message-content">
                    <div className="message-bubble">
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          {selectedImage && (
            <div style={{ marginBottom: '12px', position: 'relative' }}>
              <img
                src={selectedImage}
                alt="Selected"
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                }}
              />
              <button
                onClick={() => setSelectedImage(null)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.7)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                ×
              </button>
            </div>
          )}
          <div className="input-container">
            <div className="input-buttons">
              <button className="icon-button" onClick={handleImageSelect} title="Add image">
                📷
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            <textarea
              className="message-input"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
            />
            <button
              className="send-button"
              onClick={sendMessage}
              disabled={(!inputValue.trim() && !selectedImage) || isTyping}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
        </div> {/* End app-main */}
      </div> {/* End app-layout */}
        </div>
      </div>
    </div>
    </>
  );
};

export default App;
