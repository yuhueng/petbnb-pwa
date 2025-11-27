import React, { useState } from 'react';
import PropTypes from 'prop-types';

const StarRating = ({
  value = 0,
  onChange,
  readonly = false,
  size = 'large',
  showValue = true
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const starSize = sizeClasses[size] || sizeClasses.large;
  const textSize = textSizes[size] || textSizes.large;

  const handleStarClick = (rating) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleStarHover = (rating) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleStarLeave = () => {
    if (!readonly) {
      setHoverValue(0);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1"
        onMouseLeave={handleStarLeave}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hoverValue || value);
          return (
            <button
              key={star}
              type="button"
              className={`${starSize} transition-all duration-200 ${
                readonly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:scale-110'
              }`}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              disabled={readonly}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill={filled ? '#FFC369' : 'none'}
                stroke={filled ? '#FFC369' : '#E5E5E5'}
                strokeWidth="2"
                className="w-full h-full"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          );
        })}
      </div>
      {showValue && (
        <span
          className={`font-semibold ${textSize}`}
          style={{
            color: value > 0 ? '#FFC369' : 'var(--color-text-tertiary)'
          }}
        >
          {value > 0 ? `${value}.0` : '0.0'}
        </span>
      )}
    </div>
  );
};

StarRating.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
  readonly: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showValue: PropTypes.bool
};

export default StarRating;