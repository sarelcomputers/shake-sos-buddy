import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface CapturedPhoto {
  base64: string;
  timestamp: number;
}

export class CameraCapture {
  private photos: CapturedPhoto[] = [];
  private captureInterval: NodeJS.Timeout | null = null;
  private isCapturing = false;

  async startCapturing(intervalSeconds: number = 5, durationSeconds: number = 15): Promise<CapturedPhoto[]> {
    this.photos = [];
    this.isCapturing = true;
    
    console.log(`Starting camera capture: ${intervalSeconds}s intervals for ${durationSeconds}s total`);

    try {
      // Take first photo immediately
      await this.capturePhoto();

      // Set up interval for subsequent photos
      this.captureInterval = setInterval(async () => {
        if (this.isCapturing) {
          await this.capturePhoto();
        }
      }, intervalSeconds * 1000);

      // Stop after duration
      return new Promise((resolve) => {
        setTimeout(() => {
          this.stopCapturing();
          console.log(`Camera capture complete. Captured ${this.photos.length} photos`);
          resolve(this.photos);
        }, durationSeconds * 1000);
      });
    } catch (error) {
      console.error('Error starting camera capture:', error);
      this.stopCapturing();
      throw error;
    }
  }

  private async capturePhoto(): Promise<void> {
    try {
      const photo = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        saveToGallery: false,
        correctOrientation: true,
        width: 1280,
        height: 720,
      });

      if (photo.base64String) {
        this.photos.push({
          base64: photo.base64String,
          timestamp: Date.now(),
        });
        console.log(`Photo captured: ${this.photos.length}`);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  }

  stopCapturing(): void {
    this.isCapturing = false;
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
  }

  cleanup(): void {
    this.stopCapturing();
    this.photos = [];
  }

  getPhotos(): CapturedPhoto[] {
    return this.photos;
  }
}

export const cameraCapture = new CameraCapture();
