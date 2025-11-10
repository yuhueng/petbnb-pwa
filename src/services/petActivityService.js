import { supabase } from './supabase';

/**
 * Pet Activity Service
 * Handles all pet activity operations (walk, feed, play)
 */

export const petActivityService = {
  /**
   * Create a new pet activity
   * @param {Object} activityData - Activity data
   * @returns {Object} Created activity
   */
  async createActivity(activityData) {
    try {
      const {
        bookingId,
        petSitterId,
        petOwnerId,
        activityType,
        activityTitle,
        activityDescription,
        activityDetail,
        imageUrls = [],
        activityTimestamp = new Date().toISOString(),
      } = activityData;

      const { data, error } = await supabase
        .from('pet_activities')
        .insert([
          {
            booking_id: bookingId,
            pet_sitter_id: petSitterId,
            pet_owner_id: petOwnerId,
            activity_type: activityType,
            activity_title: activityTitle,
            activity_description: activityDescription,
            activity_detail: activityDetail,
            image_urls: imageUrls,
            activity_timestamp: activityTimestamp,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating pet activity:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get activities for a specific booking
   * @param {string} bookingId - Booking ID
   * @returns {Array} Activities
   */
  async getActivitiesByBooking(bookingId) {
    try {
      const { data, error } = await supabase
        .from('pet_activities')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('is_visible', true)
        .order('activity_timestamp', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching activities:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Get activities for a specific date
   * @param {string} bookingId - Booking ID
   * @param {Date} date - Date to filter
   * @returns {Array} Activities for that date
   */
  async getActivitiesByDate(bookingId, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('pet_activities')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('is_visible', true)
        .gte('activity_timestamp', startOfDay.toISOString())
        .lte('activity_timestamp', endOfDay.toISOString())
        .order('activity_timestamp', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching activities by date:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Get activities by owner (for owner's view)
   * @param {string} ownerId - Owner's user ID
   * @returns {Array} All activities for owner's pets
   */
  async getActivitiesByOwner(ownerId) {
    try {
      const { data, error } = await supabase
        .from('pet_activities')
        .select('*, bookings(*)')
        .eq('pet_owner_id', ownerId)
        .eq('is_visible', true)
        .order('activity_timestamp', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching owner activities:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Get activities by sitter (for sitter's view)
   * @param {string} sitterId - Sitter's user ID
   * @returns {Array} All activities by sitter
   */
  async getActivitiesBySitter(sitterId) {
    try {
      const { data, error } = await supabase
        .from('pet_activities')
        .select('*, bookings(*)')
        .eq('pet_sitter_id', sitterId)
        .eq('is_visible', true)
        .order('activity_timestamp', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching sitter activities:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Upload activity images to Supabase Storage
   * @param {File} file - Image file
   * @param {string} bookingId - Booking ID for organizing files
   * @param {string} activityType - Activity type (walk, feed, play)
   * @returns {string} Public URL of uploaded image
   */
  async uploadActivityImage(file, bookingId, activityType) {
    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${bookingId}/${activityType}/${timestamp}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('pet-activity-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from('pet-activity-images')
        .getPublicUrl(data.path);

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Error uploading activity image:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Upload multiple images
   * @param {FileList} files - Multiple image files
   * @param {string} bookingId - Booking ID
   * @param {string} activityType - Activity type
   * @returns {Array} Array of public URLs
   */
  async uploadMultipleImages(files, bookingId, activityType) {
    try {
      const uploadPromises = Array.from(files).map((file) =>
        this.uploadActivityImage(file, bookingId, activityType)
      );

      const results = await Promise.all(uploadPromises);

      const successfulUploads = results
        .filter((r) => r.success)
        .map((r) => r.url);

      return {
        success: true,
        urls: successfulUploads,
        failedCount: results.length - successfulUploads.length,
      };
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      return { success: false, error: error.message, urls: [] };
    }
  },

  /**
   * Update an activity
   * @param {string} activityId - Activity ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated activity
   */
  async updateActivity(activityId, updates) {
    try {
      const { data, error } = await supabase
        .from('pet_activities')
        .update(updates)
        .eq('id', activityId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating activity:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete an activity
   * @param {string} activityId - Activity ID
   * @returns {boolean} Success status
   */
  async deleteActivity(activityId) {
    try {
      const { error } = await supabase
        .from('pet_activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting activity:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get activity statistics for a booking
   * @param {string} bookingId - Booking ID
   * @returns {Object} Statistics (walk count, feed count, play count)
   */
  async getActivityStats(bookingId) {
    try {
      const { data, error } = await supabase
        .from('pet_activities')
        .select('activity_type')
        .eq('booking_id', bookingId)
        .eq('is_visible', true);

      if (error) throw error;

      const stats = {
        walk: data.filter((a) => a.activity_type === 'walk').length,
        feed: data.filter((a) => a.activity_type === 'feed').length,
        play: data.filter((a) => a.activity_type === 'play').length,
        total: data.length,
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      return { success: false, error: error.message };
    }
  },
};

export default petActivityService;
