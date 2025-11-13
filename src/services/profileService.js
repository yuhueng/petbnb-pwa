import { supabase } from './supabase';

/**
 * Profile Service
 * Handles profile CRUD operations and avatar uploads
 */

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export const getProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { success: false, data: null, error: error.message };
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} updates - Profile fields to update (name, bio, location, avatar_url)
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export const updateProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, data: null, error: error.message };
  }
};

/**
 * Upload profile avatar
 * @param {File} file - Image file to upload
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, url: string|null, error: string|null}>}
 */
export const uploadAvatar = async (file, userId) => {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('profile-avatars')
      .getPublicUrl(fileName);

    return { success: true, url: publicUrlData.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { success: false, url: null, error: error.message };
  }
};

/**
 * Delete old avatar from storage
 * @param {string} avatarUrl - Full URL of the avatar to delete
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const deleteAvatar = async (avatarUrl) => {
  try {
    if (!avatarUrl) return { success: true, error: null };

    // Extract file path from URL
    const urlParts = avatarUrl.split('/profile-avatars/');
    if (urlParts.length < 2) {
      throw new Error('Invalid avatar URL');
    }
    const filePath = urlParts[1];

    // Delete from storage
    const { error } = await supabase.storage
      .from('profile-avatars')
      .remove([filePath]);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting avatar:', error);
    // Don't fail the whole operation if delete fails
    return { success: true, error: null };
  }
};

/**
 * Update profile with new avatar
 * @param {File} file - Image file to upload
 * @param {string} userId - User ID
 * @param {string} oldAvatarUrl - Old avatar URL to delete (optional)
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export const updateProfileAvatar = async (file, userId, oldAvatarUrl = null) => {
  try {
    // Upload new avatar
    const uploadResult = await uploadAvatar(file, userId);
    if (!uploadResult.success) {
      throw new Error(uploadResult.error);
    }

    // Update profile with new avatar URL
    const updateResult = await updateProfile(userId, {
      avatar_url: uploadResult.url,
    });

    if (!updateResult.success) {
      throw new Error(updateResult.error);
    }

    // Delete old avatar (non-blocking)
    if (oldAvatarUrl) {
      deleteAvatar(oldAvatarUrl);
    }

    return { success: true, data: updateResult.data, error: null };
  } catch (error) {
    console.error('Error updating profile avatar:', error);
    return { success: false, data: null, error: error.message };
  }
};

/**
 * Get profile stats (for display on profile page)
 * @param {string} userId - User ID
 * @param {string} role - 'owner' or 'sitter'
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export const getProfileStats = async (userId, role) => {
  try {
    const stats = {};

    if (role === 'owner') {
      // Get total bookings count
      const { count: bookingsCount, error: bookingsError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('pet_owner_id', userId);

      if (bookingsError) throw bookingsError;

      // Get total pets count
      const { count: petsCount, error: petsError } = await supabase
        .from('pets')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('is_active', true);

      if (petsError) throw petsError;

      // Get wishlist count
      const { count: wishlistCount, error: wishlistError } = await supabase
        .from('wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

      if (wishlistError) throw wishlistError;

      stats.totalBookings = bookingsCount || 0;
      stats.totalPets = petsCount || 0;
      stats.totalWishlists = wishlistCount || 0;
    } else if (role === 'sitter') {
      // Get total bookings as sitter
      const { count: bookingsCount, error: bookingsError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('pet_sitter_id', userId);

      if (bookingsError) throw bookingsError;

      // Get completed bookings
      const { count: completedCount, error: completedError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('pet_sitter_id', userId)
        .eq('status', 'completed');

      if (completedError) throw completedError;

      // Get average rating
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('sitter_id', userId)
        .eq('is_visible', true);

      if (reviewsError) throw reviewsError;

      const avgRating =
        reviews && reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : 0;

      stats.totalBookings = bookingsCount || 0;
      stats.completedBookings = completedCount || 0;
      stats.averageRating = parseFloat(avgRating);
      stats.totalReviews = reviews?.length || 0;
    }

    return { success: true, data: stats, error: null };
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return { success: false, data: null, error: error.message };
  }
};

export const profileService = {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  updateProfileAvatar,
  getProfileStats,
};

export default profileService;
