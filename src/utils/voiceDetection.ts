// Voice detection utility for SOS activation
// Uses Web Speech API for continuous listening

import { Capacitor } from '@capacitor/core';

interface VoiceDetectionOptions {
  password: string;
  onPasswordDetected: () => void;
  onConfirmation: (confirmed: boolean) => void;
}

class VoiceDetection {
  private recognition: any = null;
  private isListening = false;
  private isAwaitingConfirmation = false;
  private password = '';
  private onPasswordDetected: (() => void) | null = null;
  private onConfirmation: ((confirmed: boolean) => void) | null = null;
  private synth: SpeechSynthesis | null = null;
  private voicesLoaded = false;
  private restartAttempts = 0;
  private maxRestartAttempts = 100;
  private microphoneStream: MediaStream | null = null;
  private isSpeaking = false;
  private keepAliveInterval: number | null = null;
  private lastSpeechTime = 0;
  private debugMode = true;

  constructor() {
    this.log('🔧 VoiceDetection constructor called');
    this.initRecognition();
    this.initSpeechSynthesis();
  }

  private log(...args: any[]) {
    if (this.debugMode) {
      console.log('[VoiceDetection]', ...args);
    }
  }

  private initRecognition() {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 5;
      this.setupRecognitionHandlers();
      this.log('✅ Speech recognition initialized');
    } else {
      console.error('❌ Web Speech API not supported in this browser');
    }
  }

  private initSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      
      const loadVoices = () => {
        const voices = this.synth?.getVoices() || [];
        if (voices.length > 0) {
          this.voicesLoaded = true;
          this.log('✅ Voices loaded:', voices.length);
        }
      };

      loadVoices();

      if (this.synth) {
        this.synth.onvoiceschanged = loadVoices;
      }
    }
  }

  private setupRecognitionHandlers() {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      this.lastSpeechTime = Date.now();
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.toLowerCase().trim();
        const confidence = result[0].confidence;
        const isFinal = result.isFinal;
        
        this.log(`🎤 Heard${isFinal ? ' (final)' : ''}:`, `"${transcript}"`, `confidence: ${(confidence * 100).toFixed(1)}%`);

        if (this.isAwaitingConfirmation) {
          // Listen for yes/no response
          if (transcript.includes('yes') || transcript.includes('yeah') || transcript.includes('yep') || transcript.includes('help')) {
            this.log('✅ User confirmed - triggering emergency!');
            this.isAwaitingConfirmation = false;
            this.onConfirmation?.(true);
            this.stop();
            return;
          } else if (transcript.includes('no') || transcript.includes('nope') || transcript.includes('cancel') || transcript.includes('stop')) {
            this.log('❌ User cancelled');
            this.isAwaitingConfirmation = false;
            this.onConfirmation?.(false);
            return;
          }
        } else {
          // Listen for password - check all alternatives
          const passwordLower = this.password.toLowerCase().trim();
          
          // Check main transcript
          if (this.matchesPassword(transcript, passwordLower)) {
            this.log('🔑 Password detected in main transcript!');
            this.handlePasswordDetected();
            return;
          }
          
          // Check all alternatives
          for (let alt = 0; alt < result.length; alt++) {
            const altTranscript = result[alt].transcript.toLowerCase().trim();
            if (this.matchesPassword(altTranscript, passwordLower)) {
              this.log('🔑 Password detected in alternative:', altTranscript);
              this.handlePasswordDetected();
              return;
            }
          }
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      this.log('❌ Recognition error:', event.error);
      
      if (!this.isListening) return;
      
      switch (event.error) {
        case 'no-speech':
          this.log('👂 No speech - continuing to listen...');
          this.restartRecognition(100);
          break;
        case 'audio-capture':
          this.log('🎤 Audio capture error, retrying...');
          this.restartRecognition(1000);
          break;
        case 'not-allowed':
          console.error('🚫 Microphone permission denied');
          this.isListening = false;
          break;
        case 'aborted':
          this.restartRecognition(100);
          break;
        case 'network':
          this.log('🌐 Network error, retrying...');
          this.restartRecognition(500);
          break;
        default:
          this.restartRecognition(500);
      }
    };

    this.recognition.onend = () => {
      this.log('🔴 Recognition ended, isListening:', this.isListening, 'isSpeaking:', this.isSpeaking);
      
      if (this.isListening && !this.isSpeaking) {
        this.restartRecognition(50);
      }
    };

    this.recognition.onstart = () => {
      this.log('🟢 Recognition ACTIVE - listening for password:', `"${this.password}"`);
      this.restartAttempts = 0;
    };

    this.recognition.onspeechstart = () => {
      this.log('🗣️ Speech detected');
      this.lastSpeechTime = Date.now();
    };

    this.recognition.onspeechend = () => {
      this.log('🔇 Speech ended');
    };

    this.recognition.onaudiostart = () => {
      this.log('🎧 Audio started (microphone active)');
    };

    this.recognition.onaudioend = () => {
      this.log('🔌 Audio ended');
    };
  }

  private matchesPassword(transcript: string, password: string): boolean {
    // Normalize both strings
    const t = transcript.toLowerCase().trim();
    const p = password.toLowerCase().trim();
    
    // Exact match
    if (t === p) {
      this.log('✅ Exact match!');
      return true;
    }
    
    // Contains match
    if (t.includes(p)) {
      this.log('✅ Contains match!');
      return true;
    }
    
    // Password contains transcript (for partial matches)
    if (p.includes(t) && t.length >= 3) {
      this.log('✅ Partial match!');
      return true;
    }
    
    // Check each word
    const words = t.split(/\s+/);
    for (const word of words) {
      if (word === p || p.includes(word) || word.includes(p)) {
        this.log('✅ Word match:', word);
        return true;
      }
    }
    
    // Very lenient fuzzy match - allow up to 40% error
    const distance = this.levenshteinDistance(t, p);
    const threshold = Math.max(2, Math.floor(p.length * 0.4));
    if (distance <= threshold) {
      this.log('✅ Fuzzy match! Distance:', distance, 'Threshold:', threshold);
      return true;
    }
    
    return false;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[b.length][a.length];
  }

  private restartRecognition(delay: number = 100) {
    if (!this.isListening || !this.recognition || this.isSpeaking) return;
    
    if (this.restartAttempts >= this.maxRestartAttempts) {
      this.log('⚠️ Max restarts reached, reinitializing...');
      this.restartAttempts = 0;
      this.initRecognition();
    }
    
    this.restartAttempts++;
    
    setTimeout(() => {
      if (this.isListening && !this.isSpeaking && this.recognition) {
        try {
          this.recognition.start();
        } catch (e: any) {
          if (e.name !== 'InvalidStateError') {
            this.log('Restart error:', e.message);
          }
        }
      }
    }, delay);
  }

  private handlePasswordDetected() {
    this.log('🎯 PASSWORD MATCHED! Asking for confirmation...');
    this.onPasswordDetected?.();
    this.isAwaitingConfirmation = true;
    
    // Stop recognition while speaking
    try {
      this.recognition?.stop();
    } catch (e) {}
    
    // Speak confirmation prompt
    this.speak('Do you need help? Say yes or no.', () => {
      this.log('⏳ Prompt spoken, waiting for yes/no...');
    });
  }

  private speak(text: string, onComplete?: () => void) {
    const isNative = Capacitor.isNativePlatform();
    
    this.log(`🔊 Speaking: "${text}"`);
    this.isSpeaking = true;

    if (isNative) {
      this.speakMobile(text, onComplete);
    } else {
      this.speakWeb(text, onComplete);
    }
  }

  private speakMobile(text: string, onComplete?: () => void) {
    if (!this.synth) {
      this.log('Speech synthesis not available');
      this.isSpeaking = false;
      this.resumeListening();
      onComplete?.();
      return;
    }

    this.synth.cancel();

    setTimeout(() => {
      const voices = this.synth!.getVoices();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const mobileVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.localService || voice.default)
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      
      if (mobileVoice) {
        utterance.voice = mobileVoice;
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      utterance.onend = () => {
        this.log('✅ Speech completed');
        this.isSpeaking = false;
        this.resumeListening();
        onComplete?.();
      };

      utterance.onerror = (event) => {
        this.log('❌ Speech error:', event.error);
        this.isSpeaking = false;
        this.resumeListening();
        onComplete?.();
      };

      if (this.synth!.paused) {
        this.synth!.resume();
      }
      
      this.synth!.speak(utterance);
    }, 100);
  }

  private speakWeb(text: string, onComplete?: () => void) {
    if (!this.synth) {
      this.isSpeaking = false;
      this.resumeListening();
      onComplete?.();
      return;
    }

    this.synth.cancel();

    const speakWhenReady = () => {
      const voices = this.synth!.getVoices();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en-US')
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      utterance.onend = () => {
        this.log('✅ Speech completed');
        this.isSpeaking = false;
        this.resumeListening();
        onComplete?.();
      };

      utterance.onerror = (event) => {
        this.log('❌ Speech error:', event);
        this.isSpeaking = false;
        this.resumeListening();
        onComplete?.();
      };

      this.synth!.speak(utterance);
    };

    if (this.voicesLoaded) {
      speakWhenReady();
    } else {
      setTimeout(speakWhenReady, 100);
    }
  }

  private resumeListening() {
    if (this.isListening && this.recognition) {
      setTimeout(() => {
        if (this.isListening && !this.isSpeaking) {
          try {
            this.recognition.start();
            this.log('▶️ Resumed listening for', this.isAwaitingConfirmation ? 'confirmation' : 'password');
          } catch (e: any) {
            if (e.name !== 'InvalidStateError') {
              this.log('Resume error:', e.message);
            }
          }
        }
      }, 300);
    }
  }

  private startKeepAlive() {
    // Keep the recognition alive by checking its state periodically
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
    
    this.keepAliveInterval = window.setInterval(() => {
      if (this.isListening && !this.isSpeaking) {
        // Check if recognition seems to have stopped
        const timeSinceLastSpeech = Date.now() - this.lastSpeechTime;
        
        // Log status every 10 seconds for debugging
        if (timeSinceLastSpeech > 10000 && timeSinceLastSpeech % 10000 < 1000) {
          this.log('🔄 Keep-alive check - still listening for:', `"${this.password}"`);
        }
        
        // Force restart if we haven't heard anything in 30 seconds
        if (timeSinceLastSpeech > 30000) {
          this.log('⚠️ No speech detected for 30s, forcing restart...');
          try {
            this.recognition?.stop();
          } catch (e) {}
          
          setTimeout(() => {
            if (this.isListening && !this.isSpeaking) {
              try {
                this.recognition?.start();
                this.log('🔄 Recognition force-restarted');
              } catch (e) {}
            }
          }, 100);
          
          this.lastSpeechTime = Date.now(); // Reset timer
        }
      }
    }, 1000);
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      this.log('🎤 Requesting microphone permission...');
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.log('✅ Microphone permission granted');
      return true;
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      return false;
    }
  }

  async start(options: VoiceDetectionOptions): Promise<boolean> {
    this.log('🚀 Starting voice detection...');
    
    if (!this.recognition) {
      this.log('⚠️ Recognition not available, reinitializing...');
      this.initRecognition();
      if (!this.recognition) {
        console.error('❌ Speech recognition not supported');
        return false;
      }
    }

    if (this.isListening) {
      this.log('⚠️ Already listening, stopping first...');
      this.stop();
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!options.password || options.password.trim() === '') {
      console.error('❌ Password is required');
      return false;
    }

    // Request microphone permission
    const hasPermission = await this.requestMicrophonePermission();
    if (!hasPermission) {
      console.error('❌ Cannot start without microphone permission');
      return false;
    }

    this.password = options.password.trim();
    this.onPasswordDetected = options.onPasswordDetected;
    this.onConfirmation = options.onConfirmation;
    this.isListening = true;
    this.isAwaitingConfirmation = false;
    this.restartAttempts = 0;
    this.isSpeaking = false;
    this.lastSpeechTime = Date.now();

    try {
      this.recognition.start();
      this.log('✅ Voice detection started!');
      this.log('🔑 Listening for password:', `"${this.password}"`);
      
      // Start keep-alive mechanism
      this.startKeepAlive();
      
      return true;
    } catch (error: any) {
      if (error.name === 'InvalidStateError') {
        this.log('Already started');
        this.startKeepAlive();
        return true;
      }
      console.error('❌ Failed to start:', error);
      this.isListening = false;
      return false;
    }
  }

  stop() {
    this.log('🛑 Stopping voice detection...');
    this.isListening = false;
    this.isAwaitingConfirmation = false;
    this.isSpeaking = false;
    
    this.stopKeepAlive();
    
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {}
    }

    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }

    if (this.synth) {
      this.synth.cancel();
    }
    
    this.log('✅ Voice detection stopped');
  }

  isActive(): boolean {
    return this.isListening;
  }
  
  // For debugging - get current status
  getStatus(): { isListening: boolean; isAwaiting: boolean; password: string } {
    return {
      isListening: this.isListening,
      isAwaiting: this.isAwaitingConfirmation,
      password: this.password
    };
  }
}

// Export singleton instance
export const voiceDetection = new VoiceDetection();
