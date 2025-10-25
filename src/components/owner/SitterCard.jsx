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
 * @property {Profile} profiles
 */

/**
 * SitterCard Component
 * Displays a pet sitter listing card with key information
 * @param {Object} props
 * @param {Listing} props.listing - The listing data
 * @param {Function} props.onClick - Click handler for the card
 */
const SitterCard = ({ listing, onClick }) => {
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
    profiles,
  } = listing;

  // Get sitter profile info
  const sitterName = profiles?.name || 'Unknown Sitter';
  const sitterAvatar = profiles?.avatar_url;
  const sitterLocation = profiles?.location || (city && state ? `${city}, ${state}` : 'Location not specified');

  // Format service types for display
  const serviceTypesDisplay = service_type?.slice(0, 3).join(', ') || 'No services';

  // Format pet types for display
  const petTypesDisplay = accepted_pet_types?.slice(0, 3).join(', ') || 'No pets';

  // Calculate minimum price for display
  const minPrice = (() => {
    const prices = [];
    if (price_per_day) prices.push(price_per_day / 100);
    if (price_per_hour) prices.push((price_per_hour / 100) * 24); // Convert hourly to daily equivalent
    return prices.length > 0 ? Math.min(...prices) : null;
  })();

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden"
    >
      {/* Card Header - Sitter Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {sitterAvatar ? (
              <img
                src={sitterAvatar}
                alt={sitterName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-semibold text-lg">
                  {sitterName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Sitter Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{sitterName}</h3>
            <p className="text-sm text-gray-600 flex items-center">
              <svg
                className="w-4 h-4 mr-1 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {sitterLocation}
            </p>
          </div>
        </div>
      </div>

      {/* Card Body - Listing Info */}
      <div className="p-4">
        {/* Title */}
        <h4 className="text-base font-semibold text-gray-900 mb-2 line-clamp-1">{title}</h4>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>

        {/* Services */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Services:</p>
          <div className="flex flex-wrap gap-1">
            {service_type?.slice(0, 3).map((service) => (
              <span
                key={service}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium"
              >
                {service}
              </span>
            ))}
            {service_type?.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{service_type.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Accepted Pets */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Accepts:</p>
          <div className="flex flex-wrap gap-1">
            {accepted_pet_types?.slice(0, 3).map((pet) => (
              <span
                key={pet}
                className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium capitalize"
              >
                {pet}
              </span>
            ))}
            {accepted_pet_types?.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{accepted_pet_types.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Amenities */}
        {amenities && amenities.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Amenities:</p>
            <div className="flex flex-wrap gap-1">
              {amenities.slice(0, 2).map((amenity) => (
                <span
                  key={amenity}
                  className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-medium"
                >
                  {amenity.replace(/_/g, ' ')}
                </span>
              ))}
              {amenities.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{amenities.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer - Pricing */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          {minPrice ? (
            <div>
              <span className="text-2xl font-bold text-gray-900">${minPrice.toFixed(0)}</span>
              <span className="text-sm text-gray-600">/day</span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Price upon request</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default SitterCard;
