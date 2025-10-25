// Note: Using JSDoc for type definitions since we're using JavaScript
// These can be converted to TypeScript types later if needed

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} role - 'owner' | 'sitter' | 'both'
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} userId
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} [avatar]
 * @property {string} [bio]
 * @property {string} [phone]
 * @property {string} [address]
 * @property {string} [city]
 * @property {string} [state]
 * @property {string} [zipCode]
 * @property {number} [latitude]
 * @property {number} [longitude]
 * @property {boolean} isSitter
 * @property {boolean} isOwner
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Pet
 * @property {string} id
 * @property {string} ownerId
 * @property {string} name
 * @property {string} type - 'dog' | 'cat' | 'bird' | etc.
 * @property {string} breed
 * @property {string} size - 'small' | 'medium' | 'large' | 'xlarge'
 * @property {number} age
 * @property {string} [photo]
 * @property {string} [description]
 * @property {string} [medicalInfo]
 * @property {string} [specialNeeds]
 * @property {boolean} isVaccinated
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Listing
 * @property {string} id
 * @property {string} sitterId
 * @property {string} title
 * @property {string} description
 * @property {string[]} services
 * @property {string[]} petTypes
 * @property {string[]} petSizes
 * @property {number} maxPets
 * @property {number} pricePerDay
 * @property {string[]} photos
 * @property {string[]} amenities
 * @property {string} [homeType]
 * @property {boolean} hasYard
 * @property {string} [cancellationPolicy]
 * @property {boolean} isActive
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Booking
 * @property {string} id
 * @property {string} ownerId
 * @property {string} sitterId
 * @property {string} listingId
 * @property {string[]} petIds
 * @property {string} startDate
 * @property {string} endDate
 * @property {string} status - 'pending' | 'accepted' | 'declined' | etc.
 * @property {number} totalPrice
 * @property {string} [specialInstructions]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} senderId
 * @property {string} receiverId
 * @property {string} [bookingId]
 * @property {string} content
 * @property {string} [mediaUrl]
 * @property {string} [mediaType]
 * @property {boolean} isRead
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} bookingId
 * @property {string} reviewerId
 * @property {string} revieweeId
 * @property {number} rating
 * @property {string} comment
 * @property {string[]} [photos]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Certificate
 * @property {string} id
 * @property {string} sitterId
 * @property {string} type - 'pet_first_aid' | 'veterinary' | etc.
 * @property {string} name
 * @property {string} issuer
 * @property {string} issueDate
 * @property {string} [expiryDate]
 * @property {string} documentUrl
 * @property {boolean} isVerified
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Wishlist
 * @property {string} id
 * @property {string} ownerId
 * @property {string} sitterId
 * @property {string} createdAt
 */

/**
 * @typedef {Object} SearchFilters
 * @property {string} [location]
 * @property {number} [latitude]
 * @property {number} [longitude]
 * @property {number} [distance]
 * @property {string} [startDate]
 * @property {string} [endDate]
 * @property {string[]} [petTypes]
 * @property {string[]} [services]
 * @property {number} [minRating]
 * @property {number} [maxPrice]
 * @property {string[]} [amenities]
 */

export {};
