import { supabase } from './supabase';

/**
 * Certification Service
 * Handles all certification-related database operations for pet sitters
 */

export const certificationService = {
  /**
   * Fetch all certifications for a specific sitter
   * @param {string} sitterId - The sitter's user ID
   * @returns {Promise<Array>} Array of certification objects
   */
  async fetchCertificationsBySitter(sitterId) {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('sitter_id', sitterId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching certifications:', error);
      throw error;
    }
  },

  /**
   * Fetch a single certification by ID
   * @param {string} certificationId - The certification's ID
   * @returns {Promise<Object>} Certification object
   */
  async fetchCertificationById(certificationId) {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('id', certificationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching certification:', error);
      throw error;
    }
  },

  /**
   * Create a new certification
   * @param {Object} certificationData - Certification information
   * @returns {Promise<Object>} Created certification object
   */
  async createCertification(certificationData) {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .insert([certificationData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating certification:', error);
      throw error;
    }
  },

  /**
   * Update an existing certification
   * @param {string} certificationId - The certification's ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated certification object
   */
  async updateCertification(certificationId, updates) {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .update(updates)
        .eq('id', certificationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating certification:', error);
      throw error;
    }
  },

  /**
   * Delete a certification (hard delete)
   * @param {string} certificationId - The certification's ID
   * @returns {Promise<void>}
   */
  async deleteCertification(certificationId) {
    try {
      const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('id', certificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting certification:', error);
      throw error;
    }
  },
};

export default certificationService;
