import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { wishlistService } from '@/services/wishlistService';
import ListingDetailModal from '@/components/owner/ListingDetailModal';
import ProfileModal from '@/components/common/ProfileModal';
import toast from 'react-hot-toast';

const Wishlist = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadWishlist();
    }
  }, [user?.id]);

  const loadWishlist = async () => {
    try {
      setIsLoading(true);
      const result = await wishlistService.getWishlist(user.id);
      if (result.success) {
        setWishlistItems(result.data);
        // Build Set of listing IDs for quick lookup
        const ids = new Set(result.data.map((item) => item.listing.id));
        setWishlistIds(ids);
      } else {
        toast.error('Failed to load wishlist');
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWishlist = async (e, listingId) => {
    e.stopPropagation();

    try {
      const result = await wishlistService.toggleWishlist(user.id, listingId);

      if (result.success) {
        if (result.isInWishlist) {
          // Added to wishlist (shouldn't happen on this page)
          setWishlistIds((prev) => new Set([...prev, listingId]));
        } else {
          // Removed from wishlist
          setWishlistIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(listingId);
            return newSet;
          });
          // Remove from displayed items
          setWishlistItems((prev) => prev.filter((item) => item.listing.id !== listingId));
        }

        // Show toast after state updates
        if (result.isInWishlist) {
          toast.success('Added to wishlist! ❤️');
        } else {
          toast.success('Removed from wishlist');
        }
      } else {
        toast.error('Failed to update wishlist');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const handleCardClick = (listing) => {
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
        <h2 className="text-2xl font-bold text-[#3e2d2e] mb-3">Please log in to view wishlist</h2>
        <p className="text-[#6d6d6d] mb-6">You need to be logged in to save your favorite sitters</p>
        <button
          onClick={() => navigate('/owner/profile')}
          className="px-6 py-3 bg-[#fb7678] text-white rounded-lg font-medium hover:bg-[#fa6568] transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fef5f6]">
      {/* Mobile-First Container - 393px max width */}
      <div className="max-w-[393px] mx-auto px-[22px] py-[82px] pb-[50px]">
        {/* Page Header */}
        <header className="flex justify-center items-center gap-[66px] mb-[22px]">
          <h1 className="text-[20px] font-semibold leading-[1.2] text-[#3e2d2e] m-0">
            My Wishlist
          </h1>
        </header>

        {/* Main Content */}
        <main>
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fb7678]"></div>
            </div>
          )}

          {/* Your Wishlist Section */}
          {!isLoading && (
            <section>
              <h2 className="text-[18px] font-semibold leading-[1.2] text-[#3e2d2e] mb-[12px] m-0">
                Your Favorites
              </h2>

              {/* Empty State */}
              {wishlistItems.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-[#7d7d7d] mx-auto mb-4"
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
                  <p className="text-[#7d7d7d] text-sm mb-2">No favorites yet</p>
                  <p className="text-[#7d7d7d] text-xs mt-2 mb-4">
                    Start exploring and click the heart to save sitters
                  </p>
                  <button
                    onClick={() => navigate('/owner/explore')}
                    className="px-6 py-2 bg-[#fb7678] text-white text-sm rounded-[20px] hover:bg-[#fa6568] transition-colors"
                  >
                    Explore Sitters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-[10px]">
                  {wishlistItems.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-col group cursor-pointer px-1 pt-1 pb-3 rounded-[10px] bg-white"
                      onClick={() => handleCardClick(item.listing)}
                    >
                      {/* Listing Image */}
                      {item.listing.cover_image_url || item.listing.image_urls?.[0] ? (
                        <div className="relative">
                          <img
                            src={item.listing.cover_image_url || item.listing.image_urls?.[0]}
                            alt={item.listing.title}
                            className="w-full h-[139px] rounded-[10px] object-cover shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]"
                          />
                          {/* Remove from Wishlist Button */}
                          <button
                            onClick={(e) => handleToggleWishlist(e, item.listing.id)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                            aria-label="Remove from wishlist"
                          >
                            <svg className="w-5 h-5 text-[#fb7678]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="relative w-full h-[139px] rounded-[10px] bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)] flex items-center justify-center">
                          <svg className="w-12 h-12 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          {/* Remove from Wishlist Button */}
                          <button
                            onClick={(e) => handleToggleWishlist(e, item.listing.id)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                            aria-label="Remove from wishlist"
                          >
                            <svg className="w-5 h-5 text-[#fb7678]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Listing Info */}
                      <div className="pt-[6px] flex flex-col gap-[3px] p-1">
                        <h3 className="text-[12px] font-semibold leading-[1.2] text-[#3e2d2e] m-0 line-clamp-1">
                          {item.listing.title || 'Pet Sitting Service'}
                        </h3>
                        {item.listing.city && item.listing.state && (
                          <p className="text-[10px] font-semibold leading-[1.2] text-[#7d7d7d] m-0">
                            {item.listing.city}, {item.listing.state}
                          </p>
                        )}
                        {(item.listing.price_per_day || item.listing.price_per_hour) && (
                          <p className="text-[10px] font-semibold leading-[1.2] text-[#fb7678] m-0">
                            {item.listing.price_per_day
                              ? `$${(item.listing.price_per_day / 100).toFixed(0)}/day`
                              : `$${(item.listing.price_per_hour / 100).toFixed(0)}/hour`}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        {/* Responsive behavior for extra small screens */}
        <style jsx>{`
          @media (max-width: 380px) {
            .grid-cols-2 {
              grid-template-columns: 1fr;
              justify-items: center;
            }
            article {
              max-width: 250px;
            }
          }
        `}</style>
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

export default Wishlist;
