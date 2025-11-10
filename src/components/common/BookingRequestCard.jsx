import { useState, useEffect } from 'react';
import { useBookingStore } from '@/store/bookingStore';

/**
 * BookingRequestCard Component
 * Displays a booking request with Accept/Decline buttons for sitters
 * @param {Object} props
 * @param {string} props.bookingId - The booking ID
 * @param {string} props.currentUserId - Current user ID
 * @param {string} props.conversationId - Conversation ID for sending response messages
 */
const BookingRequestCard = ({ bookingId, currentUserId, conversationId }) => {
  const { fetchBookingById, acceptBooking, declineBooking } = useBookingStore();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    setIsLoading(true);
    try {
      const result = await fetchBookingById(bookingId);
      if (result.success) {
        setBooking(result.booking);
      }
    } catch (error) {
      console.error('Failed to load booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const result = await acceptBooking(bookingId, currentUserId, conversationId);
      if (result.success) {
        setBooking(result.booking);
      }
    } catch (error) {
      console.error('Failed to accept booking:', error);
      alert('Failed to accept booking. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    const reason = prompt('Optional: Provide a reason for declining (or leave blank)');
    setIsDeclining(true);
    try {
      const result = await declineBooking(bookingId, currentUserId, conversationId, reason);
      if (result.success) {
        setBooking(result.booking);
      }
    } catch (error) {
      console.error('Failed to decline booking:', error);
      alert('Failed to decline booking. Please try again.');
    } finally {
      setIsDeclining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#fcf3f3] border border-[#ffa8aa] rounded-lg p-4 my-2">
        <div className="animate-pulse">
          <div className="h-4 bg-[#ffe5e5] rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-[#ffe5e5] rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-2">
        <p className="text-text-secondary text-sm">Booking not found</p>
      </div>
    );
  }

  const isSitter = booking.pet_sitter_id === currentUserId;
  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';
  const isCancelled = booking.status === 'cancelled';

  // Status badge
  const getStatusBadge = () => {
    if (isConfirmed) {
      return (
        <span className="px-2 py-1 bg-green-100 text-text-success-dark text-xs rounded-full font-medium">
          ✓ Confirmed
        </span>
      );
    }
    if (isCancelled) {
      return (
        <span className="px-2 py-1 bg-red-100 text-text-error-dark text-xs rounded-full font-medium">
          ✗ Declined
        </span>
      );
    }
    if (isPending) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-text-warning-dark text-xs rounded-full font-medium">
          ⏱ Pending
        </span>
      );
    }
    return null;
  };

  // Calculate number of days
  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-gradient-to-br from-[#fcf3f3] to-[#ffe5e5] border-2 border-[#ffa8aa] rounded-lg p-4 my-2 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="font-bold text-text-primary">Booking Request</h3>
        </div>
        {getStatusBadge()}
      </div>

      {/* Booking Details */}
      <div className="space-y-2 mb-4">
        {/* Listing */}
        <div className="flex items-start">
          <svg className="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <div>
            <p className="text-sm font-medium text-text-primary">{booking.listing?.title}</p>
            <p className="text-xs text-text-secondary">
              {booking.listing?.service_type?.join(', ')}
            </p>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center">
          <svg className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-text-secondary">
            <span className="font-medium">{startDate.toLocaleDateString()}</span>
            {' → '}
            <span className="font-medium">{endDate.toLocaleDateString()}</span>
            <span className="text-text-tertiary ml-1">({days} {days === 1 ? 'day' : 'days'})</span>
          </p>
        </div>

        {/* Price */}
        {booking.total_price && (
          <div className="flex items-center">
            <svg className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-text-secondary">
              Total: <span className="font-bold text-text-primary">${(booking.total_price / 100).toFixed(2)}</span>
            </p>
          </div>
        )}

        {/* Special Requests */}
        {booking.special_requests && (
          <div className="mt-3 p-2 bg-white bg-opacity-50 rounded border border-[#ffa8aa]">
            <p className="text-xs font-medium text-text-secondary mb-1">Special Requests:</p>
            <p className="text-sm text-text-secondary">{booking.special_requests}</p>
          </div>
        )}

        {/* Requester Info */}
        <div className="flex items-center mt-3 pt-3 border-t border-[#ffa8aa]">
          {booking.owner?.avatar_url ? (
            <img
              src={booking.owner.avatar_url}
              alt={booking.owner.name}
              className="w-8 h-8 rounded-full mr-2"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#ffe5e5] flex items-center justify-center mr-2">
              <span className="text-[#fb7678] font-semibold text-sm">
                {booking.owner?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-xs text-text-tertiary">Requested by</p>
            <p className="text-sm font-medium text-text-primary">{booking.owner?.name}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons (only for sitter and pending status) */}
      {isSitter && isPending && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-[#ffa8aa]">
          <button
            onClick={handleAccept}
            disabled={isAccepting || isDeclining}
            className="flex-1 px-4 py-2 bg-green-600 text-text-inverse rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isAccepting ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Accepting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept
              </>
            )}
          </button>
          <button
            onClick={handleDecline}
            disabled={isAccepting || isDeclining}
            className="flex-1 px-4 py-2 bg-red-600 text-text-inverse rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isDeclining ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Declining...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Decline
              </>
            )}
          </button>
        </div>
      )}

      {/* Cancellation Reason */}
      {isCancelled && booking.cancellation_reason && (
        <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
          <p className="text-xs font-medium text-text-error mb-1">Reason:</p>
          <p className="text-sm text-text-error">{booking.cancellation_reason}</p>
        </div>
      )}
    </div>
  );
};

export default BookingRequestCard;
