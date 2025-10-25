import { create } from 'zustand';
import { listingService } from '@/services/listingService';

/**
 * Listing Store
 * Manages listing state using Zustand
 */
export const useListingStore = create((set, get) => ({
  // State
  listings: [],
  currentListing: null,
  myListings: [],
  isLoading: false,
  error: null,

  // Fetch all active listings (for Explore page)
  fetchListings: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const listings = await listingService.getActiveListings(filters);
      set({ listings, isLoading: false });
      return { success: true, listings };
    } catch (error) {
      console.error('❌ Failed to fetch listings:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Fetch listing by ID
  fetchListingById: async (listingId) => {
    set({ isLoading: true, error: null });
    try {
      const listing = await listingService.getListingById(listingId);
      set({ currentListing: listing, isLoading: false });
      return { success: true, listing };
    } catch (error) {
      console.error('❌ Failed to fetch listing:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Fetch listings by sitter ID
  fetchMyListings: async (sitterId) => {
    set({ isLoading: true, error: null });
    try {
      const myListings = await listingService.getListingsBySitter(sitterId);
      set({ myListings, isLoading: false });
      return { success: true, listings: myListings };
    } catch (error) {
      console.error('❌ Failed to fetch my listings:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Create a new listing
  createListing: async (sitterId, listingData) => {
    set({ isLoading: true, error: null });
    try {
      const newListing = await listingService.createListing(sitterId, listingData);

      // Add to myListings
      set((state) => ({
        myListings: [newListing, ...state.myListings],
        currentListing: newListing,
        isLoading: false,
      }));

      return { success: true, listing: newListing };
    } catch (error) {
      console.error('❌ Failed to create listing:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Update a listing
  updateListing: async (listingId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedListing = await listingService.updateListing(listingId, updates);

      // Update in myListings
      set((state) => ({
        myListings: state.myListings.map((listing) =>
          listing.id === listingId ? updatedListing : listing
        ),
        currentListing: updatedListing,
        isLoading: false,
      }));

      return { success: true, listing: updatedListing };
    } catch (error) {
      console.error('❌ Failed to update listing:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Delete a listing
  deleteListing: async (listingId) => {
    set({ isLoading: true, error: null });
    try {
      await listingService.deleteListing(listingId);

      // Remove from myListings
      set((state) => ({
        myListings: state.myListings.filter((listing) => listing.id !== listingId),
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete listing:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Toggle listing status
  toggleListingStatus: async (listingId, isActive) => {
    set({ isLoading: true, error: null });
    try {
      const updatedListing = await listingService.toggleListingStatus(listingId, isActive);

      // Update in myListings
      set((state) => ({
        myListings: state.myListings.map((listing) =>
          listing.id === listingId ? updatedListing : listing
        ),
        isLoading: false,
      }));

      return { success: true, listing: updatedListing };
    } catch (error) {
      console.error('❌ Failed to toggle listing status:', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Clear current listing
  clearCurrentListing: () => set({ currentListing: null }),
}));
