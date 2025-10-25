import { supabase } from './supabase';

/**
 * Listing Service
 * Handles all listing-related database operations
 */

class ListingService {
  constructor() {
    console.log('✅ Listing Service initialized');
  }

  /**
   * Create a new listing
   */
  async createListing(sitterId, listingData) {
    console.log('📝 Creating listing for sitter:', sitterId);

    const { data, error } = await supabase
      .from('listings')
      .insert([
        {
          sitter_id: sitterId,
          ...listingData,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create listing:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Listing created:', data.id);
    return data;
  }

  /**
   * Get listing by ID
   */
  async getListingById(listingId) {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles:sitter_id (
          id,
          name,
          avatar_url,
          bio,
          location
        )
      `)
      .eq('id', listingId)
      .single();

    if (error) {
      console.error('❌ Failed to fetch listing:', error.message);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Get all active listings (for Explore page)
   * Optional filters: city, service_type, accepted_pet_types, excludeUserId
   */
  async getActiveListings(filters = {}) {
    console.log('🔍 Fetching active listings with filters:', filters);

    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles:sitter_id (
          id,
          name,
          avatar_url,
          bio,
          location
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Exclude current user's listings (when owner views explore page)
    if (filters.excludeUserId) {
      query = query.neq('sitter_id', filters.excludeUserId);
    }

    // Apply filters
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    if (filters.service_type) {
      query = query.contains('service_type', [filters.service_type]);
    }

    if (filters.accepted_pet_types) {
      query = query.contains('accepted_pet_types', [filters.accepted_pet_types]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Failed to fetch listings:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Fetched', data.length, 'listings');
    return data;
  }

  /**
   * Get listings by sitter ID
   */
  async getListingsBySitter(sitterId) {
    console.log('🔍 Fetching listings for sitter:', sitterId);

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('sitter_id', sitterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch sitter listings:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Fetched', data.length, 'listings for sitter');
    return data;
  }

  /**
   * Update a listing
   */
  async updateListing(listingId, updates) {
    console.log('📝 Updating listing:', listingId);

    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to update listing:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Listing updated:', data.id);
    return data;
  }

  /**
   * Delete a listing (soft delete by setting is_active = false)
   */
  async deleteListing(listingId) {
    console.log('🗑️ Deleting listing:', listingId);

    const { data, error } = await supabase
      .from('listings')
      .update({ is_active: false })
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to delete listing:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Listing deleted:', data.id);
    return data;
  }

  /**
   * Toggle listing active status
   */
  async toggleListingStatus(listingId, isActive) {
    console.log('🔄 Toggling listing status:', listingId, 'to', isActive);

    const { data, error } = await supabase
      .from('listings')
      .update({ is_active: isActive })
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to toggle listing status:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Listing status toggled:', data.id);
    return data;
  }
}

// Export singleton instance
export const listingService = new ListingService();
export default listingService;
