import { supabase } from './supabase';

/**
 * Wishlist Service
 * Handles CRUD operations for owner wishlists
 */

export const wishlistService = {
  /**
   * Add a listing to wishlist
   * @param {string} ownerId - Owner's user ID
   * @param {string} listingId - Listing ID to save
   * @returns {Promise<Object>} Created wishlist entry
   */
  async addToWishlist(ownerId, listingId) {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .insert([
          {
            owner_id: ownerId,
            listing_id: listingId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove a listing from wishlist
   * @param {string} ownerId - Owner's user ID
   * @param {string} listingId - Listing ID to remove
   * @returns {Promise<Object>} Success status
   */
  async removeFromWishlist(ownerId, listingId) {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('owner_id', ownerId)
        .eq('listing_id', listingId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all wishlist items for an owner with full listing details
   * @param {string} ownerId - Owner's user ID
   * @returns {Promise<Array>} Array of wishlist items with listing details
   */
  async getWishlist(ownerId) {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          id,
          created_at,
          listing:listings (
            id,
            title,
            description,
            service_type,
            price_per_day,
            price_per_hour,
            city,
            state,
            accepted_pet_types,
            accepted_pet_sizes,
            amenities,
            profiles:profiles!listings_sitter_id_fkey (
              id,
              name,
              avatar_url,
              location
            )
          )
        `)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Check if a listing is in the wishlist
   * @param {string} ownerId - Owner's user ID
   * @param {string} listingId - Listing ID to check
   * @returns {Promise<boolean>} True if listing is in wishlist
   */
  async isInWishlist(ownerId, listingId) {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('id')
        .eq('owner_id', ownerId)
        .eq('listing_id', listingId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return !!data;
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      return false;
    }
  },

  /**
   * Get wishlist IDs for quick lookups
   * @param {string} ownerId - Owner's user ID
   * @returns {Promise<Set>} Set of listing IDs in wishlist
   */
  async getWishlistIds(ownerId) {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('listing_id')
        .eq('owner_id', ownerId);

      if (error) throw error;
      return new Set((data || []).map((item) => item.listing_id));
    } catch (error) {
      console.error('Error fetching wishlist IDs:', error);
      return new Set();
    }
  },

  /**
   * Toggle wishlist status (add if not present, remove if present)
   * @param {string} ownerId - Owner's user ID
   * @param {string} listingId - Listing ID to toggle
   * @returns {Promise<Object>} Success status and new state
   */
  async toggleWishlist(ownerId, listingId) {
    try {
      const isInWishlist = await this.isInWishlist(ownerId, listingId);

      if (isInWishlist) {
        const result = await this.removeFromWishlist(ownerId, listingId);
        return { ...result, isInWishlist: false };
      } else {
        const result = await this.addToWishlist(ownerId, listingId);
        return { ...result, isInWishlist: true };
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      return { success: false, error: error.message };
    }
  },
};

export default wishlistService;
