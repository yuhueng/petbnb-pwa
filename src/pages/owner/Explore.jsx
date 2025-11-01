import { useState, useEffect } from 'react';
import { useListingStore } from '@/store/listingStore';
import { useAuthStore } from '@/store/authStore';
import SitterCard from '@/components/owner/SitterCard';
import ListingDetailModal from '@/components/owner/ListingDetailModal';
import ProfileModal from '@/components/common/ProfileModal';
import { parseSearchQuery, convertToListingFilters } from '@/services/aiSearchService';
import { wishlistService } from '@/services/wishlistService';
import toast from 'react-hot-toast';

const Explore = () => {
  const { listings, isLoading, error, fetchListings } = useListingStore();
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    city: '',
    service_type: '',
    accepted_pet_types: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiUnderstanding, setAiUnderstanding] = useState(null);
  const [aiParsedCriteria, setAiParsedCriteria] = useState(null);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [profileUserId, setProfileUserId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Fetch listings on mount, excluding current user's listings
  useEffect(() => {
    const initialFilters = user ? { excludeUserId: user.id } : {};
    fetchListings(initialFilters);
  }, [fetchListings, user]);

  // Fetch wishlist IDs on mount
  useEffect(() => {
    if (user) {
      loadWishlistIds();
    }
  }, [user]);

  const loadWishlistIds = async () => {
    if (!user) return;
    const ids = await wishlistService.getWishlistIds(user.id);
    setWishlistIds(ids);
  };

  // Handle AI-powered search
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      // If empty search, just reset
      const resetFilters = user ? { excludeUserId: user.id } : {};
      fetchListings(resetFilters);
      setAiUnderstanding(null);
      setAiParsedCriteria(null);
      return;
    }

    try {
      setAiSearching(true);
      setAiUnderstanding(null);
      setAiParsedCriteria(null);

      // Parse the natural language query with AI
      const aiCriteria = await parseSearchQuery(searchTerm);

      // Store the AI understanding and parsed criteria
      setAiUnderstanding(aiCriteria.understanding || 'Processing your search...');
      setAiParsedCriteria(aiCriteria);

      // Convert AI criteria to listing filters
      const searchFilters = convertToListingFilters(aiCriteria);

      // Always exclude current user's listings
      if (user) {
        searchFilters.excludeUserId = user.id;
      }

      // Fetch listings with AI-parsed filters
      fetchListings(searchFilters);
    } catch (error) {
      console.error('AI Search Error:', error);
      setAiUnderstanding('Sorry, there was an error processing your search. Please try again.');
    } finally {
      setAiSearching(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    const activeFilters = {};
    if (filters.city) activeFilters.city = filters.city;
    if (filters.service_type) activeFilters.service_type = filters.service_type;
    if (filters.accepted_pet_types) activeFilters.accepted_pet_types = filters.accepted_pet_types;
    // Always exclude current user's listings
    if (user) {
      activeFilters.excludeUserId = user.id;
    }

    fetchListings(activeFilters);
    setShowFilters(false);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      city: '',
      service_type: '',
      accepted_pet_types: '',
    });
    setSearchTerm('');
    setAiUnderstanding(null);
    setAiParsedCriteria(null);
    // Always exclude current user's listings
    const resetFilters = user ? { excludeUserId: user.id } : {};
    fetchListings(resetFilters);
  };

  // Handle listing click - open modal
  const handleListingClick = (listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedListing(null);
  };

  const handleProfileClick = (userId) => {
    setProfileUserId(userId);
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    setProfileUserId(null);
  };

  const handleToggleWishlist = async (e, listingId) => {
    e.stopPropagation(); // Prevent card click

    if (!user) {
      toast.error('Please log in to save favorites');
      return;
    }

    const result = await wishlistService.toggleWishlist(user.id, listingId);

    if (result.success) {
      // Update local wishlist state
      setWishlistIds((prev) => {
        const newSet = new Set(prev);
        if (result.isInWishlist) {
          newSet.add(listingId);
        } else {
          newSet.delete(listingId);
        }
        return newSet;
      });

      // Show toast after state update
      if (result.isInWishlist) {
        toast.success('Added to wishlist! ❤️');
      } else {
        toast.success('Removed from wishlist');
      }
    } else {
      toast.error(result.error || 'Failed to update wishlist');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">Explore Pet Sitters</h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Describe what you're looking for... (e.g., 'dog sitter in Brooklyn with a fenced yard')"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={aiSearching}
              />
            </div>
            <button
              type="submit"
              disabled={aiSearching}
              className="px-6 py-2 bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {aiSearching ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
            </button>
          </form>

          {/* AI Understanding Display */}
          {aiUnderstanding && (
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-1">AI Understanding:</h3>
                  <p className="text-sm text-indigo-800">{aiUnderstanding}</p>
                  {aiParsedCriteria && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {aiParsedCriteria.city && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          📍 {aiParsedCriteria.city}
                        </span>
                      )}
                      {aiParsedCriteria.service_type && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          🏠 {aiParsedCriteria.service_type}
                        </span>
                      )}
                      {aiParsedCriteria.accepted_pet_types && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          🐾 {aiParsedCriteria.accepted_pet_types}
                        </span>
                      )}
                      {aiParsedCriteria.accepted_pet_sizes && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          📏 {aiParsedCriteria.accepted_pet_sizes.join(', ')}
                        </span>
                      )}
                      {aiParsedCriteria.amenities && aiParsedCriteria.amenities.length > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          ✨ {aiParsedCriteria.amenities.join(', ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setAiUnderstanding(null);
                    setAiParsedCriteria(null);
                  }}
                  className="flex-shrink-0 text-indigo-400 hover:text-indigo-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={filters.city}
                    onChange={handleFilterChange}
                    placeholder="e.g., New York"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Service Type
                  </label>
                  <select
                    name="service_type"
                    value={filters.service_type}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Services</option>
                    <option value="boarding">Pet Boarding</option>
                    <option value="daycare">Daycare</option>
                    <option value="walking">Dog Walking</option>
                    <option value="grooming">Grooming</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Pet Type</label>
                  <select
                    name="accepted_pet_types"
                    value={filters.accepted_pet_types}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Pets</option>
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="bird">Bird</option>
                    <option value="rabbit">Rabbit</option>
                    <option value="hamster">Hamster</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gray-200 text-text-secondary rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-text-secondary">Loading pet sitters...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-text-error-dark">{error}</span>
            </div>
          </div>
        )}

        {/* Results Count */}
        {!isLoading && !error && (
          <div className="mb-4">
            <p className="text-sm text-text-secondary">
              {listings.length} {listings.length === 1 ? 'sitter' : 'sitters'} found
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && listings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              className="w-24 h-24 text-text-disabled mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No sitters found</h3>
            <p className="text-text-secondary mb-6">Try adjusting your search or filters</p>
            <button
              onClick={handleClearFilters}
              className="px-6 py-2 bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Listings Grid */}
        {!isLoading && !error && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <SitterCard
                key={listing.id}
                listing={listing}
                onClick={() => handleListingClick(listing)}
                isInWishlist={wishlistIds.has(listing.id)}
                onToggleWishlist={(e) => handleToggleWishlist(e, listing.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Listing Detail Modal */}
      <ListingDetailModal
        listing={selectedListing}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onProfileClick={handleProfileClick}
      />

      {/* Profile Modal */}
      <ProfileModal
        userId={profileUserId}
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
      />
    </div>
  );
};

export default Explore;
