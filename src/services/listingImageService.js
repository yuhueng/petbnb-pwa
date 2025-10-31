/**
 * Listing image upload service
 * Handles uploading images for listing cards (cover images and galleries)
 */

import { supabase } from './supabase';

// Storage bucket name for listing images
const BUCKET_NAME = 'listing-images';

// Maximum file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
];

class ListingImageService {
  /**
   * Validate image file
   * @param {File} file - Image file to validate
   * @returns {Object} { isValid: boolean, error: string }
   */
  validateImage(file) {
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `Image size must be less than ${MAX_FILE_SIZE / (1024 * 1024)} MB`,
      };
    }

    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Only image files (PNG, JPG, GIF, WEBP) are allowed',
      };
    }

    return { isValid: true, error: null };
  }

  /**
   * Generate safe filename for storage
   * @param {string} listingId - ID of the listing
   * @param {string} originalFilename - Original filename
   * @returns {string} Safe filename
   */
  generateFilename(listingId, originalFilename) {
    const timestamp = Date.now();
    const extension = originalFilename.split('.').pop().toLowerCase();
    return `${listingId}/${timestamp}_cover.${extension}`;
  }

  /**
   * Upload listing cover image
   * @param {File} file - Image file to upload
   * @param {string} listingId - ID of the listing
   * @returns {Promise<Object>} { success: boolean, url: string, error: string }
   */
  async uploadCoverImage(file, listingId) {
    try {
      // Validate image
      const validation = this.validateImage(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate filename
      const filename = this.generateFilename(listingId, file.name);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true, // Replace if exists
        });

      if (error) {
        console.error('Upload error:', error);
        return {
          success: false,
          error: `Failed to upload image: ${error.message}`,
        };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);

      return {
        success: true,
        url: publicUrl,
      };
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during upload',
      };
    }
  }

  /**
   * Upload multiple gallery images
   * @param {File[]} files - Array of image files
   * @param {string} listingId - ID of the listing
   * @returns {Promise<Object>} { success: boolean, urls: string[], error: string }
   */
  async uploadGalleryImages(files, listingId) {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const validation = this.validateImage(file);
        if (!validation.isValid) {
          throw new Error(`File ${index + 1}: ${validation.error}`);
        }

        const timestamp = Date.now();
        const extension = file.name.split('.').pop().toLowerCase();
        const filename = `${listingId}/${timestamp}_${index}.${extension}`;

        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filename, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);

        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);

      return {
        success: true,
        urls,
      };
    } catch (error) {
      console.error('Gallery upload error:', error);
      return {
        success: false,
        urls: [],
        error: error.message || 'Failed to upload gallery images',
      };
    }
  }

  /**
   * Delete an image from storage
   * @param {string} imageUrl - Public URL of the image
   * @returns {Promise<Object>} { success: boolean, error: string }
   */
  async deleteImage(imageUrl) {
    try {
      // Extract file path from URL
      const urlObj = new URL(imageUrl);
      const pathParts = urlObj.pathname.split(`/${BUCKET_NAME}/`);
      const filePath = pathParts.length > 1 ? pathParts[1] : null;

      if (!filePath) {
        return {
          success: false,
          error: 'Invalid image URL',
        };
      }

      const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return {
          success: false,
          error: `Failed to delete image: ${error.message}`,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Image deletion error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during deletion',
      };
    }
  }

  /**
   * Ensure storage bucket exists
   * @returns {Promise<boolean>}
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
        const { data, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE,
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
}

// Export singleton instance
export const listingImageService = new ListingImageService();
export default listingImageService;
