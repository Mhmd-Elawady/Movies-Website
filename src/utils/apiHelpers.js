export const validateApiResponse = (response, expectedType = 'object') => {
  if (response == null) return false;
  
  switch (expectedType) {
    case 'array':
      return Array.isArray(response);
    case 'object':
      return typeof response === 'object' && !Array.isArray(response);
    case 'string':
      return typeof response === 'string';
    case 'number':
      return typeof response === 'number' && !Number.isNaN(response);
    default:
      return true;
  }
};

export const extractResults = (response, key = 'results') => {
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.[key]) ? response[key] : [];
};

export const validateMediaItem = (item) => {
  return Boolean(item?.id && (item?.title || item?.name));
};

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
    adult: Boolean(item.adult),
  };
};

export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.';
  
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 401: return 'Authentication failed. Please check your API key.';
      case 404: return 'Resource not found.';
      case 429: return 'Too many requests. Please try again later.';
      default:
        if (status >= 500) return 'Server error. Please try again later.';
        return data?.status_message || error.message || `Error ${status}`;
    }
  }
  
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }
  
  if (error.request) {
    return 'Network error. Please check your internet connection.';
  }
  
  return error.message || 'An unexpected error occurred.';
};

export const isRetryableError = (error) => {
  if (!error) return false;
  
  const isTimeout = error.code === 'ECONNABORTED';
  const isNetworkError = error.request && !error.response;
  const isServerError = error.response?.status >= 500;
  const isRateLimit = error.response?.status === 429;
  
  return Boolean(isTimeout || isNetworkError || isServerError || isRateLimit);
};

export const getRetryDelay = (error, attempt = 1) => {
  const isRateLimit = error?.response?.status === 429;
  
  if (isRateLimit && error?.response?.headers?.['retry-after']) {
    const retryAfter = parseInt(error.response.headers['retry-after'], 10);
    if (!Number.isNaN(retryAfter)) {
      return retryAfter * 1000;
    }
  }
  
  const maxDelay = isRateLimit ? 30000 : 10000;
  const baseDelay = Math.min(1000 * (2 ** attempt), maxDelay);
  const jitter = Math.random() * 1000;
  
  return baseDelay + jitter;
};