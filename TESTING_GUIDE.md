# Testing Guide for Multi-Message and Image Features

This guide will help you manually test the newly implemented features.

## Prerequisites

1. **Ollama must be installed and running**
   ```bash
   ollama pull llama2
   ollama serve
   ```

2. **Start the application**
   ```bash
   npm install
   npm run dev
   ```

## Feature 1: Conversation Memory

### Test Memory Persistence

1. **Enable Memory**
   - Click the ⚙️ Settings icon
   - Ensure "Enable conversation memory" checkbox is checked
   - You should see "✅ AiMi will remember your conversations"

2. **Send Messages**
   - Send a few messages to AiMi (e.g., "Hi, my name is John")
   - Get responses back
   - Send another message (e.g., "What's my name?")
   - AiMi should remember your name from the previous message

3. **Test Persistence**
   - Close the application completely
   - Reopen the application
   - You should see your previous conversation history loaded
   - The last 10 messages are used as context for new responses

4. **Test Clear History**
   - Open Settings
   - Click "Clear Conversation History" button
   - The chat should clear completely
   - Button should be disabled when there are no messages

5. **Test Memory Toggle**
   - Disable memory using the checkbox
   - You should see "⚠️ Memory disabled - conversations won't be saved"
   - Send some messages
   - Close and reopen the app
   - Messages should NOT be loaded (fresh start)

**Expected Results:**
- ✅ Conversations persist across app restarts when memory is enabled
- ✅ Clear button removes all history
- ✅ Memory toggle affects save/load behavior
- ✅ Last 10 messages provide context for better responses

## Feature 2: Multi-Message Responses

### Test Message Splitting

1. **Send Complex Questions**
   - Ask questions that might elicit longer responses
   - Examples:
     - "Tell me a story about your day"
     - "Explain what you like to do for fun"
     - "What are your thoughts on relationships?"

2. **Observe Response Behavior**
   - Watch for AiMi sending multiple separate messages
   - Messages should appear with realistic delays (1.5-2.5 seconds between them)
   - Typing indicator should appear between messages
   - This happens in ~30% of responses for messages over 100 characters

3. **Check Message Flow**
   - Multiple messages should feel natural and conversational
   - Each message part should be coherent (not cut off mid-word)
   - Sentence boundaries should be respected

**Expected Results:**
- ✅ ~30% of longer responses are split into 2-3 messages
- ✅ Delays between messages feel natural (1.5-2.5s)
- ✅ Typing indicator shows between messages
- ✅ Messages split at natural sentence boundaries

## Feature 3: Random Image Sending

### Test Image Feature

1. **Verify Images Exist**
   - Check that `assets/aimi-images/` folder has images
   - Default placeholder SVG files should be present
   - You can add your own JPG, PNG, GIF, SVG, or WebP files

2. **Send Messages to Trigger Images**
   - Have a conversation with AiMi
   - After some responses, AiMi should randomly send an image
   - This happens in ~30% of responses
   - Images appear as separate messages after text responses

3. **Test Image Display**
   - Images should display correctly in the chat
   - Images should have a timestamp
   - Images can be sent without text (empty content)

4. **Test Image Variety**
   - Over multiple conversations, different images should appear
   - The system tracks the last 5 used images to avoid repetition

5. **Add Custom Images** (Optional)
   - Navigate to `assets/aimi-images/`
   - Add your own image files
   - Continue chatting
   - Your custom images should appear in the random selection

**Expected Results:**
- ✅ ~30% of responses include a random image
- ✅ Images display correctly in the chat
- ✅ Images appear with natural delays (1-2s after text)
- ✅ Good variety in image selection (no immediate repeats)
- ✅ Custom images can be added and are used

## Integration Testing

### Test All Features Together

1. **Enable Memory**
   - Turn on conversation memory

2. **Have a Conversation**
   - Send several messages
   - Observe multi-message responses
   - Watch for random images

3. **Restart and Continue**
   - Close the app
   - Reopen the app
   - Conversation should be restored
   - Continue chatting
   - Context from previous session should be maintained

4. **Test Settings Persistence**
   - Change personality settings
   - Close and reopen the app
   - Settings should be preserved
   - Memory setting should be preserved

**Expected Results:**
- ✅ All features work together seamlessly
- ✅ No conflicts between features
- ✅ Settings persist across sessions
- ✅ Memory enhances conversation quality

## Common Issues and Solutions

### Memory Not Working
- Check if checkbox is enabled in Settings
- Verify the app has write permissions
- Check browser console for errors (F12 in dev mode)
- Try clearing history and starting fresh

### Images Not Appearing
- Verify files exist in `assets/aimi-images/`
- Check file extensions are supported
- Images appear randomly (~30% chance), keep chatting
- Check browser console for errors

### Multi-Messages Not Appearing
- Only longer responses (>100 chars) are split
- Only happens ~30% of the time
- Try asking more complex questions
- Feature is working even if not every response splits

## Performance Notes

- First message after app start might be slower (model loading)
- Memory system auto-saves on every message change
- Image loading is asynchronous and shouldn't block chat
- Multi-message delays are intentional for natural flow

## Success Criteria

All features are working if:
- ✅ Conversations persist when memory is enabled
- ✅ Some responses are split into multiple messages naturally
- ✅ Random images appear in conversations occasionally
- ✅ Settings (memory, personality) persist across restarts
- ✅ No errors in console during normal operation
- ✅ App remains responsive throughout

## Reporting Issues

If you encounter any issues:
1. Check the browser console (F12) for errors
2. Check the terminal where you ran `npm run dev` for backend errors
3. Note the exact steps to reproduce the issue
4. Note what you expected vs. what actually happened
5. Include screenshots if applicable

---

**Note:** All features work with the local Ollama installation only. No data is sent to external servers. All memory is stored locally on your device.
