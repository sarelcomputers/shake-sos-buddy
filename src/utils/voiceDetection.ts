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
  private maxRestartAttempts = 50;
  private microphoneStream: MediaStream | null = null;
  private isSpeaking = false;

  constructor() {
    this.initRecognition();
    this.initSpeechSynthesis();
  }

  private initRecognition() {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true; // Enable interim results for faster detection
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 3;
      this.setupRecognitionHandlers();
      console.log('✅ Speech recognition initialized');
    } else {
      console.warn('❌ Web Speech API not supported in this browser');
    }
  }

  private initSpeechSynthesis() {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      
      // Load voices
      const loadVoices = () => {
        const voices = this.synth?.getVoices() || [];
        if (voices.length > 0) {
          this.voicesLoaded = true;
          console.log('✅ Voices loaded:', voices.length);
        }
      };

      // Try to load voices immediately
      loadVoices();

      // Also listen for voiceschanged event (needed on some browsers)
      if (this.synth) {
        this.synth.onvoiceschanged = loadVoices;
      }
    }
  }

  private setupRecognitionHandlers() {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      // Check all results, including interim
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        const isFinal = event.results[i].isFinal;
        
        console.log(`🎤 Voice detected${isFinal ? ' (final)' : ' (interim)'}:`, transcript);

        if (this.isAwaitingConfirmation) {
          // Listen for yes/no response
          if (transcript.includes('yes') || transcript === 'yes' || transcript.includes('yeah')) {
            console.log('✅ User confirmed "YES" - triggering emergency!');
            this.isAwaitingConfirmation = false;
            this.onConfirmation?.(true);
            this.stop();
            return;
          } else if (transcript.includes('no') || transcript === 'no' || transcript.includes('cancel')) {
            console.log('❌ User cancelled with "NO"');
            this.isAwaitingConfirmation = false;
            this.onConfirmation?.(false);
            // Continue listening for password
            return;
          } else if (isFinal) {
            console.log('⏳ Still waiting for yes/no, heard:', transcript);
          }
        } else {
          // Listen for password
          const passwordLower = this.password.toLowerCase();
          if (transcript.includes(passwordLower) || transcript === passwordLower) {
            console.log('🔑 Password detected!');
            this.handlePasswordDetected();
            return;
          }
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      
      // Don't restart if we're not supposed to be listening
      if (!this.isListening) return;
      
      // Handle different error types
      switch (event.error) {
        case 'no-speech':
          // This is normal, just restart
          console.log('👂 No speech detected, restarting...');
          this.restartRecognition(500);
          break;
        case 'audio-capture':
          console.error('🎤 Microphone not available, retrying...');
          this.restartRecognition(2000);
          break;
        case 'not-allowed':
          console.error('🚫 Microphone permission denied');
          this.isListening = false;
          break;
        case 'aborted':
          // Recognition was aborted, restart if still listening
          this.restartRecognition(500);
          break;
        default:
          this.restartRecognition(1000);
      }
    };

    this.recognition.onend = () => {
      console.log('🔴 Recognition ended, isListening:', this.isListening, 'isSpeaking:', this.isSpeaking);
      
      // Restart if we should still be listening and not speaking
      if (this.isListening && !this.isSpeaking) {
        this.restartRecognition(100);
      }
    };

    this.recognition.onstart = () => {
      console.log('🟢 Recognition started - listening for:', this.password || 'password');
      this.restartAttempts = 0;
    };

    this.recognition.onspeechstart = () => {
      console.log('🗣️ Speech started');
    };

    this.recognition.onspeechend = () => {
      console.log('🔇 Speech ended');
    };
  }

  private restartRecognition(delay: number = 100) {
    if (!this.isListening || !this.recognition) return;
    
    if (this.restartAttempts >= this.maxRestartAttempts) {
      console.log('⚠️ Max restart attempts reached, reinitializing...');
      this.restartAttempts = 0;
      // Reinitialize recognition
      this.initRecognition();
    }
    
    this.restartAttempts++;
    
    setTimeout(() => {
      if (this.isListening && !this.isSpeaking) {
        try {
          this.recognition?.start();
        } catch (e: any) {
          if (e.name !== 'InvalidStateError') {
            console.error('Failed to restart recognition:', e);
          }
          // If already running, that's fine
        }
      }
    }, delay);
  }

  private handlePasswordDetected() {
    this.onPasswordDetected?.();
    this.isAwaitingConfirmation = true;
    
    // Stop recognition while speaking to avoid feedback
    try {
      this.recognition?.stop();
    } catch (e) {}
    
    // Speak the confirmation prompt
    this.speak('Do you need help? Say yes or no.', () => {
      // After prompt is spoken, resume listening for yes/no
      console.log('⏳ Waiting for yes or no response...');
    });
  }

  private speak(text: string, onComplete?: () => void) {
    const isNative = Capacitor.isNativePlatform();
    
    console.log(`🔊 Speaking: "${text}" (Platform: ${isNative ? 'Native' : 'Web'})`);
    this.isSpeaking = true;

    // For mobile, use enhanced web speech with better settings
    if (isNative) {
      this.speakMobile(text, onComplete);
    } else {
      this.speakWeb(text, onComplete);
    }
  }

  private speakMobile(text: string, onComplete?: () => void) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported');
      this.isSpeaking = false;
      this.resumeListening();
      onComplete?.();
      return;
    }

    console.log('🎤 Using mobile-optimized speech synthesis');

    // Cancel any ongoing speech
    this.synth.cancel();

    // Wait a bit to ensure cancellation completed
    setTimeout(() => {
      const voices = this.synth!.getVoices();
      console.log('📱 Available mobile voices:', voices.length);
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // For mobile, find the best English voice
      const mobileVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.localService || voice.default)
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      
      if (mobileVoice) {
        console.log('Using mobile voice:', mobileVoice.name, mobileVoice.lang);
        utterance.voice = mobileVoice;
      }
      
      // Mobile-optimized settings
      utterance.rate = 0.9;  // Slightly slower for clarity
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        console.log('✅ Mobile speech started');
      };

      utterance.onend = () => {
        console.log('✅ Mobile speech completed');
        this.isSpeaking = false;
        this.resumeListening();
        onComplete?.();
      };

      utterance.onerror = (event) => {
        console.error('❌ Mobile speech synthesis error:', event);
        this.isSpeaking = false;
        this.resumeListening();
        onComplete?.();
      };

      console.log('📢 Speaking on mobile:', text);
      
      // Ensure speech synthesis is not paused
      if (this.synth.paused) {
        this.synth.resume();
      }
      
      this.synth!.speak(utterance);
    }, 100);
  }

  private speakWeb(text: string, onComplete?: () => void) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported');
      this.isSpeaking = false;
      this.resumeListening();
      onComplete?.();
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    // Wait for voices to load if not already loaded
    const speakWhenReady = () => {
      const voices = this.synth!.getVoices();
      console.log('Available voices:', voices.length);
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Use a female voice if available - try multiple options
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('victoria') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('susan') ||
        voice.name.toLowerCase().includes('karen') ||
        (voice.name.toLowerCase().includes('female') && voice.lang.startsWith('en')) ||
        (voice.name.toLowerCase().includes('woman') && voice.lang.startsWith('en'))
      ) || voices.find(voice => voice.lang.startsWith('en-US')) || voices[0];
      
      if (femaleVoice) {
        console.log('Using voice:', femaleVoice.name);
        utterance.voice = femaleVoice;
      }
      
      utterance.rate = 1.0;
      utterance.pitch = 1.2;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        console.log('Speech started');
      };

      utterance.onend = () => {
        console.log('Speech completed');
        this.isSpeaking = false;
        this.resumeListening();
        onComplete?.();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        this.isSpeaking = false;
        this.resumeListening();
        onComplete?.();
      };

      console.log('Speaking:', text);
      this.synth!.speak(utterance);
    };

    // If voices are loaded, speak immediately
    if (this.voicesLoaded) {
      speakWhenReady();
    } else {
      // Wait a bit for voices to load
      setTimeout(speakWhenReady, 100);
    }
  }

  private resumeListening() {
    if (this.isListening && this.recognition) {
      setTimeout(() => {
        if (this.isListening) {
          try {
            this.recognition.start();
            console.log('▶️ Resumed listening for', this.isAwaitingConfirmation ? 'confirmation' : 'password');
          } catch (e: any) {
            if (e.name !== 'InvalidStateError') {
              console.error('Failed to resume recognition:', e);
            }
          }
        }
      }, 300);
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      console.log('🎤 Requesting microphone permission...');
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('✅ Microphone permission granted');
      return true;
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      return false;
    }
  }

  async start(options: VoiceDetectionOptions) {
    if (!this.recognition) {
      console.error('❌ Speech recognition not available');
      // Try to reinitialize
      this.initRecognition();
      if (!this.recognition) {
        return false;
      }
    }

    if (this.isListening) {
      console.log('⚠️ Already listening');
      return true;
    }

    if (!options.password || options.password.trim() === '') {
      console.error('❌ Password is required');
      return false;
    }

    // Request microphone permission first
    const hasPermission = await this.requestMicrophonePermission();
    if (!hasPermission) {
      console.error('❌ Cannot start voice detection without microphone permission');
      return false;
    }

    this.password = options.password;
    this.onPasswordDetected = options.onPasswordDetected;
    this.onConfirmation = options.onConfirmation;
    this.isListening = true;
    this.isAwaitingConfirmation = false;
    this.restartAttempts = 0;
    this.isSpeaking = false;

    try {
      this.recognition.start();
      console.log('🎧 Voice detection started, listening for:', this.password);
      return true;
    } catch (error: any) {
      if (error.name === 'InvalidStateError') {
        // Already started, that's fine
        console.log('Recognition already started');
        return true;
      }
      console.error('❌ Failed to start recognition:', error);
      this.isListening = false;
      return false;
    }
  }

  stop() {
    console.log('🛑 Stopping voice detection...');
    this.isListening = false;
    this.isAwaitingConfirmation = false;
    this.isSpeaking = false;
    
    if (this.recognition) {
      try {
        this.recognition.stop();
        console.log('✅ Voice detection stopped');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }

    // Release microphone stream
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
      console.log('🎤 Microphone released');
    }

    // Cancel any ongoing speech
    if (this.synth) {
      this.synth.cancel();
    }
  }

  isActive() {
    return this.isListening;
  }
}

// Export singleton instance
export const voiceDetection = new VoiceDetection();