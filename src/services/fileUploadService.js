/**
 * File upload service for message attachments
 * Handles uploading files to Supabase Storage
 */

import { supabase } from './supabase';
import {
  validateFile,
  generateSafeFilename,
  isImageFile,
  formatFileSize,
} from '@/utils/fileValidation';

// Storage bucket name for message attachments
const BUCKET_NAME = 'message-attachments';

class FileUploadService {
  /**
   * Upload a file to Supabase Storage
   * @param {File} file - File to upload
   * @param {string} conversationId - ID of the conversation
   * @param {Function} onProgress - Optional progress callback (0-100)
   * @returns {Promise<Object>} { success: boolean, url: string, metadata: Object, error: string }
   */
  async uploadFile(file, conversationId, onProgress = null) {
    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate safe filename
      const safeFilename = generateSafeFilename(file.name);
      const filePath = `${conversationId}/${safeFilename}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return {
          success: false,
          error: `Failed to upload file: ${error.message}`,
        };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      // Prepare metadata
      const metadata = {
        type: 'file_attachment',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        isImage: isImageFile(file.type),
        uploadedAt: new Date().toISOString(),
      };

      return {
        success: true,
        url: publicUrl,
        metadata,
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during upload',
      };
    }
  }

  /**
   * Delete a file from Supabase Storage
   * @param {string} fileUrl - Public URL of the file to delete
   * @returns {Promise<Object>} { success: boolean, error: string }
   */
  async deleteFile(fileUrl) {
    try {
      // Extract file path from URL
      const filePath = this.extractFilePathFromUrl(fileUrl);

      if (!filePath) {
        return {
          success: false,
          error: 'Invalid file URL',
        };
      }

      const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return {
          success: false,
          error: `Failed to delete file: ${error.message}`,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('File deletion error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during deletion',
      };
    }
  }

  /**
   * Extract file path from Supabase Storage public URL
   * @param {string} url - Public URL of the file
   * @returns {string|null} File path or null if invalid
   */
  extractFilePathFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split(`/${BUCKET_NAME}/`);
      return pathParts.length > 1 ? pathParts[1] : null;
    } catch (error) {
      console.error('Error extracting file path:', error);
      return null;
    }
  }

  /**
   * Check if storage bucket exists, create if not
   * @returns {Promise<boolean>} True if bucket exists or was created
   */
  async ensureBucketExists() {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        console.error('Error listing buckets:', error);
        return false;
      }

      const bucketExists = buckets.some((bucket) => bucket.name === BUCKET_NAME);

      if (!bucketExists) {
        // Create bucket if it doesn't exist
        const { data, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 10485760, // 10 MB
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          return false;
        }

        console.log('Created storage bucket:', BUCKET_NAME);
      }

      return true;
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      return false;
    }
  }

  /**
   * Get file metadata from URL
   * @param {string} url - File URL
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(url) {
    try {
      const filePath = this.extractFilePathFromUrl(url);
      if (!filePath) {
        return null;
      }

      const { data, error } = await supabase.storage.from(BUCKET_NAME).list(filePath);

      if (error || !data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService();
export default fileUploadService;
