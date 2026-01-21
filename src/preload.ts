import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ollama: {
    chat: (params: { model: string; messages: any[]; images?: string[] }) => 
      ipcRenderer.invoke('ollama:chat', params),
    listModels: () => 
      ipcRenderer.invoke('ollama:listModels'),
    checkConnection: () => 
      ipcRenderer.invoke('ollama:checkConnection'),
  },
});
