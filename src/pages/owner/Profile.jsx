import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePetStore } from '@/store/petStore';
import { USER_ROLES } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoginRegisterTabs from '@/components/common/LoginRegisterTabs';

const Profile = () => {
  const { profile, becomeSitter, switchRole, logout, isAuthenticated, user } = useAuthStore();
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">Profile & Settings</h1>
          <p className="text-text-secondary">Manage your account, pets, and preferences.</p>
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
              <h2 className="text-lg sm:text-xl font-bold text-text-primary">{profile?.name}</h2>
              <p className="text-text-secondary">{profile?.email}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-text-info">
                  {profile?.is_verified ? '👑 Pet Owner & Sitter' : '🐾 Pet Owner'}
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

          {/* My Pets */}
          <button
            onClick={handleOpenPetsModal}
            className="w-full bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-text-primary">My Pets</p>
                <p className="text-sm text-text-secondary">Manage your pet profiles and information</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Become a Sitter */}
          <button
            onClick={handleBecomeSitter}
            className="w-full bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <span className="text-xl">{profile?.is_verified ? '🎉' : '🐾'}</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-text-primary">
                  {profile?.is_verified ? 'Sitter Mode' : 'Become a Sitter'}
                </p>
                <p className="text-sm text-text-secondary">
                  {profile?.is_verified ? 'Switch to sitter dashboard' : 'Earn money taking care of pets'}
                </p>
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
                  {profile?.is_verified ? 'Pet Owner & Sitter' : 'Pet Owner'}
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

      {/* Birthdate Modal */}
      {showBirthdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-[95vw] sm:max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4">Confirm Your Age</h3>
            <p className="text-text-secondary mb-6">
              To become a pet sitter, you must be at least 18 years old. Please enter your
              birthdate to continue.
            </p>

            <form onSubmit={handleBirthdateSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Birthdate
                </label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  className="flex-1 px-4 py-2 border border-gray-300 text-text-secondary rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-text-inverse rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
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
                <h3 className="text-xl font-bold text-text-primary">My Pets</h3>
                <p className="text-sm text-text-secondary mt-1">
                  {pets.length} {pets.length === 1 ? 'pet' : 'pets'} registered
                </p>
              </div>
              <button
                onClick={() => setShowPetsModal(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : pets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-4xl">🐾</span>
                  </div>
                  <h4 className="text-lg font-semibold text-text-primary mb-2">No pets yet</h4>
                  <p className="text-text-secondary mb-6">
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
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-text-info">
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
                              <p className="text-sm text-text-secondary mt-2">
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
                            className="p-2 text-text-info hover:bg-primary-50 rounded-lg transition-colors"
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
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <button
                onClick={() => handleOpenPetForm()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-text-primary border-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
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
              className="absolute bottom-8 right-8 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all flex items-center justify-center"
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
              <h3 className="text-xl font-bold text-text-primary">
                {editingPet ? 'Edit Pet' : 'Add New Pet'}
              </h3>
              <button
                onClick={handleClosePetForm}
                className="text-text-secondary hover:text-text-primary transition-colors"
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
                  <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <span>🐾</span> Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Pet Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={petForm.name}
                        onChange={handlePetFormChange}
                        placeholder="e.g., Buddy"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Species <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="species"
                        value={petForm.species}
                        onChange={handlePetFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Breed
                      </label>
                      <input
                        type="text"
                        name="breed"
                        value={petForm.breed}
                        onChange={handlePetFormChange}
                        placeholder="e.g., Golden Retriever"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={petForm.gender}
                        onChange={handlePetFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="unknown">Unknown</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <span>🏥</span> Medical Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Medical Conditions
                      </label>
                      <textarea
                        name="medical_conditions"
                        value={petForm.medical_conditions}
                        onChange={handlePetFormChange}
                        placeholder="Any existing medical conditions..."
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Allergies
                      </label>
                      <textarea
                        name="allergies"
                        value={petForm.allergies}
                        onChange={handlePetFormChange}
                        placeholder="Any known allergies..."
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Medications
                      </label>
                      <textarea
                        name="medications"
                        value={petForm.medications}
                        onChange={handlePetFormChange}
                        placeholder="Current medications and dosage..."
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Veterinarian Name
                        </label>
                        <input
                          type="text"
                          name="vet_name"
                          value={petForm.vet_name}
                          onChange={handlePetFormChange}
                          placeholder="e.g., Dr. Smith"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Veterinarian Phone
                        </label>
                        <input
                          type="tel"
                          name="vet_phone"
                          value={petForm.vet_phone}
                          onChange={handlePetFormChange}
                          placeholder="e.g., +65 1234 5678"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Behavioral & Care Information */}
                <div>
                  <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <span>🎯</span> Behavioral & Care Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Temperament
                      </label>
                      <input
                        type="text"
                        name="temperament"
                        value={petForm.temperament}
                        onChange={handlePetFormChange}
                        placeholder="e.g., Friendly, energetic, shy..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Special Needs
                      </label>
                      <textarea
                        name="special_needs"
                        value={petForm.special_needs}
                        onChange={handlePetFormChange}
                        placeholder="Any special needs or requirements..."
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Feeding Instructions
                      </label>
                      <textarea
                        name="feeding_instructions"
                        value={petForm.feeding_instructions}
                        onChange={handlePetFormChange}
                        placeholder="Feeding schedule, portion sizes, food preferences..."
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer with Actions */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
              <button
                type="button"
                onClick={handleClosePetForm}
                className="flex-1 px-4 py-2 border border-gray-300 text-text-secondary rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handlePetFormSubmit}
                disabled={petsLoading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
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
