export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  files?: File[];
  isEditing?: boolean;
  isRegenerating?: boolean;
  parentId?: string; // For message threading
  reactions?: string[]; // For message reactions
  bookmarked?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
  model: string;
  systemPrompt?: string;
  bookmarked?: boolean;
  folder?: string;
  lastAccessed?: number;
}

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
  category?: string;
}

export interface ChatFolder {
  id: string;
  name: string;
  color?: string;
}
