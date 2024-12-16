import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Copy, Edit2, RotateCcw, Save, X, Bookmark, MessageSquare, Smile, Check, Volume2, VolumeX } from 'lucide-react';
import type { Message } from '../types';
import { useChatStore } from '../store/chatStore';
import { ReactionPicker } from './ReactionPicker';
import { voiceService } from '../services/voiceService';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => Promise<void>;
}

interface CodeBlockProps {
  language: string;
  value: string;
  className?: string;
}

const CodeBlock = ({ language, value }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={copyToClipboard}
        className="absolute right-2 top-2 p-1 rounded bg-gray-800 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy code"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          padding: '1rem',
        }}
      >
        {value.replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const CustomCode = ({ inline, className, children }: CodeProps) => {
  if (inline) {
    return <code className={className}>{children}</code>;
  }

  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const value = String(children || '').replace(/\n$/, '');

  if (!match) {
    return <code className={className}>{children}</code>;
  }

  return <CodeBlock language={language} value={value} />;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRegenerate }) => {
  const [editContent, setEditContent] = useState(message.content);
  const [showReactions, setShowReactions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const {
    currentChat,
    updateMessage,
    setMessageEditing,
    toggleMessageBookmark,
    addReaction,
    isGenerating
  } = useChatStore();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleSave = async () => {
    if (!currentChat) return;
    try {
      // 更新当前消息
      updateMessage(currentChat.id, message.id, editContent);
      setMessageEditing(currentChat.id, message.id, false);

      // 如果是用户消息，重新生成下一条 AI 回复
      if (message.role === 'user' && onRegenerate) {
        await onRegenerate();
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleCancel = () => {
    if (currentChat) {
      setEditContent(message.content);
      setMessageEditing(currentChat.id, message.id, false);
    }
  };

  const handleEdit = () => {
    if (!currentChat) return;
    setMessageEditing(currentChat.id, message.id, true);
  };

  const handleRegenerate = async () => {
    if (!currentChat || !onRegenerate || isGenerating) return;
    await onRegenerate();
  };

  const playAudio = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      voiceService.cancelSpeech();
      setIsPlaying(false);
      return;
    }

    try {
      voiceService.cancelSpeech();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const url = await voiceService.textToSpeech(message.content, {
        language: 'zh-CN',
        voice: '',
        rate: 1,
        pitch: 1,
        volume: 1,
        autoPlay: true
      });

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to convert text to speech:', error);
      setIsPlaying(false);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div className={`py-6 ${message.role === 'assistant' ? 'bg-gray-50' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl
          ${message.role === 'assistant' ? 'bg-blue-500 text-white' : 
           message.role === 'system' ? 'bg-purple-500 text-white' : 
           'bg-gray-200'}`}>
          {message.role === 'assistant' ? '🤖' : 
           message.role === 'system' ? '⚙️' : 
           '👤'}
        </div>
        <div className={`flex-1 min-w-0 ${message.role === 'system' ? 'text-purple-600 italic' : ''}`}>
          {message.parentId && (
            <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
              <MessageSquare size={14} />
              Replying to a message
            </div>
          )}

          {message.files && message.files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {message.files.map((file, index) => (
                <div key={index} className="relative">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="max-w-full md:max-w-xs rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="p-3 bg-gray-100 rounded-lg shadow-sm">
                      {file.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {message.isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border rounded-lg resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="prose prose-slate prose-sm md:prose-base max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code: CustomCode as never,
                  // Add custom styling for other markdown elements
                  p: ({children}) => <p className="mb-4 last:mb-0">{children}</p>,
                  h1: ({children}) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                  h2: ({children}) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
                  h3: ({children}) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
                  ul: ({children}) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
                  li: ({children}) => <li className="mb-1">{children}</li>,
                  blockquote: ({children}) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
                      {children}
                    </blockquote>
                  ),
                  table: ({children}) => (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 my-4">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({children}) => (
                    <th className="px-4 py-2 bg-gray-100 font-semibold text-left">
                      {children}
                    </th>
                  ),
                  td: ({children}) => (
                    <td className="px-4 py-2 border-t">{children}</td>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <span key={index} className="text-sm bg-gray-100 rounded-full px-3 py-1">
                  {reaction}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => copyToClipboard(message.content)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors relative group"
            title="Copy message"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span className="absolute right-full mr-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {copied ? 'Copied!' : 'Copy message'}
            </span>
          </button>
          
          {message.role === 'user' && !message.isEditing && (
            <button
              onClick={handleEdit}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Edit message"
            >
              <Edit2 size={16} />
            </button>
          )}

          {message.role === 'assistant' && onRegenerate && (
            <button
              onClick={handleRegenerate}
              className={`p-2 ${
                isGenerating
                  ? 'animate-spin text-blue-500'
                  : 'text-gray-500 hover:text-gray-700 transition-colors'
              }`}
              disabled={isGenerating}
              title="Regenerate response"
            >
              <RotateCcw size={16} />
            </button>
          )}

          <button
            onClick={() => currentChat && toggleMessageBookmark(currentChat.id, message.id)}
            className={`p-2 ${
              message.bookmarked
                ? 'text-yellow-500'
                : 'text-gray-500 hover:text-gray-700 transition-colors'
            }`}
            title={message.bookmarked ? 'Remove bookmark' : 'Bookmark message'}
          >
            <Bookmark size={16} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Add reaction"
            >
              <Smile size={16} />
            </button>

            {showReactions && (
              <div className="absolute bottom-0 right-full mb-0 mr-2">
                <ReactionPicker
                  onSelect={(reaction) => {
                    if (currentChat) {
                      addReaction(currentChat.id, message.id, reaction);
                      setShowReactions(false);
                    }
                  }}
                  onClose={() => setShowReactions(false)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={playAudio}
              className="p-1 text-gray-400 hover:text-blue-500"
              title={isPlaying ? '停止播放' : '播放语音'}
            >
              {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </div>
      {audioRef.current && (
        <audio
          ref={audioRef}
          onEnded={handleAudioEnd}
          className="hidden"
        />
      )}
    </div>
  );
};
