import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FileObject } from '@supabase/storage-js';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Types
export interface UploadResult {
  path: string;
  error: Error | null;
}

export interface FileMetadata {
  size: number;
  type: string;
}

export class StorageService {
  private bucket: string;
  private client: SupabaseClient; // Correctly typed as SupabaseClient

  constructor(bucket: string = 'storage') {
    this.bucket = bucket;
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  setAuth(accessToken: string, refreshToken: string) {
    this.client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  async upload(
    file: File | Blob,
    path: string,
    filename?: string
  ): Promise<UploadResult> {
    try {
      // Clean path and ensure no leading/trailing slashes
      const cleanPath = path.replace(/^\/+|\/+$/g, '');

      // Generate filename if not provided
      const finalFilename =
        filename || (file instanceof File ? file.name : `${Date.now()}.file`);

      // Construct full path
      const fullPath = `${cleanPath}/${finalFilename}`;

      console.log('Uploading file:', {
        bucket: this.bucket,
        path: fullPath,
        size: file.size,
        type: file instanceof File ? file.type : 'application/octet-stream',
      });

      // Upload file
      const { error } = await this.client.storage
        .from(this.bucket)
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Supabase storage error:', error);
        throw error;
      }

      return {
        path: fullPath,
        error: null,
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        path: '',
        error: error instanceof Error ? error : new Error('Upload failed'),
      };
    }
  }

  async delete(paths: string | string[]): Promise<{ error: Error | null }> {
    try {
      const pathsArray = Array.isArray(paths) ? paths : [paths];

      console.log('Deleting files:', {
        bucket: this.bucket,
        paths: pathsArray,
      });

      const { error } = await this.client.storage
        .from(this.bucket)
        .remove(pathsArray);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Delete error:', error);
      return {
        error: error instanceof Error ? error : new Error('Delete failed'),
      };
    }
  }

  async getMetadata(path: string): Promise<FileMetadata | null> {
    try {
      console.log('Getting metadata for file:', {
        bucket: this.bucket,
        path,
      });

      const { data, error } = await this.client.storage
        .from(this.bucket)
        .list('', {
          search: path,
        });

      if (error) throw error;

      const file = data.find((item: FileObject) => item.name === path.split('/').pop());

      if (!file || !file.metadata) return null;

      return {
        size: file.metadata.size || 0, // Default to 0 if size is undefined
        type: file.metadata.mimetype || 'unknown', // Default to 'unknown' if mimetype is undefined
      };
    } catch (error) {
      console.error('Get metadata error:', error);
      return null;
    }
  }

  async getUrl(path: string): Promise<{ signedUrl: string | null; error: Error | null }> {
    try {
      console.log('Getting URL for file:', {
        bucket: this.bucket,
        path,
      });

      // For public bucket, we can use getPublicUrl
      const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);

      return {
        signedUrl: data.publicUrl,
        error: null,
      };
    } catch (error) {
      console.error('Get URL error:', error);
      return {
        signedUrl: null,
        error: error instanceof Error ? error : new Error('Failed to get URL'),
      };
    }
  }

  // Legacy method kept for compatibility
  async createSignedUrl(
    path: string,
    expiresIn: number = 3600
  ): Promise<{ signedUrl: string | null; error: Error | null }> {
    try {
      console.log('Creating signed URL:', {
        bucket: this.bucket,
        path,
        expiresIn,
      });

      const { data, error } = await this.client.storage
        .from(this.bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;

      return {
        signedUrl: data.signedUrl,
        error: null,
      };
    } catch (error) {
      console.error('Create signed URL error:', error);
      return {
        signedUrl: null,
        error: error instanceof Error ? error : new Error('Failed to create signed URL'),
      };
    }
  }
}

// Export singleton instance
export const storage = new StorageService();