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

  constructor() {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      this.setupRecognitionHandlers();
    } else {
      console.warn('Web Speech API not supported in this browser');
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      
      // Load voices
      const loadVoices = () => {
        const voices = this.synth?.getVoices() || [];
        if (voices.length > 0) {
          this.voicesLoaded = true;
          console.log('Voices loaded:', voices.length);
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
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.toLowerCase().trim();
      
      console.log('Voice detected:', transcript);

      if (this.isAwaitingConfirmation) {
        // Listen for yes/no response
        if (transcript.includes('yes') || transcript === 'yes') {
          console.log('✅ User confirmed "YES" - triggering emergency!');
          this.isAwaitingConfirmation = false;
          this.onConfirmation?.(true);
          this.stop();
        } else if (transcript.includes('no') || transcript === 'no') {
          console.log('❌ User cancelled with "NO"');
          this.isAwaitingConfirmation = false;
          this.onConfirmation?.(false);
          // Continue listening for password
          this.isAwaitingConfirmation = false;
        } else {
          console.log('⏳ Still waiting for yes/no, heard:', transcript);
        }
      } else {
        // Listen for password
        const passwordLower = this.password.toLowerCase();
        if (transcript.includes(passwordLower) || transcript === passwordLower) {
          console.log('Password detected!');
          this.handlePasswordDetected();
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      // Restart recognition if it stops due to an error (except if no-speech)
      if (event.error !== 'no-speech' && this.isListening) {
        setTimeout(() => {
          if (this.isListening) {
            try {
              this.recognition?.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }, 1000);
      }
    };

    this.recognition.onend = () => {
      console.log('Recognition ended');
      // Restart if we should still be listening (including when awaiting confirmation)
      if (this.isListening) {
        setTimeout(() => {
          if (this.isListening) {
            try {
              this.recognition?.start();
              console.log('Recognition restarted');
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }, 100);
      }
    };
  }

  private handlePasswordDetected() {
    this.onPasswordDetected?.();
    this.isAwaitingConfirmation = true;
    
    // Speak the confirmation prompt
    this.speak('Do you need help?', () => {
      // After prompt is spoken, continue listening for yes/no
      console.log('Waiting for yes or no response...');
    });
  }

  private speak(text: string, onComplete?: () => void) {
    const isNative = Capacitor.isNativePlatform();
    
    console.log(`🔊 Speaking: "${text}" (Platform: ${isNative ? 'Native' : 'Web'})`);

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

        // After speaking, resume listening for yes/no
        setTimeout(() => {
          if (this.isListening && this.isAwaitingConfirmation && this.recognition) {
            try {
              this.recognition.start();
              console.log('Resumed listening for confirmation');
            } catch (e) {
              console.error('Failed to resume recognition after speech:', e);
            }
          }
        }, 300); // Small delay to ensure speech is fully complete

        onComplete?.();
      };

      utterance.onerror = (event) => {
        console.error('❌ Mobile speech synthesis error:', event);
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

        // After speaking the confirmation prompt, make sure we are
        // actively listening for the user's "yes" or "no" response.
        if (this.isListening && this.isAwaitingConfirmation && this.recognition) {
          try {
            this.recognition.start();
            console.log('Resumed listening for confirmation');
          } catch (e) {
            console.error('Failed to resume recognition after speech:', e);
          }
        }

        onComplete?.();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
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

  start(options: VoiceDetectionOptions) {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      return;
    }

    if (this.isListening) {
      console.log('Already listening');
      return;
    }

    if (!options.password || options.password.trim() === '') {
      console.error('Password is required');
      return;
    }

    this.password = options.password;
    this.onPasswordDetected = options.onPasswordDetected;
    this.onConfirmation = options.onConfirmation;
    this.isListening = true;
    this.isAwaitingConfirmation = false;

    try {
      this.recognition.start();
      console.log('Voice detection started, listening for:', this.password);
    } catch (error) {
      console.error('Failed to start recognition:', error);
      this.isListening = false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.isAwaitingConfirmation = false;
      
      try {
        this.recognition.stop();
        console.log('Voice detection stopped');
      } catch (error) {
        console.error('Failed to stop recognition:', error);
      }
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
