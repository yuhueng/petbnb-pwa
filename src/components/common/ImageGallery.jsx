import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * ImageGallery Component
 * Displays listing images with hero image and thumbnails
 * Conditionally renders based on number of images available
 */
const ImageGallery = ({ images = [], title = 'Listing' }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  // Handle case where no images are provided
  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-500">No images available</p>
        </div>
      </div>
    );
  }

  // Single image - show only hero
  if (images.length === 1) {
    return (
      <div className="w-full">
        <img
          src={images[0]}
          alt={title}
          className="w-full aspect-[4/3] object-cover rounded-t-xl"
        />
      </div>
    );
  }

  // Multiple images - show hero + thumbnails
  const heroImage = images[selectedImage];
  const visibleThumbnails = images.slice(0, 4); // Show max 4 thumbnails
  const remainingCount = images.length - 4;

  return (
    <div className="w-full">
      {/* Hero Image */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-t-xl overflow-hidden">
        <img
          src={heroImage}
          alt={`${title} - Image ${selectedImage + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Image counter badge */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
          {selectedImage + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 p-3 bg-white">
        {visibleThumbnails.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`
              relative flex-1 aspect-square rounded-lg overflow-hidden
              transition-all duration-200
              ${
                selectedImage === index
                  ? 'ring-2 ring-[#fb7678] scale-105'
                  : 'ring-1 ring-gray-200 hover:ring-[#fb7678]/50'
              }
            `}
          >
            <img
              src={image}
              alt={`${title} thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {/* "+N more" overlay on last thumbnail if there are more images */}
            {index === 3 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  +{remainingCount} more
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

ImageGallery.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string,
};

export default ImageGallery;
