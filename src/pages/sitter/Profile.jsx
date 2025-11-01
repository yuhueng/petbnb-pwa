import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { USER_ROLES } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoginRegisterTabs from '@/components/common/LoginRegisterTabs';

const Profile = () => {
  const { profile, switchRole, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If not authenticated, show login/register forms
  if (!isAuthenticated) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2 text-center">Welcome to PetBNB</h1>
          <p className="text-text-secondary mb-8 text-center">Login or create an account to access your profile</p>
          <LoginRegisterTabs />
        </div>
      </div>
    );
  }

  const handleSwitchToOwner = async () => {
    setIsLoading(true);
    const result = await switchRole(USER_ROLES.OWNER);
    setIsLoading(false);

    if (result.success) {
      toast.success('Switched to Owner mode!');
      navigate('/owner');
    } else {
      toast.error(result.error || 'Failed to switch role');
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      toast.success('Logged out successfully');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">Profile & Settings</h1>
          <p className="text-text-secondary">Manage your account and preferences.</p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl text-text-info font-semibold">
                  {profile?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary">{profile?.name}</h2>
              <p className="text-text-secondary">{profile?.email}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-text-info">
                  {profile?.is_verified ? '👑 Pet Owner & Sitter' : '🐾 Pet Sitter'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="space-y-3 mb-6">
          {/* My Profile */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-full bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-text-primary">My Profile</p>
                <p className="text-sm text-text-secondary">View and edit your personal information</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Switch to Owner Mode */}
          <button
            onClick={handleSwitchToOwner}
            className="w-full bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <span className="text-xl">🐾</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-text-primary">Owner Mode</p>
                <p className="text-sm text-text-secondary">Switch to pet owner dashboard</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-full bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-text-primary">Settings</p>
                <p className="text-sm text-text-secondary">Notifications, privacy, and preferences</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="w-full bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md hover:bg-red-50 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-text-error">Log Out</p>
                <p className="text-sm text-text-secondary">Sign out of your account</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Support Info */}
        <div className="text-center py-4">
          <p className="text-sm text-text-tertiary">Need help?</p>
          <p className="text-sm text-text-info font-medium">support@petbnb.com</p>
        </div>
      </div>

      {/* My Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-[95vw] sm:max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-primary">My Profile</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Username</label>
                <p className="font-medium text-text-primary">{profile?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                <p className="font-medium text-text-primary">{profile?.email}</p>
              </div>
              {profile?.phone && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                  <p className="font-medium text-text-primary">{profile.phone}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Account Type</label>
                <p className="font-medium text-text-primary">
                  {profile?.is_verified ? 'Pet Owner & Sitter' : 'Pet Sitter'}
                </p>
              </div>
              {profile?.bio && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Bio</label>
                  <p className="text-text-primary">{profile.bio}</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full px-4 py-2 bg-primary-600 text-text-inverse rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-[95vw] sm:max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-primary">Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-text-primary">Push Notifications</p>
                  <p className="text-sm text-text-secondary">Receive booking updates</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-text-primary">Email Notifications</p>
                  <p className="text-sm text-text-secondary">Receive email updates</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                </button>
              </div>

              <div className="py-3">
                <p className="text-sm text-text-tertiary">More settings coming soon...</p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full px-4 py-2 bg-primary-600 text-text-inverse rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
