import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { bookings, isLoading, fetchSitterBookings } = useBookingStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Fetch sitter bookings on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSitterBookings(user.id);
    }
  }, [isAuthenticated, user, fetchSitterBookings]);

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

  // Filter confirmed bookings
  const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed');

  // Get calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Month navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if a date has bookings
  const getBookingsForDate = (day) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return confirmedBookings.filter(booking => {
      const startDate = booking.start_date.split('T')[0];
      const endDate = booking.end_date.split('T')[0];
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  // Check if date is today
  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
           month === today.getMonth() &&
           year === today.getFullYear();
  };

  // Generate calendar days array
  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Bookings Calendar</h1>
        <p className="text-text-secondary">View and manage your confirmed bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-text-primary">{confirmedBookings.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">This Month</p>
              <p className="text-3xl font-bold text-text-primary">
                {confirmedBookings.filter(b => {
                  const bookingMonth = new Date(b.start_date).getMonth();
                  const bookingYear = new Date(b.start_date).getFullYear();
                  return bookingMonth === month && bookingYear === year;
                }).length}
              </p>
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
              <p className="text-3xl font-bold text-text-primary">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-primary">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={goToToday}
                    className="px-3 py-1 text-sm bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-text-secondary py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const dayBookings = getBookingsForDate(day);
                  const hasBookings = dayBookings.length > 0;
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={day}
                      className={`aspect-square border rounded-lg p-1 cursor-pointer transition-all ${
                        isTodayDate
                          ? 'border-primary-500 bg-primary-50'
                          : hasBookings
                          ? 'border-green-300 bg-green-50 hover:bg-green-100'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => hasBookings && setSelectedBooking(dayBookings[0])}
                    >
                      <div className="flex flex-col h-full">
                        <span className={`text-sm font-medium ${
                          isTodayDate ? 'text-primary-700' : 'text-text-primary'
                        }`}>
                          {day}
                        </span>
                        {hasBookings && (
                          <div className="flex-1 flex flex-col justify-end">
                            <div className="bg-green-500 rounded-full w-2 h-2 mb-1"></div>
                            <span className="text-xs text-text-success font-medium">
                              {dayBookings.length}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Booking Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">Booking Details</h3>

              {selectedBooking ? (
                <div className="space-y-4">
                  {/* Pet Owner Info */}
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-xs text-text-tertiary mb-2">Pet Owner</p>
                    <div className="flex items-center gap-3">
                      {selectedBooking.owner?.avatar_url ? (
                        <img
                          src={selectedBooking.owner.avatar_url}
                          alt={selectedBooking.owner.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-700 font-semibold">
                            {selectedBooking.owner?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-text-primary">{selectedBooking.owner?.name}</p>
                        <p className="text-xs text-text-tertiary">Owner</p>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <p className="text-xs text-text-tertiary mb-2">Duration</p>
                    <div className="flex items-center text-sm text-text-secondary">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">
                        {new Date(selectedBooking.start_date).toLocaleDateString()} - {new Date(selectedBooking.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-1 ml-6">
                      {Math.ceil((new Date(selectedBooking.end_date) - new Date(selectedBooking.start_date)) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>

                  {/* Service Type */}
                  {selectedBooking.listing?.service_type && (
                    <div>
                      <p className="text-xs text-text-tertiary mb-2">Service</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedBooking.listing.service_type.map(service => (
                          <span key={service} className="px-2 py-1 bg-blue-100 text-text-info-dark text-xs rounded-full font-medium capitalize">
                            {service.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  {selectedBooking.total_price && (
                    <div>
                      <p className="text-xs text-text-tertiary mb-2">Total Price</p>
                      <p className="text-2xl font-bold text-text-primary">
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

                  {/* Status Badge */}
                  <div className="pt-4 border-t border-gray-200">
                    <span className="inline-flex px-3 py-1 bg-green-100 text-text-success-dark text-sm rounded-full font-medium">
                      ✓ Confirmed
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-text-disabled mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-text-tertiary text-sm">
                    Click on a date with bookings to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && confirmedBookings.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-24 h-24 text-text-disabled mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-text-primary mb-2">No confirmed bookings yet</h3>
          <p className="text-text-secondary mb-6">
            When pet owners book your services, they'll appear here
          </p>
          <button
            onClick={() => navigate('/sitter/listing')}
            className="px-6 py-3 bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Manage Your Listing
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
