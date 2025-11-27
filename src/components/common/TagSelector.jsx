import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { AVAILABLE_REVIEW_TAGS } from '../../services/reviewService';

const TagSelector = ({ selectedTags = [], onChange, maxSelections = 3 }) => {
  const [tags, setTags] = useState(selectedTags);

  const handleTagClick = (tag) => {
    let newTags;

    if (tags.includes(tag)) {
      // Remove tag if already selected
      newTags = tags.filter(t => t !== tag);
    } else if (tags.length < maxSelections) {
      // Add tag if under limit
      newTags = [...tags, tag];
    } else {
      // Don't add if over limit
      return;
    }

    setTags(newTags);
    if (onChange) {
      onChange(newTags);
    }
  };

  const isSelected = (tag) => tags.includes(tag);
  const canSelectMore = tags.length < maxSelections;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-[var(--color-text-primary)]">
          Select {maxSelections} tags that describe your experience
        </label>
        <span className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-primary-softest)] px-2 py-1 rounded-full border border-[var(--color-primary)]">
          {tags.length}/{maxSelections}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {AVAILABLE_REVIEW_TAGS.map((tag) => {
          const selected = isSelected(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              disabled={!selected && !canSelectMore}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border-2
                ${selected
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm hover:bg-[var(--color-primary-hover)]'
                  : canSelectMore
                    ? 'bg-white border-gray-300 text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:bg-gray-50'
                    : 'bg-[var(--color-bg-gray)] border-gray-200 text-[var(--color-text-light)] cursor-not-allowed'
                }
              `}
              aria-label={`${selected ? 'Remove' : 'Add'} tag: ${tag}`}
              aria-pressed={selected}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {!canSelectMore && (
        <p className="text-xs text-[var(--color-text-secondary)] p-2 bg-[var(--color-primary-softest)] border-l-3 border-[var(--color-primary)] rounded">
          Maximum of {maxSelections} tags selected. Remove a tag to select a different one.
        </p>
      )}
    </div>
  );
};

TagSelector.propTypes = {
  selectedTags: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  maxSelections: PropTypes.number
};

export default TagSelector;