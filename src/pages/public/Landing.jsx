import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-primary-600">PetBNB</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Find trusted pet sitters in your area or offer your pet care services.
            Connect with loving pet owners and create lasting relationships.
          </p>

          <div className="flex justify-center">
            <button
              onClick={() => navigate('/owner/explore')}
              className="px-12 py-4 bg-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-lg shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            No account needed to browse • Login anytime from your profile
          </p>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🐕</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Find Pet Sitters</h3>
            <p className="text-gray-600">
              Browse trusted pet sitters in your area with verified reviews
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏠</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Offer Pet Care</h3>
            <p className="text-gray-600">
              Become a pet sitter and earn money doing what you love
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect & Book</h3>
            <p className="text-gray-600">
              Message sitters directly and book with confidence
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
