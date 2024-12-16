import React, { useState } from 'react';
import { Settings, Plus, Trash2, Check, Edit2, X } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import type { SystemPrompt } from '../types';

export const SystemPromptEditor: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [newPromptDescription, setNewPromptDescription] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPrompt | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  
  const { 
    currentChat,
    systemPrompts,
    addSystemPrompt,
    deleteSystemPrompt,
    setSystemPrompt,
    updateSystemPrompt
  } = useChatStore();

  const handleAddPrompt = () => {
    if (newPromptTitle && newPromptContent) {
      const newPrompt: SystemPrompt = {
        id: crypto.randomUUID(),
        title: newPromptTitle,
        content: newPromptContent,
        description: newPromptDescription || undefined
      };
      addSystemPrompt(newPrompt);
      setNewPromptTitle('');
      setNewPromptContent('');
      setNewPromptDescription('');
    }
  };

  const handleSelectPrompt = (prompt: SystemPrompt) => {
    if (editingPrompt) return; // Don't allow selection while editing
    setSelectedPrompt(selectedPrompt?.id === prompt.id ? null : prompt);
  };

  const handleApplyPrompt = () => {
    if (currentChat && selectedPrompt) {
      setSystemPrompt(currentChat.id, selectedPrompt.content);
      setSelectedPrompt(null);
      setIsOpen(false);
    }
  };

  const startEditing = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt);
    setSelectedPrompt(null);
  };

  const cancelEditing = () => {
    setEditingPrompt(null);
  };

  const saveEditing = () => {
    if (editingPrompt) {
      updateSystemPrompt(editingPrompt.id, editingPrompt);
      setEditingPrompt(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700"
        title="System Prompts"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div className="fixed md:absolute inset-4 md:inset-auto md:top-full md:right-0 mt-2 md:w-96 bg-white rounded-lg shadow-lg border p-4 z-50 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">System Prompts</h3>
            <div className="flex gap-2">
              {selectedPrompt && (
                <button
                  onClick={handleApplyPrompt}
                  className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  <Check size={16} />
                  Apply
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="space-y-4 overflow-y-auto flex-1">
            {systemPrompts.map(prompt => (
              <div 
                key={prompt.id} 
                className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${
                  selectedPrompt?.id === prompt.id ? 'border-blue-500 bg-blue-50' : 
                  editingPrompt?.id === prompt.id ? 'border-yellow-500 bg-yellow-50' :
                  'border-gray-200 hover:border-gray-300'
                }`}
              >
                {editingPrompt?.id === prompt.id ? (
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editingPrompt.title}
                      onChange={(e) => setEditingPrompt({...editingPrompt, title: e.target.value})}
                      className="w-full p-2 border rounded mb-2"
                      placeholder="Title"
                    />
                    <input
                      type="text"
                      value={editingPrompt.description || ''}
                      onChange={(e) => setEditingPrompt({...editingPrompt, description: e.target.value})}
                      className="w-full p-2 border rounded mb-2"
                      placeholder="Description (optional)"
                    />
                    <textarea
                      value={editingPrompt.content}
                      onChange={(e) => setEditingPrompt({...editingPrompt, content: e.target.value})}
                      className="w-full p-2 border rounded mb-2 resize-y"
                      rows={3}
                      placeholder="Content"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEditing}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleSelectPrompt(prompt)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium line-clamp-1">{prompt.title}</div>
                      {prompt.description && (
                        <div className="text-sm text-gray-500 line-clamp-2">{prompt.description}</div>
                      )}
                      <div className="text-sm text-gray-500 line-clamp-3 mt-1">{prompt.content}</div>
                    </button>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => startEditing(prompt)}
                        className="p-1 text-gray-400 hover:text-blue-500"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteSystemPrompt(prompt.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            <div className="mt-4 space-y-2">
              <input
                type="text"
                value={newPromptTitle}
                onChange={(e) => setNewPromptTitle(e.target.value)}
                placeholder="Prompt Title"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={newPromptContent}
                onChange={(e) => setNewPromptContent(e.target.value)}
                placeholder="Prompt Content"
                className="w-full h-24 px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={newPromptDescription}
                onChange={(e) => setNewPromptDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddPrompt}
                disabled={!newPromptTitle || !newPromptContent}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} />
                Add New Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
