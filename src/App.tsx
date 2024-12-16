import { useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ModelSelector } from './components/ModelSelector';
import { SystemPromptEditor } from './components/SystemPromptEditor';
import { ApiKeyManager } from './components/ApiKeyManager';
import { useChatStore } from './store/chatStore';
import { generateContent, generateTitle } from './services/chat';
import type { Message } from './types';

function App() {
  const {
    currentChat,
    createChat,
    addMessage,
    setTitle,
    setModel,
    setMessageRegenerating,
    isSidebarOpen,
    toggleSidebar
  } = useChatStore();

  useEffect(() => {
    if (!currentChat) {
      createChat();
    }
  }, [currentChat, createChat]);

  const handleSend = async (content: string, files?: File[]) => {
    if (!currentChat) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
      files
    };
    addMessage(userMessage);

    try {
      const conversationHistory = currentChat.messages;
      
      const messages = [
        ...(currentChat.systemPrompt ? [{ role: 'system' as const, content: currentChat.systemPrompt }] : []),
        ...conversationHistory,
        userMessage
      ];

      const response = await generateContent(messages, currentChat.model);
      
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      addMessage(aiMessage);

      if (currentChat.title === 'New Chat') {
        const newTitle = await generateTitle([userMessage, aiMessage]);
        setTitle(currentChat.id, newTitle);
      }
    } catch (error) {
      console.error('Error:', error);
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      });
    }
  };

  const handleRegenerate = async (messageId: string) => {
    if (!currentChat) return;

    const messageIndex = currentChat.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    setMessageRegenerating(currentChat.id, messageId, true);

    try {
      const previousMessages = currentChat.messages.slice(0, messageIndex);
      const messages = [
        ...(currentChat.systemPrompt ? [{ role: 'system', content: currentChat.systemPrompt }] : []),
        ...previousMessages
      ];

      const response = await generateContent(messages, currentChat.model);
      
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      currentChat.messages = [...previousMessages, aiMessage];
      addMessage(aiMessage);
    } catch (error) {
      console.error('Error:', error);
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while regenerating the response. Please try again.',
        timestamp: Date.now()
      });
    } finally {
      setMessageRegenerating(currentChat.id, messageId, false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen max-w-[1920px] mx-auto relative">
        {/* Mobile sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Sidebar */}
        <div
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 fixed md:static w-72 h-full transition-transform duration-200 ease-in-out z-40`}
        >
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col w-full md:w-auto max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <ModelSelector
                currentModel={currentChat?.model}
                onChange={(model) => currentChat && setModel(currentChat.id, model)}
              />
              <SystemPromptEditor />
            </div>
            <ApiKeyManager />
          </div>

          <main className="flex-1 overflow-y-auto px-4">
            <div className="max-w-4xl mx-auto">
              {currentChat?.messages.map(message => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onRegenerate={
                    message.role === 'assistant'
                      ? () => handleRegenerate(message.id)
                      : undefined
                  }
                />
              ))}
            </div>
          </main>

          <div className="border-t bg-white">
            <div className="max-w-4xl mx-auto">
              <ChatInput onSend={handleSend} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
