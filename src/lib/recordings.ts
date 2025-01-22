// src/lib/recordings.ts
import { storage } from './storage';
import { getCurrentToken } from './api';

// Constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = ['audio/mp4', 'audio/webm', 'audio/mpeg', 'audio/wav'] as const;
type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

// Types
export interface RecordingUploadResult {
  path: string;
  size: number;
  mimeType: AllowedMimeType;
  error: Error | null;
}

export interface RecordingMetadata {
  duration: number;
  channels: number;
  sampleRate: number;
  originalName: string;
}

interface ValidationError extends Error {
  code: 'FILE_TOO_LARGE' | 'INVALID_MIME_TYPE' | 'NO_AUTH_TOKEN';
}

class RecordingError extends Error implements ValidationError {
  code: 'FILE_TOO_LARGE' | 'INVALID_MIME_TYPE' | 'NO_AUTH_TOKEN';

  constructor(message: string, code: ValidationError['code']) {
    super(message);
    this.code = code;
    this.name = 'RecordingError';
  }
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
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new RecordingError(
          `El archivo excede el límite de ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          'FILE_TOO_LARGE'
        );
      }

      // Get and validate auth token
      const token = getCurrentToken();
      if (!token) {
        throw new RecordingError(
          'No se encontró token de autenticación',
          'NO_AUTH_TOKEN'
        );
      }

      // Determine and validate MIME type
      const mimeType = file instanceof File ? file.type : 'audio/webm';
      if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
        throw new RecordingError(
          `Tipo de archivo no soportado: ${mimeType}`,
          'INVALID_MIME_TYPE'
        );
      }

      console.log('Iniciando subida de grabación:', {
        doctorId,
        sessionId,
        fileSize: file.size,
        mimeType
      });

      // Set the auth token
      const refreshToken = ''; // TODO: Implement refresh token handling
      storage.setAuth(token, refreshToken);

      // Construct path: recordings/[doctorId]/[sessionId]/[timestamp].webm
      const path = `recordings/${doctorId}/${sessionId}`;
      const timestamp = new Date().toISOString();
      const filename = `${timestamp.replace(/[:.]/g, '-')}.webm`;

      const { path: filePath, error } = await storage.upload(file, path, filename);

      if (error) {
        console.error('Error en subida a storage:', error);
        throw error;
      }

      console.log('Subida exitosa:', filePath);

      return {
        path: filePath,
        size: file.size,
        mimeType: mimeType as AllowedMimeType,
        error: null
      };

    } catch (error) {
      console.error('Error en subida de grabación:', error);
      return {
        path: '',
        size: 0,
        mimeType: 'audio/webm',
        error: error instanceof Error ? error : new Error('Error en subida')
      };
    }
  },

  /**
   * Get a URL for a recording
   */
  getUrl: async (path: string) => {
    try {
      console.log('Obteniendo URL de grabación:', { path });
      return storage.getUrl(path);
    } catch (error) {
      console.error('Error obteniendo URL de grabación:', error);
      return {
        signedUrl: null,
        error: error instanceof Error ? error : new Error('Error obteniendo URL')
      };
    }
  },

  /**
   * Delete a recording file
   */
  delete: async (path: string) => {
    try {
      console.log('Eliminando grabación:', { path });
      return storage.delete(path);
    } catch (error) {
      console.error('Error eliminando grabación:', error);
      return {
        error: error instanceof Error ? error : new Error('Error eliminando grabación')
      };
    }
  },

  /**
   * Validate a recording file before upload
   * @returns Error if validation fails, null if validation passes
   */
  validateFile: (file: File | Blob): Error | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return new RecordingError(
        `El archivo excede el límite de ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        'FILE_TOO_LARGE'
      );
    }

    // Check MIME type for File objects
    if (file instanceof File) {
      if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
        return new RecordingError(
          `Tipo de archivo no soportado: ${file.type}`,
          'INVALID_MIME_TYPE'
        );
      }
    }

    return null;
  },

  /**
   * Create recording metadata for backend
   */
  createMetadata: (
    duration: number,
    sampleRate: number = 16000,
    channels: number = 1,
    originalName?: string
  ): RecordingMetadata => {
    return {
      duration,
      sampleRate,
      channels,
      originalName: originalName || `recording-${new Date().toISOString()}.webm`
    };
  },

  /**
   * Generate recording file name
   */
  generateFileName: (extension: string = 'webm'): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${timestamp}.${extension}`;
  }
};