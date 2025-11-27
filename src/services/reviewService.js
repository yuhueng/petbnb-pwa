import { supabase } from './supabase';

// Predefined list of available review tags (EXACTLY 10 tags)
// These must match the database CHECK constraint
export const AVAILABLE_REVIEW_TAGS = [
  'Patient',
  'Friendly',
  'Reliable',
  'Caring',
  'Communicative',
  'Punctual',
  'Experienced',
  'Trustworthy',
  'Attentive',
  'Professional'
];

/**
 * Review Service
 * Handles review-related database operations
 */

class ReviewService {
  constructor() {
    console.log('✅ Review Service initialized');
  }

  /**
   * Get reviews for a specific sitter
   * @param {string} sitterId - Sitter's profile ID
   * @param {number} limit - Optional limit for number of reviews
   * @returns {Promise<{reviews: Array, averageRating: number, totalReviews: number}>}
   */
  async getReviewsBySitter(sitterId, limit = null) {
    console.log('🔍 Fetching reviews for sitter:', sitterId);

    let query = supabase
      .from('reviews')
      .select(`
        *,
        reviewer:reviewer_id (
          id,
          name,
          avatar_url
        ),
        booking:booking_id (
          id,
          start_date,
          end_date
        )
      `)
      .eq('sitter_id', sitterId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error('❌ Failed to fetch reviews:', error.message);
      throw new Error(error.message);
    }

    // Calculate average rating
    const averageRating =
      reviews && reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    console.log('✅ Fetched', reviews.length, 'reviews with average rating:', averageRating);

    return {
      reviews,
      averageRating: parseFloat(averageRating),
      totalReviews: reviews.length,
    };
  }

  /**
   * Get reviews for a specific listing (by sitter's listing)
   * @param {string} listingId - Listing ID
   * @param {number} limit - Optional limit for number of reviews
   * @returns {Promise<{reviews: Array, averageRating: number, totalReviews: number}>}
   */
  async getReviewsByListing(listingId, limit = null) {
    console.log('🔍 Fetching reviews for listing:', listingId);

    // First get the sitter_id from the listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('sitter_id')
      .eq('id', listingId)
      .single();

    if (listingError) {
      console.error('❌ Failed to fetch listing:', listingError.message);
      throw new Error(listingError.message);
    }

    // Now get reviews for that sitter
    return this.getReviewsBySitter(listing.sitter_id, limit);
  }

  /**
   * Get rating statistics for a sitter
   * @param {string} sitterId - Sitter's profile ID
   * @returns {Promise<{averageRating: number, totalReviews: number, ratingDistribution: Object}>}
   */
  async getRatingStats(sitterId) {
    console.log('📊 Fetching rating stats for sitter:', sitterId);

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('sitter_id', sitterId)
      .eq('is_visible', true);

    if (error) {
      console.error('❌ Failed to fetch rating stats:', error.message);
      throw new Error(error.message);
    }

    if (!reviews || reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    // Calculate average rating
    const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      ratingDistribution[review.rating]++;
    });

    console.log('✅ Rating stats calculated:', { averageRating, totalReviews: reviews.length });

