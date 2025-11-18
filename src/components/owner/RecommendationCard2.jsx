import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { calculateDistance, formatDistance } from '@/utils/distanceMatrix';


/**
 * RecommendationCard Component
 * Displays a pet sitter recommendation with profile info, ratings, bio, tags, and CTA
 * Based on recommendationcard.md design specifications
 * Now using Tailwind CSS with horizontal layout
 */
const RecommendationCard2 = ({ listing, onClick, isInWishlist = false, onToggleWishlist, compact = false }) => {
  const { profile } = useAuthStore();
  const {
    title,
    description,
    service_type,
    accepted_pet_types,
    price_per_day,
    price_per_hour,
    city,
    state,
    amenities,
    cover_image_url,
    image_urls,
    profiles,
    sitter_id,
    latitude,
    longitude,
  } = listing;


  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    reviewCount: 0,
    loading: true,
  });

  const [distance, setDistance] = useState(null);
  const [loadingDistance, setLoadingDistance] = useState(false);


  // Fetch review statistics for this sitter
  useEffect(() => {
    const fetchReviewStats = async () => {
      // Use sitter_id from listing, or fallback to profiles.id
      const sitterUserId = sitter_id || profiles?.id;

      if (!sitterUserId) {
        setReviewStats({ averageRating: 0, reviewCount: 0, loading: false });
        return;
      }


      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('rating')
          .eq('sitter_id', sitterUserId)
          .eq('is_visible', true);


        if (error) throw error;


        if (data && data.length > 0) {
          const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
          const avgRating = totalRating / data.length;


          setReviewStats({
            averageRating: Math.round(avgRating * 10) / 10,
            reviewCount: data.length,
            loading: false,
          });
        } else {
          // No reviews - show 0.0 instead of default 5.0
          setReviewStats({ averageRating: 0, reviewCount: 0, loading: false });
        }
      } catch (error) {
        console.error('Error fetching review stats:', error);
        setReviewStats({ averageRating: 0, reviewCount: 0, loading: false });
      }
    };


    fetchReviewStats();
  }, [sitter_id, profiles?.id]);

  // Calculate distance from owner's location to listing location
  useEffect(() => {
    const fetchDistance = async () => {
      // Only calculate if both owner and listing have location coordinates
      const ownerLat = profile?.latitude;
      const ownerLng = profile?.longitude;

      if (!ownerLat || !ownerLng || !latitude || !longitude) {
        setDistance(null);
        return;
      }

      setLoadingDistance(true);
      try {
        const result = await calculateDistance(
          { lat: ownerLat, lng: ownerLng },
          { lat: latitude, lng: longitude }
        );

        if (result) {
          setDistance(result.distance); // distance in meters
        } else {
          setDistance(null);
        }
      } catch (error) {
        console.error('Error calculating distance:', error);
        setDistance(null);
      } finally {
        setLoadingDistance(false);
      }
    };

    fetchDistance();
  }, [profile, latitude, longitude]);


  // Get sitter name
  const sitterName = profiles?.name || 'Pet Sitter';


  // Get location display - use address from listing, or profile location as fallback
  const location = listing.address || profiles?.location || 'Location not specified';


  // Get profile image
  const profileImage = profiles?.avatar_url || cover_image_url || image_urls?.[0];


  // Generate placeholder initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  const hasImage = profileImage && profileImage.trim() !== '';


  // Calculate price display
  const priceDisplay = (() => {
    if (price_per_day) {
      return `$${(price_per_day / 100).toFixed(0)}/day`;
    }
    if (price_per_hour) {
      return `$${(price_per_hour / 100).toFixed(0)}/hour`;
    }
    return 'Price TBD';
  })();


  // Get bio/description
  const bio = description || profiles?.bio || title || 'Experienced pet sitter ready to care for your furry friends!';

  return (
    <article
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-md hover:shadow-lg
        cursor-pointer transition-all duration-300
        hover:-translate-y-0.5
        ${compact ? 'w-full h-full' : 'mx-4 my-3'}
      `}
    >
      {/* Fixed Height Container */}
      <div className="h-full flex flex-col">
        {/* Top Section: Profile Image - Fixed Height */}
        <div className="relative flex-shrink-0 h-[180px]">
          {hasImage ? (
            <img
              src={profileImage}
              alt={sitterName}
              className="w-full h-full rounded-t-2xl object-cover"
              onError={(e) => {
                e.target.classList.add('hidden');
                e.target.nextElementSibling.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`
              w-full h-full rounded-t-2xl
              bg-gradient-to-br from-[#fb7678] to-[#ffa8aa]
              flex items-center justify-center
              text-white font-bold text-4xl
              ${hasImage ? 'hidden' : 'flex'}
            `}
          >
            {getInitials(sitterName)}
          </div>

          {/* Wishlist Heart Button */}
          {onToggleWishlist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(e);
              }}
              className="
                absolute top-2 right-2
                w-8 h-8 rounded-full bg-white
                border-0 shadow-md
                flex items-center justify-center
                cursor-pointer transition-all duration-200
                hover:scale-110
              "
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg
                className="w-4 h-4"
                style={{
                  fill: isInWishlist ? '#fb7678' : 'none',
                  stroke: isInWishlist ? '#fb7678' : '#6d6d6d',
                  strokeWidth: isInWishlist ? 0 : 2,
                }}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Content Section - Flex Grow with Fixed Height */}
        <div className="flex-1 flex flex-col p-3 min-h-0">
          {/* Name and Rating - Fixed Height */}
          <div className="flex justify-between items-start gap-2 mb-2 flex-shrink-0">
            <h3 className="font-bold text-base leading-tight text-black truncate">
              {sitterName}
            </h3>

            {/* Rating Badge */}
            <div className="flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-lg flex-shrink-0">
              <img
                src="/icons/common/star-review-icon.svg"
                alt="Rating"
                className="w-3 h-3"
              />
              <span className="font-normal text-xs">
                {reviewStats.loading ? '...' : reviewStats.averageRating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Location - Fixed Height */}
          <p className="text-xs text-[#909090] mb-2 truncate flex-shrink-0">
            {location}
          </p>

          {/* Bio - Fixed 1 line */}
          <p className="text-xs leading-relaxed text-[#71727a] line-clamp-2 mb-2 flex-shrink-0">
            {bio}
          </p>

          {/* Pet Type Tags */}
          {accepted_pet_types && accepted_pet_types.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2 flex-shrink-0">
              {accepted_pet_types.slice(0, 3).map((petType) => (
                <span
                  key={petType}
                  className="text-[10px] px-1.5 py-0.5 bg-[#fef5f6] text-[#fb7678] rounded-full font-['Inter'] font-semibold"
                >
                  {petType.charAt(0).toUpperCase() + petType.slice(1)}
                </span>
              ))}
              {accepted_pet_types.length > 3 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-[#f5f5f5] text-[#6d6d6d] rounded-full font-['Inter'] font-semibold">
                  +{accepted_pet_types.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Price and Distance - Fixed at bottom */}
          <div className="flex justify-between items-center gap-2 mt-auto flex-shrink-0">
            {/* Price */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <img
                src="/icons/common/money-icon.svg"
                alt="Price"
                className="w-4 h-4 flex-shrink-0"
              />
              <span className="font-bold text-[#fb7678] text-xs truncate">
                {priceDisplay}
              </span>
            </div>

            {/* Distance - Only show if we have distance data */}
            {distance !== null && (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <img
                  src="/icons/common/distance-icon.svg"
                  alt="Distance"
                  className="w-4 h-4 flex-shrink-0"
                />
                <span className="font-bold text-[#fb7678] text-xs truncate">
                  {formatDistance(distance)} Away
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};


RecommendationCard2.propTypes = {
  listing: PropTypes.shape({
    id: PropTypes.string.isRequired,
    sitter_id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    service_type: PropTypes.arrayOf(PropTypes.string),
    accepted_pet_types: PropTypes.arrayOf(PropTypes.string),
    accepted_pet_sizes: PropTypes.arrayOf(PropTypes.string),
    price_per_day: PropTypes.number,
    price_per_hour: PropTypes.number,
    city: PropTypes.string,
    state: PropTypes.string,
    amenities: PropTypes.arrayOf(PropTypes.string),
    cover_image_url: PropTypes.string,
    image_urls: PropTypes.arrayOf(PropTypes.string),
    profiles: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      avatar_url: PropTypes.string,
      bio: PropTypes.string,
      location: PropTypes.string,
    }),
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  isInWishlist: PropTypes.bool,
  onToggleWishlist: PropTypes.func,
  compact: PropTypes.bool,
};


export default RecommendationCard2;
