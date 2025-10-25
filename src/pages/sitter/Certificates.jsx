import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const Certificates = () => {
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Please log in to view certificates</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to manage your certifications</p>
        <button
          onClick={() => navigate('/sitter/profile')}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Certificates</h1>
      <p className="text-gray-600">Upload and manage your certifications.</p>
      <div className="mt-8 text-center text-gray-400">
        <p>Content coming soon...</p>
      </div>
    </div>
  );
};

export default Certificates;
