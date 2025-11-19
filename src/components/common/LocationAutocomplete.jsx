import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { loadGoogleMaps, SINGAPORE_BOUNDS, SINGAPORE_CENTER } from '@/utils/googleMapsLoader';

/**
 * LocationAutocomplete Component
 * Provides Google Maps Place Autocomplete for Singapore locations
 * Uses session tokens for cost optimization as per Google Maps API best practices
 */
const LocationAutocomplete = ({ value, onChange, placeholder, className, disabled }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [autocompleteService, setAutocompleteService] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const isSelectingRef = useRef(false); // Track if we're in the process of selecting

  // Initialize Google Maps API and services
  useEffect(() => {
    const initGoogleMaps = async () => {
      try {
        await loadGoogleMaps();

        // Initialize Autocomplete Service
        const autocomplete = new window.google.maps.places.AutocompleteService();
        setAutocompleteService(autocomplete);

        // Initialize Places Service (requires a div element)
        const placesServiceDiv = document.createElement('div');
        const places = new window.google.maps.places.PlacesService(placesServiceDiv);
        setPlacesService(places);

        // Create session token
        const token = new window.google.maps.places.AutocompleteSessionToken();
        setSessionToken(token);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
      }
    };

    initGoogleMaps();
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    // Use 'click' instead of 'mousedown' to allow suggestion clicks to register first
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle input change and fetch suggestions
  const handleInputChange = async (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (!newValue.trim() || !autocompleteService || !sessionToken) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    try {
      const request = {
        input: newValue,
        locationBias: {
          // Restrict to Singapore bounds
          west: SINGAPORE_BOUNDS.west,
          north: SINGAPORE_BOUNDS.north,
          east: SINGAPORE_BOUNDS.east,
          south: SINGAPORE_BOUNDS.south,
        },
        origin: SINGAPORE_CENTER,
        language: 'en-US',
        region: 'sg', // Singapore region
        sessionToken: sessionToken,
      };

      autocompleteService.getPlacePredictions(request, (predictions, status) => {
        setIsLoading(false);

        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      });
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      setIsLoading(false);
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (prediction) => {
    if (!placesService) return;

    // Set flag to prevent blur handler from interfering
    isSelectingRef.current = true;
    setIsLoading(true);

    // Get place details
    const request = {
      placeId: prediction.place_id,
      fields: ['formatted_address', 'name', 'geometry'],
      sessionToken: sessionToken,
    };

    placesService.getDetails(request, (place, status) => {
      setIsLoading(false);

      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const selectedAddress = place.formatted_address || prediction.description;
        setInputValue(selectedAddress);
        setShowSuggestions(false);

        // Call onChange with the selected address
        if (onChange) {
          onChange({
            address: selectedAddress,
            lat: place.geometry?.location?.lat() || null,
            lng: place.geometry?.location?.lng() || null,
            placeId: prediction.place_id,
          });
        }

        // Create a new session token for the next autocomplete session
        const newToken = new window.google.maps.places.AutocompleteSessionToken();
        setSessionToken(newToken);
      }

      // Reset the selecting flag after a brief delay
      setTimeout(() => {
        isSelectingRef.current = false;
      }, 100);
    });
  };

  // Handle manual input (when user types without selecting)
  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      // Don't process blur if we're in the middle of selecting a suggestion
      if (isSelectingRef.current) {
        return;
      }

      if (inputValue !== value) {
        // User typed but didn't select a suggestion
        if (onChange) {
          onChange({
            address: inputValue,
            lat: null,
            lng: null,
            placeId: null,
          });
        }
      }
    }, 200);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder || 'Enter location in Singapore'}
        disabled={disabled}
        className={className || 'w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fb7678] focus:border-transparent'}
        autoComplete="off"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#fb7678]"></div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur from firing
                handleSelectSuggestion(suggestion);
              }}
              className="w-full px-4 py-3 text-left hover:bg-[#ffe5e5] transition-colors border-b border-gray-100 last:border-b-0 flex items-start gap-3"
            >
              <svg
                className="w-5 h-5 text-[#fb7678] mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-[#3e2d2e] font-medium text-sm truncate">
                  {suggestion.structured_formatting?.main_text || suggestion.description}
                </p>
                <p className="text-[#6d6d6d] text-xs truncate">
                  {suggestion.structured_formatting?.secondary_text || ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

LocationAutocomplete.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default LocationAutocomplete;
