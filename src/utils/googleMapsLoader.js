/**
 * Google Maps API Loader Utility
 * Loads the Google Maps JavaScript API dynamically and provides helper functions
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Singapore bounds for location restriction
export const SINGAPORE_BOUNDS = {
  west: 103.6,
  north: 1.47,
  east: 104.0,
  south: 1.16,
};

// Singapore center point
export const SINGAPORE_CENTER = { lat: 1.3521, lng: 103.8198 };

let isGoogleMapsLoaded = false;
let googleMapsPromise = null;

/**
 * Load Google Maps JavaScript API
 * @returns {Promise<void>}
 */
export const loadGoogleMaps = () => {
  if (isGoogleMapsLoaded) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error('Google Maps API key is not configured'));
      return;
    }

    if (window.google?.maps) {
      isGoogleMapsLoaded = true;
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Global callback function
    window.initGoogleMaps = () => {
      isGoogleMapsLoaded = true;
      resolve();
      delete window.initGoogleMaps;
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

/**
 * Check if Google Maps API is loaded
 * @returns {boolean}
 */
export const isGoogleMapsAPILoaded = () => {
  return isGoogleMapsLoaded && window.google?.maps;
};

/**
 * Get Google Maps library
 * Loads the API if not already loaded
 * @returns {Promise<typeof google.maps>}
 */
export const getGoogleMaps = async () => {
  await loadGoogleMaps();
  return window.google.maps;
};
