import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Authentication Service
 * Updated to match SCHEMA.sql structure
 */

class AuthService {
  constructor() {
    this.useSupabase = isSupabaseConfigured();

    if (!this.useSupabase) {
      console.error('❌ Supabase is NOT configured! Check your .env.local file');
      throw new Error('Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local');
    }

    console.log('✅ Auth Service initialized (Supabase mode)');
    this.testConnection();
  }

  /**
   * Test Supabase connection
   */
  async testConnection() {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
      } else {
        console.log('✅ Supabase connection successful');
      }
    } catch (err) {
      console.error('❌ Supabase connection error:', err);
    }
  }

  /**
   * Register a new user
   * Note: Profile must be created manually after signup (no trigger in new schema)
   */
  async register({ email, password, name }) {  // Changed to 'name'
    console.log('📝 Starting registration for:', email);
    console.log("Name:", name);
    
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },  // Store name in user metadata
        emailRedirectTo: undefined, // Disable email confirmation redirect
      },
    });

    console.log('📊 signUp response:', {
      user: authData?.user ? 'User created' : 'No user',
      session: authData?.session ? 'Session exists' : 'No session',
      error: authError ? authError.message : 'No error'
    });

    if (authError) {
      console.error('❌ Registration failed:', authError.message);
      throw new Error(authError.message);
    }

    console.log('✅ User created successfully:', authData.user.id);
    console.log('📝 Creating profile...');

    // Step 2: Create profile manually (profiles.id = auth.users.id)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
      
    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      throw new Error('Failed to create profile: ' + profileError.message);
    }

    console.log('✅ Profile created:', profileData.id);

    return {
      user: authData.user,
      profile: profileData,
      session: authData.session,
    };
  }



  /**
   * Sign in with email and password
   */
  async login({ email, password }) {
    console.log('🔐 Starting login for:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login failed:', error.message);

      // Check if it's email confirmation error
      if (error.message.includes('Email not confirmed') || error.message.includes('email_confirmed_at')) {
        throw new Error(
          'Email confirmation is enabled in Supabase. Please go to: Supabase Dashboard → Authentication → Providers → Email → Turn OFF "Confirm email" → Save'
        );
      }

      throw new Error(error.message);
    }

    // Check if we got a session
    if (!data.session) {
      console.error('❌ No session returned - email likely not confirmed');
      throw new Error(
        'Email confirmation is enabled. Please disable it in Supabase Dashboard: Authentication → Providers → Email → Turn OFF "Confirm email"'
      );
    }

    console.log('✅ Login successful:', data.user.id);

    // Get profile (profiles.id = auth.users.id)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError.message);
      throw new Error('Profile not found. Please contact support.');
    }

    console.log('✅ Profile loaded:', profileData.id);

    return {
      user: data.user,
      profile: profileData,
      session: data.session,
    };
  }

  /**
   * Sign out
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    console.log('✅ Logged out successfully');
    return { success: true };
  }

  /**
   * Get current session
   */
  async getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }

  /**
   * Get current user with profile
   */
  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Get profile (profiles.id = user.id)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      ...user,
      profile: profileData,
    };
  }

  /**
   * Update profile
   */
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId) // profiles.id = user.id
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Update last role (owner or sitter)
   */
  async updateLastRole(userId, role) {
    if (!['owner', 'sitter'].includes(role)) {
      throw new Error('Invalid role. Must be "owner" or "sitter"');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ last_role: role })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Become a sitter (with age verification for first time)
   * Updates is_verified and last_role
   */
  async becomeSitter(userId, birthdate) {
    console.log('📝 Starting becomeSitter for user:', userId);

    // Validate age (must be 18+)
    if (birthdate) {
      const birthdateObj = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthdateObj.getFullYear();
      const monthDiff = today.getMonth() - birthdateObj.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdateObj.getDate())) {
        age--;
      }

      if (age < 18) {
        throw new Error('You must be at least 18 years old to become a sitter');
      }

      console.log('✅ Age verification passed:', age);
    }

    // Update profile: set is_verified = true and last_role = 'sitter'
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_verified: true,
        last_role: 'sitter'
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to become sitter:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Successfully became sitter:', data.id);
    return data;
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
