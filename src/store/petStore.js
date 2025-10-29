import { create } from 'zustand';
import { petService } from '@/services/petService';

/**
 * Pet Store
 * Manages pet state and operations
 */
export const usePetStore = create((set, get) => ({
  // State
  pets: [],
  currentPet: null,
  isLoading: false,
  error: null,

  // Actions

  /**
   * Fetch all pets for the current owner
   * @param {string} ownerId - The owner's user ID
   */
  fetchPets: async (ownerId) => {
    set({ isLoading: true, error: null });
    try {
      const pets = await petService.fetchPetsByOwner(ownerId);
      set({ pets, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  /**
   * Fetch a single pet by ID
   * @param {string} petId - The pet's ID
   */
  fetchPetById: async (petId) => {
    set({ isLoading: true, error: null });
    try {
      const pet = await petService.fetchPetById(petId);
      set({ currentPet: pet, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  /**
   * Create a new pet
   * @param {Object} petData - Pet information
   */
  createPet: async (petData) => {
    set({ isLoading: true, error: null });
    try {
      const newPet = await petService.createPet(petData);
      set((state) => ({
        pets: [newPet, ...state.pets],
        isLoading: false,
      }));
      return { success: true, pet: newPet };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Update an existing pet
   * @param {string} petId - The pet's ID
   * @param {Object} updates - Fields to update
   */
  updatePet: async (petId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPet = await petService.updatePet(petId, updates);
      set((state) => ({
        pets: state.pets.map((pet) =>
          pet.id === petId ? updatedPet : pet
        ),
        currentPet: state.currentPet?.id === petId ? updatedPet : state.currentPet,
        isLoading: false,
      }));
      return { success: true, pet: updatedPet };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete a pet (soft delete)
   * @param {string} petId - The pet's ID
   */
  deletePet: async (petId) => {
    set({ isLoading: true, error: null });
    try {
      await petService.deletePet(petId);
      set((state) => ({
        pets: state.pets.filter((pet) => pet.id !== petId),
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),

  /**
   * Clear current pet
   */
  clearCurrentPet: () => set({ currentPet: null }),

  /**
   * Reset store to initial state
   */
  reset: () => set({ pets: [], currentPet: null, isLoading: false, error: null }),
}));

export default usePetStore;
