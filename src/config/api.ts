export const MODELS = {
  GEMINI: {
    'gemini-1.5-flash-latest': 'Gemini 1.5 Flash',
    'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
  },
  X_AI: {
    'grok-beta': 'Grok Beta',
  }
} as const;

export const API_ENDPOINTS = {
  GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models',
  X_AI: 'https://api.x.ai/v1/chat/completions'
} as const;