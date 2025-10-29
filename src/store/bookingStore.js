import { create } from 'zustand';
import { bookingService } from '@/services/bookingService';

/**
 * Booking Store
 * Manages booking state using Zustand
 */
export const useBookingStore = create((set, get) => ({
  // State
  bookings: [],
  currentBooking: null,
  isLoading: false,
  error: null,

  // Fetch bookings by owner
  fetchOwnerBookings: async (ownerId) => {
    set({ isLoading: true, error: null });
    try {
      const bookings = await bookingService.getBookingsByOwner(ownerId);
      set({ bookings, isLoading: false });
      return { success: true, bookings };
    } catch (error) {
      console.error('❌ Failed to fetch owner bookings:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Fetch bookings by sitter
  fetchSitterBookings: async (sitterId) => {
    set({ isLoading: true, error: null });
    try {
      const bookings = await bookingService.getBookingsBySitter(sitterId);
      set({ bookings, isLoading: false });
      return { success: true, bookings };
    } catch (error) {
      console.error('❌ Failed to fetch sitter bookings:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Fetch booking by ID
  fetchBookingById: async (bookingId) => {
    set({ isLoading: true, error: null });
    try {
      const booking = await bookingService.getBookingById(bookingId);
      set({ currentBooking: booking, isLoading: false });
      return { success: true, booking };
    } catch (error) {
      console.error('❌ Failed to fetch booking:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Create a new booking
  createBooking: async (bookingData) => {
    set({ isLoading: true, error: null });
    try {
      const newBooking = await bookingService.createBooking(bookingData);

      // Add to bookings list
      set((state) => ({
        bookings: [newBooking, ...state.bookings],
        currentBooking: newBooking,
        isLoading: false,
      }));

      return { success: true, booking: newBooking };
    } catch (error) {
      console.error('❌ Failed to create booking:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Update booking status
  updateBookingStatus: async (bookingId, status, additionalData = {}) => {
    set({ isLoading: true, error: null });
    try {
      const updatedBooking = await bookingService.updateBookingStatus(
        bookingId,
        status,
        additionalData
      );

      // Update in bookings list
      set((state) => ({
        bookings: state.bookings.map((booking) =>
          booking.id === bookingId ? updatedBooking : booking
        ),
        currentBooking: updatedBooking,
        isLoading: false,
      }));

      return { success: true, booking: updatedBooking };
    } catch (error) {
      console.error('❌ Failed to update booking status:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Accept booking (sitter action)
  acceptBooking: async (bookingId, sitterId, conversationId) => {
    set({ isLoading: true, error: null });
    try {
      const updatedBooking = await bookingService.acceptBooking(
        bookingId,
        sitterId,
        conversationId
      );

      // Update in bookings list
      set((state) => ({
        bookings: state.bookings.map((booking) =>
          booking.id === bookingId ? updatedBooking : booking
        ),
        isLoading: false,
      }));

      return { success: true, booking: updatedBooking };
    } catch (error) {
      console.error('❌ Failed to accept booking:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Decline booking (sitter action)
  declineBooking: async (bookingId, sitterId, conversationId, reason = null) => {
    set({ isLoading: true, error: null });
    try {
      const updatedBooking = await bookingService.declineBooking(
        bookingId,
        sitterId,
        conversationId,
        reason
      );

      // Update in bookings list
      set((state) => ({
        bookings: state.bookings.map((booking) =>
          booking.id === bookingId ? updatedBooking : booking
        ),
        isLoading: false,
      }));

      return { success: true, booking: updatedBooking };
    } catch (error) {
      console.error('❌ Failed to decline booking:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId, userId, reason = null) => {
    set({ isLoading: true, error: null });
    try {
      const updatedBooking = await bookingService.cancelBooking(
        bookingId,
        userId,
        reason
      );

      // Update in bookings list
      set((state) => ({
        bookings: state.bookings.map((booking) =>
          booking.id === bookingId ? updatedBooking : booking
        ),
        isLoading: false,
      }));

      return { success: true, booking: updatedBooking };
    } catch (error) {
      console.error('❌ Failed to cancel booking:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Clear current booking
  clearCurrentBooking: () => set({ currentBooking: null }),
}));
