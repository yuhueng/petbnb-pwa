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
 * @param {Function} props.onProfileClick - Handler for viewing sitter profile
 */
const ListingDetailModal = ({ listing, isOpen, onClose, onProfileClick }) => {
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

      // Close modal first
      onClose();

      // Navigate to messages page with conversationId
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
        className="fixed inset-0 bg-black bg-opacity-60 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-2 bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[90vh]">
            {/* Header - Sitter Info with Gradient Background */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-8 text-white">
              <button
                onClick={() => onProfileClick?.(profiles?.id)}
                className="flex items-start gap-6 w-full text-left hover:bg-white/10 rounded-xl p-4 -m-4 transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className="flex-shrink-0 relative">
                  {sitterAvatar ? (
                    <img
                      src={sitterAvatar}
                      alt={sitterName}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl group-hover:border-white/90 transition-all"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white shadow-xl group-hover:border-white/90 transition-all">
                      <span className="text-white font-bold text-3xl">
                        {sitterName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* View Profile Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                {/* Sitter Details */}
                <div className="flex-1 pt-2">
                  <h2 className="text-3xl font-bold mb-2 group-hover:underline">{sitterName}</h2>
                  <p className="flex items-center mb-3 text-white/90">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {sitterLocation}
                  </p>
                  {sitterBio && (
                    <p className="text-white/90 text-sm leading-relaxed">{sitterBio}</p>
                  )}
                  <p className="text-xs text-white/70 mt-3 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Click to view full profile
                  </p>
                </div>
              </button>
            </div>

            {/* Main Content */}
            <div className="px-8 py-6">
              {/* Listing Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{title}</h3>

              {/* Key Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Pricing Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-700">Pricing</h4>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{priceDisplay}</p>
                </div>

                {/* Capacity Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-700">Capacity</h4>
                  </div>
                  <p className="text-xl font-bold text-gray-900">Max {max_pets} {max_pets === 1 ? 'pet' : 'pets'}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  About this listing
                </h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-4 border border-gray-200">{description}</p>
              </div>

              {/* Services */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  Services Offered
                </h4>
                <div className="flex flex-wrap gap-3">
                  {service_type?.map((service) => (
                    <span
                      key={service}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm rounded-full font-semibold shadow-md hover:shadow-lg transition-shadow capitalize"
                    >
                      {service.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Accepted Pets */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Accepted Pets
                </h4>
                <div className="flex flex-wrap gap-3 mb-3">
                  {accepted_pet_types?.map((pet) => (
                    <span
                      key={pet}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-full font-semibold shadow-md hover:shadow-lg transition-shadow capitalize"
                    >
                      {pet}
                    </span>
                  ))}
                </div>
                {accepted_pet_sizes && accepted_pet_sizes.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 text-sm">
                    <span className="font-semibold text-gray-700">Sizes:</span>
                    {accepted_pet_sizes.map((size, index) => (
                      <span key={size} className="text-gray-600 capitalize">
                        {size}{index < accepted_pet_sizes.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Location */}
              {(address || city || state) && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center mr-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    Location
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-gray-700">
                    {address && <p className="font-medium">{address}</p>}
                    <p>
                      {city && state ? `${city}, ${state}` : city || state}
                      {postal_code && ` ${postal_code}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Amenities */}
              {amenities && amenities.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mr-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    Amenities
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center text-gray-700 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg px-4 py-3 border border-amber-200">
                        <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium capitalize">{amenity.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability */}
              {(available_from || available_to) && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    Availability
                  </h4>
                  <p className="text-gray-700 bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                    {available_from && `From ${new Date(available_from).toLocaleDateString()}`}
                    {available_from && available_to && ' - '}
                    {available_to && `To ${new Date(available_to).toLocaleDateString()}`}
                  </p>
                </div>
              )}

              {/* House Rules */}
              {house_rules && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center mr-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    House Rules
                  </h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line bg-yellow-50 rounded-xl p-4 border border-yellow-200">{house_rules}</p>
                </div>
              )}

              {/* Cancellation Policy */}
              {cancellation_policy && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center mr-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    Cancellation Policy
                  </h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line bg-red-50 rounded-xl p-4 border border-red-200">{cancellation_policy}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={handleStartConversation}
                  disabled={isStartingConversation}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  {isStartingConversation ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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
                  className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailModal;
