import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { USER_ROLES } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoginRegisterTabs from '@/components/common/LoginRegisterTabs';

const Profile = () => {
  const { profile, switchRole, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
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

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Sitter Profile</h1>
        <p className="text-gray-600 mb-8">Manage your sitter profile and settings.</p>

        {/* Profile Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
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
              <p className="font-medium">Pet Owner & Sitter</p>
            </div>
            {profile?.is_verified && (
              <div>
                <p className="text-sm text-gray-500">Age Verified</p>
                <p className="font-medium text-green-600">✓ Verified (18+)</p>
              </div>
            )}
          </div>
        </div>

        {/* Sitter Status Card */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-2">🎉 Sitter Mode Active</h2>
              <p className="text-gray-600 mb-4">
                You're currently in sitter mode. Manage your listings, bookings, and reviews from
                the sitter dashboard.
              </p>

              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>✓ Create and manage your service listings</li>
                <li>✓ Accept and track bookings</li>
                <li>✓ Communicate with pet owners</li>
                <li>✓ Build your reputation with reviews</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleSwitchToOwner}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Switching...' : 'Switch to Owner Mode'}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help? Contact support@petbnb.com</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
