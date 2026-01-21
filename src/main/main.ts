import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import axios from 'axios';

let mainWindow: BrowserWindow | null = null;

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
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
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
    const response = await axios.get(`${apiBaseUrl}/api/tags`);
    return { success: true, models: response.data.models };
  } catch (error: any) {
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
