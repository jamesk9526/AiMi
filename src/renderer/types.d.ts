export {};

declare global {
  interface Window {
    electronAPI: {
      ollama: {
        chat: (params: { model: string; messages: any[]; images?: string[]; baseUrl?: string }) => Promise<any>;
        listModels: (params?: { baseUrl?: string }) => Promise<any>;
        checkConnection: (params?: { baseUrl?: string }) => Promise<any>;
      };
    };
  }
}
