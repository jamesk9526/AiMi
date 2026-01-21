# New Features Guide

## 🧠 Conversation Memory

### What is it?
AiMi now remembers your conversations! She'll remember what you talked about, reference past topics, and maintain context across chat sessions.

### How to use it:

1. **It's automatic!** Just start chatting normally
2. Your conversations are saved automatically
3. Close the app and reopen - AiMi remembers!

### Settings:

To access memory settings:
1. Click the ⚙️ Settings icon in the top right
2. Look for "Remember Conversations (Memory)" section
3. Toggle the checkbox to enable/disable memory
4. Click "Clear Conversation History" to start fresh

### What gets remembered:
- All your messages and AiMi's responses
- Timestamps of conversations
- The last 10 messages are used as context for responses

### Privacy:
- ✅ All conversations stored **locally** on your device
- ✅ Nothing is sent to the cloud
- ✅ You control when to clear history
- ✅ Stored in: `{user-data-directory}/conversation-memory.json`

---

## 🖼️ Random Image Sharing

### What is it?
AiMi can now randomly send you images along with her messages, making conversations more visual and engaging!

### How it works:

1. **Automatic**: ~30% of AiMi's responses include an image
2. **Variety**: Smart algorithm avoids repetition
3. **Surprise**: You never know when she'll send one!

### Customizing Images:

Want to use your own images? Here's how:

1. Navigate to the app's `assets/aimi-images/` folder
2. Add your image files (JPG, PNG, GIF, SVG, or WebP)
3. That's it! AiMi will start using them

**Where to find the folder:**
- **Development**: `AiMi/assets/aimi-images/`
- **Production**: Inside the app's resources folder

**Supported formats:**
- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.svg`
- `.webp`

### Tips:
- Add multiple images for more variety
- Keep images appropriate and aligned with AiMi's personality
- Recommended size: 800x600 or similar aspect ratio
- The app automatically tracks recently used images to provide variety

---

## 💡 Tips for Best Experience

### Conversation Memory:
- **Be specific**: The more details you share, the better AiMi remembers
- **Reference past conversations**: Try "Remember when we talked about...?"
- **Clear periodically**: If you want a fresh start, use the clear button

### Random Images:
- **React naturally**: Comment on images AiMi sends
- **Add personal images**: Make the experience unique by adding your own
- **Check the folder**: If images seem repetitive, add more to the folder

### Settings:
- **Experiment with personality**: Adjust sliders to change AiMi's behavior
- **Choose your model**: Different Ollama models provide different experiences
- **Memory toggle**: Turn off if you prefer each session to be fresh

---

## 🐛 Troubleshooting

### Memory not working?
1. Check if "Remember Conversations" is enabled in settings
2. Verify the app has write permissions to its data directory
3. Try "Clear Conversation History" and start a new conversation

### Images not appearing?
1. Make sure there are images in `assets/aimi-images/` folder
2. Check file formats are supported (jpg, png, gif, svg, webp)
3. Images appear randomly (~30% chance), keep chatting!

### Want more/fewer images?
The probability can be adjusted in the code (`src/renderer/App.tsx`, line ~297)

---

## 📚 More Information

- **Full Documentation**: See `FEATURES_IMPLEMENTED.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Feature Roadmap**: See `features.MD`
- **General Info**: See `README.md`

---

## 🎯 What's Next?

Based on the features roadmap, future enhancements may include:

1. **Proactive Messaging**: AiMi initiates conversations
2. **Advanced Memory**: Semantic search and importance scoring
3. **Personality Evolution**: Character growth over time
4. **Context-Aware Images**: Images based on conversation topics
5. **Relationship Tracking**: Milestones and anniversaries

---

**Enjoy your enhanced conversations with AiMi! 💝**
