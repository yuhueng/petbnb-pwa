import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import RatingDisplay from './RatingDisplay';
import reviewService from '../../services/reviewService';

/**
 * ReviewsModal Component
 * Displays all reviews for a listing/sitter in a modal
 */
const ReviewsModal = ({ isOpen, onClose, sitterId, listingTitle }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && sitterId) {
      fetchReviews();
    }
  }, [isOpen, sitterId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await reviewService.getReviewsBySitter(sitterId);
      setReviews(result.reviews || []);
      setAverageRating(result.averageRating || 0);
      setTotalReviews(result.totalReviews || 0);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-x-0 bottom-0 sm:inset-4 sm:mx-auto sm:max-w-2xl">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
              {listingTitle && (
                <p className="text-sm text-gray-500 mt-1">{listingTitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Overall Rating */}
          {!loading && totalReviews > 0 && (
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-br from-[#ffe5e5]/30 to-[#fcf3f3]">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">out of 5</div>
                </div>
                <div className="flex-1">
                  <RatingDisplay
                    rating={averageRating}
                    totalReviews={totalReviews}
                    size="medium"
                    showCount={true}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fb7678]"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-gray-300 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                <p className="text-gray-500">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                    {/* Reviewer info */}
                    <div className="flex items-start gap-3 mb-3">
                      {review.reviewer?.avatar_url ? (
                        <img
                          src={review.reviewer.avatar_url}
                          alt={review.reviewer.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ffd189] to-[#ffb347] flex items-center justify-center text-white text-sm font-bold">
                          {review.reviewer?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {review.reviewer?.name || 'Anonymous'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(review.created_at)}
                            </p>
                          </div>
                          <RatingDisplay
                            rating={review.rating}
                            totalReviews={0}
                            size="small"
                            showCount={false}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Review content */}
                    {review.title && (
                      <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                    )}
                    {review.comment && (
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    )}

                    {/* Sitter response */}
                    {review.response && (
                      <div className="mt-4 ml-6 pl-4 border-l-2 border-[#fb7678]/30 bg-gray-50 p-3 rounded-r-lg">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          Response from host
                        </p>
                        <p className="text-sm text-gray-700">{review.response}</p>
                        {review.response_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(review.response_at)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ReviewsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sitterId: PropTypes.string,
  listingTitle: PropTypes.string,
};

export default ReviewsModal;
