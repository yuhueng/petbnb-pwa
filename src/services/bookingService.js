import { supabase } from './supabase';
import { chatService } from './chatService';

/**
 * Booking Service
 * Handles all booking-related database operations
 */

class BookingService {
  constructor() {
    console.log('✅ Booking Service initialized');
  }

  /**
   * Create a new booking
   */
  async createBooking(bookingData) {
    console.log('📝 Creating booking:', bookingData);

    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          listing_id: bookingData.listingId,
          pet_owner_id: bookingData.ownerId,
          pet_sitter_id: bookingData.sitterId,
          pet_ids: bookingData.petIds || [], // Empty array for now
          start_date: bookingData.startDate,
          end_date: bookingData.endDate,
          status: 'pending',
          total_price: bookingData.totalPrice || null,
          special_requests: bookingData.specialRequests || null,
        },
      ])
      .select(`
        *,
        listing:listings(
          id,
          title,
          service_type,
          price_per_day,
          price_per_hour
        ),
        owner:profiles!pet_owner_id(
          id,
          name,
          avatar_url
        ),
        sitter:profiles!pet_sitter_id(
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('❌ Failed to create booking:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Booking created:', data.id);
    return data;
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        listing:listings(
          id,
          title,
          service_type,
          price_per_day,
          price_per_hour,
          city,
          state
        ),
        owner:profiles!pet_owner_id(
          id,
          name,
          avatar_url,
          email
        ),
        sitter:profiles!pet_sitter_id(
          id,
          name,
          avatar_url,
          email
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('❌ Failed to fetch booking:', error.message);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Get all bookings for an owner
   */
  async getBookingsByOwner(ownerId) {
    console.log('🔍 Fetching bookings for owner:', ownerId);

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        listing:listings(
          id,
          title,
          service_type,
          city,
          state
        ),
        sitter:profiles!pet_sitter_id(
          id,
          name,
          avatar_url
        )
      `)
      .eq('pet_owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch owner bookings:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Fetched', data.length, 'bookings for owner');
    return data;
  }

  /**
   * Get all bookings for a sitter
   */
  async getBookingsBySitter(sitterId) {
    console.log('🔍 Fetching bookings for sitter:', sitterId);

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        listing:listings(
          id,
          title,
          service_type
        ),
        owner:profiles!pet_owner_id(
          id,
          name,
          avatar_url
        )
      `)
      .eq('pet_sitter_id', sitterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch sitter bookings:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Fetched', data.length, 'bookings for sitter');
    return data;
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId, status, additionalData = {}) {
    console.log('📝 Updating booking status:', bookingId, 'to', status);

    const updates = {
      status,
      ...additionalData,
    };

    // Add timestamp based on status
    if (status === 'confirmed') {
      updates.confirmed_at = new Date().toISOString();
    } else if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select(`
        *,
        listing:listings(
          id,
          title,
          service_type
        ),
        owner:profiles!pet_owner_id(
          id,
          name,
          avatar_url
        ),
        sitter:profiles!pet_sitter_id(
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('❌ Failed to update booking status:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Booking status updated:', data.id);
    return data;
  }

  /**
   * Accept booking (sitter action)
   */
  async acceptBooking(bookingId, sitterId, conversationId) {
    console.log('✅ Accepting booking:', bookingId);

    // Update booking status
    const booking = await this.updateBookingStatus(bookingId, 'confirmed');

    // Send confirmation message to owner
    const confirmMessage = `🎉 Great news! Your booking request has been accepted!\n\n📅 Dates: ${new Date(booking.start_date).toLocaleDateString()} - ${new Date(booking.end_date).toLocaleDateString()}\n🏠 Service: ${booking.listing.title}\n\nLooking forward to caring for your pet!`;

    await chatService.sendMessage({
      conversationId,
      senderId: sitterId,
      content: confirmMessage,
    });

    return booking;
  }

  /**
   * Decline booking (sitter action)
   */
  async declineBooking(bookingId, sitterId, conversationId, reason = null) {
    console.log('❌ Declining booking:', bookingId);

    // Update booking status
    const booking = await this.updateBookingStatus(bookingId, 'cancelled', {
      cancellation_reason: reason,
    });

    // Send decline message to owner
    const declineMessage = `Sorry, I'm unable to accept your booking request for ${new Date(booking.start_date).toLocaleDateString()} - ${new Date(booking.end_date).toLocaleDateString()}.${reason ? `\n\nReason: ${reason}` : ''}`;

    await chatService.sendMessage({
      conversationId,
      senderId: sitterId,
      content: declineMessage,
    });

    return booking;
  }

  /**
   * Cancel booking (owner or sitter action)
   */
  async cancelBooking(bookingId, userId, reason = null) {
    console.log('🗑️ Cancelling booking:', bookingId);

    const booking = await this.updateBookingStatus(bookingId, 'cancelled', {
      cancellation_reason: reason,
    });

    return booking;
  }
}

// Export singleton instance
export const bookingService = new BookingService();
export default bookingService;
