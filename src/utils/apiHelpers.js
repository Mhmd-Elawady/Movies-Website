/**
 * API Response Validation and Data Helpers
 */

/**
 * Validate API response structure
 * @param {any} response - API response data
 * @param {string} expectedType - Expected data type ('array', 'object', etc.)
 * @returns {boolean} - True if valid
 */
export const validateApiResponse = (response, expectedType = 'object') => {
  if (!response) return false;
  
  switch (expectedType) {
    case 'array':
      return Array.isArray(response);
    case 'object':
      return typeof response === 'object' && response !== null && !Array.isArray(response);
    case 'string':
      return typeof response === 'string';
    case 'number':
      return typeof response === 'number' && !isNaN(response);
    default:
      return response != null;
  }
};

/**
 * Safely extract results from TMDB API response
 * @param {object} response - API response
 * @param {string} key - Key to extract (default: 'results')
 * @returns {Array} - Array of results or empty array
 */
export const extractResults = (response, key = 'results') => {
  if (!response || typeof response !== 'object') return [];
  if (Array.isArray(response)) return response;
  return Array.isArray(response[key]) ? response[key] : [];
};

/**
 * Validate movie/TV show data structure
 * @param {object} item - Movie or TV show item
 * @returns {boolean} - True if valid
 */
export const validateMediaItem = (item) => {
  if (!item || typeof item !== 'object') return false;
  return !!(item.id && (item.title || item.name));
};

/**
 * Normalize media item for consistent structure
 * @param {object} item - Raw API item
 * @returns {object|null} - Normalized item or null if invalid
 */
export const normalizeMediaItem = (item) => {
  if (!validateMediaItem(item)) return null;
  
  return {
    id: item.id,
    title: item.title || item.name,
    overview: item.overview || '',
    poster_path: item.poster_path || null,
    backdrop_path: item.backdrop_path || null,
    vote_average: typeof item.vote_average === 'number' ? item.vote_average : 0,
    release_date: item.release_date || item.first_air_date || null,
    media_type: item.media_type || (item.title ? 'movie' : 'tv'),
    adult: item.adult || false,
  };
};

/**
 * Handle API errors with user-friendly messages
 * @param {Error} error - Error object
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.';
  
  if (error.message) {
    return error.message;
  }
  
  if (error.response) {
    const status = error.response.status;
    if (status === 429) return 'Too many requests. Please try again later.';
    if (status === 401) return 'Authentication failed. Please check your API key.';
    if (status === 404) return 'Resource not found.';
    if (status >= 500) return 'Server error. Please try again later.';
    return error.response.data?.status_message || `Error ${status}`;
  }
  
  if (error.request) {
    return 'Network error. Please check your internet connection.';
  }
  
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }
  
  return 'An unexpected error occurred.';
};

/**
 * Check if error is retryable
 * @param {Error} error - Error object
 * @returns {boolean} - True if error is retryable
 */
export const isRetryableError = (error) => {
  if (!error) return false;
  
  // Network errors are retryable
  if (error.request && !error.response) return true;
  
  // Timeout errors are retryable
  if (error.code === 'ECONNABORTED') return true;
  
  // Server errors (5xx) are retryable
  if (error.response && error.response.status >= 500) return true;
  
  // Rate limiting (429) is retryable after delay
  if (error.response && error.response.status === 429) return true;
  
  return false;
};

/**
 * Create retry delay based on error type
 * @param {Error} error - Error object
 * @param {number} attempt - Current attempt number
 * @returns {number} - Delay in milliseconds
 */
export const getRetryDelay = (error, attempt = 1) => {
  if (error.response && error.response.status === 429) {
    // Rate limiting - exponential backoff with jitter
    const retryAfter = error.response.headers['retry-after'];
    if (retryAfter) {
      return parseInt(retryAfter) * 1000;
    }
    return Math.min(1000 * Math.pow(2, attempt), 30000) + Math.random() * 1000;
  }
  
  // Exponential backoff for other retryable errors
  return Math.min(1000 * Math.pow(2, attempt), 10000);
};

