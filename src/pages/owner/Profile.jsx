import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { USER_ROLES } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoginRegisterTabs from '@/components/common/LoginRegisterTabs';

const Profile = () => {
  const { profile, becomeSitter, switchRole, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showBirthdateModal, setShowBirthdateModal] = useState(false);
  const [birthdate, setBirthdate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If not authenticated, show login/register forms
  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2 text-center">Welcome to PetBNB</h1>
          <p className="text-gray-600 mb-8 text-center">Login or create an account to access your profile</p>
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

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-600 mb-8">Manage your account and pet information.</p>

        {/* Profile Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Username</p>
              <p className="font-medium">
                {profile?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{profile?.email}</p>
            </div>
            {profile?.phone && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{profile.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Account Type</p>
              <p className="font-medium">
                {profile?.is_verified ? 'Pet Owner & Sitter' : 'Pet Owner'}
              </p>
            </div>
          </div>
        </div>

        {/* Become a Sitter Card */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg text-gray-600 font-semibold mb-2" >
                {profile?.is_verified ? '🎉 You are a Sitter!' : '🐾 Become a Pet Sitter'}
              </h2>
              <p className="text-gray-600 mb-4">
                {profile?.is_verified
                  ? 'You can now offer pet sitting services. Switch to sitter mode to manage your listings and bookings.'
                  : 'Earn money by taking care of pets! Become a sitter and start accepting bookings.'}
              </p>

              {!profile?.is_verified && (
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>✓ Set your own prices and availability</li>
                  <li>✓ Meet amazing pets in your area</li>
                  <li>✓ Build a reputation with reviews</li>
                  <li>✓ Must be 18 years or older</li>
                </ul>
              )}
            </div>
          </div>

          <button
            onClick={handleBecomeSitter}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading
              ? 'Processing...'
              : profile?.is_verified
              ? 'Switch to Sitter Mode'
              : 'Become a Sitter'}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help? Contact support@petbnb.com</p>
        </div>
      </div>

      {/* Birthdate Modal */}
      {showBirthdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Your Age</h3>
            <p className="text-gray-600 mb-6">
              To become a pet sitter, you must be at least 18 years old. Please enter your
              birthdate to continue.
            </p>

            <form onSubmit={handleBirthdateSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Confirming...' : 'Confirm'}
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-500 mt-4">
              Your birthdate will be used to verify your age and will not be publicly displayed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
