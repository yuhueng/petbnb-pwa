import { useState, useEffect } from 'react';
import { useListingStore } from '@/store/listingStore';
import { useAuthStore } from '@/store/authStore';
import { usePetStore } from '@/store/petStore';
import RecommendationCard from '@/components/owner/RecommendationCard';
import ListingDetailModal from '@/components/owner/ListingDetailModal';
import ProfileModal from '@/components/common/ProfileModal';
import { parseSearchQuery, convertToListingFilters } from '@/services/aiSearchService';
import { wishlistService } from '@/services/wishlistService';
import toast from 'react-hot-toast';
import RecommendationCard2 from '../../components/owner/RecommendationCard2';

const Explore = () => {
  const { listings, isLoading, error, fetchListings } = useListingStore();
  const { user } = useAuthStore();
  const { pets, fetchPets } = usePetStore();

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
  const [visibleGenericListings, setVisibleGenericListings] = useState(10);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch user's pets on mount
  useEffect(() => {
    if (user) {
      fetchPets(user.id);
    }
  }, [user, fetchPets]);

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
    const { name, value} = e.target;
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

  // Get user's pet types for recommendations
  const getUserPetTypes = () => {
    if (!pets || pets.length === 0) return [];
    return [...new Set(pets.map(pet => pet.species))];
  };

  // Get recommended listings based on user's pets
  const getPetBasedRecommendations = () => {
    const userPetTypes = getUserPetTypes();
    if (userPetTypes.length === 0) return [];

    return listings.filter(listing => {
      // Check if listing accepts any of user's pet types
      return userPetTypes.some(petType =>
        listing.accepted_pet_types?.includes(petType)
      );
    }).slice(0, 10); // Limit to 10 recommendations
  };

  // Get generic listings (not including pet-based recommendations)
  const getGenericListings = () => {
    const petRecommendations = getPetBasedRecommendations();
    const petRecommendationIds = new Set(petRecommendations.map(l => l.id));

    return listings.filter(listing => !petRecommendationIds.has(listing.id));
  };

  // Load more generic listings
  const handleLoadMore = () => {
    setVisibleGenericListings(prev => prev + 10);
  };

  // Scroll functions for arrow navigation
  const scrollContainer = (containerId, direction) => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = 300; // Scroll by 300px
      const newScrollLeft = direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const userPetTypes = getUserPetTypes();
  const petRecommendations = getPetBasedRecommendations();
  const genericListings = getGenericListings();
  const visibleGenericList = genericListings.slice(0, visibleGenericListings);

  return (
    <>
      {/* Global styles for hiding scrollbar on desktop */}
      <style>
        {`
          @media (min-width: 768px) {
            #pet-recommendations-scroll::-webkit-scrollbar,
            #generic-listings-scroll::-webkit-scrollbar {
              display: none;
            }
          }
        `}
      </style>

      <div className="relative w-full min-h-screen" style={{ backgroundColor: '#fef5f6' }}>
      {/* Header - Fixed Search Bar - Full Width */}
      <div className="bg-white w-full" style={{ boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.25)' }}>
        <div className="w-full px-4 py-4 mx-auto" style={{ maxWidth: isMobile ? '100%' : '1200px' }}>
          {/* Search Bar with Filter Icon */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: '#909090' }}
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
                placeholder="Search house sitters..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:outline-none focus:border-[#fb7678]"
                style={{
                  borderRadius: '24px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
                disabled={aiSearching}
              />
            </div>
            <button
              type="submit"
              disabled={aiSearching}
              className="px-4 py-3 text-white font-semibold transition-all duration-300"
              style={{
                backgroundColor: '#fb7678',
                borderRadius: '24px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                opacity: aiSearching ? 0.5 : 1
              }}
            >
              {aiSearching ? (
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
              ) : (
                'Search'
              )}
            </button>
            {/* Filter Icon Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-3 border transition-all duration-300"
              style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                borderColor: '#e5e5e5'
              }}
              title="Filter"
            >
              <svg
                className="w-5 h-5"
                style={{ color: '#6d6d6d' }}
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
            </button>
          </form>

          {/* AI Understanding Display */}
          {aiUnderstanding && (
            <div className="mt-3 p-3 border" style={{
              backgroundColor: 'rgba(251, 118, 120, 0.1)',
              borderColor: '#fb7678',
              borderRadius: '10px'
            }}>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{
                    fontFamily: "'Inter', sans-serif",
                    color: '#3e2d2e'
                  }}>
                    {aiUnderstanding}
                  </p>
                  {aiParsedCriteria && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {aiParsedCriteria.city && (
                        <span className="text-xs px-2 py-1" style={{
                          backgroundColor: '#fcf3f3',
                          color: '#fb7678',
                          borderRadius: '12px',
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600
                        }}>
                          📍 {aiParsedCriteria.city}
                        </span>
                      )}
                      {aiParsedCriteria.service_type && (
                        <span className="text-xs px-2 py-1" style={{
                          backgroundColor: '#fcf3f3',
                          color: '#fb7678',
                          borderRadius: '12px',
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600
                        }}>
                          🏠 {aiParsedCriteria.service_type}
                        </span>
                      )}
                      {aiParsedCriteria.accepted_pet_types && (
                        <span className="text-xs px-2 py-1" style={{
                          backgroundColor: '#fcf3f3',
                          color: '#fb7678',
                          borderRadius: '12px',
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600
                        }}>
                          🐾 {aiParsedCriteria.accepted_pet_types}
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
                  style={{ color: '#fb7678' }}
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
            <div className="mt-3 p-3" style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{
                    fontFamily: "'Inter', sans-serif",
                    color: '#3e2d2e'
                  }}>
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={filters.city}
                    onChange={handleFilterChange}
                    placeholder="e.g., New York"
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#fb7678]"
                    style={{
                      borderRadius: '10px',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{
                    fontFamily: "'Inter', sans-serif",
                    color: '#3e2d2e'
                  }}>
                    Service Type
                  </label>
                  <select
                    name="service_type"
                    value={filters.service_type}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#fb7678]"
                    style={{
                      borderRadius: '10px',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px'
                    }}
                  >
                    <option value="">All Services</option>
                    <option value="boarding">Pet Boarding</option>
                    <option value="daycare">Daycare</option>
                    <option value="walking">Dog Walking</option>
                    <option value="grooming">Grooming</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{
                    fontFamily: "'Inter', sans-serif",
                    color: '#3e2d2e'
                  }}>
                    Pet Type
                  </label>
                  <select
                    name="accepted_pet_types"
                    value={filters.accepted_pet_types}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#fb7678]"
                    style={{
                      borderRadius: '10px',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px'
                    }}
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
                  className="px-4 py-2 text-white font-semibold transition-all duration-300"
                  style={{
                    backgroundColor: '#fb7678',
                    borderRadius: '30px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px'
                  }}
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 font-semibold transition-all duration-300"
                  style={{
                    backgroundColor: '#f5f5f5',
                    color: '#737373',
                    borderRadius: '30px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px'
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-5 pb-24 mx-auto" style={{ maxWidth: isMobile ? '100%' : '1200px' }}>
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2" style={{ borderColor: '#fb7678' }}></div>
            <p className="mt-4 text-sm" style={{
              fontFamily: "'Inter', sans-serif",
              color: '#6d6d6d'
            }}>
              Loading pet sitters...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 border mb-4" style={{
            backgroundColor: '#fef5f6',
            borderColor: '#fb7678',
            borderRadius: '10px'
          }}>
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                style={{ color: '#fb7678' }}
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
              <span style={{
                fontFamily: "'Inter', sans-serif",
                color: '#3e2d2e',
                fontSize: '14px'
              }}>
                {error}
              </span>
            </div>
          </div>
        )}

        {/* Content Sections - Only show when not loading and no error */}
        {!isLoading && !error && (
          <>
            {/* Pet-Based Recommendations Row */}
            {userPetTypes.length > 0 && petRecommendations.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold" style={{
                    fontFamily: "'Inter', sans-serif",
                    color: '#3e2d2e'
                  }}>
                    Recommended for your {userPetTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(', ')}
                  </h2>

                  {/* Desktop Arrow Navigation */}
                  {!isMobile && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => scrollContainer('pet-recommendations-scroll', 'left')}
                        className="p-2 rounded-full transition-all duration-200"
                        style={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e5e5',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef5f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        aria-label="Scroll left"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6d6d6d" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => scrollContainer('pet-recommendations-scroll', 'right')}
                        className="p-2 rounded-full transition-all duration-200"
                        style={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e5e5',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef5f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        aria-label="Scroll right"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6d6d6d" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Horizontal Scrolling Container */}
                <div className="relative">
                  <div
                    id="pet-recommendations-scroll"
                    className="overflow-x-auto pb-3 -mx-4 px-4"
                    style={{
                      scrollbarWidth: isMobile ? 'thin' : 'none',
                      scrollbarColor: '#fb7678 #fef5f6',
                      msOverflowStyle: isMobile ? 'auto' : 'none'
                    }}
                  >
                    <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
                      {petRecommendations.map((listing) => (
                        <div key={listing.id} className="flex-shrink-0" style={{ width: '400px', height: '200px' }}>
                          <RecommendationCard
                            listing={listing}
                            onClick={() => handleListingClick(listing)}
                            isInWishlist={wishlistIds.has(listing.id)}
                            onToggleWishlist={(e) => handleToggleWishlist(e, listing.id)}
                            compact={true}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generic Listings Row */}
            {visibleGenericList.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold" style={{
                    fontFamily: "'Inter', sans-serif",
                    color: '#3e2d2e'
                  }}>
                    More Pet Sitters Near You
                  </h2>

                  {/* Desktop Arrow Navigation */}
                  {!isMobile && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => scrollContainer('generic-listings-scroll', 'left')}
                        className="p-2 rounded-full transition-all duration-200"
                        style={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e5e5',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef5f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        aria-label="Scroll left"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6d6d6d" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => scrollContainer('generic-listings-scroll', 'right')}
                        className="p-2 rounded-full transition-all duration-200"
                        style={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e5e5',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef5f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        aria-label="Scroll right"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6d6d6d" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Horizontal Scrolling Container for Houses */}
                <div className="relative">
                  <div
                    id="generic-listings-scroll"
                    className="overflow-x-auto pb-3 -mx-4 px-4"
                    style={{
                      scrollbarWidth: isMobile ? 'thin' : 'none',
                      scrollbarColor: '#fb7678 #fef5f6',
                      msOverflowStyle: isMobile ? 'auto' : 'none'
                    }}
                  >
                    <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
                      {visibleGenericList.map((listing) => (
                        <div key={listing.id} className="flex-shrink-0" style={{ width: '400px', height: '400px' }}>
                          <RecommendationCard2
                            listing={listing}
                            onClick={() => handleListingClick(listing)}
                            isInWishlist={wishlistIds.has(listing.id)}
                            onToggleWishlist={(e) => handleToggleWishlist(e, listing.id)}
                            compact={true}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Load More Button */}
                {visibleGenericListings < genericListings.length && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={handleLoadMore}
                      className="px-6 py-3 text-white font-semibold transition-all duration-300"
                      style={{
                        backgroundColor: '#fb7678',
                        borderRadius: '30px',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        boxShadow: '0 2px 8px rgba(251, 118, 120, 0.3)'
                      }}
                    >
                      Load More ({genericListings.length - visibleGenericListings} more)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {listings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <svg
                  className="w-24 h-24 mb-4"
                  style={{ color: '#ababab' }}
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
                <h3 className="text-lg font-bold mb-2" style={{
                  fontFamily: "'Inter', sans-serif",
                  color: '#3e2d2e'
                }}>
                  No sitters found
                </h3>
                <p className="text-sm mb-6" style={{
                  fontFamily: "'Inter', sans-serif",
                  color: '#6d6d6d'
                }}>
                  Try adjusting your search or filters
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 text-white font-semibold transition-all duration-300"
                  style={{
                    backgroundColor: '#fb7678',
                    borderRadius: '30px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px'
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
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
    </>
  );
};

export default Explore;
