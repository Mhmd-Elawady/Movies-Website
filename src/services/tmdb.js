// Centralized TMDB configuration and HTTP client
import axios from "axios";

// Support both Bearer token (v4) and API key (v3) authentication
export const ACCESS_TOKEN = import.meta?.env?.VITE_ACCESS_TOKEN;
export const API_KEY =
  import.meta?.env?.VITE_TMDB_API_KEY || "4f5be434fbfbc3e5d1718cbf7b949777";
// Allow overriding the API base URL and image base URL via environment
export const BASE_URL =
  import.meta?.env?.VITE_API_BASE_URL || "https://api.themoviedb.org/3";
export const IMAGE_BASE_URL =
  import.meta?.env?.VITE_IMAGE_BASE_URL || "https://image.tmdb.org/t/p";

// Configure axios instance with default settings
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds for better network reliability
  headers: ACCESS_TOKEN
    ? {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      }
    : {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
  params: ACCESS_TOKEN
    ? {
        language: "en-US",
        include_adult: false,
      }
    : {
        api_key: API_KEY,
        language: "en-US",
        include_adult: false,
      },
  // Fix network issues - ensure proper request configuration
  withCredentials: false,
  maxRedirects: 5,
  validateStatus: function (status) {
    return status >= 200 && status < 300; // default
  },
});

// Rate limit management - handle 429 errors with intelligent backoff
const rateLimitManager = {
  resetTime: null,
  retryQueue: [],
  isWaiting: false,

  isRateLimited: () => {
    if (!rateLimitManager.resetTime) return false;
    const now = Date.now();
    if (now >= rateLimitManager.resetTime) {
      rateLimitManager.resetTime = null;
      return false;
    }
    return true;
  },

  getWaitTime: () => {
    if (!rateLimitManager.resetTime) return 0;
    return Math.max(0, rateLimitManager.resetTime - Date.now());
  },

  setRateLimitReset: (retryAfter) => {
    const waitMs = Math.min(60000, (retryAfter || 60) * 1000);
    rateLimitManager.resetTime = Date.now() + waitMs;
  },

  addRetry: (resolve, reject, config) => {
    rateLimitManager.retryQueue.push({ resolve, reject, config });
    rateLimitManager.processQueue();
  },

  processQueue: async () => {
    if (rateLimitManager.isWaiting || rateLimitManager.retryQueue.length === 0) {
      return;
    }

    if (rateLimitManager.isRateLimited()) {
      const waitTime = rateLimitManager.getWaitTime();
      rateLimitManager.isWaiting = true;
      console.log(`Rate limited. Waiting ${Math.ceil(waitTime / 1000)}s before retrying queued requests...`);
      
      setTimeout(() => {
        rateLimitManager.isWaiting = false;
        rateLimitManager.processQueue();
      }, waitTime + 100);
      return;
    }

    const { resolve, reject, config } = rateLimitManager.retryQueue.shift();
    try {
      const response = await apiClient.request(config);
      resolve(response);
    } catch (error) {
      reject(error);
    }

    // Continue processing queue
    if (rateLimitManager.retryQueue.length > 0) {
      setTimeout(() => rateLimitManager.processQueue(), 100);
    }
  },
};

