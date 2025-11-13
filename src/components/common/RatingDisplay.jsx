import React from 'react';
import PropTypes from 'prop-types';

/**
 * RatingDisplay Component
 * Displays star ratings with filled/half/empty stars and review count
 */
const RatingDisplay = ({ rating = 0, totalReviews = 0, size = 'medium', showCount = true }) => {
  // Size configurations
  const sizeClasses = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5',
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  const starSize = sizeClasses[size] || sizeClasses.medium;
  const textSize = textSizeClasses[size] || textSizeClasses.medium;

  // Render individual star based on fill level
  const renderStar = (index) => {
    const fillLevel = Math.min(Math.max(rating - index, 0), 1);

    if (fillLevel === 0) {
      // Empty star
      return (
        <svg
          key={index}
          className={`${starSize} text-gray-300`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    } else if (fillLevel >= 1) {
      // Full star
      return (
        <svg
          key={index}
          className={`${starSize} text-[#FFB800]`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    } else {
      // Half star
      return (
        <svg
          key={index}
          className={`${starSize} text-[#FFB800]`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <defs>
            <linearGradient id={`half-${index}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#half-${index})`}
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
      );
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((index) => renderStar(index))}
      </div>

      {/* Rating number */}
      <span className={`${textSize} font-semibold text-gray-900`}>
        {rating > 0 ? rating.toFixed(1) : '0.0'}
      </span>

      {/* Review count */}
      {showCount && (
        <span className={`${textSize} text-gray-500`}>
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

RatingDisplay.propTypes = {
  rating: PropTypes.number,
  totalReviews: PropTypes.number,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showCount: PropTypes.bool,
};

export default RatingDisplay;
