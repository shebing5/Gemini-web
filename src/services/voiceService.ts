import type { VoiceSettings } from '../types';

class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis = window.speechSynthesis;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private transcriptCallback: ((text: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupRecognition();
      }
      
      this.synthesis = window.speechSynthesis;
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'zh-CN';

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      if (this.transcriptCallback && currentTranscript) {
        this.transcriptCallback(currentTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };
  }

  // Start recording audio
  async startRecording(onTranscript: (text: string) => void): Promise<void> {
    try {
      this.transcriptCallback = onTranscript;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      if (this.recognition) {
        this.recognition.start();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  // Stop recording and get results
  async stopRecording(): Promise<{ audioBlob: Blob; transcript: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      let finalTranscript = '';
      
      const handleStop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        resolve({ 
          audioBlob, 
          transcript: finalTranscript 
        });
      };

      if (this.recognition) {
        // Get the final transcript
        this.recognition.onresult = (event) => {
          const lastResult = event.results[event.results.length - 1];
          if (lastResult.isFinal) {
            finalTranscript = lastResult[0].transcript;
          }
        };

        this.recognition.onend = () => {
          this.transcriptCallback = null;
          if (this.mediaRecorder) {
            this.mediaRecorder.onstop = handleStop;
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
          }
        };

        this.recognition.stop();
      } else {
        this.mediaRecorder.onstop = handleStop;
        this.mediaRecorder.stop();
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    });
  }

  // Convert text to speech
  async textToSpeech(text: string, settings: VoiceSettings): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = settings.language;
      utterance.voice = this.synthesis.getVoices().find(voice => voice.name === settings.voice) || null;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;

      // Convert to audio file
      const audioContext = new AudioContext();
      const mediaStreamDestination = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        resolve(audioUrl);
      };

      utterance.onend = () => {
        mediaRecorder.stop();
        audioContext.close();
      };

      mediaRecorder.start();
      this.synthesis.speak(utterance);
    });
  }

  // Get available voices
  getVoices(): SpeechSynthesisVoice[] {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }

  // Cancel ongoing speech
  cancelSpeech(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.synthesis.resume(); // 确保语音系统不会卡在暂停状态
    }
  }
}

export const voiceService = new VoiceService(); 