import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ollama: {
    chat: (params: { model: string; messages: any[]; images?: string[]; baseUrl?: string }) => 
      ipcRenderer.invoke('ollama:chat', params),
    listModels: (params?: { baseUrl?: string }) => 
      ipcRenderer.invoke('ollama:listModels', params || {}),
    checkConnection: (params?: { baseUrl?: string }) => 
      ipcRenderer.invoke('ollama:checkConnection', params || {}),
  },
});
