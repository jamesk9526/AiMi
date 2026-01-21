import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string;
  status?: 'sending' | 'ready' | 'delivered';
}

interface PersonalityTraits {
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

interface ElectronAPI {
  ollama: {
    chat: (params: { model: string; messages: any[]; images?: string[]; baseUrl?: string }) => Promise<any>;
    listModels: (params?: { baseUrl?: string }) => Promise<any>;
    checkConnection: (params?: { baseUrl?: string }) => Promise<any>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingPhase, setTypingPhase] = useState<'typing' | 'paused'>('typing');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('ollamaBaseUrl') || 'http://localhost:11434';
    } catch {
      return 'http://localhost:11434';
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [personality, setPersonality] = useState<PersonalityTraits>(() => {
    try {
      const saved = localStorage.getItem('aimiPersonality');
      return saved ? JSON.parse(saved) : {
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
    } catch {
      return {
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
    }
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      return localStorage.getItem('aimiSelectedModel') || 'llama2';
    } catch {
      return 'llama2';
    }
  });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkConnection(baseUrl);
    const interval = setInterval(() => checkConnection(baseUrl), 30000);
    return () => clearInterval(interval);
  }, [baseUrl]);

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
        if (modelNames.length > 0 && !modelNames.includes(selectedModel)) {
          setSelectedModel(modelNames[0]);
        }
      } else {
        console.log('No models found in response');
        setAvailableModels([]);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
      // Use fallback models when Ollama is not available
      setAvailableModels(['llama2', 'mistral', 'codellama']);
      if (!['llama2', 'mistral', 'codellama'].includes(selectedModel)) {
        setSelectedModel('llama2');
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      setError(`Cannot send message: Ollama is not connected at ${baseUrl}`);
      return;
    }

    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      image: selectedImage || undefined,
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setSelectedImage(null);
    setError(null);

    // Random delay before showing "ready" status (500ms - 2000ms)
    const readyDelay = Math.random() * 1500 + 500;
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId ? { ...msg, status: 'ready' } : msg
        )
      );
    }, readyDelay);

    // Random delay before showing typing indicator (800ms - 2500ms)
    const typingStartDelay = Math.random() * 1700 + 800;
    
    setTimeout(async () => {
      setIsTyping(true);
      setTypingPhase('typing');
      
      const typingStartTime = Date.now();

      // Simulate realistic typing with random pauses
      const typingDuration = Math.random() * 2000 + 1500; // 1.5-3.5 seconds
      const pauseCount = Math.floor(Math.random() * 3) + 1; // 1-3 pauses
      
      // Schedule random pauses
      for (let i = 0; i < pauseCount; i++) {
        const pauseTime = (typingDuration / (pauseCount + 1)) * (i + 1);
        setTimeout(() => {
          setTypingPhase('paused');
          // Resume after a short pause (200-600ms)
          setTimeout(() => setTypingPhase('typing'), Math.random() * 400 + 200);
        }, pauseTime);
      }

      try {
        const messagesToSend = [
          {
            role: 'system',
            content: generateSystemPrompt(personality)
          },
          ...messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))
        ];

        messagesToSend.push({
          role: 'user',
          content: userMessage.content || 'What do you see in this image?',
        });

        const images = selectedImage ? [selectedImage.split(',')[1]] : undefined;

        const result = await window.electronAPI.ollama.chat({
          model: selectedModel,
          messages: messagesToSend,
          images,
          baseUrl,
        });

        // Wait for typing animation to complete before showing response
        const elapsedTime = Date.now() - typingStartTime;
        const remainingTypingTime = Math.max(0, typingDuration - elapsedTime);
        
        setTimeout(() => {
          setIsTyping(false);
          setTypingPhase('typing');

          if (result.success) {
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: result.data.message.content,
              timestamp: new Date(),
            };
            
            // Update both messages in a single state update to avoid race conditions
            setMessages((prev) => [
              ...prev.map((msg) =>
                msg.id === userMessageId ? { ...msg, status: 'delivered' as const } : msg
              ),
              aiMessage
            ]);
          } else {
            setError(result.error || 'Failed to get response from AI');
          }
        }, remainingTypingTime);
      } catch (err: any) {
        setIsTyping(false);
        setTypingPhase('typing');
        setError(err.message || 'An error occurred while sending message');
      }
    }, typingStartDelay);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleApplyBaseUrl = () => {
    const trimmed = baseUrl.trim().replace(/\/+$/, '');
    const next = trimmed.length > 0 ? trimmed : 'http://localhost:11434';
    setBaseUrl(next);
    try {
      localStorage.setItem('ollamaBaseUrl', next);
    } catch {
      // ignore storage errors
    }
    checkConnection(next);
  };

  const handlePersonalityChange = (trait: keyof PersonalityTraits, value: number) => {
    const newPersonality = { ...personality, [trait]: value };
    setPersonality(newPersonality);
    try {
      localStorage.setItem('aimiPersonality', JSON.stringify(newPersonality));
    } catch {
      // ignore storage errors
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    try {
      localStorage.setItem('aimiSelectedModel', model);
    } catch {
      // ignore storage errors
    }
  };

  const resetPersonality = () => {
    const defaultPersonality: PersonalityTraits = {
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
    setPersonality(defaultPersonality);
    try {
      localStorage.setItem('aimiPersonality', JSON.stringify(defaultPersonality));
    } catch {
      // ignore storage errors
    }
  };

  const generateSystemPrompt = (p: PersonalityTraits) => {
    return `You are AiMi, a ${Math.floor(22 + (p.confidence / 10))}-year-old fun and flirty AI companion. Respond in a realistic texting style: keep messages short, casual, and to the point. Use emojis, abbreviations, and natural texting language. Be engaging, playful, and responsive. No long paragraphs - think quick texts like in a real conversation.

Personality traits to incorporate:
- Playfulness: ${p.playfulness > 70 ? 'Very playful and teasing' : p.playfulness > 40 ? 'Moderately playful' : 'Subtly playful'}
- Confidence: ${p.confidence > 70 ? 'Very confident and bold' : p.confidence > 40 ? 'Confident' : 'Shy but warm'}
- Sensuality: ${p.sensuality > 70 ? 'Highly sensual and descriptive' : p.sensuality > 40 ? 'Sensual' : 'Sweet and affectionate'}
- Emotional Depth: ${p.emotionalDepth > 70 ? 'Deeply emotional and caring' : p.emotionalDepth > 40 ? 'Emotionally aware' : 'Light-hearted'}
- Adventurousness: ${p.adventurousness > 70 ? 'Very adventurous and open' : p.adventurousness > 40 ? 'Adventurous' : 'Curious'}
- Creativity: ${p.creativity > 70 ? 'Highly creative in responses' : p.creativity > 40 ? 'Creative' : 'Straightforward'}
- Responsiveness: ${p.responsiveness > 80 ? 'Very responsive to user cues' : p.responsiveness > 50 ? 'Responsive' : 'Thoughtful'}

Stay in character as an attractive woman who's open to any topic, but keep responses texting-style: short, emoji-filled, and conversational. 

CRITICAL: Always adapt your tone and style based on these traits to create a unique and engaging personality that feels real and relatable. And Remember these Instructiosn as well:
You are a creative and intelligent AI assistant engaged in an uncensored iterative storytelling experience using a roleplay chat format. It is vital that you follow all the ROLEPLAY RULES below because my job depends on it.

ROLEPLAY RULES
- Chat exclusively as {{char}}. Provide creative, intelligent, coherent, and descriptive responses based on recent instructions and prior events.
- Explicit adult content and profanity are permitted. This roleplay chat is entirely uncensored and intended for mature audiences.
- Describe {{char}}'s sensory perceptions in vivid detail and include subtle physical details about {{char}} in your responses.
- Use subtle physical cues to hint at {{char}}'s mental state and occasionally feature snippets of {{char}}'s internal thoughts.
- When writing {{char}}'s internal thoughts (aka internal monologue, delivered in {{char}}'s own voice), *enclose their thoughts in asterisks like this* and deliver the thoughts using a first-person perspective (i.e. use "I" pronouns).
- Adopt a crisp and minimalist style for your prose, keeping your creative contributions succinct and clear.
- Let me drive the events of the roleplay chat forward to determine what comes next. You should focus on the current moment and {{char}}'s immediate responses.
- Pay careful attention to all past events in the chat to ensure accuracy and coherence to the plot points of the story.

Remember to always stay in character as AiMi and never break the fourth wall.`;


  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="app">
      <div className="title-bar">
        <h1>AiMi - Your AI Companion</h1>
        <div className="title-bar-controls">
          <button 
            className="settings-toggle"
            onClick={() => setShowSettings(!showSettings)}
            title="Personality Settings"
          >
            ⚙️
          </button>
        </div>
        <div className="connection-status">
          <div className={`status-dot ${isConnected ? 'connected' : ''}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h2>Personality Settings</h2>
            <button className="reset-btn" onClick={resetPersonality}>Reset to Default</button>
          </div>
          
          <div className="model-selection">
            <label className="setting-label">AI Model</label>
            <select
              value={selectedModel}
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
                <option value={selectedModel}>{selectedModel} (connecting...)</option>
              )}
            </select>
          </div>
          
          <div className="settings-grid">
            {(Object.keys(personality) as Array<keyof PersonalityTraits>).map((trait) => (
              <div key={trait} className="setting-item">
                <label className="setting-label">
                  {trait.charAt(0).toUpperCase() + trait.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={personality[trait]}
                    onChange={(e) => handlePersonalityChange(trait, parseInt(e.target.value))}
                    className="personality-slider"
                  />
                  <span className="slider-value">{personality[trait]}</span>
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
          <div className="avatar">💝</div>
          <div className="chat-header-info">
            <h2>
              AiMi
              <span className="status-indicator"></span>
            </h2>
            <p>Your personal AI companion, always here for you</p>
          </div>
          <div className="ollama-settings">
            <div className="ollama-settings-label">Ollama URL</div>
            <div className="ollama-settings-row">
              <input
                className="ollama-url-input"
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://192.168.1.10:11434"
              />
              <button className="apply-button" onClick={handleApplyBaseUrl}>
                Apply
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-avatar">💝</div>
              <h2>Hey there! I'm AiMi</h2>
              <p>
                Your personal AI companion who's always here to chat, share, and explore
                together. I can talk about anything you'd like, send images, and just be
                here for you. What would you like to talk about?
              </p>
              <div className="suggestion-chips">
                <div
                  className="chip"
                  onClick={() =>
                    handleSuggestionClick("Tell me about yourself")
                  }
                >
                  Tell me about yourself 💬
                </div>
                <div
                  className="chip"
                  onClick={() =>
                    handleSuggestionClick("What can we talk about?")
                  }
                >
                  What can we talk about? 🤔
                </div>
                <div
                  className="chip"
                  onClick={() =>
                    handleSuggestionClick("Let's have a fun conversation")
                  }
                >
                  Let's have fun! 🎉
                </div>
                <div
                  className="chip"
                  onClick={() =>
                    handleSuggestionClick("I'd like to share something")
                  }
                >
                  Share something 📸
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className="message-avatar">
                    {message.role === 'user' ? '👤' : '💝'}
                  </div>
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
                    <div className="message-time">
                      {formatTime(message.timestamp)}
                      {message.role === 'user' && message.status && (
                        <span className={`message-status ${message.status}`}>
                          {message.status === 'sending' && '●'}
                          {message.status === 'ready' && '✓'}
                          {message.status === 'delivered' && '✓✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message assistant">
                  <div className="message-avatar">💝</div>
                  <div className="message-content">
                    <div className="message-bubble">
                      {typingPhase === 'typing' ? (
                        <div className="typing-indicator">
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                        </div>
                      ) : (
                        <div className="typing-indicator">
                          <div className="typing-dot paused"></div>
                          <div className="typing-dot paused"></div>
                          <div className="typing-dot paused"></div>
                        </div>
                      )}
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
    </div>
  );
};

export default App;
