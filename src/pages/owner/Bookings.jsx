import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { chatService } from '@/services/chatService';

const Bookings = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { bookings, isLoading, fetchOwnerBookings } = useBookingStore();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'past'

  // Fetch owner bookings on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOwnerBookings(user.id);
    }
  }, [isAuthenticated, user, fetchOwnerBookings]);

  // Refresh bookings when page gains focus (to see sitter's updates)
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && user) {
        fetchOwnerBookings(user.id);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, user, fetchOwnerBookings]);

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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Please log in to view bookings</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to manage your bookings</p>
        <button
          onClick={() => navigate('/owner/profile')}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-xl transition-all"
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

  // Navigate to chat with sitter
  const handleGoToChat = async () => {
    if (!selectedBooking || !user) return;

    try {
      // Get or create conversation with sitter
      const conversation = await chatService.getOrCreateConversation(user.id, selectedBooking.pet_sitter_id);

      // Navigate to messages with the conversation
      navigate('/owner/messages', { state: { conversationId: conversation.id } });
    } catch (error) {
      console.error('Failed to navigate to chat:', error);
      alert('Failed to open chat. Please try again.');
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

  // Separate bookings into current and past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentBookings = bookings.filter(b => {
    const endDate = new Date(b.end_date);
    endDate.setHours(0, 0, 0, 0);
    return (
      (b.status === 'confirmed' || b.status === 'pending' || b.status === 'in_progress') &&
      endDate >= today
    );
  });

  const pastBookings = bookings.filter(b => {
    const endDate = new Date(b.end_date);
    endDate.setHours(0, 0, 0, 0);
    return (
      b.status === 'completed' ||
      b.status === 'cancelled' ||
      endDate < today
    );
  });

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
          {/* Header with Sitter Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              {booking.sitter?.avatar_url ? (
                <img
                  src={booking.sitter.avatar_url}
                  alt={booking.sitter.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {booking.sitter?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{booking.sitter?.name}</h3>
                <p className="text-xs text-gray-500">Pet Sitter</p>
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
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-600 mt-1">Manage your pet care reservations</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-3 bg-white p-2 rounded-xl shadow-md">
            <button
              onClick={() => setActiveTab('current')}
              className={`min-w-[120px] sm:min-w-[160px] px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'current'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Current ({currentBookings.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`min-w-[120px] sm:min-w-[160px] px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'past'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Past ({pastBookings.length})
              </div>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Current Bookings */}
        {!isLoading && activeTab === 'current' && (
          <div>
            {currentBookings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No current bookings</h3>
                <p className="text-gray-600 mb-6">You don't have any upcoming or ongoing bookings</p>
                <button
                  onClick={() => navigate('/owner/explore')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Book a Sitter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentBookings.map(renderBookingCard)}
              </div>
            )}
          </div>
        )}

        {/* Past Bookings */}
        {!isLoading && activeTab === 'past' && (
          <div>
            {pastBookings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No past bookings</h3>
                <p className="text-gray-600">Your completed and cancelled bookings will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastBookings.map(renderBookingCard)}
              </div>
            )}
          </div>
        )}

        {/* Booking Detail Modal */}
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
                  <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-8 text-white">
                    <h2 className="text-3xl font-bold mb-3">Booking Details</h2>
                    <div className="inline-block">
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-8 py-6">
                    {/* Sitter Info */}
                    <div className="mb-6 pb-6 border-b-2 border-gray-100">
                      <p className="text-xs text-gray-500 mb-3 uppercase font-semibold">Pet Sitter</p>
                      <div className="flex items-center gap-4">
                        {selectedBooking.sitter?.avatar_url ? (
                          <img
                            src={selectedBooking.sitter.avatar_url}
                            alt={selectedBooking.sitter.name}
                            className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {selectedBooking.sitter?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{selectedBooking.sitter?.name}</h3>
                          <p className="text-sm text-gray-600">{selectedBooking.listing?.title}</p>
                        </div>
                      </div>
                    </div>

                    {/* Booking Info */}
                    <div className="space-y-6 mb-6">
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
                    <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
                      <button
                        onClick={handleGoToChat}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Go to Chat
                      </button>
                      <button
                        onClick={handleCloseModal}
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
        )}
      </div>
    </div>
  );
};

export default Bookings;
