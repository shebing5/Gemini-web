import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2, BookmarkPlus, Volume2, VolumeX } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { voiceService } from '../services/voiceService';
import type { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
  chatId: string;
}

export const Message: React.FC<MessageProps> = ({ message, chatId }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { 
    currentChat,
    toggleMessageBookmark,
    deleteMessage
  } = useChatStore();

  const playAudio = useCallback(async () => {
    if (audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    try {
      const url = await voiceService.textToSpeech(message.content, {
        language: 'zh-CN',
        voice: '',
        rate: 1,
        pitch: 1,
        volume: 1,
        autoPlay: true
      });
      setAudioUrl(url);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Failed to convert text to speech:', error);
    }
  }, [audioUrl, isPlaying, message.content]);

  useEffect(() => {
    // Automatically play AI responses in voice mode
    if (currentChat?.voiceMode && message.role === 'assistant' && !audioUrl && !isPlaying) {
      playAudio();
    }
  }, [message, currentChat?.voiceMode, audioUrl, isPlaying, playAudio]);

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div className={`flex gap-4 p-4 ${
      message.role === 'assistant' ? 'bg-gray-50' : ''
    }`}>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="font-medium text-sm text-gray-500">
            {message.role === 'assistant' ? 'AI' : 'You'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={playAudio}
              className="p-1 text-gray-400 hover:text-blue-500"
              title={isPlaying ? '停止播放' : '播放语音'}
            >
              {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              onClick={() => toggleMessageBookmark(chatId, message.id)}
              className={`p-1 ${
                message.bookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
              }`}
              title="收藏消息"
            >
              <BookmarkPlus size={16} />
            </button>
            <button
              onClick={() => deleteMessage(chatId, message.id)}
              className="p-1 text-gray-400 hover:text-red-500"
              title="删除消息"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="mt-1 text-gray-700 whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnd}
          className="hidden"
        />
      )}
    </div>
  );
};