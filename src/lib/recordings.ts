// src/lib/recordings.ts
import { storage } from './storage';

export interface RecordingUploadResult {
  path: string;
  size: number;
  mimeType: string;
  error: Error | null;
}

export const recordingsStorage = {
  /**
   * Upload a recording file and get its storage path
   */
  upload: async (
    file: File | Blob,
    doctorId: string,
    sessionId: string
  ): Promise<RecordingUploadResult> => {
    try {
      // Construct path: recordings/[doctorId]/[sessionId]/[timestamp].webm
      const path = `recordings/${doctorId}/${sessionId}`;
      const filename = `${Date.now()}.webm`;

      const { path: filePath, error } = await storage.upload(file, path, filename);

      if (error) throw error;

      return {
        path: filePath,
        size: file.size,
        mimeType: file instanceof File ? file.type : 'audio/webm',
        error: null
      };

    } catch (error) {
      console.error('Recording upload error:', error);
      return {
        path: '',
        size: 0,
        mimeType: '',
        error: error instanceof Error ? error : new Error('Upload failed')
      };
    }
  },

  /**
   * Get a temporary URL for a recording
   */
  getUrl: async (path: string, expiresIn: number = 3600) => {
    return storage.createSignedUrl(path, expiresIn);
  },

  /**
   * Delete a recording file
   */
  delete: async (path: string) => {
    return storage.delete(path);
  }
};