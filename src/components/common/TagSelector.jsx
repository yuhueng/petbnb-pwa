import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AVAILABLE_REVIEW_TAGS } from '../../services/reviewService';

const TagSelector = ({ selectedTags = [], onChange, maxSelections = 3 }) => {
  const [tags, setTags] = useState(selectedTags);

  // Sync with parent component's selectedTags
  useEffect(() => {
    setTags(selectedTags);
  }, [selectedTags]);

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
        <span className="text-xs text-[#6f6f6f]">
          Select exactly {maxSelections} tags that describe your experience
        </span>
        <span className="text-xs bg-[#fef5f6] text-[#fb7678] px-2 py-1 rounded-full border border-[#fb7678] font-semibold">
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
                px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
                ${selected
                  ? 'bg-[#fb7678] text-white border-[#fb7678] shadow-sm hover:bg-[#fa5d5f]'
                  : canSelectMore
                    ? 'bg-white border-[#e9e9e9] text-[#494a50] hover:border-[#fb7678] hover:bg-[#fef5f6]'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
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
        <p className="text-xs text-[#494a50] p-2 bg-[#fef5f6] border-l-4 border-[#fb7678] rounded">
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