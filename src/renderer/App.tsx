import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string;
}

interface ElectronAPI {
  ollama: {
    chat: (params: { model: string; messages: any[]; images?: string[] }) => Promise<any>;
    listModels: () => Promise<any>;
    checkConnection: () => Promise<any>;
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
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const checkConnection = async () => {
    try {
      const result = await window.electronAPI.ollama.checkConnection();
      setIsConnected(result.connected);
      if (!result.connected) {
        setError('Ollama is not running. Please start Ollama and restart the app.');
      } else {
        setError(null);
      }
    } catch (err) {
      setIsConnected(false);
      setError('Failed to connect to Ollama');
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
      setError('Cannot send message: Ollama is not connected');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      image: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setSelectedImage(null);
    setIsTyping(true);
    setError(null);

    try {
      const messagesToSend = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      messagesToSend.push({
        role: 'user',
        content: userMessage.content || 'What do you see in this image?',
      });

      const images = selectedImage ? [selectedImage.split(',')[1]] : undefined;

      const result = await window.electronAPI.ollama.chat({
        model: 'llama2',
        messages: messagesToSend,
        images,
      });

      setIsTyping(false);

      if (result.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.message.content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        setError(result.error || 'Failed to get response from AI');
      }
    } catch (err: any) {
      setIsTyping(false);
      setError(err.message || 'An error occurred while sending message');
    }
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
        <div className="connection-status">
          <div className={`status-dot ${isConnected ? 'connected' : ''}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

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
                    <div className="message-time">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message assistant">
                  <div className="message-avatar">💝</div>
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
    </div>
  );
};

export default App;
