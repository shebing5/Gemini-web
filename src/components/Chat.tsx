/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

export const Chat: React.FC = () => {
  const { 
    currentChat, 
    toggleVoiceMode,
    regenerateMessage,
    isGenerating
  } = useChatStore();

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select or start a new chat
      </div>
    );
  }

  const handleRegenerate = async (messageId: string) => {
    if (!currentChat || isGenerating) return;
    await regenerateMessage(currentChat.id, messageId);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-medium">{currentChat.title}</h2>
        <button
          onClick={() => toggleVoiceMode(currentChat.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentChat.voiceMode
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={currentChat.voiceMode ? '关闭语音模式' : '开启语音模式'}
        >
          {currentChat.voiceMode ? (
            <>
              <Mic size={20} />
              <span>语音模式已开启</span>
            </>
          ) : (
            <>
              <MicOff size={20} />
              <span>语音模式已关闭</span>
            </>
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {currentChat.messages.map(message => (
          <ChatMessage
            key={message.id}
            message={message}
            onRegenerate={() => handleRegenerate(message.id)}
          />
        ))}
      </div>
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unused-vars
      <ChatInput onSend={function (_content: string, _files?: File[]): Promise<void> {
        throw new Error('Function not implemented.');
      } } />
    </div>
  );
};