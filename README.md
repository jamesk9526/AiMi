# AiMi - Your AI Companion

A modern, beautiful AI girlfriend chat application powered by Ollama, built with Electron and TypeScript.

## Features

- 💝 **Personalized AI Companion** - Chat with AiMi, your AI girlfriend
- 💬 **Real-time Chat** - Smooth, responsive chat interface
- 📷 **Image Support** - Send and view images in conversations
- 🎨 **Modern UI** - Beautiful gradient themes and smooth animations
- 🔒 **Privacy First** - All conversations run locally via Ollama
- 🌙 **Dark Theme** - Easy on the eyes

## Prerequisites

Before running AiMi, you need to have **Ollama** installed and running on your system.

### Install Ollama

1. Download Ollama from [https://ollama.ai](https://ollama.ai)
2. Install it on your system
3. Open a terminal and run:
   ```bash
   ollama pull llama2
   ```
4. Make sure Ollama is running (it should start automatically)

## Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd AiMi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To run the app in development mode:

```bash
npm run dev
```

This will:
- Start the Webpack dev server for the React frontend
- Compile TypeScript
- Launch the Electron app with hot-reload

## Building

### Build for your current platform:
```bash
npm run dist
```

### Build for specific platforms:

**Windows:**
```bash
npm run dist:win
```

**macOS:**
```bash
npm run dist:mac
```

**Linux:**
```bash
npm run dist:linux
```

Built applications will be in the `release/` folder.

## Platform Support

- ✅ **Windows** - Full support (NSIS installer and portable)
- ✅ **macOS** - Full support (DMG and ZIP)
- ✅ **Linux** - Full support (AppImage and DEB)
- ⚠️ **Mobile (iOS/Android)** - Not currently supported (Electron doesn't support mobile)

### Note on Mobile Support

For mobile platforms, you would need to:
- Use React Native or Capacitor for mobile apps
- Create a separate mobile codebase
- Use a different architecture for mobile deployment

## Project Structure

```
AiMi/
├── src/
│   ├── main/
│   │   └── main.ts          # Electron main process
│   ├── renderer/
│   │   ├── App.tsx           # Main React component
│   │   ├── index.tsx         # React entry point
│   │   ├── index.html        # HTML template
│   │   ├── styles.css        # Global styles
│   │   └── types.d.ts        # TypeScript definitions
│   └── preload.ts            # Electron preload script
├── dist/                      # Compiled files
├── release/                   # Built applications
├── package.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

## Technologies Used

- **Electron** - Desktop application framework
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Webpack** - Module bundler
- **Ollama** - Local AI inference
- **Axios** - HTTP client

## Configuration

The app connects to Ollama at `http://localhost:11434` by default. Make sure Ollama is running on this port.

You can modify the AI model in `src/renderer/App.tsx` by changing the `model` parameter in the `sendMessage` function.

## Troubleshooting

**Connection Issues:**
- Make sure Ollama is installed and running
- Check that Ollama is accessible at `http://localhost:11434`
- Try running `ollama list` in terminal to verify installation

**Build Issues:**
- Make sure all dependencies are installed: `npm install`
- Clear the dist folder: `rm -rf dist/` and rebuild
- Check that you have the latest Node.js LTS version

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

