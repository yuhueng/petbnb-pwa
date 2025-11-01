/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} name
 * @property {string} avatar_url
 * @property {string} bio
 * @property {string} location
 */

/**
 * @typedef {Object} Listing
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string[]} service_type
 * @property {string[]} accepted_pet_types
 * @property {string[]} accepted_pet_sizes
 * @property {number} price_per_day
 * @property {number} price_per_hour
 * @property {string} city
 * @property {string} state
 * @property {string[]} amenities
 * @property {string} cover_image_url
 * @property {string[]} image_urls
 * @property {Profile} profiles
 */

/**
 * SitterCard Component - Airbnb Style
 * Displays a pet sitter listing card with large image and minimal info
 * @param {Object} props
 * @param {Listing} props.listing - The listing data
 * @param {Function} props.onClick - Click handler for the card
 * @param {boolean} props.isInWishlist - Whether listing is in wishlist
 * @param {Function} props.onToggleWishlist - Handler for wishlist toggle
 */
const SitterCard = ({ listing, onClick, isInWishlist = false, onToggleWishlist }) => {
  const {
    title,
    service_type,
    price_per_day,
    price_per_hour,
    city,
    state,
    cover_image_url,
    image_urls,
    profiles,
  } = listing;

  // Get location for display
  const location = city && state ? `${city}, ${state}` : profiles?.location || 'Location not specified';

  // Get primary service (first one)
  const primaryService = service_type?.[0]?.replace(/_/g, ' ') || 'Pet Care';

  // Calculate price display (prefer daily rate)
  const priceDisplay = (() => {
    if (price_per_day) {
      return {
        value: (price_per_day / 100).toFixed(0),
        unit: 'day',
      };
    }
    if (price_per_hour) {
      return {
        value: (price_per_hour / 100).toFixed(0),
        unit: 'hour',
      };
    }
    return null;
  })();

  // Determine which image to use (priority: cover_image_url > first gallery image > sitter avatar > placeholder)
  const cardImage = cover_image_url || image_urls?.[0] || profiles?.avatar_url;

  // Generate placeholder based on service type if no image
  const getPlaceholderGradient = () => {
    const gradients = {
      boarding: 'from-blue-400 to-indigo-600',
      daycare: 'from-green-400 to-emerald-600',
      walking: 'from-amber-400 to-orange-600',
      grooming: 'from-purple-400 to-pink-600',
      default: 'from-gray-400 to-gray-600',
    };
    return gradients[service_type?.[0]] || gradients.default;
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
          {cardImage ? (
            <img
              src={cardImage}
              alt={title || 'Pet sitting service'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                // Fallback to gradient on image error
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}

          {/* Placeholder gradient (shown if no image or image fails) */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${getPlaceholderGradient()} flex items-center justify-center ${
              cardImage ? 'hidden' : 'flex'
            }`}
            style={{ display: cardImage ? 'none' : 'flex' }}
          >
            <svg className="w-16 h-16 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

          {/* Wishlist Heart Button */}
          {onToggleWishlist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(e);
              }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center group/heart"
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg
                className={`w-5 h-5 transition-all duration-200 ${
                  isInWishlist
                    ? 'fill-red-500 text-red-500 scale-110'
                    : 'fill-none text-gray-700 group-hover/heart:text-red-500 group-hover/heart:scale-110'
                }`}
                stroke="currentColor"
                strokeWidth={isInWishlist ? 0 : 2}
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

        {/* Info Section */}
        <div className="p-3">
          {/* Location */}
          <div className="flex items-start justify-between gap-1 mb-0.5">
            <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">
              {location}
            </h3>
          </div>

          {/* Title - truncated */}
          <p className="text-sm text-gray-600 truncate mb-0.5">
            {title || 'Pet sitting service'}
          </p>

          {/* Service Type */}
          <p className="text-sm text-gray-500 capitalize mb-1">
            {primaryService}
          </p>

          {/* Price */}
          <div className="mt-2">
            {priceDisplay ? (
              <p className="text-sm">
                <span className="font-semibold text-gray-900">${priceDisplay.value}</span>
                <span className="text-gray-600"> / {priceDisplay.unit}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-500">Price upon request</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SitterCard;
