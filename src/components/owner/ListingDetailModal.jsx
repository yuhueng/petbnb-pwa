import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePetStore } from '@/store/petStore';
import { chatService } from '@/services/chatService';
import { bookingService } from '@/services/bookingService';
import { supabase } from '@/services/supabase';
import toast from 'react-hot-toast';

/**
 * ListingDetailModal Component
 * Bottom sheet modal showing full details of a pet sitter listing
 * Follows recommendation-popup design system
 */
const ListingDetailModal = ({ listing, isOpen, onClose, onProfileClick }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { pets, fetchPets, isLoading: petsLoading } = usePetStore();
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showNoPetsModal, setShowNoPetsModal] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: [
      { stars: 5, count: 0 },
      { stars: 4, count: 0 },
      { stars: 3, count: 0 },
      { stars: 2, count: 0 },
      { stars: 1, count: 0 },
    ],
  });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    startDate: '',
    endDate: '',
    specialRequests: '',
    selectedPetIds: [],
  });

  // Fetch pets when modal opens and user is authenticated
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchPets(user.id);
    }
  }, [isOpen, user?.id, fetchPets]);

  // Fetch reviews when modal opens
  useEffect(() => {
    const fetchReviews = async () => {
      if (!isOpen || !listing?.profiles?.id) return;

      setLoadingReviews(true);
      try {
        // Fetch reviews for this sitter
        const { data: reviewsData, error } = await supabase
          .from('reviews')
          .select(`
            *,
            reviewer:profiles!reviewer_id(
              id,
              name,
              avatar_url
            )
          `)
          .eq('sitter_id', listing.profiles.id)
          .eq('is_visible', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setReviews(reviewsData || []);

        // Calculate statistics
        if (reviewsData && reviewsData.length > 0) {
          const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
          const avgRating = totalRating / reviewsData.length;

          // Calculate rating breakdown
          const breakdown = [
            { stars: 5, count: reviewsData.filter(r => r.rating === 5).length },
            { stars: 4, count: reviewsData.filter(r => r.rating === 4).length },
            { stars: 3, count: reviewsData.filter(r => r.rating === 3).length },
            { stars: 2, count: reviewsData.filter(r => r.rating === 2).length },
            { stars: 1, count: reviewsData.filter(r => r.rating === 1).length },
          ];

          setReviewStats({
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews: reviewsData.length,
            ratingBreakdown: breakdown,
          });
        } else {
          // No reviews - set defaults
          setReviewStats({
            averageRating: 0,
            totalReviews: 0,
            ratingBreakdown: [
              { stars: 5, count: 0 },
              { stars: 4, count: 0 },
              { stars: 3, count: 0 },
              { stars: 2, count: 0 },
              { stars: 1, count: 0 },
            ],
          });
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast.error('Failed to load reviews');
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [isOpen, listing?.profiles?.id]);

  // Reset closing state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  if (!isOpen || !listing) return null;

  const {
    title,
    description,
    service_type,
    accepted_pet_types,
    accepted_pet_sizes,
    price_per_day,
    price_per_hour,
    max_pets,
    city,
    state,
    address,
    postal_code,
    latitude,
    longitude,
    amenities,
    house_rules,
    cancellation_policy,
    available_from,
    available_to,
    profiles,
  } = listing;

  const sitterName = profiles?.name || 'Unknown Sitter';
  const sitterAvatar = profiles?.avatar_url;
  const sitterBio = profiles?.bio;
  const sitterLocation = address || profiles?.location || 'Location not specified';

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setShowBookingForm(false);
    }, 300);
  };

  // Handle message sitter
  const handleMessageSitter = async () => {
    if (!user) {
      toast.error('Please log in to message sitters');
      return;
    }

    setIsStartingConversation(true);
    try {
      // Create/get conversation with sitter
      const conversation = await chatService.getOrCreateConversationExplicit(
        user.id,
        profiles.id
      );

      // Navigate to messages with the conversation
      navigate('/owner/messages', { state: { conversationId: conversation.id } });
      handleClose();
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to open chat. Please try again.');
    } finally {
      setIsStartingConversation(false);
    }
  };

  // Handle book now
  const handleBookNow = () => {
    if (!user) {
      toast.error('Please log in to book a sitter');
      return;
    }

    // Check if user has pets
    if (!pets || pets.length === 0) {
      setShowNoPetsModal(true);
      return;
    }

    setShowBookingForm(true);
  };

  // Handle booking submission
  const handleSubmitBooking = async () => {
    if (!bookingForm.startDate || !bookingForm.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    if (bookingForm.selectedPetIds.length === 0) {
      toast.error('Please select at least one pet');
      return;
    }

    setIsCreatingBooking(true);
    try {
      const bookingData = {
        listing_id: listing.id,
        pet_owner_id: user.id,
        pet_sitter_id: profiles.id,
        pet_ids: bookingForm.selectedPetIds,
        start_date: bookingForm.startDate,
        end_date: bookingForm.endDate,
        special_requests: bookingForm.specialRequests,
        status: 'pending',
      };

      const result = await bookingService.createBooking(bookingData);

      if (result.success) {
        toast.success('Booking request sent successfully!');
        handleClose();
        navigate('/owner/bookings');
      } else {
        toast.error(result.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setIsCreatingBooking(false);
    }
  };

  // Format review date
  const formatReviewDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  // Amenities icons mapping
  const amenityIcons = {
    'house_sitting': '🏠',
    'dog_walking': '🚶',
    'pet_boarding': '🛏️',
    'pet_sitting': '🐕',
    'cat_sitting': '🐈',
    'home_visits': '🏡',
    'doggy_daycare': '☀️',
    'pet_transport': '🚗',
  };

  return (
    <>
      {/* Modal Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[1000] transition-opacity duration-300 ${
          isOpen && !isClosing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Modal Container - Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 w-full max-w-[600px] mx-auto max-h-[90vh] bg-white rounded-t-[20px] shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-[1001] overflow-y-auto transition-transform duration-400 ${
          isOpen && !isClosing
            ? 'translate-y-0'
            : 'translate-y-full'
        }`}
        style={{
          animation: isOpen && !isClosing
            ? 'slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            : isClosing
            ? 'slideDown 0.3s ease-out'
            : 'none',
        }}
      >
        {/* Drag Handle */}
        <div className="sticky top-0 z-10 bg-white pt-3 pb-2 flex justify-center rounded-t-[20px]">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="modal-content">
          {/* 1. Profile Header with Hero Image */}
          <div className="relative h-[220px] overflow-hidden">
            {sitterAvatar ? (
              <img
                src={sitterAvatar}
                alt={sitterName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] flex items-center justify-center">
                <span className="text-6xl text-white font-bold">
                  {sitterName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Profile Overlay */}
            <div
              className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/70 to-transparent text-white"
            >
              <h2 className="text-2xl font-bold leading-tight mb-1">{sitterName}</h2>
              <p className="text-sm opacity-90 mb-2">{sitterLocation}</p>
              <p className="text-base font-semibold">
                ${price_per_day}/day {price_per_hour && `• $${price_per_hour}/hour`}
              </p>
            </div>
          </div>

          {/* 2. Rating & Review Stats Section */}
          <div className="p-5 border-b border-[#e9e9e9]">
            {loadingReviews ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fb7678]"></div>
              </div>
            ) : reviewStats.totalReviews > 0 ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-[32px] font-bold text-[#1d1a20]">{reviewStats.averageRating.toFixed(1)}</div>
                  <div className="flex flex-col gap-1">
                    <div className="text-[#fb7678] text-base tracking-wider">★★★★★</div>
                    <span className="text-[13px] text-[#6f6f6f]">({reviewStats.totalReviews} reviews)</span>
                  </div>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-2">
                  {reviewStats.ratingBreakdown.map((item) => {
                    const percentage = reviewStats.totalReviews > 0 ? (item.count / reviewStats.totalReviews) * 100 : 0;
                    return (
                      <div key={item.stars} className="flex items-center gap-2 text-[13px]">
                        <span className="text-[#494a50] font-semibold min-w-[60px]">{item.stars}★</span>
                        <div className="flex-1 h-[6px] bg-[rgba(251,118,120,0.4)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#bb3739] transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[#6f6f6f] min-w-[40px] text-right">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">⭐</div>
                <p className="text-sm text-[#6f6f6f]">No reviews yet</p>
                <p className="text-xs text-[#909090] mt-1">Be the first to review this sitter</p>
              </div>
            )}
          </div>

          {/* 3. Reviews Section */}
          <div className="p-5 border-b border-[#e9e9e9]">
            <h3 className="text-lg font-semibold text-[#1d1a20] mb-4">Latest Reviews</h3>
            {loadingReviews ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fb7678]"></div>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-[#fef5f6] p-3 rounded-lg border border-[#e9e9e9]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {review.reviewer?.avatar_url ? (
                        <img
                          src={review.reviewer.avatar_url}
                          alt={review.reviewer.name || 'Reviewer'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] flex items-center justify-center text-white text-xs font-bold">
                          {(review.reviewer?.name || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-[13px] font-semibold text-[#1d1a20]">
                          {review.reviewer?.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-[#6f6f6f]">{formatReviewDate(review.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-[#fb7678] text-xs mb-1.5 tracking-wide">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                    <p className="text-[13px] leading-relaxed text-[#494a50] line-clamp-3">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm text-[#6f6f6f]">No reviews yet</p>
              </div>
            )}
          </div>

          {/* 4. Amenities & Services Section */}
          <div className="p-5 border-b border-[#e9e9e9]">
            <h3 className="text-lg font-semibold text-[#1d1a20] mb-3">Services Offered</h3>
            <div className="grid grid-cols-3 gap-3">
              {service_type && service_type.map((service, index) => (
                <div key={index} className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#fef5f6] rounded-lg text-xl">
                    {amenityIcons[service] || '🐾'}
                  </div>
                  <span className="text-xs font-semibold text-[#494a50]">
                    {service.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </div>
              ))}
            </div>

            {amenities && amenities.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-[#1d1a20] mb-3 mt-5">Amenities</h3>
                <div className="grid grid-cols-3 gap-3">
                  {amenities.slice(0, 6).map((amenity, index) => (
                    <div key={index} className="flex flex-col items-center text-center gap-2">
                      <div className="w-10 h-10 flex items-center justify-center bg-[#fef5f6] rounded-lg text-xl">
                        {amenityIcons[amenity] || '✓'}
                      </div>
                      <span className="text-xs font-semibold text-[#494a50]">
                        {amenity.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 5. Map Section */}
          <div className="p-5 border-b border-[#e9e9e9]">
            <h3 className="text-lg font-semibold text-[#1d1a20] mb-3">Location</h3>
            <p className="text-sm opacity-90 mb-2">Address: {sitterLocation}</p>
            <div className="h-[250px] border-b border-[#e9e9e9] bg-gray-100">
              {latitude && longitude ? (
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${latitude},${longitude}&region=sg&zoom=15`}
                  allowFullScreen
                  loading="lazy"
                  title="Listing Location Map"
                />
              ) : address ? (
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(address)}&region=sg&zoom=15`}
                  allowFullScreen
                  loading="lazy"
                  title="Listing Location Map"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📍</div>
                    <p className="text-sm text-gray-600 font-medium">{sitterLocation}</p>
                    <p className="text-xs text-gray-500 mt-1">Location not available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 6. Additional Details Section */}
          {(description || house_rules) && (
            <div className="p-5 border-b border-[#e9e9e9]">
              {description && (
                <>
                  <h3 className="text-lg font-semibold text-[#1d1a20] mb-2">About</h3>
                  <p className="text-sm text-[#494a50] leading-relaxed mb-4">{description}</p>
                </>
              )}
              {house_rules && (
                <>
                  <h3 className="text-lg font-semibold text-[#1d1a20] mb-2">House Rules</h3>
                  <p className="text-sm text-[#494a50] leading-relaxed">{house_rules}</p>
                </>
              )}
            </div>
          )}

          {/* 7. Action Buttons */}
          <div className="p-5 flex gap-3">
            <button
              onClick={handleBookNow}
              disabled={isCreatingBooking}
              className="flex-1 bg-[#fb7678] text-white py-3.5 px-5 rounded-lg text-[15px] font-semibold hover:bg-[#fa5d5f] active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingBooking ? 'Processing...' : 'Book Now'}
            </button>
            <button
              onClick={handleMessageSitter}
              disabled={isStartingConversation}
              className="flex-1 bg-[#fef5f6] text-[#fb7678] border-2 border-[#fb7678] py-3 px-5 rounded-lg text-[15px] font-semibold hover:bg-[rgba(251,118,120,0.1)] active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStartingConversation ? 'Opening...' : 'Message'}
            </button>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/60 z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-[#1d1a20] mb-4">Book {sitterName}</h2>

            {/* Date Selection */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#494a50] mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={bookingForm.startDate}
                onChange={(e) => setBookingForm({ ...bookingForm, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-[#e9e9e9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#494a50] mb-2">
                End Date
              </label>
              <input
                type="date"
                value={bookingForm.endDate}
                onChange={(e) => setBookingForm({ ...bookingForm, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-[#e9e9e9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678]"
              />
            </div>

            {/* Pet Selection */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#494a50] mb-2">
                Select Pets
              </label>
              <div className="space-y-2">
                {pets.map((pet) => (
                  <label key={pet.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bookingForm.selectedPetIds.includes(pet.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBookingForm({
                            ...bookingForm,
                            selectedPetIds: [...bookingForm.selectedPetIds, pet.id],
                          });
                        } else {
                          setBookingForm({
                            ...bookingForm,
                            selectedPetIds: bookingForm.selectedPetIds.filter((id) => id !== pet.id),
                          });
                        }
                      }}
                      className="w-4 h-4 text-[#fb7678] focus:ring-[#fb7678]"
                    />
                    <span className="text-sm text-[#494a50]">{pet.name} ({pet.species})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Special Requests */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#494a50] mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                value={bookingForm.specialRequests}
                onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-[#e9e9e9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678] resize-none"
                placeholder="Any special instructions..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowBookingForm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitBooking}
                disabled={isCreatingBooking}
                className="flex-1 px-4 py-2 bg-[#fb7678] text-white rounded-lg font-semibold hover:bg-[#fa5d5f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingBooking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Pets Modal */}
      {showNoPetsModal && (
        <div className="fixed inset-0 bg-black/60 z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="text-6xl mb-4">🐾</div>
            <h2 className="text-xl font-bold text-[#1d1a20] mb-2">No Pets Found</h2>
            <p className="text-sm text-[#494a50] mb-6">
              You need to add at least one pet to your profile before booking a sitter.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNoPetsModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNoPetsModal(false);
                  handleClose();
                  navigate('/owner/profile');
                }}
                className="flex-1 px-4 py-2 bg-[#fb7678] text-white rounded-lg font-semibold hover:bg-[#fa5d5f] transition-colors"
              >
                Add Pet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ListingDetailModal;
