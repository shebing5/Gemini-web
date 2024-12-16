import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { voiceService } from '../services/voiceService';
import type { VoiceState } from '../types';

interface VoiceControlsProps {
  onTranscript: (text: string) => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({ onTranscript }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isProcessing: false,
    error: null,
    audioBlob: null,
    transcript: ''
  });

  useEffect(() => {
    return () => {
      if (voiceState.isRecording) {
        voiceService.stopRecording().catch(console.error);
      }
    };
  }, [voiceState.isRecording]);

  const handleStartRecording = async () => {
    try {
      setVoiceState(prev => ({ 
        ...prev, 
        isRecording: true, 
        error: null,
        transcript: ''
      }));
      
      await voiceService.startRecording((text) => {
        setVoiceState(prev => ({ ...prev, transcript: text }));
        onTranscript(text);
      });
    } catch (error) {
      setVoiceState(prev => ({
        ...prev,
        isRecording: false,
        error: 'Failed to start recording: ' + (error as Error).message
      }));
    }
  };

  const handleStopRecording = async () => {
    if (!voiceState.isRecording) return;
    
    try {
      setVoiceState(prev => ({ ...prev, isProcessing: true }));
      const { audioBlob, transcript } = await voiceService.stopRecording();
      
      if (transcript) {
        onTranscript(transcript);
      }

      setVoiceState({
        isRecording: false,
        isProcessing: false,
        error: null,
        audioBlob,
        transcript
      });
    } catch (error) {
      setVoiceState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        error: 'Failed to process recording: ' + (error as Error).message
      }));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={voiceState.isRecording ? handleStopRecording : handleStartRecording}
        className={`p-3 rounded-lg transition-colors ${
          voiceState.isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
        title={voiceState.isRecording ? 'Stop recording' : 'Start recording'}
        disabled={voiceState.isProcessing}
      >
        {voiceState.isRecording ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      {voiceState.error && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-red-100 text-red-600 text-sm rounded whitespace-nowrap">
          {voiceState.error}
        </div>
      )}
    </div>
  );
}; 