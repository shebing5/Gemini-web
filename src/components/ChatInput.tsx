import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { VoiceControls } from './VoiceControls';

interface ChatInputProps {
  onSend: (content: string, files?: File[]) => Promise<void>;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onSend(input.trim(), undefined);
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscript = (text: string) => {
    if (text) {
      setInput(input + text);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 border-t">
      <div className="flex-1">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Type a message..."
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={1}
          style={{
            minHeight: '2.5rem',
            maxHeight: '10rem',
            height: 'auto',
          }}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="p-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send size={20} />
      </button>
      <VoiceControls onTranscript={handleTranscript} />
    </form>
  );
};
