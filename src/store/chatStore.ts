import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Chat, Message, SystemPrompt, ChatFolder, ContextConfig, MessageContext, VoiceSettings } from '../types';
import { isValidChat } from '../types';
import { generateContent } from '../services/chat';

// Default context configuration
const DEFAULT_CONTEXT_CONFIG: ContextConfig = {
  maxContextWindow: 10,
  maxTokens: 4000,
  relevanceThreshold: 0.5,
  systemPromptWeight: 1.5
};

// Utility functions for context management
const estimateTokenCount = (text: string): number => {
  // Rough estimation: ~4 chars per token
  return Math.ceil(text.length / 4);
};

const calculateRelevance = (currentMessage: Message, targetMessage: Message): number => {
  // Simple time-based relevance decay
  const timeDiff = Math.abs(currentMessage.timestamp - targetMessage.timestamp);
  const timeRelevance = Math.exp(-timeDiff / (1000 * 60 * 60)); // 1-hour decay
  
  // Thread relevance
  const threadRelevance = currentMessage.parentId === targetMessage.id ? 1 :
    targetMessage.parentId === currentMessage.id ? 1 : 0.5;
  
  return (timeRelevance + threadRelevance) / 2;
};

// Error handling utility
const createErrorHandler = (operation: string) => (error: unknown) => {
  console.error(`Error during ${operation}:`, error);
  return error instanceof Error ? error : new Error(`Unknown error during ${operation}`);
};

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  systemPrompts: SystemPrompt[];
  folders: ChatFolder[];
  isSidebarOpen: boolean;
  isGenerating: boolean;
  searchQuery: string;
  contextConfig: ContextConfig;
  selectedModel: string;
  
  // Chat Management
  createChat: (systemPrompt?: string) => void;
  deleteChat: (chatId: string) => void;
  selectChat: (chatId: string) => void;
  bookmarkChat: (chatId: string) => void;
  moveToFolder: (chatId: string, folderId: string) => void;
  setModel: (chatId: string, model: string) => void;
  setSelectedModel: (model: string) => void;
  setTitle: (chatId: string, title: string) => void;
  setMessageRegenerating: (chatId: string, messageId: string, isRegenerating: boolean) => void;
  setMessageEditing: (chatId: string, messageId: string, isEditing: boolean) => void;
  
  // Message Management
  addMessage: (message: Message) => void;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  toggleMessageBookmark: (chatId: string, messageId: string) => void;
  addReaction: (chatId: string, messageId: string, reaction: string) => void;
  
  // Generation Controls
  setGenerating: (isGenerating: boolean) => void;
  regenerateMessage: (chatId: string, messageId: string) => Promise<void>;
  cancelGeneration: () => void;
  
  // System Prompts
  addSystemPrompt: (prompt: SystemPrompt) => void;
  updateSystemPrompt: (id: string, updates: Partial<SystemPrompt>) => void;
  deleteSystemPrompt: (id: string) => void;
  setDefaultPrompt: (id: string) => void;
  setSystemPrompt: (chatId: string, content: string) => void;
  
  // Search & Filters
  setSearchQuery: (query: string) => void;
  searchChats: () => Chat[];
  
  // Import/Export
  exportData: () => string;
  importData: (data: string) => void;
  
  // Sidebar
  toggleSidebar: () => void;

  // Add batch update functionality
  batchUpdateMessages: (chatId: string, updates: Array<[string, Partial<Message>]>) => void;

  // Context Management
  getMessageContext: (chatId: string, messageId: string) => MessageContext;
  updateContextConfig: (config: Partial<ContextConfig>) => void;
  setContextWindow: (chatId: string, size: number) => void;
  setMaxTokens: (chatId: string, tokens: number) => void;

  // Voice Controls
  toggleVoiceMode: (chatId: string) => void;
  updateVoiceSettings: (chatId: string, settings: Partial<VoiceSettings>) => void;
  playMessageAudio: (chatId: string, messageId: string) => void;
  stopMessageAudio: (chatId: string, messageId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      currentChat: null,
      systemPrompts: [],
      folders: [],
      isSidebarOpen: window.innerWidth > 768,
      isGenerating: false,
      searchQuery: '',
      contextConfig: DEFAULT_CONTEXT_CONFIG,
      selectedModel: 'gemini-1.5-flash-latest',

      toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),

      setModel: (chatId, model) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId ? { ...chat, model } : chat
          ),
          currentChat: state.currentChat?.id === chatId
            ? { ...state.currentChat, model }
            : state.currentChat
        }));
      },

      setSelectedModel: (model: string) => {
        set({ selectedModel: model });
      },

      setTitle: (chatId, title) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId ? { ...chat, title } : chat
          ),
          currentChat: state.currentChat?.id === chatId
            ? { ...state.currentChat, title }
            : state.currentChat
        }));
      },

      createChat: (systemPrompt) => {
        const defaultPrompt = get().systemPrompts.find(p => p.isDefault);
        const newChat: Chat = {
          id: crypto.randomUUID(),
          title: 'New Chat',
          messages: [],
          timestamp: Date.now(),
          lastAccessed: Date.now(),
          model: 'gemini-1.5-flash-latest',
          systemPrompt: systemPrompt || defaultPrompt?.content || ''
        };
        
        if (newChat.systemPrompt) {
          newChat.messages.push({
            id: crypto.randomUUID(),
            role: 'system',
            content: newChat.systemPrompt,
            timestamp: Date.now()
          });
        }
        
        set(state => ({
          chats: [newChat, ...state.chats],
          currentChat: newChat
        }));
      },

      deleteChat: (chatId) => {
        set(state => {
          const newChats = state.chats.filter(chat => chat.id !== chatId);
          return {
            chats: newChats,
            currentChat: state.currentChat?.id === chatId
              ? newChats[0] || null
              : state.currentChat
          };
        });
      },

      selectChat: (chatId) => {
        set(state => {
          const chat = state.chats.find(c => c.id === chatId);
          if (!chat) return state;
          
          const updatedChat = {
            ...chat,
            lastAccessed: Date.now()
          };
          
          return {
            currentChat: updatedChat,
            chats: state.chats.map(c => 
              c.id === chatId ? updatedChat : c
            )
          };
        });
      },

      bookmarkChat: (chatId) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, bookmarked: !chat.bookmarked }
              : chat
          )
        }));
      },

      moveToFolder: (chatId, folderId) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, folder: folderId }
              : chat
          )
        }));
      },

      addMessage: (message) => {
        const tokenCount = estimateTokenCount(message.content);
        const enhancedMessage = { ...message, tokenCount };
        
        set(state => {
          if (!state.currentChat) return state;
          const updatedChat = {
            ...state.currentChat,
            messages: [...state.currentChat.messages, enhancedMessage],
            lastAccessed: Date.now()
          };
          return {
            chats: state.chats.map(chat =>
              chat.id === updatedChat.id ? updatedChat : chat
            ),
            currentChat: updatedChat
          };
        });
      },

      updateMessage: (chatId: string, messageId: string, content: string) => {
        set(state => {
          const chat = state.chats.find(c => c.id === chatId);
          if (!chat) return state;

          const messageIndex = chat.messages.findIndex(m => m.id === messageId);
          if (messageIndex === -1) return state;

          const updatedMessages = chat.messages.map(msg => {
            if (msg.id === messageId) {
              return { 
                ...msg, 
                content,
                isEditing: false,
                timestamp: Date.now()
              };
            }
            return msg;
          });

          const updatedChat = {
            ...chat,
            messages: updatedMessages,
            lastAccessed: Date.now()
          };

          return {
            chats: state.chats.map(c => c.id === chatId ? updatedChat : c),
            currentChat: state.currentChat?.id === chatId ? updatedChat : state.currentChat
          };
        });
      },

      deleteMessage: (chatId: string, messageId: string) => {
        set(state => {
          const chat = state.chats.find(c => c.id === chatId);
          if (!chat) return state;

          const messageIndex = chat.messages.findIndex(m => m.id === messageId);
          if (messageIndex === -1) return state;

          const updatedMessages = [
            ...chat.messages.slice(0, messageIndex),
            ...chat.messages.slice(messageIndex + 1)
          ];

          const updatedChat = {
            ...chat,
            messages: updatedMessages,
            lastAccessed: Date.now()
          };

          return {
            chats: state.chats.map(c => c.id === chatId ? updatedChat : c),
            currentChat: state.currentChat?.id === chatId ? updatedChat : state.currentChat
          };
        });
      },

      toggleMessageBookmark: (chatId: string, messageId: string) => {
        set(state => {
          const chat = state.chats.find(c => c.id === chatId);
          if (!chat) return state;

          const updatedMessages = chat.messages.map(msg =>
            msg.id === messageId
              ? { ...msg, bookmarked: !msg.bookmarked }
              : msg
          );

          const updatedChat = { ...chat, messages: updatedMessages };
          return {
            chats: state.chats.map(c => c.id === chatId ? updatedChat : c),
            currentChat: state.currentChat?.id === chatId ? updatedChat : state.currentChat
          };
        });
      },

      addReaction: (chatId: string, messageId: string, reaction: string) => {
        set(state => {
          const chat = state.chats.find(c => c.id === chatId);
          if (!chat) return state;

          const updatedMessages = chat.messages.map(msg =>
            msg.id === messageId
              ? {
                  ...msg,
                  reactions: msg.reactions
                    ? [...new Set([...msg.reactions, reaction])]
                    : [reaction]
                }
              : msg
          );

          const updatedChat = { ...chat, messages: updatedMessages };
          return {
            chats: state.chats.map(c => c.id === chatId ? updatedChat : c),
            currentChat: state.currentChat?.id === chatId ? updatedChat : state.currentChat
          };
        });
      },

      setGenerating: (isGenerating) => set({ isGenerating }),

      regenerateMessage: async (chatId: string, messageId: string) => {
        const state = get();
        const chat = state.chats.find(c => c.id === chatId);
        if (!chat) return;

        const messageIndex = chat.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;

        // 设置消息为重新生成状态
        set(state => ({
          ...state,
          isGenerating: true
        }));

        try {
          // 获取到目标消息之前的所有消息
          const previousMessages = chat.messages.slice(0, messageIndex);
          
          // 包含系统提示
          const messages = [
            ...(chat.systemPrompt ? [{ role: 'system', content: chat.systemPrompt }] : []),
            ...previousMessages
          ];

          // 调用 AI 生成新的回复
          const response = await generateContent(messages, chat.model);
          
          // 创建新的消息
          const newMessage = {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: response,
            timestamp: Date.now()
          };

          // 更新消息列表
          set(state => {
            const updatedChat = {
              ...chat,
              messages: [...previousMessages, newMessage],
              lastAccessed: Date.now()
            };

            return {
              isGenerating: false,
              chats: state.chats.map(c => c.id === chatId ? updatedChat : c),
              currentChat: state.currentChat?.id === chatId ? updatedChat : state.currentChat
            };
          });
        } catch (error) {
          console.error('Error regenerating message:', error);
          set(state => ({ ...state, isGenerating: false }));
        }
      },

      cancelGeneration: () => {
        set({ isGenerating: false });
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      searchChats: () => {
        const state = get();
        const query = state.searchQuery.toLowerCase();
        
        if (!query) return state.chats;
        
        return state.chats.filter(chat => {
          const titleMatch = chat.title.toLowerCase().includes(query);
          const contentMatch = chat.messages.some(msg =>
            msg.content.toLowerCase().includes(query)
          );
          return titleMatch || contentMatch;
        });
      },

      exportData: () => {
        const state = get();
        return JSON.stringify({
          chats: state.chats,
          systemPrompts: state.systemPrompts,
          folders: state.folders
        });
      },

      importData: (data) => {
        try {
          const parsed = JSON.parse(data);
          const validChats = Array.isArray(parsed.chats) && parsed.chats.every(isValidChat);
          const validSystemPrompts = Array.isArray(parsed.systemPrompts);
          const validFolders = Array.isArray(parsed.folders);

          if (!validChats || !validSystemPrompts || !validFolders) {
            throw new Error('Invalid data format');
          }

          set({
            chats: parsed.chats,
            systemPrompts: parsed.systemPrompts,
            folders: parsed.folders
          });
        } catch (error) {
          createErrorHandler('data import')(error);
        }
      },

      setMessageRegenerating: (chatId: string, messageId: string, isRegenerating: boolean) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map(msg =>
                    msg.id === messageId
                      ? { ...msg, isRegenerating }
                      : msg
                  )
                }
              : chat
          ),
          currentChat: state.currentChat?.id === chatId
            ? {
                ...state.currentChat,
                messages: state.currentChat.messages.map(msg =>
                  msg.id === messageId
                    ? { ...msg, isRegenerating }
                    : msg
                )
              }
            : state.currentChat
        }));
      },

      setMessageEditing: (chatId: string, messageId: string, isEditing: boolean) => {
        set(state => {
          const chat = state.chats.find(c => c.id === chatId);
          if (!chat) return state;

          const updatedMessages = chat.messages.map(msg => {
            if (msg.id === messageId) {
              return { ...msg, isEditing };
            }
            return msg;
          });

          const updatedChat = {
            ...chat,
            messages: updatedMessages,
            lastAccessed: Date.now()
          };

          return {
            chats: state.chats.map(c => c.id === chatId ? updatedChat : c),
            currentChat: state.currentChat?.id === chatId ? updatedChat : state.currentChat
          };
        });
      },

      addSystemPrompt: (prompt: SystemPrompt) => {
        set(state => ({
          systemPrompts: [...state.systemPrompts, prompt]
        }));
      },

      updateSystemPrompt: (id: string, updates: Partial<SystemPrompt>) => {
        set(state => ({
          systemPrompts: state.systemPrompts.map(prompt =>
            prompt.id === id
              ? { ...prompt, ...updates }
              : prompt
          )
        }));
      },

      deleteSystemPrompt: (id: string) => {
        set(state => ({
          systemPrompts: state.systemPrompts.filter(prompt => prompt.id !== id)
        }));
      },

      setDefaultPrompt: (id: string) => {
        set(state => ({
          systemPrompts: state.systemPrompts.map(prompt => ({
            ...prompt,
            isDefault: prompt.id === id
          }))
        }));
      },

      setSystemPrompt: (chatId: string, content: string) => {
        set(state => {
          const chat = state.chats.find(c => c.id === chatId);
          if (!chat) return state;

          // Find existing system message or create new one
          const systemMessageIndex = chat.messages.findIndex(m => m.role === 'system');
          let updatedMessages = [...chat.messages];

          if (systemMessageIndex >= 0) {
            // Update existing system message
            updatedMessages[systemMessageIndex] = {
              ...updatedMessages[systemMessageIndex],
              content
            };
          } else {
            // Add new system message at the beginning
            updatedMessages = [
              {
                id: crypto.randomUUID(),
                role: 'system',
                content,
                timestamp: Date.now()
              },
              ...chat.messages
            ];
          }

          const updatedChat = {
            ...chat,
            systemPrompt: content,
            messages: updatedMessages,
            lastAccessed: Date.now()
          };

          return {
            chats: state.chats.map(c => c.id === chatId ? updatedChat : c),
            currentChat: state.currentChat?.id === chatId ? updatedChat : state.currentChat
          };
        });
      },

      // Add batch update functionality
      batchUpdateMessages: (chatId, updates) => {
        set(state => {
          const chat = state.chats.find(c => c.id === chatId);
          if (!chat) return state;

          const messageMap = new Map(updates);
          const updatedMessages = chat.messages.map(msg => {
            const update = messageMap.get(msg.id);
            return update ? { ...msg, ...update } : msg;
          });

          const updatedChat = {
            ...chat,
            messages: updatedMessages,
            lastAccessed: Date.now()
          };

          return {
            chats: state.chats.map(c => c.id === chatId ? updatedChat : c),
            currentChat: state.currentChat?.id === chatId ? updatedChat : state.currentChat
          };
        });
      },

      getMessageContext: (chatId: string, messageId: string): MessageContext => {
        const state = get();
        const chat = state.chats.find(c => c.id === chatId);
        if (!chat) {
          return { messages: [], tokenCount: 0, relevanceScore: 0 };
        }

        const targetMessage = chat.messages.find(m => m.id === messageId);
        if (!targetMessage) {
          return { messages: [], tokenCount: 0, relevanceScore: 0 };
        }

        const config = state.contextConfig;
        const maxWindow = chat.contextWindow || config.maxContextWindow;
        const maxTokens = chat.maxTokens || config.maxTokens;

        // Calculate relevance scores for all messages
        const scoredMessages = chat.messages.map(msg => ({
          ...msg,
          contextRelevance: calculateRelevance(targetMessage, msg)
        }));

        // Sort by relevance and filter by threshold
        const relevantMessages = scoredMessages
          .filter(msg => msg.contextRelevance! >= config.relevanceThreshold)
          .sort((a, b) => b.contextRelevance! - a.contextRelevance!);

        // Build context window while respecting token limit
        const contextMessages: Message[] = [];
        let totalTokens = 0;
        let averageRelevance = 0;

        for (const msg of relevantMessages.slice(0, maxWindow)) {
          const msgTokens = msg.tokenCount || estimateTokenCount(msg.content);
          if (totalTokens + msgTokens > maxTokens) break;
          
          contextMessages.push(msg);
          totalTokens += msgTokens;
          averageRelevance += msg.contextRelevance!;
        }

        // Always include system prompt without token limit
        const systemPrompt = chat.systemPrompt;

        return {
          messages: contextMessages,
          systemPrompt,
          tokenCount: totalTokens + (systemPrompt ? estimateTokenCount(systemPrompt) : 0),
          relevanceScore: contextMessages.length > 0 ? 
            averageRelevance / contextMessages.length : 0
        };
      },

      updateContextConfig: (config: Partial<ContextConfig>) => {
        set(state => ({
          contextConfig: { ...state.contextConfig, ...config }
        }));
      },

      setContextWindow: (chatId: string, size: number) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId ? { ...chat, contextWindow: size } : chat
          )
        }));
      },

      setMaxTokens: (chatId: string, tokens: number) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId ? { ...chat, maxTokens: tokens } : chat
          )
        }));
      },

      toggleVoiceMode: (chatId) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? {
                  ...chat,
                  voiceMode: !chat.voiceMode,
                  voiceSettings: chat.voiceSettings || {
                    language: 'en-US',
                    voice: '',
                    rate: 1,
                    pitch: 1,
                    volume: 1,
                    autoPlay: true
                  }
                }
              : chat
          ),
          currentChat: state.currentChat?.id === chatId
            ? {
                ...state.currentChat,
                voiceMode: !state.currentChat.voiceMode,
                voiceSettings: state.currentChat.voiceSettings || {
                  language: 'en-US',
                  voice: '',
                  rate: 1,
                  pitch: 1,
                  volume: 1,
                  autoPlay: true
                }
              }
            : state.currentChat
        }));
      },

      updateVoiceSettings: (chatId, settings) => {
        set(state => {
          const defaultSettings: VoiceSettings = {
            language: 'en-US',
            voice: '',
            rate: 1,
            pitch: 1,
            volume: 1,
            autoPlay: true
          };

          return {
            chats: state.chats.map(chat =>
              chat.id === chatId
                ? {
                    ...chat,
                    voiceSettings: { ...defaultSettings, ...(chat.voiceSettings || {}), ...settings }
                  }
                : chat
            ),
            currentChat: state.currentChat?.id === chatId
              ? {
                  ...state.currentChat,
                  voiceSettings: { ...defaultSettings, ...(state.currentChat.voiceSettings || {}), ...settings }
                }
              : state.currentChat
          };
        });
      },

      playMessageAudio: (chatId, messageId) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map(msg =>
                    msg.id === messageId
                      ? { ...msg, isPlaying: true }
                      : msg
                  )
                }
              : chat
          ),
          currentChat: state.currentChat?.id === chatId
            ? {
                ...state.currentChat,
                messages: state.currentChat.messages.map(msg =>
                  msg.id === messageId
                    ? { ...msg, isPlaying: true }
                    : msg
                )
              }
            : state.currentChat
        }));
      },

      stopMessageAudio: (chatId, messageId) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map(msg =>
                    msg.id === messageId
                      ? { ...msg, isPlaying: false }
                      : msg
                  )
                }
              : chat
          ),
          currentChat: state.currentChat?.id === chatId
            ? {
                ...state.currentChat,
                messages: state.currentChat.messages.map(msg =>
                  msg.id === messageId
                    ? { ...msg, isPlaying: false }
                    : msg
                )
              }
            : state.currentChat
        }));
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        chats: state.chats,
        systemPrompts: state.systemPrompts,
        folders: state.folders,
        contextConfig: state.contextConfig
      })
    }
  )
);
