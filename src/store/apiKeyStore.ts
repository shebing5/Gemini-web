import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ApiKeyState {
  geminiKey: string;
  xaiKey: string;
  setGeminiKey: (key: string) => void;
  setXaiKey: (key: string) => void;
  clearKeys: () => void;
}

export const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set) => ({
      geminiKey: '',
      xaiKey: '',
      setGeminiKey: (key: string) => set({ geminiKey: key }),
      setXaiKey: (key: string) => set({ xaiKey: key }),
      clearKeys: () => set({ geminiKey: '', xaiKey: '' }),
    }),
    {
      name: 'api-keys-storage',
    }
  )
);
