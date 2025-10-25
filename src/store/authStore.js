import { create } from 'zustand';
import { authService } from '@/services/authService';
import { USER_ROLES } from '@/utils/constants';

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  profile: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  activeRole: USER_ROLES.OWNER,

  // Initialize - check for existing session
  initialize: async () => {
    set({ isLoading: true });
    try {
      const session = await authService.getSession();
      if (session) {
        const user = await authService.getCurrentUser();
        if (user && user.profile) {
          set({
            user,
            profile: user.profile,
            session,
            isAuthenticated: true,
            activeRole: user.profile.last_role || USER_ROLES.OWNER,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Initialize error:', error);
      set({ isLoading: false });
    }
  },

  // Register (always as OWNER)
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🔐 authStore: Starting registration...', userData);
      const { user, profile, session } = await authService.register(userData);
  
      console.log('✅ authStore: Registration successful', { user: user.id, profile: profile?.id });

      set({
        user,
        profile,
        session,
        isAuthenticated: true,
        isLoading: false,
        activeRole: USER_ROLES.OWNER, // Always start as owner
      });

      return { success: true };
    } catch (error) {
      console.error('❌ authStore: Registration failed', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🔐 authStore: Starting login for', email);
      const { user, profile, session } = await authService.login({ email, password });

      console.log('✅ authStore: Login successful', { user: user.id, profile: profile?.id });

      set({
        user,
        profile,
        session,
        isAuthenticated: true,
        isLoading: false,
        activeRole: profile.last_role || USER_ROLES.OWNER,
      });

      return { success: true };
    } catch (error) {
      console.error('❌ authStore: Login failed', error.message);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        activeRole: USER_ROLES.OWNER,
      });
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Update profile
  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const user = get().user;
      if (!user) throw new Error('Not authenticated');

      const updatedProfile = await authService.updateProfile(user.id, updates);
      set({
        profile: updatedProfile,
        isLoading: false,
      });

      return { success: true, profile: updatedProfile };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Switch role
  switchRole: async (role) => {
    const user = get().user;
    if (!user) return { success: false, error: 'Not authenticated' };

    set({ isLoading: true, error: null });
    try {
      // Update last_role in database
      const updatedProfile = await authService.updateLastRole(user.id, role);

      set({
        profile: updatedProfile,
        activeRole: role,
        isLoading: false,
      });

      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Become a sitter (with age verification for first time)
  becomeSitter: async (birthdate) => {
    const user = get().user;
    if (!user) return { success: false, error: 'Not authenticated' };

    set({ isLoading: true, error: null });
    try {
      const updatedProfile = await authService.becomeSitter(user.id, birthdate);
      set({
        profile: updatedProfile,
        activeRole: USER_ROLES.SITTER, // Auto-switch to sitter mode
        isLoading: false,
      });

      return { success: true, profile: updatedProfile };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
