import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { USER_ROLES } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoginRegisterTabs from '@/components/common/LoginRegisterTabs';
import profileService from '@/services/profileService';
import reviewService from '@/services/reviewService';

const Profile = () => {
  const { profile, switchRole, logout, isAuthenticated, user, updateUserProfile } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    location: '',
  });
  const [profileStats, setProfileStats] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  // Fetch profile stats when modal opens
  useEffect(() => {
    const fetchStats = async () => {
      if (showProfileModal && user) {
        const result = await profileService.getProfileStats(user.id, 'sitter');
        if (result.success) {
          setProfileStats(result.data);
        }
      }
    };
    fetchStats();
  }, [showProfileModal, user]);

  // Fetch reviews when reviews modal opens
  useEffect(() => {
    const fetchReviews = async () => {
      if (showReviewsModal && user) {
        setLoadingReviews(true);
        try {
          const { reviews: fetchedReviews, averageRating, totalReviews } = await reviewService.getReviewsBySitter(user.id);
          setReviews(fetchedReviews);
          setReviewStats({ averageRating, totalReviews });
        } catch (error) {
          console.error('Error fetching reviews:', error);
          toast.error('Failed to load reviews');
        } finally {
          setLoadingReviews(false);
        }
      }
    };
    fetchReviews();
  }, [showReviewsModal, user]);

  // Initialize profile form when opening modal
  useEffect(() => {
    if (showProfileModal && profile) {
      setProfileForm({
        name: profile.name || '',
        bio: profile.bio || '',
        location: profile.location || '',
      });
      setIsEditingProfile(false);
    }
  }, [showProfileModal, profile]);

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

  // Profile edit handlers
  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    if (isEditingProfile) {
      avatarInputRef.current?.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    try {
      const result = await profileService.updateProfileAvatar(file, user.id, profile?.avatar_url);
      if (result.success) {
        toast.success('Profile picture updated!');
        // Update local profile state
        if (updateUserProfile) {
          updateUserProfile(result.data);
        }
      } else {
        toast.error(result.error || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!profileForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await profileService.updateProfile(user.id, {
        name: profileForm.name.trim(),
        bio: profileForm.bio.trim() || null,
        location: profileForm.location.trim() || null,
      });

      if (result.success) {
        toast.success('Profile updated successfully!');
        setIsEditingProfile(false);
        // Update local profile state
        if (updateUserProfile) {
          updateUserProfile(result.data);
        }
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileForm({
      name: profile?.name || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
    });
    setIsEditingProfile(false);
  };

  return (
    <div className="min-h-screen bg-[#fef5f6]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">Profile & Settings</h1>
          <p className="text-text-secondary">Manage your account and preferences.</p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Left Section: Avatar + Profile Info */}
            <div className="flex items-start space-x-4 flex-1 min-w-0">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-[#ffe5e5] flex items-center justify-center flex-shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-[#fb7678] font-semibold">
                    {profile?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-[#3e2d2e]">{profile?.name}</h2>
                <p className="text-[#6d6d6d] text-sm sm:text-base">{profile?.email}</p>
                {profile?.location && (
                  <p className="text-[#6d6d6d] text-sm flex items-center gap-1 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {profile.location}
                  </p>
                )}
                <div className="mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#ffe5e5] text-[#fb7678]">
                    {profile?.is_verified ? '👑 Pet Owner & Sitter' : '🐾 Pet Sitter'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Section: Bio (Desktop) / Bottom Section: Bio (Mobile) */}
            {profile?.bio && (
              <div className="lg:w-[350px] lg:flex-shrink-0">
                <div className="bg-gradient-to-br from-[#ffe5e5]/30 to-[#fcf3f3] rounded-lg p-4 lg:h-full">
                  <h3 className="text-sm font-bold text-[#3e2d2e] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Bio:
                  </h3>
                  <p className="text-sm text-[#6d6d6d] leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Menu */}
        <div className="space-y-3 mb-6">
                    {/* Switch to Owner Mode */}
                    <button
            onClick={handleSwitchToOwner}
            className="w-full bg-gradient-to-r from-[#ffe5e5] to-[#fcf3f3] rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
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

          {/* Reviews */}
          <button
            onClick={() => setShowReviewsModal(true)}
            className="w-full bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-text-primary">Reviews</p>
                <p className="text-sm text-text-secondary">View ratings and feedback from clients</p>
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

      {/* My Profile Modal - Enhanced with Edit Functionality */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[15px] shadow-xl max-w-[95vw] sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-[15px] z-10">
              <h3 className="text-xl font-bold text-[#3e2d2e]">My Profile</h3>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setIsEditingProfile(false);
                }}
                className="text-[#6d6d6d] hover:text-[#3e2d2e] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div
                    onClick={handleAvatarClick}
                    className={`w-24 h-24 rounded-full ${
                      isEditingProfile ? 'cursor-pointer ring-4 ring-[#fb7678]/20' : ''
                    } bg-[#ffe5e5] flex items-center justify-center overflow-hidden transition-all`}
                  >
                    {isUploadingAvatar ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fb7678]"></div>
                    ) : profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl text-[#fb7678] font-semibold">
                        {profile?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  {isEditingProfile && (
                    <div className="absolute bottom-0 right-0 bg-[#fb7678] rounded-full p-2 shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                {isEditingProfile && (
                  <p className="text-xs text-[#6d6d6d] mt-2 text-center">Click avatar to change picture</p>
                )}
              </div>

              {/* Profile Stats */}
              {profileStats && !isEditingProfile && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#ffe5e5]/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#fb7678]">{profileStats.totalBookings}</p>
                    <p className="text-xs text-[#6d6d6d] mt-1">Bookings</p>
                  </div>
                  <div className="bg-[#ffe5e5]/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#fb7678]">{profileStats.completedBookings}</p>
                    <p className="text-xs text-[#6d6d6d] mt-1">Completed</p>
                  </div>
                  <div className="bg-[#ffe5e5]/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-2xl font-bold text-[#fb7678]">{profileStats.averageRating}</p>
                      <span className="text-amber-500">⭐</span>
                    </div>
                    <p className="text-xs text-[#6d6d6d] mt-1">Rating</p>
                  </div>
                </div>
              )}

              {/* Profile Fields */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                    Name {isEditingProfile && <span className="text-red-500">*</span>}
                  </label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileFormChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678] focus:border-transparent"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <p className="font-medium text-[#3e2d2e] px-4 py-2 bg-gray-50 rounded-lg">{profile?.name}</p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-[#6d6d6d] mb-2">Email</label>
                  <p className="font-medium text-[#3e2d2e] px-4 py-2 bg-gray-50 rounded-lg">{profile?.email}</p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-[#6d6d6d] mb-2">Location</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      name="location"
                      value={profileForm.location}
                      onChange={handleProfileFormChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678] focus:border-transparent"
                      placeholder="e.g., Singapore, New York"
                    />
                  ) : (
                    <p className="font-medium text-[#3e2d2e] px-4 py-2 bg-gray-50 rounded-lg">
                      {profile?.location || 'Not specified'}
                    </p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-[#6d6d6d] mb-2">Bio</label>
                  {isEditingProfile ? (
                    <textarea
                      name="bio"
                      value={profileForm.bio}
                      onChange={handleProfileFormChange}
                      rows="4"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678] focus:border-transparent resize-none"
                      placeholder="Tell us about yourself and your experience with pets..."
                    />
                  ) : (
                    <p className="text-[#3e2d2e] px-4 py-2 bg-gray-50 rounded-lg min-h-[100px]">
                      {profile?.bio || 'No bio yet'}
                    </p>
                  )}
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-sm font-medium text-[#6d6d6d] mb-2">Account Type</label>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                    <span className="text-xl">
                      {profile?.is_verified ? '👑' : '🐾'}
                    </span>
                    <p className="font-medium text-[#3e2d2e]">
                      {profile?.is_verified ? 'Pet Owner & Sitter' : 'Pet Sitter'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 p-6 bg-[#fef5f6] rounded-b-[15px]">
              {isEditingProfile ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-[#6d6d6d] rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-[#fb7678] text-white rounded-lg hover:bg-[#fa6568] transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex-1 px-4 py-3 bg-[#fb7678] text-white rounded-lg hover:bg-[#fa6568] transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="px-6 py-3 border-2 border-gray-300 text-[#6d6d6d] rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
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
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#fb7678]">
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
                className="w-full px-4 py-2 bg-[#fb7678] text-text-inverse rounded-lg hover:bg-[#fa6568] transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[15px] shadow-xl max-w-[95vw] sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-[15px] z-10">
              <div>
                <h3 className="text-xl font-bold text-[#3e2d2e]">My Reviews</h3>
                <p className="text-sm text-[#6d6d6d] mt-1">
                  {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'} • {reviewStats.averageRating.toFixed(1)} ⭐ average
                </p>
              </div>
              <button
                onClick={() => setShowReviewsModal(false)}
                className="text-[#6d6d6d] hover:text-[#3e2d2e] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loadingReviews ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fb7678]"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-[#ffe5e5] rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-[#3e2d2e] mb-2">No reviews yet</h4>
                  <p className="text-[#6d6d6d] text-sm">You haven't received any reviews from clients.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-gradient-to-br from-[#ffe5e5]/30 to-[#fcf3f3] rounded-lg p-4 border border-gray-100">
                      {/* Reviewer Info */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {review.reviewer?.avatar_url ? (
                            <img
                              src={review.reviewer.avatar_url}
                              alt={review.reviewer.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#ffe5e5] flex items-center justify-center">
                              <span className="text-lg text-[#fb7678] font-semibold">
                                {review.reviewer?.name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-[#3e2d2e]">{review.reviewer?.name || 'Anonymous'}</p>
                            <p className="text-xs text-[#6d6d6d]">
                              {new Date(review.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        {/* Rating Stars */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>

                      {/* Review Title */}
                      {review.title && (
                        <h4 className="font-semibold text-[#3e2d2e] mb-2">{review.title}</h4>
                      )}

                      {/* Review Comment */}
                      {review.comment && (
                        <p className="text-[#6d6d6d] text-sm leading-relaxed mb-3">{review.comment}</p>
                      )}

                      {/* Booking Info */}
                      {review.booking && (
                        <div className="flex items-center gap-2 text-xs text-[#6d6d6d] mb-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {new Date(review.booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(review.booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      )}

                      {/* Sitter Response */}
                      {review.response && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#fb7678] flex items-center justify-center flex-shrink-0">
                              <span className="text-sm text-white font-semibold">
                                {profile?.name?.charAt(0).toUpperCase() || 'Y'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-[#3e2d2e] text-sm mb-1">Your Response:</p>
                              <p className="text-[#6d6d6d] text-sm">{review.response}</p>
                              <p className="text-xs text-[#6d6d6d] mt-1">
                                {new Date(review.response_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 bg-[#fef5f6] rounded-b-[15px]">
              <button
                onClick={() => setShowReviewsModal(false)}
                className="w-full px-4 py-3 bg-[#fb7678] text-white rounded-lg hover:bg-[#fa6568] transition-colors font-medium"
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
