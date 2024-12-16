export type ModelProvider = 'GEMINI' | 'X_AI';

export interface ApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GeminiRequest {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
}

export interface XAIRequest {
  messages: ApiMessage[];
  model: string;
  stream: boolean;
  temperature: number;
}

export interface ApiResponse {
  content: string;
  error?: string;
}
