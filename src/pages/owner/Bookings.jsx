import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { supabase } from '@/services/supabase';
import { chatService } from '@/services/chatService';

/**
 * Owner's Bookings Page
 * Three tabs: Current, Upcoming, Past
 * Current tab shows Pet Care REQUEST cards (not routine)
 * Past tab shows timeline of activities logged by sitter
 */
const Bookings = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { bookings, isLoading, fetchOwnerBookings } = useBookingStore();

  const [activeTab, setActiveTab] = useState('current'); // 'current', 'upcoming', 'past'
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [selectedBookingForTimeline, setSelectedBookingForTimeline] = useState(null);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);

  // Track request cooldowns for spam prevention (15 minutes per type)
  const [requestCooldowns, setRequestCooldowns] = useState({});
  const [recentRequests, setRecentRequests] = useState([]);

  // Fetch owner bookings on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOwnerBookings(user.id);
      fetchRecentRequests(user.id);
    }
  }, [isAuthenticated, user, fetchOwnerBookings]);

  // Fetch recent requests from database (last 15 minutes)
  const fetchRecentRequests = async (ownerId) => {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('pet_care_requests')
        .select('*')
        .eq('pet_owner_id', ownerId)
        .gte('created_at', fifteenMinutesAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRecentRequests(data || []);
    } catch (error) {
      console.error('Error fetching recent requests:', error);
      setRecentRequests([]);
    }
  };

  // Refresh bookings when page gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && user) {
        fetchOwnerBookings(user.id);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, user, fetchOwnerBookings]);

  // Categorize bookings into current, upcoming, past
  const { currentBookings, upcomingBookings, pastBookings } = useMemo(() => {
    // Safety check: ensure bookings is an array
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return { currentBookings: [], upcomingBookings: [], pastBookings: [] };
    }

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

  // Fetch activities for a specific booking
  const fetchActivitiesForBooking = async (bookingId) => {
    setLoadingActivities(true);
    try {
      const { data, error } = await supabase
        .from('pet_activities')
        .select('*')
        .eq('booking_id', bookingId)
        .order('activity_timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    } finally {
      setLoadingActivities(false);
    }
  };

  // Handle view timeline click (past bookings)
  const handleViewTimeline = async (booking) => {
    setSelectedBookingForTimeline(booking);
    const fetchedActivities = await fetchActivitiesForBooking(booking.id);
    setActivities(fetchedActivities);
    setIsTimelineModalOpen(true);
  };

  // Close timeline modal
  const handleCloseTimelineModal = () => {
    setIsTimelineModalOpen(false);
    setSelectedBookingForTimeline(null);
    setActivities([]);
  };

  // Check if request is on cooldown (15 minutes) - checks both DB and client state
  const isRequestOnCooldown = (bookingId, requestType) => {
    // Check database records first (persistent across refreshes)
    const dbRequest = recentRequests.find(
      r => r.booking_id === bookingId && r.request_type === requestType
    );

    if (dbRequest) {
      const requestTime = new Date(dbRequest.created_at).getTime();
      const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);
      if (requestTime > fifteenMinutesAgo) {
        return true;
      }
    }

    // Also check client-side state (for requests just made in this session)
    const key = `${bookingId}-${requestType}`;
    const lastRequestTime = requestCooldowns[key];

    if (!lastRequestTime) return false;

    const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);
    return lastRequestTime > fifteenMinutesAgo;
  };

  // Get remaining cooldown time in minutes
  const getCooldownRemainingMinutes = (bookingId, requestType) => {
    // Check database records first
    const dbRequest = recentRequests.find(
      r => r.booking_id === bookingId && r.request_type === requestType
    );

    let lastRequestTime = null;

    if (dbRequest) {
      lastRequestTime = new Date(dbRequest.created_at).getTime();
    }

    // Check client-side state
    const key = `${bookingId}-${requestType}`;
    const clientRequestTime = requestCooldowns[key];

    // Use the most recent request time
    if (clientRequestTime && (!lastRequestTime || clientRequestTime > lastRequestTime)) {
      lastRequestTime = clientRequestTime;
    }

    if (!lastRequestTime) return 0;

    const elapsed = Date.now() - lastRequestTime;
    const fifteenMinutes = 15 * 60 * 1000;
    const remaining = fifteenMinutes - elapsed;

    return Math.ceil(remaining / 60000);
  };

  // Handle pet care request (walk, feed, play)
  const handleCareRequest = async (booking, requestType) => {
    if (!user) return;

    // Check cooldown
    if (isRequestOnCooldown(booking.id, requestType)) {
      const remaining = getCooldownRemainingMinutes(booking.id, requestType);
      alert(`Please wait ${remaining} more minute(s) before sending another ${requestType} request.`);
      return;
    }

    try {
      // Get or create conversation with sitter
      const conversation = await chatService.getOrCreateConversation(
        user.id,
        booking.pet_sitter_id
      );

      // Send message requesting photo
      const requestMessage = `Hi! Could you please share a photo of ${requestType === 'walk' ? 'the walk' : requestType === 'feed' ? 'feeding time' : 'playtime'}? Thank you! 🐾`;

      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: requestMessage,
          metadata: {
            type: 'pet_care_request',
            booking_id: booking.id,
            request_type: requestType,
          },
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Log the request in pet_care_requests table
      const { error: requestError } = await supabase
        .from('pet_care_requests')
        .insert({
          booking_id: booking.id,
          pet_owner_id: user.id,
          pet_sitter_id: booking.pet_sitter_id,
          request_type: requestType,
          conversation_id: conversation.id,
          message_id: message.id,
        });

      if (requestError) throw requestError;

      // Update cooldown in client state
      setRequestCooldowns(prev => ({
        ...prev,
        [`${booking.id}-${requestType}`]: Date.now(),
      }));

      // Refresh recent requests from database
      await fetchRecentRequests(user.id);

      alert(`${requestType.charAt(0).toUpperCase() + requestType.slice(1)} photo request sent successfully!`);
    } catch (error) {
      console.error('Error sending request:', error);
      alert('Failed to send request. Please try again.');
    }
  };

  // Render booking card
  const renderBookingCard = (booking) => {
    return (
      <article
        key={booking.id}
        className="bg-white rounded-[10px] shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)] p-3 sm:p-4 mb-3"
      >
        {/* Header with Sitter Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {booking.sitter?.avatar_url ? (
              <img
                src={booking.sitter.avatar_url}
                alt={booking.sitter.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] flex items-center justify-center text-white font-bold">
                {booking.sitter?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-bold text-sm text-[#3e2d2e]">{booking.sitter?.name}</h3>
              <p className="text-xs text-[#6d6d6d]">{booking.listing?.title}</p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            booking.status === 'confirmed' ? 'bg-[#a2d08a] text-white' :
            booking.status === 'pending' ? 'bg-[#ffc369] text-white' :
            booking.status === 'in_progress' ? 'bg-[#c0a7fe] text-white' :
            booking.status === 'completed' ? 'bg-[#fb7678] text-white' :
            'bg-[#d9d9d9] text-[#6d6d6d]'
          }`}>
            {booking.status}
          </span>
        </div>

        {/* Date Range */}
        <div className="bg-[#fef5f6] rounded-[10px] p-2 mb-2">
          <div className="flex items-center text-xs text-[#6d6d6d]">
            <img src="/icons/common/calendar-icon.svg" alt="Calendar" className="w-4 h-4 mr-2" />
            <span className="font-semibold">
              {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' - '}
              {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Price */}
        {booking.total_price && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6d6d6d]">Total</span>
            <span className="font-bold text-[#fb7678]">${(booking.total_price / 100).toFixed(2)}</span>
          </div>
        )}
      </article>
    );
  };

  // Render Pet Care REQUEST card (for current bookings)
  const renderCareRequestCard = (type, color, icon, activeBookings) => {
    // Get all current bookings for cooldown check
    const anyCooldown = activeBookings.some(b => isRequestOnCooldown(b.id, type));

    // Map request type to color-specific add icon
    const addIconMap = {
      walk: '/icons/common/add-yellow-icon.svg',
      feed: '/icons/common/add-green-icon.svg',
      play: '/icons/common/add-purple-icon.svg',
    };

    return (
      <div key={type} className="flex-shrink-0 w-[92px] sm:w-[106px]">
        <div
          className="relative bg-white rounded-[10px] cursor-pointer transition-transform hover:scale-105"
          onClick={() => {
            if (activeBookings.length === 1) {
              handleCareRequest(activeBookings[0], type);
            } else if (activeBookings.length > 1) {
              // Show booking selector if multiple current bookings
              alert('Multiple bookings active. Please go to messages to request updates.');
            } else {
              alert('No active bookings to request from.');
            }
          }}
        >
          <div className="w-full h-[12px] sm:h-[15px] rounded-t-[10px]" style={{ backgroundColor: color }}></div>
          <div className="flex flex-col items-center px-2 sm:px-3 pb-6 sm:pb-7 pt-1">
            <p className="text-xs sm:text-base font-bold mb-1.5" style={{ color }}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </p>
            <div
              className="w-[44px] h-[44px] sm:w-[54px] sm:h-[54px] rounded-[8px]"
              style={{ background: `linear-gradient(to bottom right, ${color}33, ${color}66)` }}
            >
              <img src={icon} alt={type} className="w-full h-full p-2" />
            </div>

            {/* Floating bottom icon - positioned absolutely */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
              {anyCooldown ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center shadow-md">
                  <img src="/icons/common/stopclock-icon.svg" alt="clock" className="w-6 h-6" />
                </div>
              ) : (
                <img
                  src={addIconMap[type]}
                  alt={`Add ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                  className="w-8 h-8 sm:w-10 sm:h-10 shadow-md bg-white rounded-full"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Group activities by date
  const groupActivitiesByDate = (activities) => {
    const grouped = {};

    activities.forEach(activity => {
      const date = new Date(activity.activity_timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(activity);
    });

    return grouped;
  };

  // Get activity color and icon
  const getActivityStyle = (type) => {
    switch (type) {
      case 'walk':
        return { color: '#ffc369', icon: '/icons/common/walk-icon.svg' };
      case 'feed':
        return { color: '#a2d08a', icon: '/icons/common/feed-icon.svg' };
      case 'play':
        return { color: '#c0a7fe', icon: '/icons/common/play-icon.svg' };
      default:
        return { color: '#d9d9d9', icon: null };
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] rounded-full flex items-center justify-center mb-4">
          <img src="/icons/common/calendar-icon.svg" alt="Calendar" className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-[#3e2d2e] mb-2 text-center">Please log in</h2>
        <p className="text-[#6d6d6d] mb-6 text-center">You need to be logged in to view bookings</p>
        <button
          onClick={() => navigate('/owner/profile')}
          className="px-6 py-3 bg-[#fb7678] text-white rounded-[20px] font-semibold hover:bg-[#fa6567] transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fef5f6] pb-20">
      <div className="max-w-[393px] mx-auto px-[22px] py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#3e2d2e] mb-1">My Bookings</h1>
          <p className="text-sm text-[#6d6d6d]">Track your pet care reservations</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-[20px] shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 px-4 py-2 rounded-[15px] font-semibold text-sm transition-all ${
              activeTab === 'current'
                ? 'bg-[#fb7678] text-white'
                : 'text-[#6d6d6d] hover:bg-[#fef5f6]'
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 px-4 py-2 rounded-[15px] font-semibold text-sm transition-all ${
              activeTab === 'upcoming'
                ? 'bg-[#fb7678] text-white'
                : 'text-[#6d6d6d] hover:bg-[#fef5f6]'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 px-4 py-2 rounded-[15px] font-semibold text-sm transition-all ${
              activeTab === 'past'
                ? 'bg-[#fb7678] text-white'
                : 'text-[#6d6d6d] hover:bg-[#fef5f6]'
            }`}
          >
            Past
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#fb7678]"></div>
          </div>
        )}

        {/* Current Tab */}
        {!isLoading && activeTab === 'current' && (
          <div>
            {currentBookings.length === 0 ? (
              <div className="bg-white rounded-[15px] p-8 text-center shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]">
                <div className="w-16 h-16 bg-[#fef5f6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <img src="/icons/common/calendar-icon.svg" alt="Calendar" className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[#3e2d2e] mb-2">No current bookings</h3>
                <p className="text-sm text-[#6d6d6d] mb-4">You don't have any ongoing bookings</p>
                <button
                  onClick={() => navigate('/owner/explore')}
                  className="px-6 py-2 bg-[#fb7678] text-white rounded-[20px] font-semibold text-sm hover:bg-[#fa6567] transition-colors"
                >
                  Find a Sitter
                </button>
              </div>
            ) : (
              <>
                {/* Booking Cards */}
                <div className="mb-4">
                  {currentBookings.map(renderBookingCard)}
                </div>

                {/* Pet Care REQUEST Cards */}
                <div className="bg-[#fb7678e6] rounded-[10px] p-3 sm:p-4 mb-4">
                  <h2 className="text-sm sm:text-base font-extrabold text-white mb-3 sm:mb-4 text-center">
                    Pet Care Request
                  </h2>

                  <div className="flex gap-2 justify-center">
                    {renderCareRequestCard('walk', '#ffc369', '/icons/common/walk-icon.svg', currentBookings)}
                    {renderCareRequestCard('feed', '#a2d08a', '/icons/common/feed-icon.svg', currentBookings)}
                    {renderCareRequestCard('play', '#c0a7fe', '/icons/common/play-icon.svg', currentBookings)}
                  </div>

                  <p className="text-[10px] text-white text-center mt-10 opacity-90">
                    Request photo updates from your sitter
                  </p>
                  <p className="text-[10px] text-white text-center opacity-90">
                    (15min cooldown per type)
                  </p>
                  
                </div>

                {/* Instructions */}
                <div className="bg-white rounded-[10px] p-3 text-xs text-[#6d6d6d] shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]">
                  <p className="font-semibold mb-1">💡 How it works:</p>
                  <p>Tap a request card to send a message to your sitter asking for a photo update. Each request type has a 15-minute cooldown to prevent spam.</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Upcoming Tab */}
        {!isLoading && activeTab === 'upcoming' && (
          <div>
            {upcomingBookings.length === 0 ? (
              <div className="bg-white rounded-[15px] p-8 text-center shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]">
                <div className="w-16 h-16 bg-[#fef5f6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <img src="/icons/common/calendar-icon.svg" alt="Calendar" className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[#3e2d2e] mb-2">No upcoming bookings</h3>
                <p className="text-sm text-[#6d6d6d] mb-4">Your future bookings will appear here</p>
                <button
                  onClick={() => navigate('/owner/explore')}
                  className="px-6 py-2 bg-[#fb7678] text-white rounded-[20px] font-semibold text-sm hover:bg-[#fa6567] transition-colors"
                >
                  Find a Sitter
                </button>
              </div>
            ) : (
              <div>
                {upcomingBookings.map(renderBookingCard)}
              </div>
            )}
          </div>
        )}

        {/* Past Tab */}
        {!isLoading && activeTab === 'past' && (
          <div>
            {pastBookings.length === 0 ? (
              <div className="bg-white rounded-[15px] p-8 text-center shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]">
                <div className="w-16 h-16 bg-[#fef5f6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <img src="/icons/common/calendar-icon.svg" alt="Calendar" className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[#3e2d2e] mb-2">No past bookings</h3>
                <p className="text-sm text-[#6d6d6d]">Completed bookings will appear here</p>
              </div>
            ) : (
              <div>
                {pastBookings.map(booking => (
                  <article
                    key={booking.id}
                    className="bg-white rounded-[10px] shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)] p-3 sm:p-4 mb-3"
                  >
                    {/* Header with Sitter Info */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {booking.sitter?.avatar_url ? (
                          <img
                            src={booking.sitter.avatar_url}
                            alt={booking.sitter.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] flex items-center justify-center text-white font-bold">
                            {booking.sitter?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-sm text-[#3e2d2e]">{booking.sitter?.name}</h3>
                          <p className="text-xs text-[#6d6d6d]">{booking.listing?.title}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.status === 'completed' ? 'bg-[#fb7678] text-white' :
                        'bg-[#d9d9d9] text-[#6d6d6d]'
                      }`}>
                        {booking.status}
                      </span>
                    </div>

                    {/* Date Range */}
                    <div className="bg-[#fef5f6] rounded-[10px] p-2 mb-3">
                      <div className="flex items-center text-xs text-[#6d6d6d]">
                        <img src="/icons/common/calendar-icon.svg" alt="Calendar" className="w-4 h-4 mr-2" />
                        <span className="font-semibold">
                          {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' - '}
                          {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* View Timeline Button */}
                    <button
                      onClick={() => handleViewTimeline(booking)}
                      className="w-full px-4 py-2 bg-[#fb7678] text-white rounded-[10px] font-semibold text-sm hover:bg-[#fa6567] transition-colors"
                    >
                      View Timeline
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timeline Modal */}
        {isTimelineModalOpen && selectedBookingForTimeline && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-60 transition-opacity backdrop-blur-sm"
              onClick={handleCloseTimelineModal}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-[20px] shadow-2xl max-w-[393px] w-full max-h-[90vh] overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={handleCloseTimelineModal}
                  className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <svg className="w-5 h-5 text-[#6d6d6d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="overflow-y-auto max-h-[90vh]">
                  {/* Header */}
                  <div className="bg-[#fb7678] px-6 py-6 text-white">
                    <h2 className="text-xl font-bold mb-2">Activity Timeline</h2>
                    <p className="text-sm opacity-90">{selectedBookingForTimeline.sitter?.name}</p>
                    <p className="text-xs opacity-75">
                      {new Date(selectedBookingForTimeline.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' - '}
                      {new Date(selectedBookingForTimeline.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Timeline Content */}
                  <div className="px-6 py-4">
                    {loadingActivities ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#fb7678]"></div>
                      </div>
                    ) : activities.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 bg-[#fef5f6] rounded-full flex items-center justify-center mx-auto mb-3">
                          <img src="/icons/common/calendar-icon.svg" alt="No activities" className="w-8 h-8" />
                        </div>
                        <p className="text-sm text-[#6d6d6d]">No activities recorded yet</p>
                      </div>
                    ) : (
                      Object.entries(groupActivitiesByDate(activities)).map(([date, dateActivities], dateIndex) => (
                        <div key={dateIndex} className="mb-6">
                          <h3 className="text-base font-bold text-[#3e2d2e] mb-1">{date}</h3>
                          <div className="space-y-6">
                            {dateActivities.map((activity, activityIndex) => {
                              const { color, icon } = getActivityStyle(activity.activity_type);
                              const timeStr = new Date(activity.activity_timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              });

                              return (
                                <div key={activity.id} className="relative">
                                  <div className="flex items-start gap-3">
                                    {/* Activity Icon */}
                                    <div
                                      className="w-[42px] h-[42px] rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{ backgroundColor: color }}
                                    >
                                      {icon && <img src={icon} alt={activity.activity_type} className="w-6 h-6" />}
                                    </div>

                                    {/* Activity Details */}
                                    <div className="flex-1 pt-1">
                                      <div className="flex items-start justify-between mb-1">
                                        <p className="text-sm font-semibold text-black">{activity.activity_title}</p>
                                        <p className="text-xs text-[#6d6d6d] ml-2">{timeStr}</p>
                                      </div>

                                      {activity.activity_description && (
                                        <p className="text-xs text-[#6d6d6d] mb-2">{activity.activity_description}</p>
                                      )}

                                      {/* Image Gallery */}
                                      {activity.image_urls && activity.image_urls.length > 0 && (
                                        <div className="flex gap-2 flex-wrap">
                                          {activity.image_urls.map((url, i) => (
                                            <img
                                              key={i}
                                              src={url}
                                              alt={`${activity.activity_type} ${i + 1}`}
                                              className="w-[100px] h-[100px] rounded-[10px] object-cover shadow-sm"
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Connecting Line */}
                                  {activityIndex < dateActivities.length - 1 && (
                                    <div
                                      className="absolute left-[20px] w-0.5 h-6 mt-1"
                                      style={{
                                        background: `linear-gradient(to bottom, ${color}, ${getActivityStyle(dateActivities[activityIndex + 1].activity_type).color})`
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
