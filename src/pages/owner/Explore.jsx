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
    priceRange: { min: '', max: '', type: 'day' }, // day or hour
    minRating: 0,
    petTypes: [],
    services: [],
    amenities: [],
    selectedPets: [], // IDs of user's pets to filter by
    dateRange: { start: '', end: '' }, // Date range for availability
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterMode, setFilterMode] = useState('quick'); // 'quick' or 'byPet'
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

      const aiCriteria = await parseSearchQuery(searchTerm);
      setAiUnderstanding(aiCriteria.understanding || 'Processing your search...');
      setAiParsedCriteria(aiCriteria);

      const searchFilters = convertToListingFilters(aiCriteria);
      if (user) {
        searchFilters.excludeUserId = user.id;
      }

      fetchListings(searchFilters);
    } catch (error) {
      console.error('AI Search Error:', error);
      setAiUnderstanding('Sorry, there was an error processing your search. Please try again.');
    } finally {
      setAiSearching(false);
    }
  };

  // Toggle filter handlers
  const togglePetType = (petType) => {
    setFilters(prev => ({
      ...prev,
      petTypes: prev.petTypes.includes(petType)
        ? prev.petTypes.filter(t => t !== petType)
        : [...prev.petTypes, petType]
    }));
  };

  const toggleService = (service) => {
    setFilters(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const toggleAmenity = (amenity) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const togglePetSelection = (petId) => {
    setFilters(prev => ({
      ...prev,
      selectedPets: prev.selectedPets.includes(petId)
        ? prev.selectedPets.filter(id => id !== petId)
        : [...prev.selectedPets, petId]
    }));
  };

  const handleApplyFilters = () => {
    // Filters are applied client-side in getFilteredListings
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      priceRange: { min: '', max: '', type: 'day' },
      minRating: 0,
      petTypes: [],
      services: [],
      amenities: [],
      selectedPets: [],
      dateRange: { start: '', end: '' },
    });
    setSearchTerm('');
    setAiUnderstanding(null);
    setAiParsedCriteria(null);
    const resetFilters = user ? { excludeUserId: user.id } : {};
    fetchListings(resetFilters);
  };

  // Apply filters to listings
  const getFilteredListings = (listingsToFilter) => {
    let filtered = [...listingsToFilter];

    // Price range filter
    if (filters.priceRange.min || filters.priceRange.max) {
      filtered = filtered.filter(listing => {
        const price = filters.priceRange.type === 'day'
          ? listing.price_per_day / 100
          : listing.price_per_hour / 100;

        if (!price) return true; // Include listings without price

        const min = filters.priceRange.min ? parseInt(filters.priceRange.min) : 0;
        const max = filters.priceRange.max ? parseInt(filters.priceRange.max) : Infinity;

        return price >= min && price <= max;
      });
    }

    // Pet types filter
    if (filters.petTypes.length > 0) {
      filtered = filtered.filter(listing => {
        return filters.petTypes.some(petType =>
          listing.accepted_pet_types?.includes(petType)
        );
      });
    }

    // Services filter
    if (filters.services.length > 0) {
      filtered = filtered.filter(listing => {
        return filters.services.some(service =>
          listing.service_type?.includes(service)
        );
      });
    }

    // Amenities filter
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(listing => {
        return filters.amenities.every(amenity =>
          listing.amenities?.includes(amenity)
        );
      });
    }

    // Selected pets filter (filter by specific pet needs)
    if (filterMode === 'byPet' && filters.selectedPets.length > 0) {
      const selectedPetObjects = pets.filter(pet => filters.selectedPets.includes(pet.id));
      const requiredSpecies = [...new Set(selectedPetObjects.map(p => p.species))];

      filtered = filtered.filter(listing => {
        return requiredSpecies.every(species =>
          listing.accepted_pet_types?.includes(species)
        );
      });
    }

    // TODO: Rating filter - requires fetching review stats from Supabase
    // This would need to be implemented as an async operation or pre-loaded data
    // For now, rating filter is displayed but not yet functional
    // if (filters.minRating > 0) {
    //   filtered = await filterByRating(filtered, filters.minRating);
    // }

    return filtered;
  };

  const handleListingClick = (listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

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
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in to save favorites');
      return;
    }

    const result = await wishlistService.toggleWishlist(user.id, listingId);

    if (result.success) {
      setWishlistIds((prev) => {
        const newSet = new Set(prev);
        if (result.isInWishlist) {
          newSet.add(listingId);
        } else {
          newSet.delete(listingId);
        }
        return newSet;
      });

      if (result.isInWishlist) {
        toast.success('Added to wishlist! ❤️');
      } else {
        toast.success('Removed from wishlist');
      }
    } else {
      toast.error(result.error || 'Failed to update wishlist');
    }
  };

  // Get user's pets grouped by species for individual recommendations
  const getPetsBySpecies = () => {
    if (!pets || pets.length === 0) return {};

    const grouped = {};
    pets.forEach(pet => {
      if (!grouped[pet.species]) {
        grouped[pet.species] = [];
      }
      grouped[pet.species].push(pet);
    });
    return grouped;
  };

  // Get recommended listings for a specific pet species
  const getRecommendationsForSpecies = (species, limit = 10) => {
    const speciesListings = listings.filter(listing => {
      return listing.accepted_pet_types?.includes(species);
    });
    // Apply filters to species-specific listings
    const filtered = getFilteredListings(speciesListings);
    return filtered.slice(0, limit);
  };

  // Get all pet-specific recommendation IDs (to exclude from generic listings)
  const getAllPetRecommendationIds = () => {
    const petsBySpecies = getPetsBySpecies();
    const allIds = new Set();

    Object.keys(petsBySpecies).forEach(species => {
      const recommendations = getRecommendationsForSpecies(species);
      recommendations.forEach(listing => allIds.add(listing.id));
    });

    return allIds;
  };

  // Get generic listings (not including any pet-based recommendations)
  const getGenericListings = () => {
    const petRecommendationIds = getAllPetRecommendationIds();
    const genericList = listings.filter(listing => !petRecommendationIds.has(listing.id));
    // Apply filters to generic listings
    return getFilteredListings(genericList);
  };

  const handleLoadMore = () => {
    setVisibleGenericListings(prev => prev + 10);
  };

  // Scroll functions for arrow navigation
  const scrollContainer = (containerId, direction) => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const petsBySpecies = getPetsBySpecies();
  const genericListings = getGenericListings();
  const visibleGenericList = genericListings.slice(0, visibleGenericListings);

  return (
    <>
      {/* Global styles for hiding scrollbar on desktop */}
      <style>
        {`
          @media (min-width: 768px) {
            .pet-scroll-container::-webkit-scrollbar,
            #generic-listings-scroll::-webkit-scrollbar {
              display: none;
            }
          }
        `}
      </style>

      <div className="relative w-full min-h-screen bg-[#fef5f6]">
        {/* Header - Fixed Search Bar - Full Width */}
        <div className="bg-white w-full shadow-md">
          <div className={`w-full px-4 py-4 mx-auto ${isMobile ? '' : 'max-w-[1200px]'}`}>
            {/* Search Bar with Filter Icon */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#909090]"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-[24px] bg-white text-sm font-['Inter'] focus:outline-none focus:border-[#fb7678] disabled:opacity-50"
                  disabled={aiSearching}
                />
              </div>
              <button
                type="submit"
                disabled={aiSearching}
                className={`px-4 py-3 bg-[#fb7678] text-white font-semibold rounded-[24px] text-sm font-['Inter'] transition-all duration-300 ${aiSearching ? 'opacity-50' : ''}`}
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
                className="px-3 py-3 bg-white border border-[#e5e5e5] rounded-[24px] transition-all duration-300 hover:bg-gray-50"
                title="Filter"
              >
                <svg
                  className="w-5 h-5 text-[#6d6d6d]"
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
              <div className="mt-3 p-3 bg-[rgba(251,118,120,0.1)] border border-[#fb7678] rounded-[10px]">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#3e2d2e] font-['Inter']">
                      {aiUnderstanding}
                    </p>
                    {aiParsedCriteria && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {aiParsedCriteria.city && (
                          <span className="text-xs px-2 py-1 bg-[#fcf3f3] text-[#fb7678] rounded-[12px] font-['Inter'] font-semibold">
                            📍 {aiParsedCriteria.city}
                          </span>
                        )}
                        {aiParsedCriteria.service_type && (
                          <span className="text-xs px-2 py-1 bg-[#fcf3f3] text-[#fb7678] rounded-[12px] font-['Inter'] font-semibold">
                            🏠 {aiParsedCriteria.service_type}
                          </span>
                        )}
                        {aiParsedCriteria.accepted_pet_types && (
                          <span className="text-xs px-2 py-1 bg-[#fcf3f3] text-[#fb7678] rounded-[12px] font-['Inter'] font-semibold">
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
                    className="text-[#fb7678] hover:text-[#fa5d5f]"
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

            {/* Enhanced Filters Panel */}
            {showFilters && (
              <div className="mt-3 p-4 bg-white rounded-[10px] shadow-lg border border-[#e5e5e5]">
                {/* Filter Mode Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setFilterMode('quick')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold font-['Inter'] transition-all duration-200 ${
                      filterMode === 'quick'
                        ? 'bg-[#fb7678] text-white'
                        : 'bg-[#f5f5f5] text-[#737373] hover:bg-gray-300'
                    }`}
                  >
                    Quick Filters
                  </button>
                  <button
                    onClick={() => setFilterMode('byPet')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold font-['Inter'] transition-all duration-200 ${
                      filterMode === 'byPet'
                        ? 'bg-[#fb7678] text-white'
                        : 'bg-[#f5f5f5] text-[#737373] hover:bg-gray-300'
                    }`}
                  >
                    Filter by Pet
                  </button>
                </div>

                {/* Quick Filters Mode */}
                {filterMode === 'quick' && (
                  <div className="space-y-4">
                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-[#3e2d2e] font-['Inter'] mb-2">
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-[#6d6d6d] font-['Inter'] mb-1">
                            Check-in
                          </label>
                          <input
                            type="date"
                            value={filters.dateRange.start}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, start: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg font-['Inter'] text-sm focus:outline-none focus:border-[#fb7678]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#6d6d6d] font-['Inter'] mb-1">
                            Check-out
                          </label>
                          <input
                            type="date"
                            value={filters.dateRange.end}
                            min={filters.dateRange.start || new Date().toISOString().split('T')[0]}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, end: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg font-['Inter'] text-sm focus:outline-none focus:border-[#fb7678]"
                          />
                        </div>
                      </div>
                      {filters.dateRange.start && filters.dateRange.end && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-[#6d6d6d] font-['Inter']">
                          <svg className="w-4 h-4 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {Math.ceil((new Date(filters.dateRange.end) - new Date(filters.dateRange.start)) / (1000 * 60 * 60 * 24))} night(s)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price Range Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-[#3e2d2e] font-['Inter'] mb-2">
                        Price Range
                      </label>
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, type: 'day' } }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-['Inter'] transition-all duration-200 ${
                            filters.priceRange.type === 'day'
                              ? 'bg-[#fb7678] text-white'
                              : 'bg-[#f5f5f5] text-[#737373]'
                          }`}
                        >
                          Per Day
                        </button>
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, type: 'hour' } }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-['Inter'] transition-all duration-200 ${
                            filters.priceRange.type === 'hour'
                              ? 'bg-[#fb7678] text-white'
                              : 'bg-[#f5f5f5] text-[#737373]'
                          }`}
                        >
                          Per Hour
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.priceRange.min}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, min: e.target.value }
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-['Inter'] text-sm focus:outline-none focus:border-[#fb7678]"
                        />
                        <span className="flex items-center text-[#909090]">-</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.priceRange.max}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, max: e.target.value }
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-['Inter'] text-sm focus:outline-none focus:border-[#fb7678]"
                        />
                      </div>
                    </div>

                    {/* Minimum Rating Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-[#3e2d2e] font-['Inter'] mb-2">
                        Minimum Rating
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              minRating: prev.minRating === rating ? 0 : rating
                            }))}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold font-['Inter'] transition-all duration-200 ${
                              filters.minRating >= rating
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-[#f5f5f5] text-[#909090]'
                            }`}
                          >
                            {rating}★
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pet Types Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-[#3e2d2e] font-['Inter'] mb-2">
                        Pet Types
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['dog', 'cat', 'bird', 'rabbit', 'hamster', 'other'].map(petType => (
                          <button
                            key={petType}
                            onClick={() => togglePetType(petType)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold font-['Inter'] transition-all duration-200 ${
                              filters.petTypes.includes(petType)
                                ? 'bg-[#fb7678] text-white'
                                : 'bg-[#f5f5f5] text-[#737373] hover:bg-gray-300'
                            }`}
                          >
                            {petType.charAt(0).toUpperCase() + petType.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Services Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-[#3e2d2e] font-['Inter'] mb-2">
                        Services
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['boarding', 'daycare', 'walking', 'grooming'].map(service => (
                          <button
                            key={service}
                            onClick={() => toggleService(service)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold font-['Inter'] transition-all duration-200 ${
                              filters.services.includes(service)
                                ? 'bg-[#fb7678] text-white'
                                : 'bg-[#f5f5f5] text-[#737373] hover:bg-gray-300'
                            }`}
                          >
                            {service.charAt(0).toUpperCase() + service.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amenities Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-[#3e2d2e] font-['Inter'] mb-2">
                        Amenities
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['fenced_yard', 'air_conditioning', 'pet_camera', 'first_aid_trained', 'pool_access'].map(amenity => (
                          <button
                            key={amenity}
                            onClick={() => toggleAmenity(amenity)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold font-['Inter'] transition-all duration-200 ${
                              filters.amenities.includes(amenity)
                                ? 'bg-[#fb7678] text-white'
                                : 'bg-[#f5f5f5] text-[#737373] hover:bg-gray-300'
                            }`}
                          >
                            {amenity.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Filter by Pet Mode */}
                {filterMode === 'byPet' && (
                  <div className="space-y-3">
                    {/* Date Range Filter (shared across modes) */}
                    <div>
                      <label className="block text-sm font-semibold text-[#3e2d2e] font-['Inter'] mb-2">
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-[#6d6d6d] font-['Inter'] mb-1">
                            Check-in
                          </label>
                          <input
                            type="date"
                            value={filters.dateRange.start}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, start: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg font-['Inter'] text-sm focus:outline-none focus:border-[#fb7678]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#6d6d6d] font-['Inter'] mb-1">
                            Check-out
                          </label>
                          <input
                            type="date"
                            value={filters.dateRange.end}
                            min={filters.dateRange.start || new Date().toISOString().split('T')[0]}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, end: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg font-['Inter'] text-sm focus:outline-none focus:border-[#fb7678]"
                          />
                        </div>
                      </div>
                      {filters.dateRange.start && filters.dateRange.end && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-[#6d6d6d] font-['Inter']">
                          <svg className="w-4 h-4 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {Math.ceil((new Date(filters.dateRange.end) - new Date(filters.dateRange.start)) / (1000 * 60 * 60 * 24))} night(s)
                          </span>
                        </div>
                      )}
                    </div>

                    {pets && pets.length > 0 ? (
                      <>
                        <p className="text-xs text-[#6d6d6d] font-['Inter'] mb-3">
                          Select your pet(s) to find sitters that match their specific needs
                        </p>
                        {pets.map(pet => (
                          <div
                            key={pet.id}
                            onClick={() => togglePetSelection(pet.id)}
                            className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                              filters.selectedPets.includes(pet.id)
                                ? 'border-[#fb7678] bg-[#fef5f6]'
                                : 'border-gray-200 hover:border-[#fb7678] hover:bg-[#fef5f6]'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                filters.selectedPets.includes(pet.id)
                                  ? 'border-[#fb7678] bg-[#fb7678]'
                                  : 'border-gray-300'
                              }`}>
                                {filters.selectedPets.includes(pet.id) && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>

                              {/* Pet Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-sm text-[#3e2d2e] font-['Inter']">
                                    {pet.name}
                                  </h4>
                                  <span className="text-xs px-2 py-0.5 bg-[#fb7678] text-white rounded-full font-['Inter'] font-semibold">
                                    {pet.species}
                                  </span>
                                </div>

                                <div className="space-y-1 text-xs text-[#6d6d6d] font-['Inter']">
                                  {pet.breed && (
                                    <p><span className="font-semibold">Breed:</span> {pet.breed}</p>
                                  )}
                                  {pet.age && (
                                    <p><span className="font-semibold">Age:</span> {pet.age} years</p>
                                  )}
                                  {pet.temperament && (
                                    <p><span className="font-semibold">Temperament:</span> {pet.temperament}</p>
                                  )}
                                  {pet.medical_conditions && (
                                    <p className="text-[#fb7678]">
                                      <span className="font-semibold">Medical:</span> {pet.medical_conditions}
                                    </p>
                                  )}
                                  {pet.allergies && (
                                    <p className="text-[#fb7678]">
                                      <span className="font-semibold">Allergies:</span> {pet.allergies}
                                    </p>
                                  )}
                                  {pet.special_needs && (
                                    <p className="text-[#fb7678]">
                                      <span className="font-semibold">Special Needs:</span> {pet.special_needs}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-[#6d6d6d] font-['Inter'] mb-3">
                          No pets added yet
                        </p>
                        <p className="text-xs text-[#909090] font-['Inter']">
                          Add pets to your profile to use this filter
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleApplyFilters}
                    className="flex-1 px-4 py-2.5 bg-[#fb7678] text-white font-semibold rounded-full text-sm font-['Inter'] transition-all duration-300 hover:bg-[#fa5d5f] shadow-sm"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2.5 bg-[#f5f5f5] text-[#737373] font-semibold rounded-full text-sm font-['Inter'] transition-all duration-300 hover:bg-gray-300"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={`px-4 py-5 pb-24 mx-auto ${isMobile ? '' : 'max-w-[1200px]'}`}>
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#fb7678] mb-4"></div>
              <p className="text-sm text-[#6d6d6d] font-['Inter']">
                Loading pet sitters...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-[#fef5f6] border border-[#fb7678] rounded-[10px] mb-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-[#fb7678] mr-2"
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
                <span className="text-[#3e2d2e] text-sm font-['Inter']">
                  {error}
                </span>
              </div>
            </div>
          )}

          {/* Content Sections - Only show when not loading and no error */}
          {!isLoading && !error && (
            <>
              {/* Pet-Based Recommendation Rows - One for Each Pet Type */}
              {Object.entries(petsBySpecies).map(([species, pets]) => {
                const recommendations = getRecommendationsForSpecies(species, 10);
                if (recommendations.length === 0) return null;

                const speciesDisplayName = species.charAt(0).toUpperCase() + species.slice(1);
                const petNames = pets.map(pet => pet.name).join(', ');

                return (
                  <div key={species} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-[#3e2d2e] font-['Inter']">
                        Recommended for {petNames}
                      </h2>

                      {/* Desktop Arrow Navigation */}
                      {!isMobile && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => scrollContainer(`pet-${species}-scroll`, 'left')}
                            className="p-2 bg-white border border-[#e5e5e5] rounded-full transition-all duration-200 hover:bg-[#fef5f6]"
                            aria-label="Scroll left"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6d6d6d" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => scrollContainer(`pet-${species}-scroll`, 'right')}
                            className="p-2 bg-white border border-[#e5e5e5] rounded-full transition-all duration-200 hover:bg-[#fef5f6]"
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
                        id={`pet-${species}-scroll`}
                        className={`pet-scroll-container overflow-x-auto pb-3 -mx-4 px-4 ${isMobile ? 'scrollbar-thin scrollbar-thumb-[#fb7678] scrollbar-track-[#fef5f6]' : ''}`}
                      >
                        <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
                          {recommendations.map((listing) => (
                            <div key={listing.id} className="flex-shrink-0 w-[360px] h-[150px]">
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
                );
              })}

              {/* Generic Listings Row */}
              {visibleGenericList.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-[#3e2d2e] font-['Inter']">
                      More Pet Sitters Near You
                    </h2>

                    {/* Desktop Arrow Navigation */}
                    {!isMobile && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => scrollContainer('generic-listings-scroll', 'left')}
                          className="p-2 bg-white border border-[#e5e5e5] rounded-full transition-all duration-200 hover:bg-[#fef5f6]"
                          aria-label="Scroll left"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6d6d6d" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => scrollContainer('generic-listings-scroll', 'right')}
                          className="p-2 bg-white border border-[#e5e5e5] rounded-full transition-all duration-200 hover:bg-[#fef5f6]"
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
                      className={`overflow-x-auto pb-3 -mx-4 px-4 ${isMobile ? 'scrollbar-thin scrollbar-thumb-[#fb7678] scrollbar-track-[#fef5f6]' : ''}`}
                    >
                      <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
                        {visibleGenericList.map((listing) => (
                          <div key={listing.id} className="flex-shrink-0 w-[250px] h-[360px]">
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
                        className="px-6 py-3 bg-[#fb7678] text-white font-semibold rounded-[30px] text-sm font-['Inter'] shadow-md hover:bg-[#fa5d5f] transition-all duration-300"
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
                    className="w-24 h-24 text-[#ababab] mb-4"
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
                  <h3 className="text-lg font-bold text-[#3e2d2e] font-['Inter'] mb-2">
                    No sitters found
                  </h3>
                  <p className="text-sm text-[#6d6d6d] font-['Inter'] mb-6">
                    Try adjusting your search or filters
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="px-6 py-3 bg-[#fb7678] text-white font-semibold rounded-[30px] text-sm font-['Inter'] transition-all duration-300 hover:bg-[#fa5d5f]"
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
