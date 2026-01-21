import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

let mainWindow: BrowserWindow | null = null;
let recentlyUsedImages: string[] = []; // Track recently used images to avoid repetition

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0a0a0a',
      symbolColor: '#ffffff',
      height: 40
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload.js'),
    },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3001');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const normalizeBaseUrl = (baseUrl?: string) => {
  const fallback = 'http://localhost:11434';
  if (!baseUrl || typeof baseUrl !== 'string') {
    return fallback;
  }
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : fallback;
};

// IPC Handlers for Ollama API
ipcMain.handle('ollama:chat', async (event, { model, messages, images, baseUrl }) => {
  try {
    const apiBaseUrl = normalizeBaseUrl(baseUrl);
    const response = await axios.post(`${apiBaseUrl}/api/chat`, {
      model: model || 'llama2',
      messages: messages,
      images: images,
      stream: false
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Ollama API Error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to connect to Ollama' 
    };
  }
});

ipcMain.handle('ollama:listModels', async (event, { baseUrl }) => {
  try {
    const apiBaseUrl = normalizeBaseUrl(baseUrl);
    console.log('Main: Fetching models from:', apiBaseUrl);
    const response = await axios.get(`${apiBaseUrl}/api/tags`);
    console.log('Main: Models response:', response.data);
    return { success: true, data: { models: response.data.models || [] } };
  } catch (error: any) {
    console.log('Main: Error fetching models:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ollama:checkConnection', async (event, { baseUrl }) => {
  try {
    const apiBaseUrl = normalizeBaseUrl(baseUrl);
    await axios.get(`${apiBaseUrl}/api/tags`);
    return { success: true, connected: true };
  } catch (error) {
    return { success: false, connected: false };
  }
});

// Memory System - Save conversation history
ipcMain.handle('memory:save', async (event, { messages }) => {
  try {
    const userDataPath = app.getPath('userData');
    const memoryPath = path.join(userDataPath, 'conversation-memory.json');
    
    // Ensure the directory exists
    const dir = path.dirname(memoryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save the conversation history
    fs.writeFileSync(memoryPath, JSON.stringify(messages, null, 2));
    return { success: true };
  } catch (error: any) {
    console.error('Error saving memory:', error);
    return { success: false, error: error.message };
  }
});

// Memory System - Load conversation history
ipcMain.handle('memory:load', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const memoryPath = path.join(userDataPath, 'conversation-memory.json');
    
    if (fs.existsSync(memoryPath)) {
      const data = fs.readFileSync(memoryPath, 'utf-8');
      const messages = JSON.parse(data);
      return { success: true, messages };
    }
    
    return { success: true, messages: [] };
  } catch (error: any) {
    console.error('Error loading memory:', error);
    return { success: false, error: error.message, messages: [] };
  }
});

// Memory System - Clear conversation history
ipcMain.handle('memory:clear', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const memoryPath = path.join(userDataPath, 'conversation-memory.json');
    
    if (fs.existsSync(memoryPath)) {
      fs.unlinkSync(memoryPath);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error clearing memory:', error);
    return { success: false, error: error.message };
  }
});

// Random Image System - Get a random image from the assets folder
ipcMain.handle('images:getRandom', async () => {
  try {
    // In development, images are in the source directory
    // In production, they're in the resources directory
    let imagesPath: string;
    
    if (process.env.NODE_ENV === 'development') {
      imagesPath = path.join(__dirname, '..', '..', 'assets', 'aimi-images');
    } else {
      imagesPath = path.join(process.resourcesPath, 'assets', 'aimi-images');
    }
    
    // Check if the directory exists
    if (!fs.existsSync(imagesPath)) {
      console.log('Images directory not found:', imagesPath);
      return { success: false, error: 'Images directory not found' };
    }
    
    // Get all image files
    const files = fs.readdirSync(imagesPath);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext);
    });
    
    if (imageFiles.length === 0) {
      return { success: false, error: 'No images found in folder' };
    }
    
    // Select a random image, avoiding recently used ones for better variety
    let randomImage: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
      attempts++;
    } while (
      recentlyUsedImages.includes(randomImage) && 
      attempts < maxAttempts && 
      imageFiles.length > 1
    );
    
    // Track this image as recently used (keep last 5)
    recentlyUsedImages.push(randomImage);
    if (recentlyUsedImages.length > 5) {
      recentlyUsedImages.shift();
    }
    
    const imagePath = path.join(imagesPath, randomImage);
    
    // Read the image as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(randomImage).toLowerCase();
    let mimeType = 'image/jpeg';
    
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.svg') mimeType = 'image/svg+xml';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    
    return { success: true, image: base64Image, filename: randomImage };
  } catch (error: any) {
    console.error('Error getting random image:', error);
    return { success: false, error: error.message };
  }
});

// Random Image System - List all available images
ipcMain.handle('images:list', async () => {
  try {
    let imagesPath: string;
    
    if (process.env.NODE_ENV === 'development') {
      imagesPath = path.join(__dirname, '..', '..', 'assets', 'aimi-images');
    } else {
      imagesPath = path.join(process.resourcesPath, 'assets', 'aimi-images');
    }
    
    if (!fs.existsSync(imagesPath)) {
      return { success: true, images: [] };
    }
    
    const files = fs.readdirSync(imagesPath);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext);
    });
    
    return { success: true, images: imageFiles };
  } catch (error: any) {
    console.error('Error listing images:', error);
    return { success: false, error: error.message, images: [] };
  }
});

// Window mode handler - resize window based on mode
ipcMain.handle('window:setMode', async (event, mode: 'phone' | 'desktop') => {
  try {
    if (!mainWindow) {
      return { success: false, error: 'Window not found' };
    }

    if (mode === 'phone') {
      mainWindow.setSize(420, 900);
    } else {
      mainWindow.setSize(1200, 800);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error setting window mode:', error);
    return { success: false, error: error.message };
  }
});
