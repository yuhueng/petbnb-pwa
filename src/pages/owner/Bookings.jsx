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

  // Fetch owner bookings on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOwnerBookings(user.id);
    }
  }, [isAuthenticated, user, fetchOwnerBookings]);

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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Please log in to view bookings</h2>
        <p className="text-text-secondary mb-6">You need to be logged in to manage your bookings</p>
        <button
          onClick={() => navigate('/owner/profile')}
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
          <span className="px-3 py-1 bg-green-100 text-text-success-dark text-sm rounded-full font-medium">
            ✓ Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-text-warning-dark text-sm rounded-full font-medium">
            ⏱ Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 bg-red-100 text-text-error-dark text-sm rounded-full font-medium">
            ✗ Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  // Separate bookings by status
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">My Bookings</h1>
        <p className="text-text-secondary">View and manage your pet care bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Confirmed</p>
              <p className="text-3xl font-bold text-text-primary">{confirmedBookings.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Pending</p>
              <p className="text-3xl font-bold text-text-primary">{pendingBookings.length}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Total</p>
              <p className="text-3xl font-bold text-text-primary">{bookings.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && bookings.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-24 h-24 text-text-disabled mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-text-primary mb-2">No bookings yet</h3>
          <p className="text-text-secondary mb-6">Start by exploring pet sitters and making your first booking</p>
          <button
            onClick={() => navigate('/owner/explore')}
            className="px-6 py-3 bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Explore Sitters
          </button>
        </div>
      )}

      {/* Bookings List */}
      {!isLoading && bookings.length > 0 && (
        <div className="space-y-6">
          {/* Confirmed Bookings */}
          {confirmedBookings.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">Confirmed Bookings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {confirmedBookings.map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => handleBookingClick(booking)}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-green-500"
                  >
                    {/* Sitter Info */}
                    <div className="flex items-center gap-3 mb-3">
                      {booking.sitter?.avatar_url ? (
                        <img
                          src={booking.sitter.avatar_url}
                          alt={booking.sitter.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-semibold text-lg">
                            {booking.sitter?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">{booking.sitter?.name}</h3>
                        <p className="text-xs text-text-tertiary">Pet Sitter</p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    {/* Listing Title */}
                    <h4 className="font-medium text-text-primary mb-2">{booking.listing?.title}</h4>

                    {/* Dates */}
                    <div className="flex items-center text-sm text-text-secondary mb-2">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Price */}
                    {booking.total_price && (
                      <div className="text-right">
                        <span className="text-2xl font-bold text-text-primary">
                          ${(booking.total_price / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Bookings */}
          {pendingBookings.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">Pending Bookings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => handleBookingClick(booking)}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-yellow-500"
                  >
                    {/* Sitter Info */}
                    <div className="flex items-center gap-3 mb-3">
                      {booking.sitter?.avatar_url ? (
                        <img
                          src={booking.sitter.avatar_url}
                          alt={booking.sitter.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-semibold text-lg">
                            {booking.sitter?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">{booking.sitter?.name}</h3>
                        <p className="text-xs text-text-tertiary">Pet Sitter</p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    {/* Listing Title */}
                    <h4 className="font-medium text-text-primary mb-2">{booking.listing?.title}</h4>

                    {/* Dates */}
                    <div className="flex items-center text-sm text-text-secondary mb-2">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Price */}
                    {booking.total_price && (
                      <div className="text-right">
                        <span className="text-2xl font-bold text-text-primary">
                          ${(booking.total_price / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancelled Bookings */}
          {cancelledBookings.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">Cancelled Bookings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cancelledBookings.map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => handleBookingClick(booking)}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-red-500 opacity-75"
                  >
                    {/* Sitter Info */}
                    <div className="flex items-center gap-3 mb-3">
                      {booking.sitter?.avatar_url ? (
                        <img
                          src={booking.sitter.avatar_url}
                          alt={booking.sitter.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-semibold text-lg">
                            {booking.sitter?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">{booking.sitter?.name}</h3>
                        <p className="text-xs text-text-tertiary">Pet Sitter</p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    {/* Listing Title */}
                    <h4 className="font-medium text-text-primary mb-2">{booking.listing?.title}</h4>

                    {/* Dates */}
                    <div className="flex items-center text-sm text-text-secondary mb-2">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Price */}
                    {booking.total_price && (
                      <div className="text-right">
                        <span className="text-2xl font-bold text-text-primary">
                          ${(booking.total_price / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Detail Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleCloseModal}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Content */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-text-primary mb-4">Booking Details</h2>

                {/* Status Badge */}
                <div className="mb-4">
                  {getStatusBadge(selectedBooking.status)}
                </div>

                {/* Sitter Info */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-xs text-text-tertiary mb-2">Pet Sitter</p>
                  <div className="flex items-center gap-3">
                    {selectedBooking.sitter?.avatar_url ? (
                      <img
                        src={selectedBooking.sitter.avatar_url}
                        alt={selectedBooking.sitter.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-700 font-semibold text-2xl">
                          {selectedBooking.sitter?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">{selectedBooking.sitter?.name}</h3>
                      <p className="text-sm text-text-secondary">{selectedBooking.listing?.title}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Info */}
                <div className="space-y-4 mb-6">
                  {/* Dates */}
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Duration</p>
                    <div className="flex items-center text-text-secondary">
                      <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">
                        {new Date(selectedBooking.start_date).toLocaleDateString()} - {new Date(selectedBooking.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-1 ml-7">
                      {Math.ceil((new Date(selectedBooking.end_date) - new Date(selectedBooking.start_date)) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>

                  {/* Service Type */}
                  {selectedBooking.listing?.service_type && (
                    <div>
                      <p className="text-xs text-text-tertiary mb-2">Services</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedBooking.listing.service_type.map(service => (
                          <span key={service} className="px-3 py-1 bg-blue-100 text-text-info-dark text-sm rounded-full font-medium capitalize">
                            {service.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  {selectedBooking.total_price && (
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Total Price</p>
                      <p className="text-3xl font-bold text-text-primary">
                        ${(selectedBooking.total_price / 100).toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Special Requests */}
                  {selectedBooking.special_requests && (
                    <div>
                      <p className="text-xs text-text-tertiary mb-2">Special Requests</p>
                      <p className="text-sm text-text-secondary bg-gray-50 rounded-lg p-3">
                        {selectedBooking.special_requests}
                      </p>
                    </div>
                  )}

                  {/* Cancellation Reason */}
                  {selectedBooking.status === 'cancelled' && selectedBooking.cancellation_reason && (
                    <div>
                      <p className="text-xs text-text-tertiary mb-2">Cancellation Reason</p>
                      <p className="text-sm text-text-error bg-red-50 rounded-lg p-3 border border-red-200">
                        {selectedBooking.cancellation_reason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleGoToChat}
                    className="flex-1 px-6 py-3 bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Go to Chat
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-gray-200 text-text-secondary rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
