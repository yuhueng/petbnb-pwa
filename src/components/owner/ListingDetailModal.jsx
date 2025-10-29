import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { chatService } from '@/services/chatService';

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
 * @property {number} max_pets
 * @property {string} city
 * @property {string} state
 * @property {string} address
 * @property {string} postal_code
 * @property {string[]} amenities
 * @property {string} house_rules
 * @property {string} cancellation_policy
 * @property {string} available_from
 * @property {string} available_to
 * @property {Profile} profiles
 */

/**
 * ListingDetailModal Component
 * Shows full details of a pet sitter listing
 * @param {Object} props
 * @param {Listing} props.listing - The listing data
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 */
const ListingDetailModal = ({ listing, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isStartingConversation, setIsStartingConversation] = useState(false);

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
  const sitterLocation = profiles?.location || (city && state ? `${city}, ${state}` : 'Location not specified');

  // Handle start conversation
  const handleStartConversation = async () => {
    if (!user) {
      alert('Please log in to start a conversation');
      navigate('/login');
      return;
    }

    setIsStartingConversation(true);
    try {
      // Get or create conversation between current user and sitter
      const conversation = await chatService.getOrCreateConversation(user.id, profiles.id);

      console.log('✅ Conversation created/found:', conversation.id);

      // Navigate to messages page
      navigate('/owner/messages', { state: { conversationId: conversation.id } });
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setIsStartingConversation(false);
    }
  };

  // Format price display
  const priceDisplay = (() => {
    const parts = [];
    if (price_per_day) {
      parts.push(`$${(price_per_day / 100).toFixed(2)}/day`);
    }
    if (price_per_hour) {
      parts.push(`$${(price_per_hour / 100).toFixed(2)}/hour`);
    }
    return parts.length > 0 ? parts.join(' or ') : 'Contact for pricing';
  })();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Header - Sitter Info */}
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {sitterAvatar ? (
                  <img
                    src={sitterAvatar}
                    alt={sitterName}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-semibold text-2xl">
                      {sitterName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Sitter Details */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-text-primary mb-1">{sitterName}</h2>
                <p className="text-text-secondary flex items-center mb-2">
                  <svg className="w-5 h-5 mr-1 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {sitterLocation}
                </p>
                {sitterBio && (
                  <p className="text-text-secondary text-sm">{sitterBio}</p>
                )}
              </div>
            </div>

            {/* Listing Title */}
            <h3 className="text-xl font-bold text-text-primary mb-3">{title}</h3>

            {/* Description */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-text-secondary mb-2">About this listing</h4>
              <p className="text-text-secondary whitespace-pre-line">{description}</p>
            </div>

            {/* Services */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-text-secondary mb-2">Services Offered</h4>
              <div className="flex flex-wrap gap-2">
                {service_type?.map((service) => (
                  <span
                    key={service}
                    className="px-3 py-1 bg-blue-100 text-text-info-dark text-sm rounded-full font-medium capitalize"
                  >
                    {service.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Accepted Pets */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-text-secondary mb-2">Accepted Pets</h4>
              <div className="flex flex-wrap gap-2">
                {accepted_pet_types?.map((pet) => (
                  <span
                    key={pet}
                    className="px-3 py-1 bg-green-100 text-text-success-dark text-sm rounded-full font-medium capitalize"
                  >
                    {pet}
                  </span>
                ))}
              </div>
              {accepted_pet_sizes && accepted_pet_sizes.length > 0 && (
                <div className="mt-2">
                  <span className="text-sm text-text-secondary">Sizes: </span>
                  {accepted_pet_sizes.map((size) => (
                    <span key={size} className="text-sm text-text-secondary capitalize">{size}</span>
                  )).reduce((prev, curr) => [prev, ', ', curr])}
                </div>
              )}
            </div>

            {/* Capacity */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-text-secondary mb-2">Capacity</h4>
              <p className="text-text-secondary">Maximum {max_pets} {max_pets === 1 ? 'pet' : 'pets'} at a time</p>
            </div>

            {/* Pricing */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-text-secondary mb-2">Pricing</h4>
              <p className="text-2xl font-bold text-text-primary">{priceDisplay}</p>
            </div>

            {/* Location */}
            {(address || city || state) && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-text-secondary mb-2">Location</h4>
                <div className="text-text-secondary">
                  {address && <p>{address}</p>}
                  <p>
                    {city && state ? `${city}, ${state}` : city || state}
                    {postal_code && ` ${postal_code}`}
                  </p>
                </div>
              </div>
            )}

            {/* Amenities */}
            {amenities && amenities.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-text-secondary mb-2">Amenities</h4>
                <div className="grid grid-cols-2 gap-2">
                  {amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center text-text-secondary">
                      <svg className="w-5 h-5 mr-2 text-text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm capitalize">{amenity.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            {(available_from || available_to) && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-text-secondary mb-2">Availability</h4>
                <p className="text-text-secondary">
                  {available_from && `From ${new Date(available_from).toLocaleDateString()}`}
                  {available_from && available_to && ' - '}
                  {available_to && `To ${new Date(available_to).toLocaleDateString()}`}
                </p>
              </div>
            )}

            {/* House Rules */}
            {house_rules && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-text-secondary mb-2">House Rules</h4>
                <p className="text-text-secondary whitespace-pre-line">{house_rules}</p>
              </div>
            )}

            {/* Cancellation Policy */}
            {cancellation_policy && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-text-secondary mb-2">Cancellation Policy</h4>
                <p className="text-text-secondary whitespace-pre-line">{cancellation_policy}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleStartConversation}
                disabled={isStartingConversation}
                className="flex-1 px-6 py-3 bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isStartingConversation ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-text-inverse" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Starting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Start Conversation
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-text-secondary rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailModal;
