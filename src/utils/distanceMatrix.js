/**
 * Google Maps Distance Matrix Utility
 * Calculates distances between locations using Google Maps Distance Matrix API
 */

import { loadGoogleMaps } from './googleMapsLoader';

/**
 * Calculate distance between two locations
 * @param {Object} origin - Origin location {lat, lng}
 * @param {Object} destination - Destination location {lat, lng}
 * @returns {Promise<Object>} Distance data {distance: number (meters), distanceText: string, duration: number (seconds), durationText: string}
 */
export const calculateDistance = async (origin, destination) => {
  if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
    return null;
  }

  try {
    await loadGoogleMaps();

    const service = new window.google.maps.DistanceMatrixService();

    return new Promise((resolve, reject) => {
      service.getDistanceMatrix(
        {
          origins: [{ lat: origin.lat, lng: origin.lng }],
          destinations: [{ lat: destination.lat, lng: destination.lng }],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC, // Use kilometers
          region: 'sg', // Singapore region
        },
        (response, status) => {
          if (status === 'OK' && response.rows[0]?.elements[0]?.status === 'OK') {
            const element = response.rows[0].elements[0];
            resolve({
              distance: element.distance.value, // in meters
              distanceText: element.distance.text, // e.g., "2.5 km"
              duration: element.duration.value, // in seconds
              durationText: element.duration.text, // e.g., "10 mins"
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error calculating distance:', error);
    return null;
  }
};

/**
 * Calculate distances from one origin to multiple destinations
 * @param {Object} origin - Origin location {lat, lng}
 * @param {Array<Object>} destinations - Array of destination locations [{lat, lng}, ...]
 * @returns {Promise<Array<Object>>} Array of distance data or null for each destination
 */
export const calculateDistances = async (origin, destinations) => {
  if (!origin?.lat || !origin?.lng || !destinations || destinations.length === 0) {
    return destinations.map(() => null);
  }

  try {
    await loadGoogleMaps();

    const service = new window.google.maps.DistanceMatrixService();

    // Filter out invalid destinations
    const validDestinations = destinations.filter(dest => dest?.lat && dest?.lng);

    if (validDestinations.length === 0) {
      return destinations.map(() => null);
    }

    return new Promise((resolve, reject) => {
      service.getDistanceMatrix(
        {
          origins: [{ lat: origin.lat, lng: origin.lng }],
          destinations: validDestinations.map(dest => ({ lat: dest.lat, lng: dest.lng })),
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
          region: 'sg',
        },
        (response, status) => {
          if (status === 'OK') {
            const results = response.rows[0].elements.map((element, index) => {
              if (element.status === 'OK') {
                return {
                  distance: element.distance.value,
                  distanceText: element.distance.text,
                  duration: element.duration.value,
                  durationText: element.duration.text,
                };
              }
              return null;
            });
            resolve(results);
          } else {
            resolve(destinations.map(() => null));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error calculating distances:', error);
    return destinations.map(() => null);
  }
};

/**
 * Format distance for display
 * @param {number} distanceInMeters - Distance in meters
 * @returns {string} Formatted distance (e.g., "2.5km")
 */
export const formatDistance = (distanceInMeters) => {
  if (!distanceInMeters && distanceInMeters !== 0) {
    return null;
  }

  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  }

  const km = distanceInMeters / 1000;
  return `${km.toFixed(1)}km`;
};
