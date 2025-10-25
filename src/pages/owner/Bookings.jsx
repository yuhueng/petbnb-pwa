import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const Bookings = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <svg
          className="w-24 h-24 text-gray-300 mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Please log in to view bookings</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to manage your bookings</p>
        <button
          onClick={() => navigate('/owner/profile')}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Bookings</h1>
      <p className="text-gray-600">View and manage your bookings.</p>
      <div className="mt-8 text-center text-gray-400">
        <p>Content coming soon...</p>
      </div>
    </div>
  );
};

export default Bookings;
