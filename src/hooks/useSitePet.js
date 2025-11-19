import { useEffect, useRef } from 'react';

/**
 * React hook to create and manage a site-pet instance
 * @param {string} containerId - The ID of the container element where the pet will roam
 * @param {string} spritePath - Path to the sprite image (e.g., '/images/dogs-spritesheet.png')
 * @param {boolean} enabled - Whether the pet should be displayed (defaults to true)
 * @returns {Object} petRef - Reference to the pet element
 */
export const useSitePet = (containerId, spritePath = '/images/dogs-spritesheet.png', enabled = true) => {
  const petRef = useRef(null);
  const intervalRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // If disabled, clean up and return
    if (!enabled) {
      if (petRef.current && petRef.current.parentNode) {
        petRef.current.remove();
        petRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      initializedRef.current = false;
      return;
    }

    // Prevent double initialization
    if (initializedRef.current) return;

    // Import the createSitePet function from the utility
    const initPet = async () => {
      try {
        // Dynamically import the site-pet module
        const { createSitePet } = await import('@/utils/site-pet.js');

        const container = document.getElementById(containerId);
        if (!container) {
          console.warn(`Container with id "${containerId}" not found`);
          return;
        }

        // Clean up any existing pets in the container
        const existingPets = container.querySelectorAll('[style*="background-image"]');
        existingPets.forEach(pet => {
          if (pet.style.backgroundImage.includes('dogs-spritesheet')) {
            pet.remove();
          }
        });

        // Create the pet with custom sprite path
        petRef.current = createSitePet(spritePath);

        if (petRef.current) {
          // Move pet from body to container
          if (petRef.current.parentNode === document.body) {
            document.body.removeChild(petRef.current);
          }
          container.appendChild(petRef.current);

          // Initialize position to middle of container
          if (petRef.current.initPosition) {
            petRef.current.initPosition();
          }

          // Constrain pet to container bounds
          constrainPetToContainer(petRef.current, container, intervalRef);

          // Mark as initialized
          initializedRef.current = true;
        }
      } catch (error) {
        console.error('Error initializing site-pet:', error);
      }
    };

    initPet();

    // Cleanup function
    return () => {
      if (petRef.current && petRef.current.parentNode) {
        petRef.current.remove();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      initializedRef.current = false;
    };
  }, [containerId, spritePath, enabled]);

  return petRef;
};

/**
 * Constrains the pet element to stay within the container bounds
 * @param {HTMLElement} petElement - The pet DOM element
 * @param {HTMLElement} container - The container DOM element
 * @param {Object} intervalRef - Reference to store the interval
 */
function constrainPetToContainer(petElement, container, intervalRef) {
  const checkBounds = () => {
    if (!petElement || !container) return;

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    let x = parseInt(petElement.style.left) || 0;
    let y = parseInt(petElement.style.top) || 0;
    let adjusted = false;

    // Get pet dimensions
    const petWidth = 64; // From site-pet.js
    const petHeight = 64;

    // Check left boundary
    if (x < 0) {
      x = 0;
      adjusted = true;
    }

    // Check right boundary
    if (x + petWidth > containerWidth) {
      x = containerWidth - petWidth;
      adjusted = true;
    }

    // Check top boundary
    if (y < 0) {
      y = 0;
      adjusted = true;
    }

    // Check bottom boundary
    if (y + petHeight > containerHeight) {
      y = containerHeight - petHeight;
      adjusted = true;
    }

    if (adjusted) {
      petElement.style.left = `${x}px`;
      petElement.style.top = `${y}px`;
    }
  };

  // Store interval reference for cleanup
  intervalRef.current = setInterval(checkBounds, 100);
}

export default useSitePet;