// CRITICAL FIX: Add request interceptor to ensure proper URL construction and logging
apiClient.interceptors.request.use(
  (config) => {
    // Ensure baseURL is set
    if (!config.baseURL) {
      config.baseURL = BASE_URL;
    }

    // Ensure URL is properly constructed with baseURL
    if (config.url && !config.url.startsWith("http")) {
      // If URL doesn't start with http, ensure it starts with /
      if (!config.url.startsWith("/")) {
        config.url = "/" + config.url;
      }
      // The baseURL will be automatically prepended by axios
    }

    // Construct full URL for logging and verification
    const fullUrl = config.baseURL
      ? `${config.baseURL.replace(/\/$/, "")}${
          config.url.startsWith("/") ? config.url : "/" + config.url
        }`
      : config.url;

    // Verify authentication is present
    const hasAuth = !!(config.headers?.Authorization || config.params?.api_key);

    // Log the full URL being requested for debugging
    if (import.meta?.env?.DEV) {
      console.log("API Request:", {
        method: config.method?.toUpperCase() || "GET",
        fullUrl: fullUrl,
        relativeUrl: config.url,
        baseURL: config.baseURL,
        hasAuth: hasAuth,
        authType: config.headers?.Authorization
          ? "Bearer Token"
          : config.params?.api_key
          ? "API Key"
          : "None",
      });
    }

    // Validate that we have authentication
    if (!hasAuth) {
      console.warn("API Request missing authentication:", fullUrl);
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add request interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Validate response structure
    if (!response || !response.data) {
      return response;
    }
    return response;
  },
  (error) => {
    // Enhanced error handling for different error types
    // Treat cancellations/aborts as non-errors (quiet) since components may intentionally abort requests
    if (
      error &&
      (error.name === "CanceledError" ||
        error.name === "AbortError" ||
        error.code === "ERR_CANCELED")
    ) {
      if (import.meta?.env?.DEV) {
        console.debug(
          "Request canceled or aborted:",
          error.config?.url || error.message || error
        );
      }
      // Propagate the canceled error so callers can detect it, but don't spam logs
      return Promise.reject(error);
    }
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;

      // Handle specific error codes
      if (status === 429) {
        // Rate limit error - use intelligent backoff
        const retryAfter = parseInt(error.response.headers['retry-after']) || 60;
        rateLimitManager.setRateLimitReset(retryAfter);
        
        // Return a promise that will be resolved when rate limit is lifted
        return new Promise((resolve, reject) => {
          console.warn(`Rate limited (429). Retry after ${retryAfter}s. Request queued for retry.`);
          rateLimitManager.addRetry(resolve, reject, error.config);
        });
      } else if (status === 401) {
        console.error("API Authentication Failed. Check your API key.");
        error.message =
          "Authentication failed. Please check your API configuration.";
      } else if (status === 404) {
        console.error("API Resource Not Found:", error.config?.url);
        error.message = "Resource not found.";
      } else if (status >= 500) {
        console.error("API Server Error:", status, statusText);
        error.message = "Server error. Please try again later.";
      } else {
        console.error("API Error:", status, statusText, error.response.data);
        error.message =
          error.response.data?.status_message || `API Error: ${statusText}`;
      }
    } else if (error.request) {
      // Network error - no response received
      const fullUrl = error.config?.baseURL
        ? `${error.config.baseURL}${
            error.config.url?.startsWith("/")
              ? error.config.url
              : "/" + error.config.url
          }`
        : error.config?.url || "Unknown URL";

      console.error("Network Error: No response received", {
        readyState: error.request.readyState,
        status: error.request.status,
        url: fullUrl,
        baseURL: error.config?.baseURL,
        relativeUrl: error.config?.url,
        code: error.code,
        message: error.message,
      });

      // Check for specific network issues
      if (error.request.readyState === 0) {
        error.message = `Network connection failed. Unable to reach ${fullUrl}. Please check your internet connection and API configuration.`;
      } else if (error.code === "ERR_NETWORK") {
        error.message = `Network error. Unable to reach ${fullUrl}. Please check your connection and CORS settings.`;
      } else if (error.code === "ECONNABORTED") {
        error.message =
          "Request timeout. The server took too long to respond. Please try again.";
      } else if (
        error.code === "ERR_BLOCKED_BY_CLIENT" ||
        error.code === "ERR_BLOCKED_BY_RESPONSE"
      ) {
        error.message =
          "Request blocked. This may be due to CORS policy or browser security settings.";
      } else {
        error.message = `Network error accessing ${fullUrl}. Please check your internet connection and try again.`;
      }
    } else if (
      error.code === "ECONNABORTED" ||
      error.message?.includes("timeout")
    ) {
      console.error("Request Timeout");
      error.message = "Request timeout. Please try again.";
    } else {
      console.error("Error:", error.message, error.code);
      error.message = error.message || "An unexpected error occurred.";
    }
    return Promise.reject(error);
  }
);

