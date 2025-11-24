// Voice detection utility for SOS activation
// Uses Web Speech API for continuous listening

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

  constructor() {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.setupRecognitionHandlers();
    } else {
      console.warn('Web Speech API not supported in this browser');
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
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
          console.log('User confirmed emergency');
          this.isAwaitingConfirmation = false;
          this.onConfirmation?.(true);
          this.stop();
        } else if (transcript.includes('no') || transcript === 'no') {
          console.log('User cancelled emergency');
          this.isAwaitingConfirmation = false;
          this.onConfirmation?.(false);
          // Continue listening for password
          this.isAwaitingConfirmation = false;
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
      // Restart if we should still be listening
      if (this.isListening && !this.isAwaitingConfirmation) {
        setTimeout(() => {
          if (this.isListening) {
            try {
              this.recognition?.start();
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
    if (!this.synth) {
      console.warn('Speech synthesis not supported');
      onComplete?.();
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Use a female voice if available
    const voices = this.synth.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('woman') ||
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('victoria')
    ) || voices.find(voice => voice.lang === 'en-US');
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.2;
    utterance.volume = 1.0;

    utterance.onend = () => {
      console.log('Prompt spoken');
      onComplete?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      onComplete?.();
    };

    this.synth.speak(utterance);
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
