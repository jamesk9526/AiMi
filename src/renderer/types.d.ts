export {};

declare global {
  interface Window {
    electronAPI: {
      ollama: {
        chat: (params: { model: string; messages: any[]; images?: string[] }) => Promise<any>;
        listModels: () => Promise<any>;
        checkConnection: () => Promise<any>;
      };
    };
  }
}
