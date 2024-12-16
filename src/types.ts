export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  parentId?: string;
  isEditing?: boolean;
  isRegenerating?: boolean;
  bookmarked?: boolean;
  reactions?: string[];
  files?: File[];
  contextRelevance?: number;
  tokenCount?: number;
  audioUrl?: string;
  isPlaying?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
  lastAccessed: number;
  model: string;
  systemPrompt?: string;
  bookmarked?: boolean;
  folder?: string;
  contextWindow?: number;
  maxTokens?: number;
  voiceMode?: boolean;
  voiceSettings?: VoiceSettings;
}

export interface VoiceSettings {
  language: string;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  autoPlay: boolean;
}

export interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  audioBlob: Blob | null;
  transcript: string;
}

export interface SystemPrompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  isDefault?: boolean;
}

export interface ChatFolder {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
}

export interface ContextConfig {
  maxContextWindow: number;
  maxTokens: number;
  relevanceThreshold: number;
  systemPromptWeight: number;
}

export interface MessageContext {
  messages: Message[];
  systemPrompt?: string;
  tokenCount: number;
  relevanceScore: number;
}

// Type guards for runtime type checking
export const isValidMessage = (message: unknown): message is Message => {
  return typeof message === 'object' && message !== null &&
    'id' in message &&
    'role' in message &&
    'content' in message &&
    'timestamp' in message;
};

export const isValidChat = (chat: unknown): chat is Chat => {
  return typeof chat === 'object' && chat !== null &&
    'id' in chat &&
    'title' in chat &&
    'messages' in chat &&
    Array.isArray((chat as Chat).messages) &&
    (chat as Chat).messages.every(isValidMessage);
}; 