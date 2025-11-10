import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { USER_ROLES } from '@/utils/constants';

const Landing = () => {
  const navigate = useNavigate();
  const { activeRole } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef5f6] via-[#fcf3f3] to-[#ffe5e5]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#ffa8aa] to-[#ffe5e5] rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-[#ffe5e5] to-[#fcf3f3] rounded-full blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            {/* Main Heading */}
            <div className="mb-8">
              <h1 className="text-6xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#fb7678] via-[#fe8c85] to-[#ffa8aa] mb-4 animate-fade-in">
                PetBNB
              </h1>
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-1 w-20 bg-gradient-to-r from-[#fb7678] to-[#fe8c85] rounded-full"></div>
                <span className="text-3xl">🐾</span>
                <div className="h-1 w-20 bg-gradient-to-r from-[#fe8c85] to-[#ffa8aa] rounded-full"></div>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-[#3e2d2e] mb-6 max-w-4xl mx-auto">
              Your Pet's Perfect Home Away From Home
            </h2>

            <p className="text-xl sm:text-2xl text-[#6d6d6d] mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect with loving pet sitters in your area or share your passion for pets by becoming a sitter yourself.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => {
                  const targetPath = activeRole === USER_ROLES.SITTER
                    ? '/sitter/dashboard'
                    : '/owner/explore';
                  navigate(targetPath);
                }}
                className="group relative px-12 py-5 bg-gradient-to-r from-[#fb7678] to-[#ffa8aa] text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-[#fb7678]/50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>

            <p className="text-sm text-gray-500 flex items-center justify-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No account needed to browse
              </span>
              <span className="hidden sm:inline text-gray-300">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Login anytime from your profile
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fb7678] to-[#fe8c85] rounded-t-2xl"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-[#ffe5e5] to-[#fcf3f3] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-md">
              <span className="text-5xl">🐕</span>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-[#3e2d2e]">Find Pet Sitters</h3>
            <p className="text-[#6d6d6d] leading-relaxed">
              Browse trusted, verified pet sitters in your area with detailed profiles and genuine reviews from pet owners
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fe8c85] to-[#ffa8aa] rounded-t-2xl"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-[#fcf3f3] to-[#ffe5e5] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-md">
              <span className="text-5xl">🏠</span>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-[#3e2d2e]">Offer Pet Care</h3>
            <p className="text-[#6d6d6d] leading-relaxed">
              Turn your love for animals into income. Set your own schedule and rates while caring for adorable pets
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffa8aa] to-[#fb7678] rounded-t-2xl"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-[#ffe5e5] to-[#fcf3f3] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-md">
              <span className="text-5xl">💬</span>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-[#3e2d2e]">Connect & Book</h3>
            <p className="text-[#6d6d6d] leading-relaxed">
              Chat directly with sitters, share your pet's needs, and book services with complete peace of mind
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-[#fb7678] to-[#ffa8aa] rounded-3xl p-12 text-center shadow-2xl">
          <div className="grid md:grid-cols-3 gap-8 text-white">
            <div>
              <div className="text-5xl font-bold mb-2">1000+</div>
              <div className="text-white/80">Trusted Sitters</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">5000+</div>
              <div className="text-white/80">Happy Pets</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">10k+</div>
              <div className="text-white/80">Successful Bookings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">Need help? Contact us at <span className="text-[#fb7678] font-medium">support@petbnb.com</span></p>
      </div>
    </div>
  );
};

export default Landing;
