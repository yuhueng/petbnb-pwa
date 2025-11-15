import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { chatService } from '@/services/chatService';
import { petActivityService } from '@/services/petActivityService';
import { petService } from '@/services/petService';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { bookings, isLoading, fetchSitterBookings, acceptBooking, declineBooking } = useBookingStore();

  const [activeTab, setActiveTab] = useState('current');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingBookingId, setProcessingBookingId] = useState(null);

  // Activity Modal States
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityModalStep, setActivityModalStep] = useState(1); // 1 = question, 2 = image upload
  const [activityAnswer, setActivityAnswer] = useState('');
  const [activityImages, setActivityImages] = useState([]);
  const [isUploadingActivity, setIsUploadingActivity] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fileInputRef = useRef(null);

  // Timeline Activities
  const [todayActivities, setTodayActivities] = useState([]);

  // Timeline Modal for Past Bookings
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedPastBooking, setSelectedPastBooking] = useState(null);
  const [pastBookingActivities, setPastBookingActivities] = useState([]);

  // Pet details for selected booking
  const [bookingPets, setBookingPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);

  // Toggle state for current bookings view (null = show all cards, bookingId = show that booking's timeline)
  const [selectedCurrentBooking, setSelectedCurrentBooking] = useState(null);

  // Fetch sitter bookings on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSitterBookings(user.id);
    }
  }, [isAuthenticated, user, fetchSitterBookings]);

  // Fetch pet details when booking is selected
  useEffect(() => {
    const fetchPetDetails = async () => {
      if (selectedBooking && selectedBooking.pet_ids && selectedBooking.pet_ids.length > 0) {
        setLoadingPets(true);
        try {
          const petPromises = selectedBooking.pet_ids.map((petId) => petService.fetchPetById(petId));
          const petsData = await Promise.all(petPromises);
          setBookingPets(petsData);
        } catch (error) {
          console.error('Error fetching pet details:', error);
          toast.error('Failed to load pet details');
          setBookingPets([]);
        } finally {
          setLoadingPets(false);
        }
      } else {
        setBookingPets([]);
      }
    };

    fetchPetDetails();
  }, [selectedBooking]);

  // Calculate bookings by status and date using useMemo
  const { currentBookings, upcomingBookings, pastBookings } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const current = bookings.filter(b => {
      const startDate = new Date(b.start_date);
      const endDate = new Date(b.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      return (
        (b.status === 'confirmed' || b.status === 'in_progress') &&
        startDate <= today &&
        endDate >= today
      );
    });

    const upcoming = bookings.filter(b => {
      const startDate = new Date(b.start_date);
      startDate.setHours(0, 0, 0, 0);
      return (
        b.status === 'pending' ||
        (b.status === 'confirmed' && startDate > today)
      );
    });

    const past = bookings.filter(b => {
      const endDate = new Date(b.end_date);
      endDate.setHours(0, 0, 0, 0);
      return (
        b.status === 'completed' ||
        b.status === 'cancelled' ||
        endDate < today
      );
    });

    return { currentBookings: current, upcomingBookings: upcoming, pastBookings: past };
  }, [bookings]);

  // Fetch today's activities for selected booking
  useEffect(() => {
    const fetchTodayActivities = async () => {
      if (selectedCurrentBooking) {
        const booking = currentBookings.find(b => b.id === selectedCurrentBooking);
        if (booking) {
          const result = await petActivityService.getActivitiesByDate(
            booking.id,
            new Date()
          );
          if (result.success) {
            setTodayActivities(result.data);
          }
        }
      } else {
        setTodayActivities([]);
      }
    };

    if (activeTab === 'current') {
      fetchTodayActivities();
    }
  }, [activeTab, selectedCurrentBooking, currentBookings]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <svg
          className="w-24 h-24 text-text-disabled mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Please log in to view dashboard</h2>
        <p className="text-text-secondary mb-6">You need to be logged in to manage your bookings</p>
        <button
          onClick={() => navigate('/sitter/profile')}
          className="px-6 py-3 bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  // Handle booking click
  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  // Handle past booking click - show timeline
  const handlePastBookingClick = async (booking) => {
    setSelectedPastBooking(booking);
    setTimelineModalOpen(true);

    // Fetch all activities for this booking
    try {
      const result = await petActivityService.getActivitiesByBooking(booking.id);
      if (result.success) {
        setPastBookingActivities(result.data);
      } else {
        setPastBookingActivities([]);
        toast.error('Failed to load activities');
      }
    } catch (error) {
      console.error('Failed to fetch booking activities:', error);
      setPastBookingActivities([]);
      toast.error('Failed to load activities');
    }
  };

  // Close timeline modal
  const handleCloseTimelineModal = () => {
    setTimelineModalOpen(false);
    setSelectedPastBooking(null);
    setPastBookingActivities([]);
  };

  // Navigate to chat with owner
  const handleGoToChat = async (booking) => {
    if (!booking || !user) return;

    try {
      // Get or create conversation - explicitly set roles
      // booking.pet_owner_id = owner
      // user.id = sitter (current user)
      const conversation = await chatService.getOrCreateConversationExplicit(
        booking.pet_owner_id,
        user.id
      );

      // Navigate to messages with the conversation
      navigate('/sitter/messages', { state: { conversationId: conversation.id } });
    } catch (error) {
      console.error('Failed to navigate to chat:', error);
      toast.error('Failed to open chat. Please try again.');
    }
  };

  // Handle accept booking
  const handleAcceptBooking = async (e, booking) => {
    e.stopPropagation(); // Prevent card click

    if (!user) return;

    setProcessingBookingId(booking.id);
    try {
      // Get or create conversation - explicitly set roles
      // booking.pet_owner_id = owner (person who made the booking)
      // user.id = sitter (current user, the one accepting)
      const conversation = await chatService.getOrCreateConversationExplicit(
        booking.pet_owner_id,
        user.id
      );

      // Accept booking
      const result = await acceptBooking(booking.id, user.id, conversation.id);

      if (result.success) {
        toast.success('Booking accepted! 🎉');
        // Refresh bookings
        await fetchSitterBookings(user.id);
      } else {
        toast.error('Failed to accept booking');
      }
    } catch (error) {
      console.error('Failed to accept booking:', error);
      toast.error('Failed to accept booking. Please try again.');
    } finally {
      setProcessingBookingId(null);
    }
  };

  // Handle decline booking
  const handleDeclineBooking = async (e, booking) => {
    e.stopPropagation(); // Prevent card click

    if (!user) return;

    const reason = prompt('Optional: Provide a reason for declining (or leave blank)');

    setProcessingBookingId(booking.id);
    try {
      // Get or create conversation - explicitly set roles
      // booking.pet_owner_id = owner (person who made the booking)
      // user.id = sitter (current user, the one declining)
      const conversation = await chatService.getOrCreateConversationExplicit(
        booking.pet_owner_id,
        user.id
      );

      // Decline booking
      const result = await declineBooking(booking.id, user.id, conversation.id, reason);

      if (result.success) {
        toast.success('Booking declined');
        // Refresh bookings
        await fetchSitterBookings(user.id);
      } else {
        toast.error('Failed to decline booking');
      }
    } catch (error) {
      console.error('Failed to decline booking:', error);
      toast.error('Failed to decline booking. Please try again.');
    } finally {
      setProcessingBookingId(null);
    }
  };

  // Handle activity card click - Open Step 1 modal
  const handleActivityClick = (activityType) => {
    if (currentBookings.length === 0) {
      toast.error('No active booking to log activity');
      return;
    }

    setSelectedActivity(activityType);
    setActivityModalOpen(true);
    setActivityModalStep(1);
    setActivityAnswer('');
    setActivityImages([]);
  };

  // Get question text based on activity type
  const getActivityQuestion = (activityType) => {
    const petName = currentBookings[0]?.owner?.name || 'the pet';
    switch (activityType) {
      case 'feed':
        return `How much did ${petName}'s pet eat?`;
      case 'walk':
        return `How much did ${petName}'s pet walk?`;
      case 'play':
        return `What did ${petName}'s pet play?`;
      default:
        return 'Add activity details';
    }
  };

  // Handle Step 1 - Answer submission
  const handleStep1Continue = () => {
    if (!activityAnswer.trim()) {
      toast.error('Please provide an answer');
      return;
    }
    setActivityModalStep(2);
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setActivityImages(files);
    }
  };

  // Handle Step 2 - Submit activity with images
  const handleSubmitActivity = async () => {
    if (activityImages.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }

    if (!user || currentBookings.length === 0) {
      toast.error('Unable to submit activity');
      return;
    }

    setIsUploadingActivity(true);

    try {
      const booking = currentBookings[0];

      // Upload images
      const uploadResult = await petActivityService.uploadMultipleImages(
        activityImages,
        booking.id,
        selectedActivity
      );

      if (!uploadResult.success || uploadResult.urls.length === 0) {
        throw new Error('Failed to upload images');
      }

      // Create activity
      const activityData = {
        bookingId: booking.id,
        petSitterId: user.id,
        petOwnerId: booking.pet_owner_id,
        activityType: selectedActivity,
        activityTitle: selectedActivity.charAt(0).toUpperCase() + selectedActivity.slice(1),
        activityDescription: activityAnswer,
        activityDetail: {
          detail: activityAnswer,
        },
        imageUrls: uploadResult.urls,
      };

      const result = await petActivityService.createActivity(activityData);

      if (result.success) {
        // Close activity modal
        setActivityModalOpen(false);
        setActivityModalStep(1);
        setSelectedActivity(null);
        setActivityAnswer('');
        setActivityImages([]);

        // Show success modal
        setShowSuccessModal(true);

        // Refresh timeline
        const activitiesResult = await petActivityService.getActivitiesByDate(
          booking.id,
          new Date()
        );
        if (activitiesResult.success) {
          setTodayActivities(activitiesResult.data);
        }

        // Auto-close success modal after 2 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 2000);
      } else {
        throw new Error('Failed to create activity');
      }
    } catch (error) {
      console.error('Error submitting activity:', error);
      toast.error('Failed to log activity. Please try again.');
    } finally {
      setIsUploadingActivity(false);
    }
  };

  // Close activity modal
  const handleCloseActivityModal = () => {
    setActivityModalOpen(false);
    setActivityModalStep(1);
    setSelectedActivity(null);
    setActivityAnswer('');
    setActivityImages([]);
  };

  // Get activity icon and color
  const getActivityStyles = (activityType) => {
    switch (activityType) {
      case 'walk':
        return {
          color: '#ffd189',
          icon: <img src="/icons/common/walk-white-icon.svg" alt="Walk" className="w-6 h-6" />,
          bgGradient: 'from-[#ffd189] to-[#ffb347]',
        };
      case 'feed':
        return {
          color: '#a2d08a',
          icon: <img src="/icons/common/feed-white-icon.svg" alt="Feed" className="w-6 h-6" />,
          bgGradient: 'from-[#a2d08a] to-[#8bc574]',
        };
      case 'play':
        return {
          color: '#c0a7fe',
          icon: <img src="/icons/common/play-white-icon.svg" alt="Play" className="w-6 h-6" />,
          bgGradient: 'from-[#c0a7fe] to-[#a88fec]',
        };
      default:
        return {
          color: '#ffd189',
          icon: <img src="/icons/common/add-icon.svg" alt="Add" className="w-6 h-6" />,
          bgGradient: 'from-[#ffd189] to-[#ffb347]',
        };
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full font-semibold shadow-sm">
            ✓ Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs rounded-full font-semibold shadow-sm">
            ⏱ Pending
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs rounded-full font-semibold shadow-sm">
            🔵 In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-semibold shadow-sm">
            ✔ Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-full font-semibold shadow-sm">
            ✗ Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  // Render booking card
  const renderBookingCard = (booking) => {
    const isUpcoming = new Date(booking.start_date) > today;
    const isOngoing = new Date(booking.start_date) <= today && new Date(booking.end_date) >= today;

    return (
      <div
        key={booking.id}
        onClick={() => handleBookingClick(booking)}
        className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 transform hover:scale-[1.02]"
      >
        {/* Status Indicator Bar */}
        <div className={`h-1.5 ${
          booking.status === 'confirmed' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
          booking.status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
          booking.status === 'in_progress' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
          booking.status === 'completed' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
          'bg-gradient-to-r from-red-500 to-rose-500'
        }`} />

        <div className="p-5">
          {/* Header with Owner Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              {booking.owner?.avatar_url ? (
                <img
                  src={booking.owner.avatar_url}
                  alt={booking.owner.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {booking.owner?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{booking.owner?.name}</h3>
                <p className="text-xs text-gray-500">Pet Owner</p>
              </div>
            </div>
            {getStatusBadge(booking.status)}
          </div>

          {/* Listing Title */}
          <h4 className="font-semibold text-gray-800 mb-3 line-clamp-1">{booking.listing?.title}</h4>

          {/* Date Range with Visual Indicator */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 mb-3">
            <div className="flex items-center text-sm text-gray-700">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="flex-1">
                <div className="font-medium">
                  {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' → '}
                  {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24))} days
                  {isUpcoming && ' • Upcoming'}
                  {isOngoing && ' • Ongoing'}
                </div>
              </div>
            </div>
          </div>

          {/* Price */}
          {booking.total_price && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-600">Total Price</span>
              <span className="text-2xl font-bold text-gray-900">
                ${(booking.total_price / 100).toFixed(2)}
              </span>
            </div>
          )}

          {/* Accept/Decline Buttons for Pending Bookings */}
          {booking.status === 'pending' && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={(e) => handleAcceptBooking(e, booking)}
                disabled={processingBookingId === booking.id}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processingBookingId === booking.id ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accept
                  </>
                )}
              </button>
              <button
                onClick={(e) => handleDeclineBooking(e, booking)}
                disabled={processingBookingId === booking.id}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processingBookingId === booking.id ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Decline
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fef5f6] flex justify-center items-start py-6 px-4">
      {/* Mobile Container - 393px width matching the guide */}
      <div className="relative w-full max-w-[393px] bg-[#fef5f6] mx-auto">

        {/* Top Navigation Tabs */}
        <div className="flex justify-center mb-6 mt-4">
          <div className="inline-flex items-center gap-5 bg-white px-3 py-2.5 rounded-[20px] shadow-[0px_1px_4px_rgba(0,0,0,0.25)]">
            <button
              onClick={() => setActiveTab('current')}
              className={`w-20 px-3 py-1.5 rounded-[30px] text-xs font-bold transition-all duration-300 ${
                activeTab === 'current'
                  ? 'bg-[#fb7678] text-white border border-[#fe8c85]'
                  : 'text-[#737373] hover:bg-[#f5f5f5]'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`w-20 px-3 py-1.5 rounded-[30px] text-xs font-normal transition-all duration-300 ${
                activeTab === 'upcoming'
                  ? 'bg-[#fb7678] text-white border border-[#fe8c85] font-bold'
                  : 'text-[#737373] hover:bg-[#f5f5f5]'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`w-20 px-3 py-1.5 rounded-[30px] text-xs font-normal transition-all duration-300 ${
                activeTab === 'past'
                  ? 'bg-[#fb7678] text-white border border-[#fe8c85] font-bold'
                  : 'text-[#737373] hover:bg-[#f5f5f5]'
              }`}
            >
              Past
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fb7678]"></div>
          </div>
        )}

        {/* Content based on active tab */}
        {!isLoading && (
          <div className="space-y-6">
            {/* Currently Petsitting Section */}
            {activeTab === 'current' && currentBookings.length > 0 && selectedCurrentBooking === null && (
              <div className="px-4">
                <h2 className="text-base font-bold text-[#3e2d2e] mb-3">
                  Currently Petsitting ({currentBookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length})
                </h2>
                <p className="text-xs text-[#6d6d6d] mb-2">Tap a booking to view routine and timeline</p>

                {currentBookings
                  .filter(b => b.status === 'confirmed' || b.status === 'in_progress')
                  .map(booking => (
                    <div
                      key={booking.id}
                      onClick={() => setSelectedCurrentBooking(booking.id)}
                      className="bg-white rounded-[10px] p-2.5 mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex gap-3">
                        {/* Pet Images */}
                        {booking.pets && booking.pets.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {booking.pets.slice(0, 1).map(pet => (
                              pet.avatar_url ? (
                                <img key={pet.id} src={pet.avatar_url} alt={pet.name} className="w-[74px] h-[74px] rounded-[10px] object-cover flex-shrink-0" />
                              ) : (
                                <div key={pet.id} className="w-[74px] h-[74px] rounded-[10px] bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {pet.name?.charAt(0).toUpperCase()}
                                </div>
                              )
                            ))}
                            {booking.pets.length > 1 && (
                              <div className="text-[8px] text-[#6d6d6d] text-center">+{booking.pets.length - 1} more</div>
                            )}
                          </div>
                        ) : (
                          <div className="w-[74px] h-[74px] rounded-[10px] bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] flex items-center justify-center text-4xl flex-shrink-0">
                            🐶
                          </div>
                        )}

                        {/* Booking Info */}
                        <div className="flex-1 flex flex-col ">
                          {/* Booking Details */}
                          <div className="flex flex-col gap-0.5">
                            {/* Pets Names */}
                            {booking.pets && booking.pets.length > 0 ? (
                              <p className="text-sm font-medium text-black leading-normal">
                                {booking.pets.map(p => p.name).join(', ')}
                              </p>
                            ) : (
                              <p className="text-sm font-medium text-black leading-normal">
                                {booking.listing?.title || 'Pet Sitting Service'}
                              </p>
                            )}
                            <p className="text-[10px] font-light text-[#535353] leading-normal">
                              {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                            </p>
                            <div className="h-px bg-[#e5e5e5] my-1"></div>
                          </div>

                          {/* Owner Section */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {/* Owner Avatar */}
                              {booking.owner?.avatar_url ? (
                                <img
                                  src={booking.owner.avatar_url}
                                  alt={booking.owner.name}
                                  className="w-[27px] h-[27px] rounded-full object-cover border border-gray-200 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-[27px] h-[27px] rounded-full bg-gradient-to-br from-[#ffd189] to-[#ffb347] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                  {booking.owner?.name?.charAt(0).toUpperCase() || 'O'}
                                </div>
                              )}

                              <div className="flex flex-col gap-px">
                                <p className="text-xs font-medium text-black leading-normal">
                                  {booking.owner?.name || 'Owner'}
                                </p>
                                <div className="flex items-center text-center">
                                  <span className="inline-flex items-center px-0.5 py-0.5 bg-[#fcf3f3] border border-[#fb7678] rounded-sm">
                                    <span className="text-[6px] font-semibold text-[#fb7678]">OWNER</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Message Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGoToChat(booking);
                              }}
                              className="px-2 bg-[#fb7678cc] hover:bg-[#fb7678] rounded-[20px] transition-all duration-300 hover:scale-105"
                            >
                              <div className="flex items-center text-center px-2.5 py-1.5">
                                <span className="text-[8px] font-bold text-white whitespace-nowrap">💬 Message</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Selected Booking View */}
            {activeTab === 'current' && selectedCurrentBooking && (
              <div className="px-4">
                {/* Back Button */}
                <button
                  onClick={() => setSelectedCurrentBooking(null)}
                  className="flex items-center gap-2 text-sm text-[#fb7678] font-semibold mb-3 hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to all bookings
                </button>

                {/* Selected Booking Card */}
                {(() => {
                  const booking = currentBookings.find(b => b.id === selectedCurrentBooking);
                  if (!booking) return null;

                  return (
                    <div className="bg-white rounded-[10px] p-2.5 mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                      <div className="flex gap-3">
                        {/* Pet Images */}
                        {booking.pets && booking.pets.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {booking.pets.slice(0, 1).map(pet => (
                              pet.avatar_url ? (
                                <img key={pet.id} src={pet.avatar_url} alt={pet.name} className="w-[74px] h-[74px] rounded-[10px] object-cover flex-shrink-0" />
                              ) : (
                                <div key={pet.id} className="w-[74px] h-[74px] rounded-[10px] bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {pet.name?.charAt(0).toUpperCase()}
                                </div>
                              )
                            ))}
                            {booking.pets.length > 1 && (
                              <div className="text-[8px] text-[#6d6d6d] text-center">+{booking.pets.length - 1} more</div>
                            )}
                          </div>
                        ) : (
                          <div className="w-[74px] h-[74px] rounded-[10px] bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] flex items-center justify-center text-4xl flex-shrink-0">
                            🐶
                          </div>
                        )}

                        {/* Booking Info */}
                        <div className="flex-1 flex flex-col">
                          <div className="flex flex-col gap-0.5">
                            {booking.pets && booking.pets.length > 0 ? (
                              <p className="text-sm font-medium text-black leading-normal">
                                {booking.pets.map(p => p.name).join(', ')}
                              </p>
                            ) : (
                              <p className="text-sm font-medium text-black leading-normal">
                                {booking.listing?.title || 'Pet Sitting Service'}
                              </p>
                            )}
                            <p className="text-[10px] font-light text-[#535353] leading-normal">
                              {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                            </p>
                            <div className="h-px bg-[#e5e5e5] my-1"></div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {booking.owner?.avatar_url ? (
                                <img
                                  src={booking.owner.avatar_url}
                                  alt={booking.owner.name}
                                  className="w-[27px] h-[27px] rounded-full object-cover border border-gray-200 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-[27px] h-[27px] rounded-full bg-gradient-to-br from-[#ffd189] to-[#ffb347] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                  {booking.owner?.name?.charAt(0).toUpperCase() || 'O'}
                                </div>
                              )}

                              <div className="flex flex-col gap-px">
                                <p className="text-xs font-medium text-black leading-normal">
                                  {booking.owner?.name || 'Owner'}
                                </p>
                                <div className="flex items-center text-center">
                                  <span className="inline-flex items-center px-0.5 py-0.5 bg-[#fcf3f3] border border-[#fb7678] rounded-sm">
                                    <span className="text-[6px] font-semibold text-[#fb7678]">OWNER</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGoToChat(booking);
                              }}
                              className="px-2 bg-[#fb7678cc] hover:bg-[#fb7678] rounded-[20px] transition-all duration-300 hover:scale-105"
                            >
                              <div className="flex items-center text-center px-2.5 py-1.5">
                                <span className="text-[8px] font-bold text-white whitespace-nowrap">💬 Message</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Pet's Routine Section - Only show when a booking is selected */}
            {activeTab === 'current' && selectedCurrentBooking && (
              <div className="px-4">
                <div className="bg-[#fb7678e6] rounded-[10px] p-3 sm:p-4 shadow-[0_4px_12px_rgba(251,118,120,0.3)]">
                  <h2 className="text-sm sm:text-base font-extrabold text-white mb-3 sm:mb-4 text-center">Pet Care Routine</h2>

                  <div className="flex gap-2 sm:gap-3 justify-center items-start pb-5 sm:pb-6">

                    {/* Walk Card */}
                    <div className="flex-shrink-0 w-[92px] sm:w-[106px]">
                      <div className="relative bg-white rounded-[10px] overflow-visible cursor-pointer hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(0,0,0,0.15)] active:scale-95 transition-all duration-300"
                          onClick={() => handleActivityClick('walk')}>

                        {/* Top colored bar */}
                        <div className="w-full h-[12px] sm:h-[15px] bg-[#ffc369] rounded-t-[10px]"></div>

                        {/* Content - using flex column */}
                        <div className="flex flex-col items-center px-2 sm:px-3 pb-6 sm:pb-7 pt-1 sm:pt-1.5">
                          {/* Title */}
                          <p className="text-xs sm:text-base font-bold text-[#ffc369] mb-1.5 sm:mb-2">Walk</p>

                          {/* Main icon box */}
                          <div className="w-[44px] h-[44px] sm:w-[54px] sm:h-[54px] rounded-[8px] sm:rounded-[10px] bg-gradient-to-br from-[#ffc36933] to-[#ffb34733] flex items-center justify-center">
                            <img src="/icons/common/walk-icon.svg" alt="Walk" className="w-6 h-6 sm:w-8 sm:h-8" />
                          </div>

                          {/* Bottom circular icon - positioned relative to flow */}
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                            <img src="/icons/common/add-yellow-icon.svg" alt="Add Walk" className="w-8 h-8 sm:w-10 sm:h-10 shadow-md bg-white rounded-full" />
                          </div>

                        </div>
                      </div>
                    </div>


                    {/* Feed Card - With Floating Bottom Icon */}
                    <div className="flex-shrink-0 w-[92px] sm:w-[106px]">
                      <div className="relative bg-white rounded-[10px] overflow-visible cursor-pointer hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(0,0,0,0.15)] active:scale-95 transition-all duration-300"
                          onClick={() => handleActivityClick('feed')}>

                        {/* Top colored bar */}
                        <div className="w-full h-[12px] sm:h-[15px] bg-[#a2d08a] rounded-t-[10px]"></div>

                        {/* Content - using flex column */}
                        <div className="flex flex-col items-center px-2 sm:px-3 pb-6 sm:pb-7 pt-1 sm:pt-1.5">
                          {/* Title */}
                          <p className="text-xs sm:text-base font-bold text-[#a2d08a] mb-1.5 sm:mb-2">Feed</p>

                          {/* Main icon box */}
                          <div className="w-[44px] h-[44px] sm:w-[54px] sm:h-[54px] rounded-[8px] sm:rounded-[10px] bg-gradient-to-br from-[#a2d08a33] to-[#8bc57433] flex items-center justify-center">
                            <img src="/icons/common/feed-icon.svg" alt="Feed" className="w-6 h-6 sm:w-8 sm:h-8" />
                          </div>
                        </div>

                        {/* Floating bottom icon - positioned absolutely */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                          <img src="/icons/common/add-green-icon.svg" alt="Add Feed" className="w-8 h-8 sm:w-10 sm:h-10 shadow-md bg-white rounded-full" />
                        </div>
                      </div>
                    </div>


                    {/* Play Card - With Floating Bottom Icon */}
                    <div className="flex-shrink-0 w-[92px] sm:w-[106px]">
                      <div className="relative bg-white rounded-[10px] overflow-visible cursor-pointer hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(0,0,0,0.15)] active:scale-95 transition-all duration-300"
                          onClick={() => handleActivityClick('play')}>

                        {/* Top colored bar */}
                        <div className="w-full h-[12px] sm:h-[15px] bg-[#c0a7fe] rounded-t-[10px]"></div>

                        {/* Content - using flex column */}
                        <div className="flex flex-col items-center px-2 sm:px-3 pb-6 sm:pb-7 pt-1 sm:pt-1.5">
                          {/* Title */}
                          <p className="text-xs sm:text-base font-bold text-[#c0a7fe] mb-1.5 sm:mb-2">Play</p>

                          {/* Main icon box */}
                          <div className="w-[44px] h-[44px] sm:w-[54px] sm:h-[54px] rounded-[8px] sm:rounded-[10px] bg-gradient-to-br from-[#c0a7fe33] to-[#a88fec33] flex items-center justify-center">
                            <img src="/icons/common/play-icon.svg" alt="Play" className="w-6 h-6 sm:w-8 sm:h-8" />
                          </div>
                        </div>

                        {/* Floating bottom icon - positioned absolutely */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                          <img src="/icons/common/add-purple-icon.svg" alt="Add Play" className="w-8 h-8 sm:w-10 sm:h-10 shadow-md bg-white rounded-full" />
                        </div>
                      </div>
                    </div>


                  </div>
                </div>
              </div>
            )}

            {/* Pet's Timeline Section - Only show when a booking is selected */}
            {activeTab === 'current' && selectedCurrentBooking && (
              <div className="px-4 pb-6">
                <div className="relative bg-white rounded-[15px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                  <h2 className="text-base font-bold text-[#3e2d2e] mb-1">Today's Timeline</h2>
                  <p className="text-base font-semibold text-[#fe8c85] mb-4">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>

                  {/* Timeline Items */}
                  {todayActivities.length > 0 ? (
                    <div className="space-y-6">
                      {todayActivities.map((activity, index) => {
                        const styles = getActivityStyles(activity.activity_type);
                        const timestamp = new Date(activity.activity_timestamp);
                        const timeStr = timestamp.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        });

                        return (
                          <div key={activity.id} className="relative">
                            <div className="flex items-start gap-3">
                              {/* Event Icon */}
                              <div
                                className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-xl flex-shrink-0 relative "
                                style={{ backgroundColor: styles.color }}
                              >
                                {styles.icon}
                              </div>

                              {/* Event Details */}
                              <div className="flex-1 pt-1">
                                <div className="flex items-start justify-between mb-1">
                                  <div>
                                    <p className="text-sm font-semibold text-black leading-normal">
                                      {activity.activity_title}
                                    </p>
                                    <p className="text-xs font-normal text-[#6d6d6d] leading-normal">
                                      {activity.activity_description}
                                    </p>
                                  </div>
                                  <p className="text-xs font-normal text-[#6d6d6d] whitespace-nowrap ml-2">
                                    {timeStr}
                                  </p>
                                </div>

                                {/* Event Images */}
                                {activity.image_urls && activity.image_urls.length > 0 && (
                                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                                    {activity.image_urls.slice(0, 3).map((url, imgIndex) => (
                                      <img
                                        key={imgIndex}
                                        src={url}
                                        alt={`${activity.activity_title} ${imgIndex + 1}`}
                                        className="w-[100px] h-[100px] rounded-[10px] object-cover flex-shrink-0 shadow-sm"
                                      />
                                    ))}
                                    {activity.image_urls.length > 3 && (
                                      <div className="w-[100px] h-[100px] rounded-[10px] bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <p className="text-sm font-semibold text-gray-600">
                                          +{activity.image_urls.length - 3}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Connecting Line */}
                            {index < todayActivities.length - 1 && (
                              <div
                                className="absolute left-[20px] w-0.5 -bottom-4"
                                style={{
                                  height: activity.image_urls && activity.image_urls.length > 0 ? '140px' : '32px',
                                  background: `linear-gradient(to bottom, ${styles.color}, ${getActivityStyles(todayActivities[index + 1].activity_type).color})`,
                                }}
                              ></div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📝</div>
                      <p className="text-sm text-[#6d6d6d]">No activities logged today</p>
                      <p className="text-xs text-[#999] mt-1">Start by logging Walk, Feed, or Play activities</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty States */}
            {!isLoading && activeTab === 'current' && currentBookings.length === 0 && (
              <div className="px-4">
                <div className="bg-white rounded-[15px] p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-bold text-[#3e2d2e] mb-2">No Current Bookings</h3>
                  <p className="text-sm text-[#6d6d6d] mb-4">You don't have any current pet sitting assignments</p>
                  <button
                    onClick={() => navigate('/sitter/listing')}
                    className="px-6 py-3 bg-[#fb7678] text-white rounded-[30px] font-bold text-sm hover:bg-[#fa6568] transition-all"
                  >
                    Manage Your Listing
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'upcoming' && upcomingBookings.length === 0 && (
              <div className="px-4">
                <div className="bg-white rounded-[15px] p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                  <div className="text-6xl mb-4">⏰</div>
                  <h3 className="text-lg font-bold text-[#3e2d2e] mb-2">No Upcoming Bookings</h3>
                  <p className="text-sm text-[#6d6d6d]">You don't have any upcoming pet sitting assignments</p>
                </div>
              </div>
            )}

            {activeTab === 'past' && pastBookings.length === 0 && (
              <div className="px-4">
                <div className="bg-white rounded-[15px] p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-lg font-bold text-[#3e2d2e] mb-2">No Past Bookings</h3>
                  <p className="text-sm text-[#6d6d6d]">Your completed bookings will appear here</p>
                </div>
              </div>
            )}

            {/* Upcoming Bookings List */}
            {activeTab === 'upcoming' && upcomingBookings.length > 0 && (
              <div className="px-4 space-y-3">
                <h2 className="text-base font-bold text-[#3e2d2e] mb-3">
                  Upcoming Bookings ({upcomingBookings.length})
                </h2>
                {upcomingBookings.map(booking => (
                  <div key={booking.id}
                       onClick={() => handleBookingClick(booking)}
                       className="bg-white rounded-[10px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-black">{booking.listing?.title}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-xs text-[#6d6d6d] mb-2">
                      {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-[#e5e5e5]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ffd189] to-[#ffb347]"></div>
                        <span className="text-xs font-medium text-black">{booking.owner?.name}</span>
                      </div>
                      {booking.total_price && (
                        <span className="text-sm font-bold text-[#3e2d2e]">
                          ${(booking.total_price / 100).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Accept/Decline for pending */}
                    {booking.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => handleAcceptBooking(e, booking)}
                          disabled={processingBookingId === booking.id}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[20px] text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {processingBookingId === booking.id ? 'Processing...' : '✓ Accept'}
                        </button>
                        <button
                          onClick={(e) => handleDeclineBooking(e, booking)}
                          disabled={processingBookingId === booking.id}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-[20px] text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {processingBookingId === booking.id ? 'Processing...' : '✗ Decline'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Past Bookings List */}
            {activeTab === 'past' && pastBookings.length > 0 && (
              <div className="px-4 space-y-3">
                <h2 className="text-base font-bold text-[#3e2d2e] mb-3">
                  Past Bookings ({pastBookings.length})
                </h2>
                {pastBookings.map(booking => (
                  <div key={booking.id}
                       onClick={() => handlePastBookingClick(booking)}
                       className="bg-white rounded-[10px] p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                    <div className="flex gap-3">
                      {/* Pet Image/Icon */}
                      <div className="w-[74px] h-[70px] rounded-[10px] bg-gradient-to-br from-[#fb7678]/50 to-[#ffa8aa]/50 flex items-center justify-center text-3xl flex-shrink-0">
                        🐶
                      </div>

                      {/* Booking Info */}
                      <div className="flex-1 flex flex-col">
                        {/* Title and Status */}
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-black leading-normal">
                              {booking.listing?.title || 'Pet Sitting Service'}
                            </p>
                            {getStatusBadge(booking.status)}
                          </div>
                          <p className="text-[10px] font-light text-[#535353] leading-normal">
                            {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <div className="h-px bg-[#e5e5e5] my-1"></div>
                        </div>

                        {/* Owner and Price */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {booking.owner?.avatar_url ? (
                              <img
                                src={booking.owner.avatar_url}
                                alt={booking.owner.name}
                                className="w-[27px] h-[27px] rounded-full object-cover border border-gray-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-[27px] h-[27px] rounded-full bg-gradient-to-br from-[#ffd189] to-[#ffb347] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                {booking.owner?.name?.charAt(0).toUpperCase() || 'O'}
                              </div>
                            )}
                            <p className="text-xs font-medium text-black leading-normal">
                              {booking.owner?.name || 'Owner'}
                            </p>
                          </div>

                          {booking.total_price && (
                            <span className="text-sm font-bold text-[#3e2d2e]">
                              ${(booking.total_price / 100).toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* View Timeline Button */}
                        <div className="mt-2">
                          <div className="flex items-center gap-1 text-[#fb7678] text-xs font-semibold">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>View Timeline</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity Modal - 2 Step Process */}
        {activityModalOpen && selectedActivity && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={handleCloseActivityModal}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-[20px] shadow-2xl max-w-md w-full">
                {/* Close Button */}
                <button
                  onClick={handleCloseActivityModal}
                  className="absolute top-4 right-4 z-10 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Step 1: Question */}
                {activityModalStep === 1 && (
                  <div className="p-8">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        {selectedActivity === 'walk' && <img src="/icons/common/walk-icon.svg" alt="Walk" className="w-16 h-16" />}
                        {selectedActivity === 'feed' && <img src="/icons/common/feed-icon.svg" alt="Feed" className="w-16 h-16" />}
                        {selectedActivity === 'play' && <img src="/icons/common/play-icon.svg" alt="Play" className="w-16 h-16" />}
                      </div>
                      <h2 className="text-xl font-bold text-[#3e2d2e] mb-2">
                        {getActivityQuestion(selectedActivity)}
                      </h2>
                      <p className="text-sm text-[#6d6d6d]">Step 1 of 2</p>
                    </div>

                    <textarea
                      value={activityAnswer}
                      onChange={(e) => setActivityAnswer(e.target.value)}
                      placeholder={`e.g., ${
                        selectedActivity === 'walk' ? '2 miles around the park' :
                        selectedActivity === 'feed' ? '2 cups of dry food' :
                        'Fetch with a tennis ball'
                      }`}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-[15px] focus:ring-2 focus:ring-[#fb7678] focus:border-[#fb7678] transition-colors resize-none mb-6"
                      rows="4"
                    />

                    <button
                      onClick={handleStep1Continue}
                      className="w-full py-3 bg-[#fb7678] hover:bg-[#fa6568] text-white rounded-[30px] font-bold transition-all"
                    >
                      Continue to Photo Upload
                    </button>
                  </div>
                )}

                {/* Step 2: Image Upload */}
                {activityModalStep === 2 && (
                  <div className="p-8">
                    <div className="text-center mb-6">
                      <div className="text-5xl mb-4">📸</div>
                      <h2 className="text-xl font-bold text-[#3e2d2e] mb-2">
                        Upload Photos
                      </h2>
                      <p className="text-sm text-[#6d6d6d]">Step 2 of 2</p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    {activityImages.length === 0 ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-[15px] hover:border-[#fb7678] hover:bg-[#ffe5e5]/50 transition-all flex flex-col items-center justify-center gap-3 mb-6"
                      >
                        <div className="w-16 h-16 bg-[#ffe5e5] rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            Take or Upload Photos
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, or WEBP</p>
                        </div>
                      </button>
                    ) : (
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {Array.from(activityImages).map((file, index) => (
                            <div key={index} className="relative w-20 h-20">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover rounded-[10px]"
                              />
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sm text-[#fb7678] font-semibold"
                        >
                          + Add More Photos
                        </button>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setActivityModalStep(1)}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-[30px] font-semibold transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmitActivity}
                        disabled={isUploadingActivity || activityImages.length === 0}
                        className="flex-1 py-3 bg-[#fb7678] hover:bg-[#fa6568] text-white rounded-[30px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingActivity ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Uploading...
                          </span>
                        ) : (
                          'Submit Activity'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pawtastic Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative bg-white rounded-[30px] shadow-2xl p-8 max-w-sm w-full text-center animate-[bounce_0.6s_ease-in-out]">
              {/* <div className="text-7xl mb-4">🎉</div>
               */}
              <div className="mb-4 flex justify-center">
                <img 
                  src="/icons/common/pawtastic-icon.svg"
                  alt="Pawtastic" 
                  className="w-[100px] h-[100px]"
                />
              </div>
              <h2 className="text-3xl font-extrabold text-[#fb7678] mb-2">
                Pawtastic!
              </h2>
              <p className="text-base font-medium text-[#3e2d2e]">
                Pet's timeline has been updated
              </p>
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-[#fb7678] rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-[#fb7678] rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-[#fb7678] rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Detail Modal - Same as Owner's Bookings */}
        {isModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-60 transition-opacity backdrop-blur-sm"
              onClick={handleCloseModal}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={handleCloseModal}
                  className="absolute top-6 right-6 z-10 p-2 bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="overflow-y-auto max-h-[90vh]">
                  {/* Header with Gradient */}
                  <div className="bg-[#fb7678] px-8 py-8 text-white rounded-t-2xl">
                    <h2 className="text-3xl font-bold mb-3">Booking Details</h2>
                    <div className="inline-block">
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-8 py-6">
                    {/* Owner Info */}
                    <div className="mb-6 pb-6 border-b-2 border-gray-100">
                      <p className="text-xs text-gray-500 mb-3 uppercase font-semibold">Pet Owner</p>
                      <div className="flex items-center gap-4">
                        {selectedBooking.owner?.avatar_url ? (
                          <img
                            src={selectedBooking.owner.avatar_url}
                            alt={selectedBooking.owner.name}
                            className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {selectedBooking.owner?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{selectedBooking.owner?.name}</h3>
                          <p className="text-sm text-gray-600">{selectedBooking.listing?.title}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pet Details */}
                    {selectedBooking.pet_ids && selectedBooking.pet_ids.length > 0 && (
                      <div className="mb-6 pb-6 border-b-2 border-gray-100">
                        <p className="text-xs text-gray-500 mb-3 uppercase font-semibold">
                          Pet{selectedBooking.pet_ids.length > 1 ? 's' : ''} ({selectedBooking.pet_ids.length})
                        </p>
                        {loadingPets ? (
                          <p className="text-sm text-gray-500">Loading pet details...</p>
                        ) : bookingPets.length > 0 ? (
                          <div className="space-y-4">
                            {bookingPets.map((pet) => (
                              <div key={pet.id} className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-200">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                    🐾
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-lg font-bold text-gray-900">{pet.name}</h4>
                                    <p className="text-sm text-gray-600 capitalize">{pet.species}{pet.breed ? ` - ${pet.breed}` : ''}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                                  {pet.age && (
                                    <div>
                                      <span className="font-semibold text-gray-700">Age:</span>
                                      <span className="text-gray-600 ml-2">{pet.age} years</span>
                                    </div>
                                  )}
                                  {pet.weight && (
                                    <div>
                                      <span className="font-semibold text-gray-700">Weight:</span>
                                      <span className="text-gray-600 ml-2">{pet.weight} lbs</span>
                                    </div>
                                  )}
                                  {pet.gender && pet.gender !== 'unknown' && (
                                    <div>
                                      <span className="font-semibold text-gray-700">Gender:</span>
                                      <span className="text-gray-600 ml-2 capitalize">{pet.gender}</span>
                                    </div>
                                  )}
                                  {pet.temperament && (
                                    <div className="col-span-2">
                                      <span className="font-semibold text-gray-700">Temperament:</span>
                                      <span className="text-gray-600 ml-2">{pet.temperament}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Medical Information */}
                                {(pet.medical_conditions || pet.allergies || pet.medications) && (
                                  <div className="mt-4 pt-4 border-t border-orange-200">
                                    <p className="font-semibold text-gray-700 mb-2 flex items-center">
                                      <span className="text-red-500 mr-2">⚕️</span>
                                      Medical Information
                                    </p>
                                    {pet.medical_conditions && (
                                      <p className="text-sm text-gray-700 mb-1">
                                        <span className="font-semibold">Conditions:</span> {pet.medical_conditions}
                                      </p>
                                    )}
                                    {pet.allergies && (
                                      <p className="text-sm text-gray-700 mb-1">
                                        <span className="font-semibold">Allergies:</span> {pet.allergies}
                                      </p>
                                    )}
                                    {pet.medications && (
                                      <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Medications:</span> {pet.medications}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Special Needs & Care */}
                                {(pet.special_needs || pet.feeding_instructions) && (
                                  <div className="mt-4 pt-4 border-t border-orange-200">
                                    <p className="font-semibold text-gray-700 mb-2 flex items-center">
                                      <span className="text-blue-500 mr-2">📋</span>
                                      Care Instructions
                                    </p>
                                    {pet.special_needs && (
                                      <p className="text-sm text-gray-700 mb-1">
                                        <span className="font-semibold">Special Needs:</span> {pet.special_needs}
                                      </p>
                                    )}
                                    {pet.feeding_instructions && (
                                      <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Feeding:</span> {pet.feeding_instructions}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Vet Information */}
                                {(pet.vet_name || pet.vet_phone) && (
                                  <div className="mt-4 pt-4 border-t border-orange-200">
                                    <p className="font-semibold text-gray-700 mb-2 flex items-center">
                                      <span className="text-green-500 mr-2">🏥</span>
                                      Veterinarian
                                    </p>
                                    {pet.vet_name && (
                                      <p className="text-sm text-gray-700 mb-1">
                                        <span className="font-semibold">Name:</span> {pet.vet_name}
                                      </p>
                                    )}
                                    {pet.vet_phone && (
                                      <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Phone:</span> {pet.vet_phone}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No pet details available</p>
                        )}
                      </div>
                    )}

                    {/* Details sections similar to Owner's modal */}
                    <div className="space-y-6">
                      {/* Dates */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h4 className="text-sm font-semibold text-gray-700">Duration</h4>
                        </div>
                        <p className="text-lg font-bold text-gray-900 ml-11">
                          {new Date(selectedBooking.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          {' → '}
                          {new Date(selectedBooking.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-600 ml-11 mt-1">
                          {Math.ceil((new Date(selectedBooking.end_date) - new Date(selectedBooking.start_date)) / (1000 * 60 * 60 * 24))} days total
                        </p>
                      </div>

                      {/* Service Type */}
                      {selectedBooking.listing?.service_type && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Services</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedBooking.listing.service_type.map(service => (
                              <span key={service} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm rounded-full font-semibold shadow-md capitalize">
                                {service.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price */}
                      {selectedBooking.total_price && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h4 className="text-sm font-semibold text-gray-700">Total Price</h4>
                          </div>
                          <p className="text-3xl font-bold text-gray-900 ml-11">
                            ${(selectedBooking.total_price / 100).toFixed(2)}
                          </p>
                        </div>
                      )}

                      {/* Special Requests */}
                      {selectedBooking.special_requests && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Special Requests</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-200">
                            {selectedBooking.special_requests}
                          </p>
                        </div>
                      )}

                      {/* Cancellation Reason */}
                      {selectedBooking.status === 'cancelled' && selectedBooking.cancellation_reason && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Cancellation Reason</h4>
                          <p className="text-sm text-red-700 bg-red-50 rounded-xl p-4 border border-red-200">
                            {selectedBooking.cancellation_reason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t-2 border-gray-200 mt-6">
                      <button
                        onClick={() => handleGoToChat(selectedBooking)}
                        className="flex-1 px-6 py-4 bg-[#fb7678] hover:bg-[#fa6568] text-white rounded-[20px] font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Go to Chat
                      </button>
                      <button
                        onClick={handleCloseModal}
                        className="px-6 py-4 bg-gray-100 text-gray-700 rounded-[20px] font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Timeline Modal for Past Bookings */}
        {timelineModalOpen && selectedPastBooking && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={handleCloseTimelineModal}
            />

            {/* Modal */}
            <div className="flex min-h-full items-end sm:items-center justify-center">
              <div className="relative bg-white rounded-t-[20px] sm:rounded-[20px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                  onClick={handleCloseTimelineModal}
                  className="sticky top-4 right-4 z-10 float-right p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h2 className="text-base font-bold text-[#3e2d2e] mb-1">
                        {selectedPastBooking.listing?.title || 'Pet Sitting Service'} - Timeline
                      </h2>
                      <p className="text-base font-semibold text-[#fe8c85]">
                        {new Date(selectedPastBooking.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(selectedPastBooking.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoToChat(selectedPastBooking);
                      }}
                      className="px-3 py-2 bg-[#fb7678] hover:bg-[#fa6568] rounded-[15px] transition-all duration-300 hover:scale-105 flex items-center gap-2"
                    >
                      <span className="text-xs font-bold text-white whitespace-nowrap">💬 Message</span>
                    </button>
                  </div>
                </div>

                {/* Timeline Content */}
                <div className="px-6 pb-6">
                  {pastBookingActivities.length > 0 ? (
                    <div className="space-y-6">
                      {/* Group activities by date */}
                      {Object.entries(
                        pastBookingActivities.reduce((groups, activity) => {
                          const date = new Date(activity.activity_timestamp).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          });
                          if (!groups[date]) groups[date] = [];
                          groups[date].push(activity);
                          return groups;
                        }, {})
                      ).map(([date, activities]) => (
                        <div key={date}>
                          <h3 className="text-base font-semibold text-[#fe8c85] mb-4">{date}</h3>

                          <div className="space-y-4">
                            {activities.map((activity, index) => {
                              const isLast = index === activities.length - 1;
                              const activityColors = {
                                walk: { bg: '#ffd189', icon: '🚶' },
                                feed: { bg: '#a2d08a', icon: '🍖' },
                                play: { bg: '#c0a7fe', icon: '🎾' }
                              };
                              const color = activityColors[activity.activity_type] || activityColors.walk;

                              return (
                                <div key={activity.id} className="flex gap-3">
                                  {/* Timeline indicator */}
                                  <div className="flex flex-col items-center">
                                    <div
                                      className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-xl flex-shrink-0"
                                      style={{ backgroundColor: color.bg }}
                                    >
                                      {color.icon}
                                    </div>
                                    {!isLast && (
                                      <div
                                        className="w-[2px] flex-1 min-h-[60px]"
                                        style={{
                                          background: `linear-gradient(180deg, ${color.bg} 0%, ${activityColors[activities[index + 1]?.activity_type]?.bg || color.bg} 100%)`
                                        }}
                                      />
                                    )}
                                  </div>

                                  {/* Activity content */}
                                  <div className="flex-1 pb-4">
                                    <div className="flex items-start justify-between mb-1">
                                      <h4 className="text-sm font-semibold text-black capitalize">
                                        {activity.activity_type}
                                      </h4>
                                      <span className="text-xs text-[#6d6d6d]">
                                        {new Date(activity.activity_timestamp).toLocaleTimeString('en-US', {
                                          hour: 'numeric',
                                          minute: '2-digit',
                                          hour12: true
                                        })}
                                      </span>
                                    </div>

                                    {(activity.activity_description || activity.notes) && (
                                      <p className="text-xs text-[#6d6d6d] mb-2 leading-relaxed">
                                        {activity.activity_description || activity.notes}
                                      </p>
                                    )}

                                    {activity.image_urls && activity.image_urls.length > 0 && (
                                      <div className="grid grid-cols-3 gap-2 mt-2">
                                        {activity.image_urls.map((url, imgIndex) => (
                                          <img
                                            key={imgIndex}
                                            src={url}
                                            alt={`Activity ${imgIndex + 1}`}
                                            className="w-full aspect-square object-cover rounded-[10px]"
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">📝</div>
                      <h3 className="text-lg font-bold text-[#3e2d2e] mb-2">No Activities Logged</h3>
                      <p className="text-sm text-[#6d6d6d]">
                        No activities were recorded for this booking
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
       </div>
    </div>
  );
};

export default Dashboard;
