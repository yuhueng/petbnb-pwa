// App Configuration
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'PetBNB';
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
export const MOCK_API_DELAY = parseInt(import.meta.env.VITE_MOCK_API_DELAY || '500', 10);

// User Roles
export const USER_ROLES = {
  OWNER: 'owner',
  SITTER: 'sitter',
  BOTH: 'both',
};

// Pet Types
export const PET_TYPES = {
  DOG: 'dog',
  CAT: 'cat',
  BIRD: 'bird',
  RABBIT: 'rabbit',
  FISH: 'fish',
  REPTILE: 'reptile',
  OTHER: 'other',
};

// Pet Sizes
export const PET_SIZES = {
  SMALL: 'small', // < 10kg
  MEDIUM: 'medium', // 10-25kg
  LARGE: 'large', // 25-45kg
  XLARGE: 'xlarge', // > 45kg
};

// Service Types
export const SERVICE_TYPES = {
  DOG_BOARDING: 'dog_boarding',
  DOG_SITTING: 'dog_sitting',
  DOG_WALKING: 'dog_walking',
  CAT_SITTING: 'cat_sitting',
  DROP_IN_VISITS: 'drop_in_visits',
  DAYCARE: 'daycare',
};

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Certification Types
export const CERTIFICATION_TYPES = {
  PET_FIRST_AID: 'pet_first_aid',
  VETERINARY: 'veterinary',
  PROFESSIONAL_GROOMING: 'professional_grooming',
  ANIMAL_BEHAVIOR: 'animal_behavior',
  DOG_TRAINING: 'dog_training',
  OTHER: 'other',
};

// Review Ratings
export const RATING_VALUES = [1, 2, 3, 4, 5];

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  TIME: 'HH:mm',
  DATETIME: 'MMM dd, yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
};

// Pagination
export const ITEMS_PER_PAGE = 20;

// Image Settings
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Search Filters
export const DISTANCE_OPTIONS = [5, 10, 25, 50, 100]; // in km

// Availability
export const AVAILABILITY_TIMES = [
  '00:00',
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
];

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'petbnb_auth_token',
  USER_PROFILE: 'petbnb_user_profile',
  ACTIVE_ROLE: 'petbnb_active_role',
  THEME: 'petbnb_theme',
  SEARCH_HISTORY: 'petbnb_search_history',
  ONBOARDING_COMPLETE: 'petbnb_onboarding_complete',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  // Owner Routes
  OWNER_EXPLORE: '/owner/explore',
  OWNER_WISHLIST: '/owner/wishlist',
  OWNER_BOOKINGS: '/owner/bookings',
  OWNER_MESSAGES: '/owner/messages',
  OWNER_PROFILE: '/owner/profile',
  // Sitter Routes
  SITTER_DASHBOARD: '/sitter/dashboard',
  SITTER_CERTIFICATES: '/sitter/certificates',
  SITTER_LISTING: '/sitter/listing',
  SITTER_MESSAGES: '/sitter/messages',
  SITTER_PROFILE: '/sitter/profile',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};
