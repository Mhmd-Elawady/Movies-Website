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
        console.error(
          "API Rate Limit Exceeded. Please wait before making more requests."
        );
        error.message = "Too many requests. Please try again later.";
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
  // Support multiple possible shapes by checking for common keys
  const id = raw.id || raw.movie_id || null;
  const title = raw.title || raw.name || raw.movie_title || "";
  const overview = raw.overview || raw.description || raw.summary || "";
  const poster_path = raw.poster_path || raw.poster || raw.posterUrl || null;
  const backdrop_path =
    raw.backdrop_path || raw.backdrop || raw.backdropUrl || null;
  const release_date =
    raw.release_date || raw.first_release || raw.published_at || null;
  const vote_average =
    typeof raw.vote_average === "number"
      ? raw.vote_average
      : raw.rating || raw.score || 0;
  const runtime = raw.runtime || raw.duration || null;
  // genres may be array of ids or array of {id,name}
  let genres = [];
  if (Array.isArray(raw.genres)) {
    genres = raw.genres.map((g) =>
      typeof g === "object" ? g : { id: g, name: String(g) }
    );
  } else if (Array.isArray(raw.genre_ids)) {
    genres = raw.genre_ids.map((id) => ({ id, name: String(id) }));
  }

  return {
    id,
    title,
    overview,
    poster_path,
    backdrop_path,
    posterUrl: buildImageUrl(poster_path),
    backdropUrl: buildImageUrl(backdrop_path, "original"),
    release_date,
    vote_average,
    runtime,
    genres,
    raw,
  };
}

export function normalizeTV(raw = {}) {
  const id = raw.id || raw.tv_id || null;
  const name = raw.name || raw.title || raw.tv_name || "";
  const overview = raw.overview || raw.description || raw.summary || "";
  const poster_path = raw.poster_path || raw.poster || raw.posterUrl || null;
  const backdrop_path =
    raw.backdrop_path || raw.backdrop || raw.backdropUrl || null;
  const first_air_date =
    raw.first_air_date || raw.air_date || raw.published_at || null;
  const vote_average =
    typeof raw.vote_average === "number"
      ? raw.vote_average
      : raw.rating || raw.score || 0;
  const episode_run_time = raw.episode_run_time || raw.runtime || null;

  let genres = [];
  if (Array.isArray(raw.genres)) {
    genres = raw.genres.map((g) =>
      typeof g === "object" ? g : { id: g, name: String(g) }
    );
  } else if (Array.isArray(raw.genre_ids)) {
    genres = raw.genre_ids.map((id) => ({ id, name: String(id) }));
  }

  return {
    id,
    name,
    overview,
    poster_path,
    backdrop_path,
    posterUrl: buildImageUrl(poster_path),
    backdropUrl: buildImageUrl(backdrop_path, "original"),
    first_air_date,
    vote_average,
    episode_run_time,
    genres,
    raw,
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
