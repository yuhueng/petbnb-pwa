import { useState } from 'react';
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
    <div className="w-full max-w-[600px] mx-auto bg-white rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] p-6">
      {/* Header Section */}
      <div className="mb-5 border-b border-[#e9e9e9] pb-4">
        <h2 className="text-xl font-bold text-[#1d1a20] mb-2">
          Review Your Experience
        </h2>
        <p className="text-sm text-[#494a50]">
          with <span className="font-semibold text-[#1d1a20]">{sitterName}</span>
          {petNames && petNames.length > 0 && (
            <> caring for <span className="font-semibold text-[#1d1a20]">{petNames.join(', ')}</span></>
          )}
        </p>
      </div>

      {/* Star Rating Section */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-[#494a50] mb-2">
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
        <label htmlFor="title" className="block text-sm font-semibold text-[#494a50] mb-2">
          Review Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience in a few words"
          className="w-full px-3 py-2 border border-[#e9e9e9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678] text-sm"
          maxLength={100}
        />
        <p className="mt-1 text-xs text-[#6f6f6f] text-right">
          {title.length}/100 characters
        </p>
      </div>

      {/* Review Comment Section */}
      <div className="mb-4">
        <label htmlFor="comment" className="block text-sm font-semibold text-[#494a50] mb-2">
          Review Details
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us more about your experience..."
          rows={5}
          className="w-full px-3 py-2 border border-[#e9e9e9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678] resize-none text-sm"
          maxLength={1000}
        />
        <p className="mt-1 text-xs text-[#6f6f6f] text-right">
          {comment.length}/1000 characters
        </p>
      </div>

      {/* Tag Selector Section */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-[#494a50] mb-2">
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
        <div className="mb-4 p-4 bg-[#fef5f6] border border-[#fb7678] rounded-lg text-sm text-[#fb7678]">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-[#e9e9e9]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-[15px] font-semibold hover:bg-gray-200 active:scale-98 transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-[#fb7678] text-white rounded-lg text-[15px] font-semibold hover:bg-[#fa5d5f] active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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