// Legacy buildUrl function for backward compatibility (deprecated - use apiClient instead)
export function buildUrl(path) {
  const url = new URL(path, BASE_URL);
  // Keep API key for legacy callers that expect query param auth
  if (API_KEY) {
    url.searchParams.set("api_key", API_KEY);
  }
  return url.toString();
}

// Build a full image URL given a path and optional size.
// If path is already a full URL, return it unchanged.
export function buildImageUrl(path, size = "w500") {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = IMAGE_BASE_URL.replace(/\/$/, "");
  // Ensure path starts with a slash
  const p = path.startsWith("/") ? path : "/" + path;
  return `${base}/${size}${p}`;
}

// Normalization helpers: map different API response shapes into the UI-friendly shape
export function normalizeMovie(raw = {}) {
  try {
    // Validate input is actually an object
    if (typeof raw !== 'object' || raw === null) {
      return createEmptyMovieNormalized();
    }

    // Safely extract and validate all fields with fallbacks
    const id = parseInt(raw?.id || raw?.movie_id, 10) || null;
    const title = String(raw?.title || raw?.name || raw?.movie_title || "").trim();
    const overview = String(raw?.overview || raw?.description || raw?.summary || "").trim();
    
    // Validate image paths start with '/' (TMDB format)
    const poster_path = raw?.poster_path && String(raw.poster_path).startsWith('/') 
      ? raw.poster_path 
      : null;
    const backdrop_path = raw?.backdrop_path && String(raw.backdrop_path).startsWith('/') 
      ? raw.backdrop_path 
      : null;
    
    // Validate date format (YYYY-MM-DD)
    const release_date = raw?.release_date && /^\d{4}-\d{2}-\d{2}$/.test(raw.release_date) 
      ? raw.release_date 
      : null;
    
    // Validate rating is number between 0-10
    const vote_average = typeof raw?.vote_average === 'number' && raw.vote_average >= 0 && raw.vote_average <= 10
      ? parseFloat(raw.vote_average.toFixed(1))
      : (typeof raw?.rating === 'number' ? parseFloat(raw.rating.toFixed(1)) : null);
    
    const runtime = parseInt(raw?.runtime || raw?.duration, 10) || null;
    const budget = parseInt(raw?.budget, 10) || null;
    const revenue = parseInt(raw?.revenue, 10) || null;
    const status = raw?.status ? String(raw.status).trim() : null;

    // Normalize genres - handle multiple input formats
    let genres = [];
    if (Array.isArray(raw?.genres)) {
      genres = raw.genres
        .filter(g => g && typeof g === 'object')
        .map(g => ({ 
          id: parseInt(g.id, 10) || 0, 
          name: String(g.name || '').trim() 
        }))
        .filter(g => g.id > 0 && g.name.length > 0);
    } else if (Array.isArray(raw?.genre_ids)) {
      genres = raw.genre_ids
        .filter(id => id && parseInt(id, 10) > 0)
        .map(id => ({ id: parseInt(id, 10), name: `Genre ${id}` }));
    }

    return {
      id,
      title,
      overview,
      poster_path,
      backdrop_path,
      posterUrl: poster_path ? buildImageUrl(poster_path, 'w500') : null,
      backdropUrl: backdrop_path ? buildImageUrl(backdrop_path, 'original') : null,
      release_date,
      vote_average,
      runtime,
      budget,
      revenue,
      status,
      genres,
      media_type: 'movie',
    };
  } catch (error) {
    console.error('Error normalizing movie data:', error);
    return createEmptyMovieNormalized();
  }
}

function createEmptyMovieNormalized() {
  return {
    id: null,
    title: '',
    overview: '',
    poster_path: null,
    backdrop_path: null,
    posterUrl: null,
    backdropUrl: null,
    release_date: null,
    vote_average: null,
    runtime: null,
    budget: null,
    revenue: null,
    status: null,
    genres: [],
    media_type: 'movie',
  };
}

