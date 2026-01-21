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
  memory: {
    save: (params: { messages: any[] }) => 
      ipcRenderer.invoke('memory:save', params),
    load: () => 
      ipcRenderer.invoke('memory:load'),
    clear: () => 
      ipcRenderer.invoke('memory:clear'),
  },
  images: {
    getRandom: () => 
      ipcRenderer.invoke('images:getRandom'),
    list: () => 
      ipcRenderer.invoke('images:list'),
  },
  window: {
    setMode: (mode: 'phone' | 'desktop') => 
      ipcRenderer.invoke('window:setMode', mode),
  },
});
