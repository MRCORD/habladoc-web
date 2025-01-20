// src/lib/storage.ts
import { createClient } from '@supabase/supabase-js';

// Ensure environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface UploadResult {
  path: string;
  error: Error | null;
}

export interface FileMetadata {
  size: number;
  type: string;
}

// Base storage service class
export class StorageService {
  private bucket: string;

  constructor(bucket: string = 'storage') {
    this.bucket = bucket;
  }

  /**
   * Upload a file to storage
   * @param file - File to upload
   * @param path - Path where file should be stored (without filename)
   * @param filename - Optional filename (if not provided, original name is used)
   */
  async upload(
    file: File | Blob,
    path: string,
    filename?: string
  ): Promise<UploadResult> {
    try {
      // Clean path and ensure no leading/trailing slashes
      const cleanPath = path.replace(/^\/+|\/+$/g, '');
      
      // Generate filename if not provided
      const finalFilename = filename || 
        (file instanceof File ? file.name : `${Date.now()}.file`);
      
      // Construct full path
      const fullPath = `${cleanPath}/${finalFilename}`;

      // Upload file
      const { error } = await supabase.storage
        .from(this.bucket)
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      return {
        path: fullPath,
        error: null
      };

    } catch (error) {
      console.error('Upload error:', error);
      return {
        path: '',
        error: error instanceof Error ? error : new Error('Upload failed')
      };
    }
  }

  /**
   * Delete one or more files from storage
   * @param paths - Single path or array of paths to delete
   */
  async delete(paths: string | string[]): Promise<{ error: Error | null }> {
    try {
      const pathsArray = Array.isArray(paths) ? paths : [paths];
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove(pathsArray);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Delete error:', error);
      return {
        error: error instanceof Error ? error : new Error('Delete failed')
      };
    }
  }

  /**
   * Get file metadata
   * @param path - Path to the file
   */
  async getMetadata(path: string): Promise<FileMetadata | null> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .list('', {
          search: path
        });

      if (error) throw error;

      const file = data.find(item => item.name === path.split('/').pop());
      if (!file) return null;

      return {
        size: file.metadata.size,
        type: file.metadata.mimetype
      };
    } catch (error) {
      console.error('Get metadata error:', error);
      return null;
    }
  }

  /**
   * Create a signed URL for temporary access
   * @param path - Path to the file
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   */
  async createSignedUrl(
    path: string,
    expiresIn: number = 3600
  ): Promise<{ signedUrl: string | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;

      return {
        signedUrl: data.signedUrl,
        error: null
      };
    } catch (error) {
      console.error('Create signed URL error:', error);
      return {
        signedUrl: null,
        error: error instanceof Error ? error : new Error('Failed to create signed URL')
      };
    }
  }
}

// Create instance with default bucket
export const storage = new StorageService();