import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { wishlistService } from '@/services/wishlistService';
import SitterCard from '@/components/owner/SitterCard';
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
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Please log in to view wishlist</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to save your favorite sitters</p>
        <button
          onClick={() => navigate('/owner/profile')}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-xl transition-all"
        >
          Log In
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-600 mt-1">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'saved sitter' : 'saved sitters'}
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-400"
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
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No favorites yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start exploring and save your favorite pet sitters by clicking the heart icon on their listings.
            </p>
            <button
              onClick={() => navigate('/owner/explore')}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Explore Sitters
            </button>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <SitterCard
                key={item.id}
                listing={item.listing}
                onClick={() => handleCardClick(item.listing)}
                isInWishlist={wishlistIds.has(item.listing.id)}
                onToggleWishlist={(e) => handleToggleWishlist(e, item.listing.id)}
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

export default Wishlist;
