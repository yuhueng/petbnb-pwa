import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePetStore } from '@/store/petStore';
import { USER_ROLES } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoginRegisterTabs from '@/components/common/LoginRegisterTabs';
import profileService from '@/services/profileService';

const Profile = () => {
  const { profile, becomeSitter, switchRole, logout, isAuthenticated, user, updateUserProfile } = useAuthStore();
  const { pets, fetchPets, createPet, updatePet, deletePet, isLoading: petsLoading } = usePetStore();
  const navigate = useNavigate();
  const [showBirthdateModal, setShowBirthdateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPetsModal, setShowPetsModal] = useState(false);
  const [showPetFormModal, setShowPetFormModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [birthdate, setBirthdate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  // Pet form state
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'dog',
    breed: '',
    age: '',
    weight: '',
    gender: 'unknown',
    medical_conditions: '',
    allergies: '',
    medications: '',
    vet_name: '',
    vet_phone: '',
    temperament: '',
    special_needs: '',
    feeding_instructions: '',
  });

  // Fetch pets when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPets(user.id);
    }
  }, [isAuthenticated, user, fetchPets]);

  // Fetch profile stats when modal opens
  useEffect(() => {
    const fetchStats = async () => {
      if (showProfileModal && user) {
        const result = await profileService.getProfileStats(user.id, 'owner');
        if (result.success) {
          setProfileStats(result.data);
        }
      }
    };
    fetchStats();
  }, [showProfileModal, user]);

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

  const handleBecomeSitter = async () => {
    // If already verified (has been a sitter before), just switch roles
    if (profile?.is_verified) {
      const result = await switchRole(USER_ROLES.SITTER);
      if (result.success) {
        toast.success('Switched to Sitter mode!');
        navigate('/sitter');
      } else {
        toast.error(result.error || 'Failed to switch role');
      }
      return;
    }

    // If not verified yet, show birthdate modal for age verification
    setShowBirthdateModal(true);
  };

  const becomeSitterHandler = async (birthdateValue) => {
    setIsLoading(true);
    const result = await becomeSitter(birthdateValue);
    setIsLoading(false);

    if (result.success) {
      toast.success('Sitter mode enabled! Redirecting...');
      setShowBirthdateModal(false);
      // Auto-navigate to sitter dashboard
      setTimeout(() => navigate('/sitter'), 500);
    } else {
      toast.error(result.error || 'Failed to enable sitter mode');
    }
  };

  const handleBirthdateSubmit = (e) => {
    e.preventDefault();

    if (!birthdate) {
      toast.error('Please enter your birthdate');
      return;
    }

    becomeSitterHandler(birthdate);
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

  // Pet handlers
  const handleOpenPetsModal = () => {
    setShowPetsModal(true);
  };

  const handleOpenPetForm = (pet = null) => {
    if (pet) {
      // Editing existing pet
      setEditingPet(pet);
      setPetForm({
        name: pet.name || '',
        species: pet.species || 'dog',
        breed: pet.breed || '',
        age: pet.age?.toString() || '',
        weight: pet.weight?.toString() || '',
        gender: pet.gender || 'unknown',
        medical_conditions: pet.medical_conditions || '',
        allergies: pet.allergies || '',
        medications: pet.medications || '',
        vet_name: pet.vet_name || '',
        vet_phone: pet.vet_phone || '',
        temperament: pet.temperament || '',
        special_needs: pet.special_needs || '',
        feeding_instructions: pet.feeding_instructions || '',
      });
    } else {
      // Creating new pet
      setEditingPet(null);
      setPetForm({
        name: '',
        species: 'dog',
        breed: '',
        age: '',
        weight: '',
        gender: 'unknown',
        medical_conditions: '',
        allergies: '',
        medications: '',
        vet_name: '',
        vet_phone: '',
        temperament: '',
        special_needs: '',
        feeding_instructions: '',
      });
    }
    setShowPetFormModal(true);
  };

  const handleClosePetForm = () => {
    setShowPetFormModal(false);
    setEditingPet(null);
  };

  const handlePetFormChange = (e) => {
    const { name, value } = e.target;
    setPetForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePetFormSubmit = async (e) => {
    e.preventDefault();

    if (!petForm.name || !petForm.species) {
      toast.error('Please enter pet name and species');
      return;
    }

    const petData = {
      ...petForm,
      owner_id: user.id,
      age: petForm.age ? parseInt(petForm.age) : null,
      weight: petForm.weight ? parseFloat(petForm.weight) : null,
    };

    let result;
    if (editingPet) {
      // Update existing pet
      result = await updatePet(editingPet.id, petData);
      if (result.success) {
        toast.success('Pet updated successfully!');
        handleClosePetForm();
      } else {
        toast.error(result.error || 'Failed to update pet');
      }
    } else {
      // Create new pet
      result = await createPet(petData);
      if (result.success) {
        toast.success('Pet added successfully!');
        handleClosePetForm();
      } else {
        toast.error(result.error || 'Failed to add pet');
      }
    }
  };

  const handleDeletePet = async (petId, petName) => {
    if (window.confirm(`Are you sure you want to remove ${petName}?`)) {
      const result = await deletePet(petId);
      if (result.success) {
        toast.success('Pet removed successfully');
      } else {
        toast.error(result.error || 'Failed to remove pet');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fef5f6]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[#3e2d2e] mb-2">Profile & Settings</h1>
          <p className="text-[#6d6d6d]">Manage your account, pets, and preferences.</p>
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
                    {profile?.is_verified ? '👑 Pet Owner & Sitter' : '🐾 Pet Owner'}
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
                    {/* Become a Sitter */}
                    <button
            onClick={handleBecomeSitter}
            className="w-full bg-gradient-to-r from-[#ffe5e5] to-[#fcf3f3] rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#ffe5e5] flex items-center justify-center">
                <span className="text-xl">{profile?.is_verified ? '🎉' : '🐾'}</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#3e2d2e]">
                  {profile?.is_verified ? 'Sitter Mode' : 'Become a Sitter'}
                </p>
                <p className="text-sm text-[#6d6d6d]">
                  {profile?.is_verified ? 'Switch to sitter dashboard' : 'Earn money taking care of pets'}
                </p>
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
              <div className="w-10 h-10 rounded-full bg-[#ffe5e5] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#3e2d2e]">My Profile</p>
                <p className="text-sm text-[#6d6d6d]">View and edit your personal information</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* My Pets */}
          <button
            onClick={handleOpenPetsModal}
            className="w-full bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#ffe5e5] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#3e2d2e]">My Pets</p>
                <p className="text-sm text-[#6d6d6d]">Manage your pet profiles and information</p>
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
                <p className="font-semibold text-[#3e2d2e]">Settings</p>
                <p className="text-sm text-[#6d6d6d]">Notifications, privacy, and preferences</p>
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
                <p className="text-sm text-[#6d6d6d]">Sign out of your account</p>
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
          <p className="text-sm text-[#fb7678] font-medium">support@petbnb.com</p>
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
                    <p className="text-2xl font-bold text-[#fb7678]">{profileStats.totalPets}</p>
                    <p className="text-xs text-[#6d6d6d] mt-1">Pets</p>
                  </div>
                  <div className="bg-[#ffe5e5]/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#fb7678]">{profileStats.totalWishlists}</p>
                    <p className="text-xs text-[#6d6d6d] mt-1">Wishlists</p>
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
                      placeholder="Tell us about yourself..."
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
                      {profile?.is_verified ? 'Pet Owner & Sitter' : 'Pet Owner'}
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
              <h3 className="text-xl font-bold text-[#3e2d2e]">Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-[#6d6d6d] hover:text-[#3e2d2e]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-[#3e2d2e]">Push Notifications</p>
                  <p className="text-sm text-[#6d6d6d]">Receive booking updates</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-[#3e2d2e]">Email Notifications</p>
                  <p className="text-sm text-[#6d6d6d]">Receive email updates</p>
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
                className="w-full px-4 py-2 bg-[#fb7678] text-white rounded-lg hover:bg-[#fa6568] transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Birthdate Modal */}
      {showBirthdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-[95vw] sm:max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-[#3e2d2e] mb-4">Confirm Your Age</h3>
            <p className="text-[#6d6d6d] mb-6">
              To become a pet sitter, you must be at least 18 years old. Please enter your
              birthdate to continue.
            </p>

            <form onSubmit={handleBirthdateSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                  Birthdate
                </label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBirthdateModal(false);
                    setBirthdate('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-[#6d6d6d] rounded-lg hover:bg-[#ffe5e5] transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-[#fb7678] text-white rounded-lg hover:bg-[#fa6568] transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Confirming...' : 'Confirm'}
                </button>
              </div>
            </form>

            <p className="text-xs text-text-tertiary mt-4">
              Your birthdate will be used to verify your age and will not be publicly displayed.
            </p>
          </div>
        </div>
      )}

      {/* My Pets Modal */}
      {showPetsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-[95vw] sm:max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-[#3e2d2e]">My Pets</h3>
                <p className="text-sm text-[#6d6d6d] mt-1">
                  {pets.length} {pets.length === 1 ? 'pet' : 'pets'} registered
                </p>
              </div>
              <button
                onClick={() => setShowPetsModal(false)}
                className="text-[#6d6d6d] hover:text-[#3e2d2e] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {petsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fb7678]"></div>
                </div>
              ) : pets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-4xl">🐾</span>
                  </div>
                  <h4 className="text-lg font-semibold text-[#3e2d2e] mb-2">No pets yet</h4>
                  <p className="text-[#6d6d6d] mb-6">
                    Add your first pet to get started with booking pet sitters.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {/* Pet Avatar */}
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">
                              {pet.species === 'dog' ? '🐕' :
                               pet.species === 'cat' ? '🐈' :
                               pet.species === 'bird' ? '🐦' :
                               pet.species === 'rabbit' ? '🐰' :
                               pet.species === 'hamster' ? '🐹' : '🐾'}
                            </span>
                          </div>

                          {/* Pet Info */}
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-text-primary">{pet.name}</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#ffe5e5] text-[#fb7678]">
                                {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
                              </span>
                              {pet.breed && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-text-secondary">
                                  {pet.breed}
                                </span>
                              )}
                              {pet.age && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-text-secondary">
                                  {pet.age} {pet.age === 1 ? 'year' : 'years'}
                                </span>
                              )}
                              {pet.gender && pet.gender !== 'unknown' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-text-secondary">
                                  {pet.gender === 'male' ? '♂' : '♀'} {pet.gender}
                                </span>
                              )}
                            </div>
                            {pet.temperament && (
                              <p className="text-sm text-[#6d6d6d] mt-2">
                                <span className="font-medium">Temperament:</span> {pet.temperament}
                              </p>
                            )}
                            {pet.special_needs && (
                              <p className="text-sm text-text-warning mt-1">
                                <span className="font-medium">Special Needs:</span> {pet.special_needs}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleOpenPetForm(pet)}
                            className="p-2 text-[#fb7678] hover:bg-[#ffe5e5] rounded-lg transition-colors"
                            title="Edit pet"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeletePet(pet.id, pet.name)}
                            className="p-2 text-text-error hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete pet"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Add Button */}
            <div className="border-t border-gray-200 p-4 bg-[#fef5f6]">
              <button
                onClick={() => handleOpenPetForm()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#fb7678] text-white border-2 rounded-lg hover:bg-[#fa6568] transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Pet
              </button>
            </div>

            {/* Floating Add Button (Alternative - Circular) */}
            <button
              onClick={() => handleOpenPetForm()}
              className="absolute bottom-8 right-8 w-14 h-14 bg-[#fb7678] text-white rounded-full shadow-lg hover:bg-[#fa6568] hover:shadow-xl transition-all flex items-center justify-center"
              title="Add new pet"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Pet Form Modal (Add/Edit) */}
      {showPetFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-[95vw] sm:max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-[#3e2d2e]">
                {editingPet ? 'Edit Pet' : 'Add New Pet'}
              </h3>
              <button
                onClick={handleClosePetForm}
                className="text-[#6d6d6d] hover:text-[#3e2d2e] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handlePetFormSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-lg font-semibold text-[#3e2d2e] mb-4 flex items-center gap-2">
                    <span>🐾</span> Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                        Pet Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={petForm.name}
                        onChange={handlePetFormChange}
                        placeholder="e.g., Buddy"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                        Species <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="species"
                        value={petForm.species}
                        onChange={handlePetFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                        required
                      >
                        <option value="dog">🐕 Dog</option>
                        <option value="cat">🐈 Cat</option>
                        <option value="bird">🐦 Bird</option>
                        <option value="rabbit">🐰 Rabbit</option>
                        <option value="hamster">🐹 Hamster</option>
                        <option value="other">🐾 Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                        Breed
                      </label>
                      <input
                        type="text"
                        name="breed"
                        value={petForm.breed}
                        onChange={handlePetFormChange}
                        placeholder="e.g., Golden Retriever"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={petForm.gender}
                        onChange={handlePetFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                      >
                        <option value="unknown">Unknown</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                        Age (years)
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={petForm.age}
                        onChange={handlePetFormChange}
                        placeholder="e.g., 3"
                        min="0"
                        max="50"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={petForm.weight}
                        onChange={handlePetFormChange}
                        placeholder="e.g., 25.5"
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h4 className="text-lg font-semibold text-[#3e2d2e] mb-4 flex items-center gap-2">
                    <span>🏥</span> Medical Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                        Medical Conditions
                      </label>
                      <textarea
                        name="medical_conditions"
                        value={petForm.medical_conditions}
                        onChange={handlePetFormChange}
                        placeholder="Any existing medical conditions..."
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                        Allergies
                      </label>
                      <textarea
                        name="allergies"
                        value={petForm.allergies}
                        onChange={handlePetFormChange}
                        placeholder="Any known allergies..."
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                        Medications
                      </label>
                      <textarea
                        name="medications"
                        value={petForm.medications}
                        onChange={handlePetFormChange}
                        placeholder="Current medications and dosage..."
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                          Veterinarian Name
                        </label>
                        <input
                          type="text"
                          name="vet_name"
                          value={petForm.vet_name}
                          onChange={handlePetFormChange}
                          placeholder="e.g., Dr. Smith"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                          Veterinarian Phone
                        </label>
                        <input
                          type="tel"
                          name="vet_phone"
                          value={petForm.vet_phone}
                          onChange={handlePetFormChange}
                          placeholder="e.g., +65 1234 5678"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Behavioral & Care Information */}
                <div>
                  <h4 className="text-lg font-semibold text-[#3e2d2e] mb-4 flex items-center gap-2">
                    <span>🎯</span> Behavioral & Care Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                        Temperament
                      </label>
                      <input
                        type="text"
                        name="temperament"
                        value={petForm.temperament}
                        onChange={handlePetFormChange}
                        placeholder="e.g., Friendly, energetic, shy..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                        Special Needs
                      </label>
                      <textarea
                        name="special_needs"
                        value={petForm.special_needs}
                        onChange={handlePetFormChange}
                        placeholder="Any special needs or requirements..."
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6d6d6d] mb-2">
                        Feeding Instructions
                      </label>
                      <textarea
                        name="feeding_instructions"
                        value={petForm.feeding_instructions}
                        onChange={handlePetFormChange}
                        placeholder="Feeding schedule, portion sizes, food preferences..."
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer with Actions */}
            <div className="border-t border-gray-200 p-6 bg-[#fef5f6] flex gap-3">
              <button
                type="button"
                onClick={handleClosePetForm}
                className="flex-1 px-4 py-2 border border-gray-300 text-[#6d6d6d] rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handlePetFormSubmit}
                disabled={petsLoading}
                className="flex-1 px-4 py-2 bg-[#fb7678] text-white rounded-lg hover:bg-[#fa6568] transition-colors disabled:opacity-50 font-medium"
              >
                {petsLoading ? 'Saving...' : editingPet ? 'Update Pet' : 'Add Pet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
