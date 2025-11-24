import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { supabase } from '@/integrations/supabase/client';

export interface CapturedPhoto {
  base64: string;
  timestamp: number;
  url?: string;
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
        direction: CameraDirection.Front, // Use front-facing camera
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

  /**
   * Capture a single photo from front camera for emergency alert
   */
  async captureEmergencyPhoto(userId: string): Promise<string | null> {
    try {
      console.log('📸 Capturing emergency photo from front camera...');
      
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        direction: CameraDirection.Front,
        saveToGallery: false,
        correctOrientation: true,
        width: 1280,
        height: 720,
      });

      if (!photo.base64String) {
        console.error('No photo data captured');
        return null;
      }

      // Upload to Supabase Storage
      const fileName = `${userId}/${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('emergency-photos')
        .upload(fileName, this.base64ToBlob(photo.base64String, 'image/jpeg'), {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading photo:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('emergency-photos')
        .getPublicUrl(fileName);

      console.log('✅ Emergency photo uploaded:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error capturing emergency photo:', error);
      return null;
    }
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
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
