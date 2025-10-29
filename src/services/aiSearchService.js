/**
 * AI Search Service
 * Uses OpenAI to parse natural language queries and extract structured search criteria
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Parse a natural language search query using OpenAI
 * @param {string} query - The user's natural language search query
 * @returns {Promise<Object>} Structured search criteria
 */
export const parseSearchQuery = async (query) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const systemPrompt = `You are a search query parser for a pet sitting marketplace. Parse the user's natural language query and extract relevant search criteria.

Return a JSON object with the following structure (only include fields that are mentioned or clearly implied):
{
  "city": "string - city name if mentioned",
  "service_type": "string - one of: boarding, daycare, walking, grooming",
  "accepted_pet_types": "string - one of: dog, cat, bird, rabbit, hamster, other",
  "accepted_pet_sizes": "array - can include: small, medium, large",
  "amenities": "array - can include: fenced_yard, air_conditioning, pool, etc.",
  "date_range": {
    "start": "YYYY-MM-DD format if mentioned",
    "end": "YYYY-MM-DD format if mentioned"
  },
  "price_range": {
    "min": "number in dollars if mentioned",
    "max": "number in dollars if mentioned"
  },
  "understanding": "string - A friendly summary of what you understood from the query"
}

Important rules:
- Only include fields that are clearly mentioned or strongly implied in the query
- For location, extract city names, neighborhood names, or areas
- Be flexible with synonyms (e.g., "overnight care" = "boarding", "day visits" = "daycare", "walks" = "walking")
- If pet size is mentioned (small, medium, large, tiny, big), include it
- Extract amenities if mentioned (yard, pool, AC, outdoor space, etc.)
- The "understanding" field should be a natural, friendly summary that confirms what you extracted

Examples:
- "dog sitter in Brooklyn with a fenced yard" → {"city": "Brooklyn", "accepted_pet_types": "dog", "amenities": ["fenced_yard"], "understanding": "Looking for dog sitting services in Brooklyn with a fenced yard"}
- "overnight boarding for small dogs" → {"service_type": "boarding", "accepted_pet_types": "dog", "accepted_pet_sizes": ["small"], "understanding": "Looking for overnight boarding for small dogs"}
- "cat sitter near downtown this weekend" → {"accepted_pet_types": "cat", "understanding": "Looking for cat sitting services near downtown this weekend"}

Return ONLY the JSON object, no additional text.`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // Parse the JSON response
    const parsedCriteria = JSON.parse(content);

    // Clean up the data - remove empty values
    const cleanedCriteria = {};
    Object.keys(parsedCriteria).forEach((key) => {
      const value = parsedCriteria[key];
      if (value !== null && value !== undefined && value !== '') {
        // For arrays, only include if not empty
        if (Array.isArray(value)) {
          if (value.length > 0) {
            cleanedCriteria[key] = value;
          }
        }
        // For objects, only include if has properties
        else if (typeof value === 'object') {
          if (Object.keys(value).length > 0) {
            cleanedCriteria[key] = value;
          }
        }
        // For other values, include as-is
        else {
          cleanedCriteria[key] = value;
        }
      }
    });

    return cleanedCriteria;
  } catch (error) {
    console.error('Error parsing search query with AI:', error);
    throw error;
  }
};

/**
 * Convert AI parsed criteria to listing store filter format
 * @param {Object} aiCriteria - Criteria from AI parsing
 * @returns {Object} Filter object for listing store
 */
export const convertToListingFilters = (aiCriteria) => {
  const filters = {};

  // Map AI criteria to listing filter fields
  if (aiCriteria.city) {
    filters.city = aiCriteria.city;
  }

  if (aiCriteria.service_type) {
    filters.service_type = aiCriteria.service_type;
  }

  if (aiCriteria.accepted_pet_types) {
    filters.accepted_pet_types = aiCriteria.accepted_pet_types;
  }

  // Note: Additional filters like amenities, pet sizes, price range, and date range
  // may need to be handled differently depending on your listing store implementation
  // For now, we'll pass them through as-is
  if (aiCriteria.accepted_pet_sizes) {
    filters.accepted_pet_sizes = aiCriteria.accepted_pet_sizes;
  }

  if (aiCriteria.amenities) {
    filters.amenities = aiCriteria.amenities;
  }

  if (aiCriteria.price_range) {
    filters.price_range = aiCriteria.price_range;
  }

  if (aiCriteria.date_range) {
    filters.date_range = aiCriteria.date_range;
  }

  return filters;
};

export default {
  parseSearchQuery,
  convertToListingFilters,
};
