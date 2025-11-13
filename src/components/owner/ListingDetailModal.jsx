import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePetStore } from '@/store/petStore';
import { chatService } from '@/services/chatService';
import { bookingService } from '@/services/bookingService';
import toast from 'react-hot-toast';

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
  const { pets, fetchPets, isLoading: petsLoading } = usePetStore();
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showNoPetsModal, setShowNoPetsModal] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
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

  // Handle open booking form - check for pets first
  const handleOpenBookingForm = () => {
    if (!user) {
      toast.error('Please log in to book');
      navigate('/login');
      return;
    }

    // Check if user has pets
    if (!pets || pets.length === 0) {
      setShowNoPetsModal(true);
      return;
    }

    setShowBookingForm(true);
  };

  // Handle pet selection toggle
  const handlePetToggle = (petId) => {
    setBookingForm((prev) => {
      const isSelected = prev.selectedPetIds.includes(petId);

      if (isSelected) {
        // Deselect pet
        return {
          ...prev,
          selectedPetIds: prev.selectedPetIds.filter((id) => id !== petId),
        };
      } else {
        // Check max_pets limit
        if (max_pets && prev.selectedPetIds.length >= max_pets) {
          toast.error(`This sitter accepts a maximum of ${max_pets} pet${max_pets > 1 ? 's' : ''}`);
          return prev;
        }

        // Select pet
        return {
          ...prev,
          selectedPetIds: [...prev.selectedPetIds, petId],
        };
      }
    });
  };

  // Handle start conversation
  const handleStartConversation = async () => {
    if (!user) {
      alert('Please log in to start a conversation');
      navigate('/login');
      return;
    }

    setIsStartingConversation(true);
    try {
      // Get or create conversation - explicitly set roles
      // user.id = owner (current user viewing the listing)
      // profiles.id = sitter (owner of the listing)
      const conversation = await chatService.getOrCreateConversationExplicit(user.id, profiles.id);

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

  // Handle booking form submission
  const handleCreateBooking = async () => {
    if (!user) {
      toast.error('Please log in to book');
      navigate('/login');
      return;
    }

    // Validate pet selection
    if (!bookingForm.selectedPetIds || bookingForm.selectedPetIds.length === 0) {
      toast.error('Please select at least one pet');
      return;
    }

    // Validate dates
    if (!bookingForm.startDate || !bookingForm.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    const start = new Date(bookingForm.startDate);
    const end = new Date(bookingForm.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      toast.error('Start date cannot be in the past');
      return;
    }

    if (end <= start) {
      toast.error('End date must be after start date');
      return;
    }

    // Calculate total price
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    let totalPrice = null;

    if (price_per_day) {
      totalPrice = price_per_day * days; // Already in cents
    }

    setIsCreatingBooking(true);
    try {
      // Get selected pets with full details
      const selectedPets = pets.filter((pet) =>
        bookingForm.selectedPetIds.includes(pet.id)
      );

      // Create booking
      const booking = await bookingService.createBooking({
        listingId: listing.id,
        ownerId: user.id,
        sitterId: profiles.id,
        startDate: bookingForm.startDate,
        endDate: bookingForm.endDate,
        totalPrice,
        specialRequests: bookingForm.specialRequests || null,
        petIds: bookingForm.selectedPetIds,
      });

      console.log('✅ Booking created:', booking.id);

      // Get or create conversation - explicitly set owner and sitter roles
      // user.id = owner (person making the booking)
      // profiles.id = sitter (person whose listing is being booked)
      const conversation = await chatService.getOrCreateConversationExplicit(user.id, profiles.id);
      console.log('✅ Conversation ready:', conversation.id);

      // Build pet details message
      const petDetailsMessage = selectedPets
        .map((pet) => {
          let petInfo = `🐾 ${pet.name} (${pet.species.charAt(0).toUpperCase() + pet.species.slice(1)})`;
          if (pet.breed) petInfo += `\n   Breed: ${pet.breed}`;
          if (pet.age) petInfo += `\n   Age: ${pet.age} years`;
          if (pet.weight) petInfo += `\n   Weight: ${pet.weight} lbs`;
          if (pet.gender && pet.gender !== 'unknown')
            petInfo += `\n   Gender: ${pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}`;
          if (pet.temperament) petInfo += `\n   Temperament: ${pet.temperament}`;
          if (pet.medical_conditions) petInfo += `\n   ⚕️ Medical: ${pet.medical_conditions}`;
          if (pet.allergies) petInfo += `\n   🚫 Allergies: ${pet.allergies}`;
          if (pet.medications) petInfo += `\n   💊 Medications: ${pet.medications}`;
          if (pet.special_needs) petInfo += `\n   ⚠️ Special needs: ${pet.special_needs}`;
          if (pet.feeding_instructions) petInfo += `\n   🍽️ Feeding: ${pet.feeding_instructions}`;
          if (pet.vet_name) petInfo += `\n   🏥 Vet: ${pet.vet_name}${pet.vet_phone ? ` (${pet.vet_phone})` : ''}`;
          return petInfo;
        })
        .join('\n\n');

      // Send booking request message with pet details
      const requestMessage = `📋 New booking request!\n\n📅 Dates: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}\n🏠 Service: ${title}\n${totalPrice ? `💰 Total: $${(totalPrice / 100).toFixed(2)}` : ''}\n\n${petDetailsMessage}\n${bookingForm.specialRequests ? `\n📝 Special requests: ${bookingForm.specialRequests}` : ''}\n\nPlease review and respond.`;

      const message = await chatService.sendMessage({
        conversationId: conversation.id,
        senderId: user.id,
        content: requestMessage,
        metadata: {
          type: 'booking_request',
          bookingId: booking.id,
        },
      });

      console.log('✅ Booking request message sent:', message.id);
      toast.success('Booking request sent successfully!');

      // Close modal and reset form
      setShowBookingForm(false);
      setBookingForm({ startDate: '', endDate: '', specialRequests: '', selectedPetIds: [] });
      onClose();

      // Navigate to messages
      navigate('/owner/messages', { state: { conversationId: conversation.id } });
    } catch (error) {
      console.error('❌ Failed to create booking:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setIsCreatingBooking(false);
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

  // Calculate estimated price for booking form
  const calculateEstimatedPrice = () => {
    if (!bookingForm.startDate || !bookingForm.endDate || !price_per_day) {
      return null;
    }

    const start = new Date(bookingForm.startDate);
    const end = new Date(bookingForm.endDate);

    if (end <= start) return null;

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return (price_per_day * days) / 100;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-full max-h-[90vh] overflow-hidden">
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
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-6 sm:px-6 sm:py-8 md:px-8 text-white">
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
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2 group-hover:underline">{sitterName}</h2>
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
            <div className="px-4 py-4 sm:px-6 md:px-8">
              {/* Listing Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">{title}</h3>

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

              {/* Booking Form */}
              {showBookingForm && (
                <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-indigo-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    Booking Details
                  </h4>

                  <div className="space-y-4">
                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={bookingForm.startDate}
                        onChange={(e) => setBookingForm({ ...bookingForm, startDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={bookingForm.endDate}
                        onChange={(e) => setBookingForm({ ...bookingForm, endDate: e.target.value })}
                        min={bookingForm.startDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                      />
                    </div>

                    {/* Pet Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Select Pets {max_pets && `(Max: ${max_pets})`}
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-indigo-200 rounded-lg bg-gray-50">
                        {petsLoading ? (
                          <p className="text-sm text-gray-500 text-center py-4">Loading pets...</p>
                        ) : pets && pets.length > 0 ? (
                          pets.map((pet) => (
                            <label
                              key={pet.id}
                              className="flex items-center p-3 bg-white rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors border border-gray-200"
                            >
                              <input
                                type="checkbox"
                                checked={bookingForm.selectedPetIds.includes(pet.id)}
                                onChange={() => handlePetToggle(pet.id)}
                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">{pet.name}</span>
                                  <span className="text-sm text-gray-500 capitalize">({pet.species})</span>
                                </div>
                                {pet.breed && (
                                  <p className="text-xs text-gray-600 mt-0.5">{pet.breed}</p>
                                )}
                              </div>
                            </label>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">No pets found</p>
                        )}
                      </div>
                      {bookingForm.selectedPetIds.length > 0 && (
                        <p className="text-xs text-indigo-600 mt-2">
                          {bookingForm.selectedPetIds.length} pet{bookingForm.selectedPetIds.length > 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>

                    {/* Special Requests */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Special Requests (Optional)
                      </label>
                      <textarea
                        value={bookingForm.specialRequests}
                        onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                        rows={3}
                        placeholder="Any special needs or instructions for your pet..."
                        className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white resize-none"
                      />
                    </div>

                    {/* Estimated Price */}
                    {calculateEstimatedPrice() && (
                      <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">Estimated Total</span>
                          <span className="text-2xl font-bold text-green-600">
                            ${calculateEstimatedPrice().toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.ceil((new Date(bookingForm.endDate) - new Date(bookingForm.startDate)) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleCreateBooking}
                        disabled={isCreatingBooking || !bookingForm.startDate || !bookingForm.endDate}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isCreatingBooking ? (
                          <>
                            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Creating...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Confirm Booking
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowBookingForm(false);
                          setBookingForm({ startDate: '', endDate: '', specialRequests: '', selectedPetIds: [] });
                        }}
                        disabled={isCreatingBooking}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={handleOpenBookingForm}
                  disabled={showBookingForm}
                  className="w-full sm:flex-1 px-6 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Request to Book
                </button>
                <button
                  onClick={handleStartConversation}
                  disabled={isStartingConversation}
                  className="w-full sm:flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
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
                      Message Sitter
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* No Pets Modal */}
      {showNoPetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={() => setShowNoPetsModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Pets Added</h3>
              <p className="text-gray-600 mb-6">
                You need to add at least one pet before making a booking. Please add your pet's information first.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNoPetsModal(false);
                    onClose();
                    navigate('/owner/profile');
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Add Pet
                </button>
                <button
                  onClick={() => setShowNoPetsModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetailModal;
