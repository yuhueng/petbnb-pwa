import React, { useState } from 'react';
import PropTypes from 'prop-types';
import StarRating from '../common/StarRating';
import TagSelector from '../common/TagSelector';
import { reviewService } from '../../services/reviewService';

/**
 * Review Form Component
 * Allows pet owners to submit reviews for completed bookings
 * Styled according to PetBNB design system
 */
const ReviewForm = ({
  bookingId,
  sitterId,
  reviewerId,
  sitterName,
  petNames,
  onReviewSubmitted,
  onCancel
}) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }

    if (!title.trim()) {
      setError('Please add a review title');
      return;
    }

    if (!comment.trim()) {
      setError('Please write a review comment');
      return;
    }

    if (tags.length !== 3) {
      setError('Please select exactly 3 tags');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if review already exists
      const reviewExists = await reviewService.checkReviewExists(bookingId, reviewerId);
      if (reviewExists) {
        setError('You have already submitted a review for this booking');
        return;
      }

      // Create review
      const reviewData = {
        booking_id: bookingId,
        reviewer_id: reviewerId,
        sitter_id: sitterId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        tags
      };

      await reviewService.createReview(reviewData);

      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
      setTags([]);
      onReviewSubmitted();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[393px] mx-auto bg-white rounded-xl shadow-md p-4 transition-all duration-300 hover:shadow-lg">
      {/* Header Section */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-2">
          Review Your Experience
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          with <span className="font-medium text-[var(--color-text-primary)]">{sitterName}</span>
          {petNames && petNames.length > 0 && (
             <span className="font-medium text-[var(--color-text-primary)]">caring for {petNames.join(', ')}</span>
          )}
        </p>
      </div>

      {/* Star Rating Section */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
          Overall Rating
        </label>
        <StarRating
          value={rating}
          onChange={setRating}
          size="large"
        />
      </div>

      {/* Review Title Section */}
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">
          Review Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience in a few words"
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all duration-300"
          maxLength={100}
        />
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)] text-right">
          {title.length}/100 characters
        </p>
      </div>

      {/* Review Comment Section */}
      <div className="mb-4">
        <label htmlFor="comment" className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">
          Review Details
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us more about your experience..."
          rows={5}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none transition-all duration-300"
          maxLength={1000}
        />
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)] text-right">
          {comment.length}/1000 characters
        </p>
      </div>

      {/* Tag Selector Section */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
          Select 3 Tags
        </label>
        <TagSelector
          selectedTags={tags}
          onChange={setTags}
          maxSelections={3}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-gray)] rounded-full hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-300"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
};

ReviewForm.propTypes = {
  bookingId: PropTypes.string.isRequired,
  sitterId: PropTypes.string.isRequired,
  reviewerId: PropTypes.string.isRequired,
  sitterName: PropTypes.string.isRequired,
  petNames: PropTypes.arrayOf(PropTypes.string),
  onReviewSubmitted: PropTypes.func,
  onCancel: PropTypes.func
};

export default ReviewForm;