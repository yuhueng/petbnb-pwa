import { supabase } from './supabase';

/**
 * Pet Service
 * Handles all pet-related database operations
 */

export const petService = {
  /**
   * Fetch all pets for a specific owner
   * @param {string} ownerId - The owner's user ID
   * @returns {Promise<Array>} Array of pet objects
   */
  async fetchPetsByOwner(ownerId) {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pets:', error);
      throw error;
    }
  },

  /**
   * Fetch a single pet by ID
   * @param {string} petId - The pet's ID
   * @returns {Promise<Object>} Pet object
   */
  async fetchPetById(petId) {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching pet:', error);
      throw error;
    }
  },

  /**
   * Create a new pet
   * @param {Object} petData - Pet information
   * @returns {Promise<Object>} Created pet object
   */
  async createPet(petData) {
    try {
      const { data, error } = await supabase
        .from('pets')
        .insert([petData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating pet:', error);
      throw error;
    }
  },

  /**
   * Update an existing pet
   * @param {string} petId - The pet's ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated pet object
   */
  async updatePet(petId, updates) {
    try {
      const { data, error } = await supabase
        .from('pets')
        .update(updates)
        .eq('id', petId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating pet:', error);
      throw error;
    }
  },

  /**
   * Delete a pet (soft delete by setting is_active to false)
   * @param {string} petId - The pet's ID
   * @returns {Promise<Object>} Updated pet object
   */
  async deletePet(petId) {
    try {
      const { data, error } = await supabase
        .from('pets')
        .update({ is_active: false })
        .eq('id', petId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting pet:', error);
      throw error;
    }
  },

  /**
   * Hard delete a pet (permanently remove from database)
   * @param {string} petId - The pet's ID
   * @returns {Promise<void>}
   */
  async hardDeletePet(petId) {
    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId);

      if (error) throw error;
    } catch (error) {
      console.error('Error permanently deleting pet:', error);
      throw error;
    }
  },
};

export default petService;