export function normalizeTV(raw = {}) {
  try {
    // Validate input is actually an object
    if (typeof raw !== 'object' || raw === null) {
      return createEmptyTVNormalized();
    }

    // Safely extract and validate all fields with fallbacks
    const id = parseInt(raw?.id || raw?.tv_id, 10) || null;
    const name = String(raw?.name || raw?.title || raw?.tv_name || "").trim();
    const overview = String(raw?.overview || raw?.description || raw?.summary || "").trim();
    
    // Validate image paths start with '/' (TMDB format)
    const poster_path = raw?.poster_path && String(raw.poster_path).startsWith('/') 
      ? raw.poster_path 
      : null;
    const backdrop_path = raw?.backdrop_path && String(raw.backdrop_path).startsWith('/') 
      ? raw.backdrop_path 
      : null;
    
    // Validate date formats (YYYY-MM-DD)
    const first_air_date = raw?.first_air_date && /^\d{4}-\d{2}-\d{2}$/.test(raw.first_air_date) 
      ? raw.first_air_date 
      : null;
    const last_air_date = raw?.last_air_date && /^\d{4}-\d{2}-\d{2}$/.test(raw.last_air_date) 
      ? raw.last_air_date 
      : null;
    
    // Validate rating is number between 0-10
    const vote_average = typeof raw?.vote_average === 'number' && raw.vote_average >= 0 && raw.vote_average <= 10
      ? parseFloat(raw.vote_average.toFixed(1))
      : (typeof raw?.rating === 'number' ? parseFloat(raw.rating.toFixed(1)) : null);
    
    const number_of_seasons = parseInt(raw?.number_of_seasons, 10) || 0;
    const number_of_episodes = parseInt(raw?.number_of_episodes, 10) || 0;
    
    // Handle episode_run_time - can be array or number
    let episode_run_time = null;
    if (Array.isArray(raw?.episode_run_time) && raw.episode_run_time.length > 0) {
      episode_run_time = parseInt(raw.episode_run_time[0], 10) || null;
    } else if (typeof raw?.episode_run_time === 'number') {
      episode_run_time = raw.episode_run_time;
    } else if (typeof raw?.runtime === 'number') {
      episode_run_time = raw.runtime;
    }
    
    const status = raw?.status ? String(raw.status).trim() : null;

    // Normalize genres - handle multiple input formats
    let genres = [];
    if (Array.isArray(raw?.genres)) {
      genres = raw.genres
        .filter(g => g && typeof g === 'object')
        .map(g => ({ 
          id: parseInt(g.id, 10) || 0, 
          name: String(g.name || '').trim() 
        }))
        .filter(g => g.id > 0 && g.name.length > 0);
    } else if (Array.isArray(raw?.genre_ids)) {
      genres = raw.genre_ids
        .filter(id => id && parseInt(id, 10) > 0)
        .map(id => ({ id: parseInt(id, 10), name: `Genre ${id}` }));
    }

    return {
      id,
      name,
      overview,
      poster_path,
      backdrop_path,
      posterUrl: poster_path ? buildImageUrl(poster_path, 'w500') : null,
      backdropUrl: backdrop_path ? buildImageUrl(backdrop_path, 'original') : null,
      first_air_date,
      last_air_date,
      vote_average,
      episode_run_time,
      number_of_seasons,
      number_of_episodes,
      status,
      genres,
      media_type: 'tv',
    };
  } catch (error) {
    console.error('Error normalizing TV data:', error);
    return createEmptyTVNormalized();
  }
}

function createEmptyTVNormalized() {
  return {
    id: null,
    name: '',
    overview: '',
    poster_path: null,
    backdrop_path: null,
    posterUrl: null,
    backdropUrl: null,
    first_air_date: null,
    last_air_date: null,
    vote_average: null,
    episode_run_time: null,
    number_of_seasons: 0,
    number_of_episodes: 0,
    status: null,
    genres: [],
    media_type: 'tv',
  };
}

// Diagnostic function to verify API configuration
export function verifyAPIConfig() {
  const config = {
    baseURL: BASE_URL,
    hasAccessToken: !!ACCESS_TOKEN,
    hasAPIKey: !!API_KEY,
    accessTokenLength: ACCESS_TOKEN?.length || 0,
    apiKeyLength: API_KEY?.length || 0,
  };

  if (import.meta?.env?.DEV) {
    console.log("TMDB API Configuration:", config);
  }

  return config;
}

// Call verification on module load (development only)
if (import.meta?.env?.DEV) {
  verifyAPIConfig();
}
