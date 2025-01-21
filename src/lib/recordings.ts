// src/lib/recordings.ts
import { storage } from './storage';
import api, { getCurrentToken } from './api';

// Types
export interface RecordingUploadResult {
  path: string;
  size: number;
  mimeType: string;
  error: Error | null;
}

export interface RecordingMetadata {
  duration: number;
  channels: number;
  sampleRate: number;
}

// Constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = ['audio/mp4', 'audio/webm', 'audio/mpeg'];

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
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      // Get and validate auth token
      const token = getCurrentToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Determine MIME type
      const mimeType = file instanceof File ? file.type : 'audio/mp4';
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      console.log('Starting recording upload:', {
        doctorId,
        sessionId,
        fileSize: file.size,
        mimeType
      });

      // Set the auth token once before upload
      storage.setAuth(token);

      // Construct path: recordings/[doctorId]/[sessionId]/[timestamp].mp4
      const path = `recordings/${doctorId}/${sessionId}`;
      const filename = `${Date.now()}.mp4`;

      const { path: filePath, error } = await storage.upload(file, path, filename);

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('Upload successful:', filePath);

      return {
        path: filePath,
        size: file.size,
        mimeType: 'audio/mp4',
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
   * Get a URL for a recording
   */
  getUrl: async (path: string, expiresIn: number = 3600) => {
    try {
      console.log('Getting recording URL:', { path });
      return storage.getUrl(path);
    } catch (error) {
      console.error('Get recording URL error:', error);
      return {
        signedUrl: null,
        error: error instanceof Error ? error : new Error('Failed to get recording URL')
      };
    }
  },

  /**
   * Delete a recording file
   */
  delete: async (path: string) => {
    try {
      console.log('Deleting recording:', { path });
      return storage.delete(path);
    } catch (error) {
      console.error('Delete recording error:', error);
      return {
        error: error instanceof Error ? error : new Error('Failed to delete recording')
      };
    }
  },

  /**
   * Validate a recording file before upload
   */
  validateFile: (file: File | Blob): Error | null => {
    if (file.size > MAX_FILE_SIZE) {
      return new Error(`File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    if (file instanceof File && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return new Error(`Unsupported file type: ${file.type}`);
    }

    return null;
  }
};