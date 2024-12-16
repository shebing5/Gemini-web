import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Trash2,
  Search,
  Bookmark,
  Download,
  Upload
} from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import type { Chat } from '../types';

export const Sidebar: React.FC = () => {
  const [showSearch, setShowSearch] = useState(false);
  
  const {
    chats,
    currentChat,
    createChat,
    selectChat,
    deleteChat,
    setSearchQuery,
    exportData,
    importData
  } = useChatStore();

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          importData(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full bg-white border-r shadow-lg flex flex-col">
      <div className="p-4 space-y-2">
        <button
          onClick={() => createChat()}
          className="w-full flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <MessageSquarePlus size={20} />
          New Chat
        </button>

        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Search size={20} />
          Search
        </button>
      </div>

      {showSearch && (
        <div className="px-4 mb-2">
          <input
            type="text"
            placeholder="Search chats..."
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {chats.some(chat => chat.bookmarked) && (
          <>
            <div className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-50">Bookmarked</div>
            {chats.filter(chat => chat.bookmarked).map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={currentChat?.id === chat.id}
                onSelect={() => selectChat(chat.id)}
                onDelete={() => deleteChat(chat.id)}
              />
            ))}
          </>
        )}

        <div className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-50">Recent</div>
        {chats.filter(chat => !chat.bookmarked).map(chat => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isActive={currentChat?.id === chat.id}
            onSelect={() => selectChat(chat.id)}
            onDelete={() => deleteChat(chat.id)}
          />
        ))}
      </div>

      <div className="p-4 border-t space-y-2 bg-gray-50">
        <button
          onClick={handleImport}
          className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Upload size={20} />
          Import
        </button>
        <button
          onClick={handleExport}
          className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Download size={20} />
          Export
        </button>
      </div>
    </div>
  );
};

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, isActive, onSelect, onDelete }) => {
  return (
    <div
      className={`flex items-center gap-2 p-4 cursor-pointer hover:bg-gray-100
        ${isActive ? 'bg-gray-100' : ''}`}
      onClick={onSelect}
    >
      <div className="flex-1 truncate">
        <div className="font-medium">{chat.title}</div>
        <div className="text-sm text-gray-500 truncate">
          {chat.messages[chat.messages.length - 1]?.content || 'No messages'}
        </div>
      </div>
      
      {chat.bookmarked && (
        <Bookmark size={16} className="text-yellow-500" />
      )}
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-1 text-gray-500 hover:text-red-500"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
