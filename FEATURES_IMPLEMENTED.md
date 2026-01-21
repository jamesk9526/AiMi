# Implemented Features

This document describes the features that have been implemented as part of the conversation memory and random image enhancement.

## 1. Conversation Memory System

### Overview
AiMi now has a memory system that remembers past conversations and maintains context across sessions.

### Features Implemented

#### Persistent Storage
- Conversations are automatically saved to local storage
- Memory persists across app restarts
- All messages including timestamps are preserved

#### Context-Aware Responses
- The last 10 messages are used as context for each new response
- AiMi references past conversations naturally when relevant
- System prompt is enhanced with conversation context awareness

#### Memory Management UI
- Toggle to enable/disable memory in Settings
- "Clear Conversation History" button to reset all saved conversations
- Memory setting is persisted in localStorage

### How It Works

1. **Auto-Save**: Every time a message is sent or received, the conversation is automatically saved
2. **Auto-Load**: When the app starts, if memory is enabled, previous conversations are loaded
3. **Context Window**: The last 10 messages are sent to the LLM for better context awareness
4. **Storage Location**: Conversations are stored in the app's userData directory as `conversation-memory.json`

### Usage

1. Open Settings (⚙️ icon)
2. Check/uncheck "Remember Conversations (Memory)"
3. Use "Clear Conversation History" to start fresh

## 2. Random Image Sending Feature

### Overview
AiMi can now randomly attach images from a local folder when responding to messages, making conversations more engaging and visual.

### Features Implemented

#### Random Image Selection
- 30% chance that AiMi will attach a random image with her response
- Images are selected from the `assets/aimi-images` folder
- Supports multiple image formats: JPG, PNG, GIF, SVG, WebP

#### Image Management
- Images are stored locally in `assets/aimi-images/`
- Easy to add custom images by placing them in the folder
- Sample placeholder images included for testing

#### IPC Handlers
- `images:getRandom` - Gets a random image from the folder
- `images:list` - Lists all available images

### How It Works

1. **Random Selection**: After generating a text response, there's a 30% chance an image will be attached
2. **Base64 Encoding**: Images are read from the filesystem and converted to base64 data URIs
3. **Display**: Images appear in the chat alongside the message text

### Adding Custom Images

1. Navigate to `assets/aimi-images/` folder
2. Add your image files (jpg, png, gif, svg, webp)
3. Images will be automatically detected and used
4. No need to restart the app

## Technical Implementation

### File Changes

1. **src/main/main.ts**
   - Added `fs` module for file system operations
   - Implemented memory IPC handlers: `memory:save`, `memory:load`, `memory:clear`
   - Implemented image IPC handlers: `images:getRandom`, `images:list`
   - Handle both development and production paths for images

2. **src/preload.ts**
   - Exposed memory and image APIs to renderer process
   - Added type-safe IPC bindings

3. **src/renderer/App.tsx**
   - Added `memoryEnabled` state
   - Implemented conversation loading on startup
   - Implemented auto-save on message changes
   - Added 30% probability for random image attachment
   - Enhanced system prompt with conversation context
   - Added memory management UI controls

4. **src/renderer/styles.css**
   - Added styles for memory settings section
   - Styled checkbox controls

5. **assets/aimi-images/**
   - Created folder for random images
   - Added sample SVG placeholder images
   - Created README with instructions

### API Surface

#### Window.electronAPI.memory
```typescript
{
  save: (params: { messages: any[] }) => Promise<any>;
  load: () => Promise<any>;
  clear: () => Promise<any>;
}
```

#### Window.electronAPI.images
```typescript
{
  getRandom: () => Promise<any>;
  list: () => Promise<any>;
}
```

## Future Enhancements

Based on the features.md roadmap, potential next steps include:

1. **Advanced Memory Features**
   - Semantic search through conversation history
   - Memory importance scoring
   - User profile building
   - Relationship timeline tracking

2. **Proactive Messaging**
   - AiMi initiates conversations when idle
   - Time-based and context-aware messages
   - Background notifications

3. **Enhanced Image Features**
   - AI-generated images specific to conversation context
   - Image description and understanding
   - Mood-based image selection

4. **Personality Evolution**
   - Character growth based on interactions
   - Emotional state persistence
   - Relationship progression tracking

## Testing Checklist

- [x] Build succeeds without errors
- [ ] Memory saves conversations correctly
- [ ] Memory loads conversations on startup
- [ ] Clear memory button works
- [ ] Memory toggle persists setting
- [ ] Random images appear in ~30% of responses
- [ ] Images display correctly in chat
- [ ] Context window provides better responses
- [ ] App works with memory disabled

## Notes

- Memory is enabled by default
- Conversation history is stored locally only (privacy first)
- Image folder can be customized with user's own images
- The 30% probability for images can be adjusted in App.tsx (around line 297)