    return {
      averageRating: parseFloat(averageRating),
      totalReviews: reviews.length,
      ratingDistribution,
    };
  }

  /**
   * Create a new review
   * @param {Object} reviewData - Review data (booking_id, reviewer_id, sitter_id, rating, title, comment, tags)
   * @returns {Promise<Object>} Created review
   */
  async createReview(reviewData) {
    console.log('📝 Creating review for sitter:', reviewData.sitter_id);

    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select(`
        *,
        reviewer:reviewer_id (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('❌ Failed to create review:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Review created:', data.id);
    return data;
  }

  /**
   * Update a review
   * @param {string} reviewId - Review ID
   * @param {Object} updates - Fields to update (rating, title, comment)
   * @returns {Promise<Object>} Updated review
   */
  async updateReview(reviewId, updates) {
    console.log('📝 Updating review:', reviewId);

    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select(`
        *,
        reviewer:reviewer_id (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('❌ Failed to update review:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Review updated:', data.id);
    return data;
  }

  /**
   * Add sitter response to a review
   * @param {string} reviewId - Review ID
   * @param {string} response - Sitter's response text
   * @returns {Promise<Object>} Updated review
   */
  async addSitterResponse(reviewId, response) {
    console.log('💬 Adding sitter response to review:', reviewId);

    const { data, error } = await supabase
      .from('reviews')
      .update({
        response,
        response_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select(`
        *,
        reviewer:reviewer_id (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('❌ Failed to add response:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Sitter response added');
    return data;
  }

  /**
   * Get rating statistics for multiple sitters at once
   * @param {string[]} sitterIds - Array of sitter IDs
   * @returns {Promise<Map<string, {averageRating: number, totalReviews: number}>>}
   */
  async getBatchRatingStats(sitterIds) {
    console.log('📊 Fetching rating stats for', sitterIds.length, 'sitters');

    if (!sitterIds || sitterIds.length === 0) {
      return new Map();
    }

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('sitter_id, rating')
      .in('sitter_id', sitterIds)
      .eq('is_visible', true);

    if (error) {
      console.error('❌ Failed to fetch batch rating stats:', error.message);
      throw new Error(error.message);
    }

    // Group reviews by sitter_id and calculate stats
    const statsMap = new Map();

    // Initialize all sitters with zero stats
    sitterIds.forEach(sitterId => {
      statsMap.set(sitterId, {
        averageRating: 0,
        totalReviews: 0,
      });
    });

    // Group reviews by sitter
    const reviewsBySitter = {};
    reviews.forEach(review => {
      if (!reviewsBySitter[review.sitter_id]) {
        reviewsBySitter[review.sitter_id] = [];
      }
      reviewsBySitter[review.sitter_id].push(review);
    });

    // Calculate stats for each sitter
    Object.keys(reviewsBySitter).forEach(sitterId => {
      const sitterReviews = reviewsBySitter[sitterId];
      const averageRating = sitterReviews.length > 0
        ? parseFloat((sitterReviews.reduce((sum, r) => sum + r.rating, 0) / sitterReviews.length).toFixed(1))
        : 0;

      statsMap.set(sitterId, {
        averageRating,
        totalReviews: sitterReviews.length,
      });
    });

    console.log('✅ Batch rating stats calculated for', statsMap.size, 'sitters');
    return statsMap;
  }

  /**
   * Get all unique tags used in reviews for a sitter with counts
   * @param {string} sitterId - Sitter ID
   * @returns {Promise<Array>} Array of tags with usage counts
   */
  async getSitterTagCounts(sitterId) {
    console.log('🏷️ Fetching tag counts for sitter:', sitterId);

    const { data, error } = await supabase
      .from('reviews')
      .select('tags')
      .eq('sitter_id', sitterId)
      .eq('is_visible', true);

    if (error) {
      console.error('❌ Failed to fetch sitter tags:', error.message);
      throw new Error(error.message);
    }

    // Count tag occurrences
    const tagCounts = {};
    (data || []).forEach(review => {
      if (review.tags) {
        review.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // Convert to array and sort by count
    const tagArray = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    console.log('✅ Fetched', tagArray.length, 'unique tags for sitter');
    return tagArray;
  }

  /**
   * Check if a review exists for a booking
   * @param {string} bookingId - Booking ID
   * @param {string} reviewerId - Reviewer ID
   * @returns {Promise<boolean>} Whether review exists
   */
  async checkReviewExists(bookingId, reviewerId) {
    console.log('🔍 Checking if review exists for booking:', bookingId);

    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('reviewer_id', reviewerId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('❌ Failed to check review existence:', error.message);
      throw new Error(error.message);
    }

    const exists = !error && data;
    console.log('✅ Review exists:', exists);
    return exists;
  }
}

// Export singleton instance
export const reviewService = new ReviewService();
export default reviewService;
