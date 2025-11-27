import { useState, useEffect } from 'react';
import { useListingStore } from '@/store/listingStore';
import { useAuthStore } from '@/store/authStore';
import { usePetStore } from '@/store/petStore';
import RecommendationCard from '@/components/owner/RecommendationCard';
import ListingDetailModal from '@/components/owner/ListingDetailModal';
import ProfileModal from '@/components/common/ProfileModal';
import { wishlistService } from '@/services/wishlistService';
import { reviewService } from '@/services/reviewService';
import { calculateDistance } from '@/utils/helpers';
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
  const [showSearchModal, setShowSearchModal] = useState(false); // Search popup modal
  const [selectedListing, setSelectedListing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [profileUserId, setProfileUserId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [visibleGenericListings, setVisibleGenericListings] = useState(10);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [enrichedListings, setEnrichedListings] = useState([]);

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

  // Enrich listings with review data and distance, then sort
  useEffect(() => {
    const enrichListings = async () => {
      if (!listings || listings.length === 0) {
        setEnrichedListings([]);
        return;
      }

      try {
        // Extract unique sitter IDs
        const sitterIds = [...new Set(listings.map(listing => listing.sitter_id))];

        // Fetch review statistics for all sitters
        const reviewStatsMap = await reviewService.getBatchRatingStats(sitterIds);

        // Get user's location (from profile)
        const userLat = user?.latitude;
        const userLon = user?.longitude;

        // Enrich each listing with review data and distance
        const enriched = listings.map(listing => {
          const stats = reviewStatsMap.get(listing.sitter_id) || {
            averageRating: 0,
            totalReviews: 0,
          };

          // Calculate distance if both user and listing have coordinates
          let distance = Infinity; // Default to infinity if no coordinates
          if (userLat && userLon && listing.latitude && listing.longitude) {
            distance = calculateDistance(userLat, userLon, listing.latitude, listing.longitude);
          }

          return {
            ...listing,
            averageRating: stats.averageRating,
            totalReviews: stats.totalReviews,
            distance,
          };
        });

        // Sort by average rating (descending), then by distance (ascending)
        enriched.sort((a, b) => {
          // First, sort by average rating (higher is better)
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          // If ratings are equal, sort by distance (closer is better)
          return a.distance - b.distance;
        });

        setEnrichedListings(enriched);
      } catch (error) {
        console.error('Error enriching listings:', error);
        // Fallback to original listings if enrichment fails
        setEnrichedListings(listings);
      }
    };

    enrichListings();
  }, [listings, user]);

  // Handle AI-powered search
  // Handle search - now opens the search modal with pet filters
  const handleSearchClick = () => {
    setShowSearchModal(true);
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

    // Date range filter - check if listing is available during the requested dates
    if (filters.dateRange.start && filters.dateRange.end) {
      const requestStart = new Date(filters.dateRange.start);
      const requestEnd = new Date(filters.dateRange.end);

      filtered = filtered.filter(listing => {
        // If listing has availability data, check against it
        // For now, we'll include all listings as we don't have availability tracking yet
        // TODO: Implement proper availability checking once availability table is set up
        return true;
      });
    }

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
    if (filters.selectedPets.length > 0) {
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
    const speciesListings = enrichedListings.filter(listing => {
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
    const genericList = enrichedListings.filter(listing => !petRecommendationIds.has(listing.id));
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
            <div className="flex gap-2">
              <div
                className="flex-1 relative cursor-pointer"
                onClick={handleSearchClick}
              >
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#909090] pointer-events-none"
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
                  readOnly
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-[24px] bg-white text-sm font-['Inter'] focus:outline-none focus:border-[#fb7678] cursor-pointer"
                />
              </div>
            </div>
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
                        [Web Experiment] Recommended for {petNames}
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
                            <div key={listing.id} className="flex-shrink-0 w-[360px] h-[180px]">
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
              {enrichedListings.length === 0 && (
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

        {/* Search by Pet Modal */}
        {showSearchModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 backdrop-blur-md bg-opacity-50"
              onClick={() => setShowSearchModal(false)}
            />

            {/* Modal Content - Bottom Sheet on Mobile, Centered on Desktop */}
            <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 rounded-t-3xl sm:rounded-t-3xl z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#3e2d2e] font-['Inter']">
                    Search by Filter
                  </h2>
                  <button
                    onClick={() => setShowSearchModal(false)}
                    className="text-[#6d6d6d] hover:text-[#fb7678] transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-5">
                {/* Pet Selection */}
                <div>
                  <label className="block text-base font-bold text-[#3e2d2e] font-['Inter'] mb-1">
                    Select Your Pets
                  </label>
                  <p className="text-xs text-[#6d6d6d] font-['Inter'] mb-3">
                    Choose which pets need a sitter
                  </p>

                  {pets && pets.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {pets.map(pet => {
                        const getPetImage = (species) => {
                          const speciesLower = species?.toLowerCase() || 'dog';
                          const imageMap = {
                            'dog': '/images/pet-boarding-dog-image.jpg',
                            'cat': '/images/pet-boarding-cat-image.jpg',
                            'bird': '/images/pet-boarding-bird-image.jpg',
                            'rabbit': '/images/pet-boarding-rabbit-image.jpg',
                            'hamster': '/images/pet-boarding-hamster-image.jpg',
                          };
                          return imageMap[speciesLower] || imageMap['dog'];
                        };

                        return (
                          <div
                            key={pet.id}
                            onClick={() => togglePetSelection(pet.id)}
                            className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                              filters.selectedPets.includes(pet.id)
                                ? 'ring-2 ring-[#fb7678] shadow-lg'
                                : 'ring-1 ring-gray-200 hover:ring-2 hover:ring-[#fb7678]'
                            }`}
                          >
                            {/* Pet Image */}
                            <div className="relative h-32 bg-gray-100">
                              <img
                                src={getPetImage(pet.species)}
                                alt={pet.name}
                                className="w-full h-full object-cover"
                              />
                              {/* Checkbox Overlay */}
                              <div className="absolute top-2 right-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                                  filters.selectedPets.includes(pet.id)
                                    ? 'bg-[#fb7678] border-2 border-white shadow-md'
                                    : 'bg-white border-2 border-gray-300'
                                }`}>
                                  {filters.selectedPets.includes(pet.id) && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Pet Info */}
                            <div className={`p-3 ${
                              filters.selectedPets.includes(pet.id) ? 'bg-[#fef5f6]' : 'bg-white'
                            }`}>
                              <h4 className="font-bold text-sm text-[#3e2d2e] font-['Inter'] truncate mb-0.5">
                                {pet.name}
                              </h4>
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-xs px-2 py-0.5 bg-[#fb7678] text-white rounded-full font-['Inter'] font-semibold">
                                  {pet.species}
                                </span>
                                {pet.age && (
                                  <span className="text-xs text-[#6d6d6d] font-['Inter']">
                                    {pet.age}y
                                  </span>
                                )}
                              </div>
                              {pet.breed && (
                                <p className="text-xs text-[#6d6d6d] font-['Inter'] truncate">
                                  {pet.breed}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <div className="text-4xl mb-2">🐾</div>
                      <p className="text-sm text-[#6d6d6d] font-['Inter'] font-semibold mb-1">
                        No pets added yet
                      </p>
                      <p className="text-xs text-[#909090] font-['Inter']">
                        Add pets to your profile to use this filter
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Date Range Filter */}
                <div>
                  <label className="block text-base font-bold text-[#3e2d2e] font-['Inter'] mb-1">
                    Date Range
                  </label>
                  <p className="text-xs text-[#6d6d6d] font-['Inter'] mb-3">
                    Select check-in and check-out dates
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#6d6d6d] font-['Inter'] mb-1.5">
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
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl font-['Inter'] text-sm focus:outline-none focus:ring-2 focus:ring-[#fb7678] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6d6d6d] font-['Inter'] mb-1.5">
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
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl font-['Inter'] text-sm focus:outline-none focus:ring-2 focus:ring-[#fb7678] focus:border-transparent"
                      />
                    </div>
                  </div>
                  {filters.dateRange.start && filters.dateRange.end && (
                    <div className="mt-3 flex items-center justify-center gap-2 py-2 bg-[#fef5f6] rounded-lg">
                      <svg className="w-4 h-4 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-[#fb7678] font-['Inter']">
                        {Math.ceil((new Date(filters.dateRange.end) - new Date(filters.dateRange.start)) / (1000 * 60 * 60 * 24))} night(s)
                      </span>
                    </div>
                  )}
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-base font-bold text-[#3e2d2e] font-['Inter'] mb-1">
                    Price Range
                  </label>
                  <p className="text-xs text-[#6d6d6d] font-['Inter'] mb-3">
                    Set your budget
                  </p>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, type: 'day' } }))}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold font-['Inter'] transition-all duration-200 ${
                        filters.priceRange.type === 'day'
                          ? 'bg-[#fb7678] text-white shadow-md'
                          : 'bg-[#f5f5f5] text-[#737373] hover:bg-gray-300'
                      }`}
                    >
                      Per Day
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, type: 'hour' } }))}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold font-['Inter'] transition-all duration-200 ${
                        filters.priceRange.type === 'hour'
                          ? 'bg-[#fb7678] text-white shadow-md'
                          : 'bg-[#f5f5f5] text-[#737373] hover:bg-gray-300'
                      }`}
                    >
                      Per Hour
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Min $"
                      value={filters.priceRange.min}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, min: e.target.value }
                      }))}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-['Inter'] text-sm focus:outline-none focus:ring-2 focus:ring-[#fb7678] focus:border-transparent"
                    />
                    <span className="text-[#909090] font-bold">—</span>
                    <input
                      type="number"
                      placeholder="Max $"
                      value={filters.priceRange.max}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, max: e.target.value }
                      }))}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-['Inter'] text-sm focus:outline-none focus:ring-2 focus:ring-[#fb7678] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Services Filter */}
                <div>
                  <label className="block text-base font-bold text-[#3e2d2e] font-['Inter'] mb-1">
                    Services Needed
                  </label>
                  <p className="text-xs text-[#6d6d6d] font-['Inter'] mb-3">
                    What type of care do you need?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['boarding', 'daycare', 'drop_in', 'house_sitting', 'dog_walking'].map(service => (
                      <button
                        key={service}
                        onClick={() => toggleService(service)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold font-['Inter'] transition-all duration-200 ${
                          filters.services.includes(service)
                            ? 'bg-[#fb7678] text-white shadow-md'
                            : 'bg-[#f5f5f5] text-[#737373] hover:bg-gray-300'
                        }`}
                      >
                        {service.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities Filter */}
                <div>
                  <label className="block text-base font-bold text-[#3e2d2e] font-['Inter'] mb-1">
                    Preferred Amenities
                  </label>
                  <p className="text-xs text-[#6d6d6d] font-['Inter'] mb-3">
                    Special features you'd like
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['fenced_yard', 'air_conditioning', 'pool', 'pet_camera', 'first_aid_trained', 'non_smoking'].map(amenity => (
                      <button
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold font-['Inter'] transition-all duration-200 ${
                          filters.amenities.includes(amenity)
                            ? 'bg-[#fb7678] text-white shadow-md'
                            : 'bg-[#f5f5f5] text-[#737373] hover:bg-gray-300'
                        }`}
                      >
                        {amenity.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="sticky bottom-0 -mx-5 -mb-5 p-5 bg-white border-t border-gray-200 flex gap-3">
                  <button
                    onClick={handleClearFilters}
                    className="px-6 py-3.5 bg-white border-2 border-[#fb7678] text-[#fb7678] font-bold rounded-full text-sm font-['Inter'] transition-all duration-300 hover:bg-[#fef5f6]"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => {
                      handleApplyFilters();
                      setShowSearchModal(false);
                    }}
                    className="flex-1 px-6 py-3.5 bg-[#fb7678] text-white font-bold rounded-full text-sm font-['Inter'] transition-all duration-300 hover:bg-[#fa5d5f] shadow-lg"
                  >
                    Show Results
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Explore;
