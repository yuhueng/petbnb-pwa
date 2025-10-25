import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const Wishlist = () => {
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
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Please log in to view wishlist</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to save your favorite sitters</p>
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
      <h1 className="text-2xl font-bold mb-4">My Wishlist</h1>
      <p className="text-gray-600">Your saved favorite pet sitters.</p>
      <div className="mt-8 text-center text-gray-400">
        <p>Content coming soon...</p>
      </div>
    </div>
  );
};

export default Wishlist;
