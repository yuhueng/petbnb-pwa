import { supabase } from './supabase';

/**
 * Certification Service
 * Handles all certification-related database operations for pet sitters
 */

export const certificationService = {
  /**
   * Fetch all certifications for a specific sitter
   * @param {string} sitterId - The sitter's user ID
   * @returns {Promise<Array>} Array of certification objects
   */
  async fetchCertificationsBySitter(sitterId) {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('sitter_id', sitterId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching certifications:', error);
      throw error;
    }
  },

  /**
   * Fetch a single certification by ID
   * @param {string} certificationId - The certification's ID
   * @returns {Promise<Object>} Certification object
   */
  async fetchCertificationById(certificationId) {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('id', certificationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching certification:', error);
      throw error;
    }
  },

  /**
   * Create a new certification
   * @param {Object} certificationData - Certification information
   * @returns {Promise<Object>} Created certification object
   */
  async createCertification(certificationData) {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .insert([certificationData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating certification:', error);
      throw error;
    }
  },

  /**
   * Update an existing certification
   * @param {string} certificationId - The certification's ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated certification object
   */
  async updateCertification(certificationId, updates) {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .update(updates)
        .eq('id', certificationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating certification:', error);
      throw error;
    }
  },

  /**
   * Delete a certification (hard delete)
   * @param {string} certificationId - The certification's ID
   * @returns {Promise<void>}
   */
  async deleteCertification(certificationId) {
    try {
      const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('id', certificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting certification:', error);
      throw error;
    }
  },

  /**
   * Upload a certificate image to Supabase Storage
   * @param {File} file - Image file to upload
   * @param {string} sitterId - Sitter's user ID
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async uploadCertificateImage(file, sitterId) {
    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Only JPG, PNG, and WEBP are allowed.',
        };
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File size too large. Maximum size is 5MB.',
        };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${sitterId}/cert-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('certification-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('certification-images')
        .getPublicUrl(fileName);

      return {
        success: true,
        url: publicUrlData.publicUrl,
      };
    } catch (error) {
      console.error('Error uploading certificate image:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Delete a certificate image from storage
   * @param {string} imageUrl - Full URL of the image to delete
   * @returns {Promise<{success: boolean}>}
   */
  async deleteCertificateImage(imageUrl) {
    try {
      if (!imageUrl) return { success: true };

      // Extract file path from URL
      const urlParts = imageUrl.split('/certification-images/');
      if (urlParts.length < 2) {
        throw new Error('Invalid image URL');
      }
      const filePath = urlParts[1];

      // Delete from storage
      const { error } = await supabase.storage
        .from('certification-images')
        .remove([filePath]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting certificate image:', error);
      // Don't fail the whole operation if delete fails
      return { success: true };
    }
  },
};

export default certificationService;
