import { apiClient } from "../services/tmdb";

/**
 * Search for a movie by name and return structured data
 * @param {string} movieName - The name of the movie to search for
 * @returns {Promise<Object>} Movie data with title, release year, rating, and genre
 */
export const getMovieData = async (movieName) => {
  try {
    if (!movieName || typeof movieName !== "string") {
      throw new Error("Movie name must be a non-empty string");
    }

    // Search for the movie
    const response = await apiClient.get("/search/movie", {
      params: {
        query: movieName,
        page: 1,
      },
    });

    if (!response.data || !response.data.results || response.data.results.length === 0) {
      throw new Error(`Movie "${movieName}" not found`);
    }

    // Get the first result (best match)
    const movie = response.data.results[0];

    // Extract the required data
    const result = {
      "Movie Title": movie.title || "N/A",
      "Release Year": movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A",
      "IMDb Rating": movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
    };

    // Genre is optional - would need a separate call to get genre names
    // For now, including it if available from the search response
    if (movie.genres && Array.isArray(movie.genres)) {
      result.Genre = movie.genres.map((g) => g.name).join(", ");
    }

    return result;
  } catch (error) {
    console.error("Error fetching movie data:", error);
    throw error;
  }
};

/**
 * Format runtime in minutes to "Xh Ym" format
 * @param {number} runtime - Runtime in minutes
 * @returns {string} Formatted duration string
 */
export const formatDuration = (runtime) => {
  if (!runtime || runtime <= 0) return "Unknown";
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return hours > 0
    ? `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`.trim()
    : `${minutes}m`;
};

/**
 * Extract year from date string
 * @param {string} dateString - Date string (YYYY-MM-DD format)
 * @returns {number|null} Year or null if invalid
 */
export const getYearFromDate = (dateString) => {
  if (!dateString) return null;
  try {
    const year = new Date(dateString).getFullYear();
    return isNaN(year) ? null : year;
  } catch {
    return null;
  }
};

/**
 * Format rating to 1 decimal place
 * @param {number} rating - Rating value
 * @returns {string} Formatted rating or 'N/A'
 */
export const formatRating = (rating) => {
  if (rating == null || isNaN(rating)) return "N/A";
  return parseFloat(rating).toFixed(1);
};

/**
 * Build image URL with fallback
 * @param {string} path - Image path from API
 * @param {string} size - Image size (default: 'w500')
 * @param {string} fallback - Fallback placeholder URL
 * @returns {string} Complete image URL
 */
export const buildImageUrl = (
  path,
  size = "w500",
  fallback = "https://via.placeholder.com/500x750/1a1a1a/666666?text=No+Image"
) => {
  if (!path) return fallback;
  // Ensure path starts with / for proper URL construction
  const imagePath = path.startsWith("/") ? path : `/${path}`;
  // Build URL with correct size - TMDB image URLs format: https://image.tmdb.org/t/p/{size}{path}
  const baseUrl = "https://image.tmdb.org/t/p";
  return `${baseUrl}/${size}${imagePath}`;
};

/**
 * Build YouTube embed URL from video key
 * @param {string} key - YouTube video key
 * @param {boolean} autoplay - Whether to autoplay
 * @returns {string} YouTube embed URL
 */
export const buildYouTubeEmbedUrl = (key, autoplay = false) => {
  if (!key) return null;
  return `https://www.youtube.com/embed/${key}${autoplay ? "?autoplay=1" : ""}`;
};

/**
 * Find trailer video from videos array
 * @param {Array} videos - Array of video objects
 * @returns {Object|null} Trailer video or null
 */
export const findTrailer = (videos) => {
  if (!Array.isArray(videos) || videos.length === 0) return null;

  // First try to find a Trailer
  const trailer = videos.find(
    (video) => video.type === "Trailer" && video.site === "YouTube"
  );

  if (trailer) return trailer;

  // Fallback to Teaser
  return (
    videos.find(
      (video) => video.type === "Teaser" && video.site === "YouTube"
    ) || null
  );
};

/**
 * Create a bounded cache with size limit
 * @param {number} maxSize - Maximum cache size
 * @returns {Map} Bounded cache Map
 */
export const createBoundedCache = (maxSize = 50) => {
  const cache = new Map();

  return {
    get: (key) => cache.get(key),
    set: (key, value) => {
      if (cache.size >= maxSize && !cache.has(key)) {
        // Remove oldest entry (first key)
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },
    has: (key) => cache.has(key),
    clear: () => cache.clear(),
    size: () => cache.size,
  };
};

/**
 * Validate and parse numeric ID
 * @param {string|number} id - ID to validate
 * @returns {number|null} Valid numeric ID or null
 */
export const parseNumericId = (id) => {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }
  return numericId;
};

/* Favorites helpers - localStorage backed */
const FAVORITES_KEY = "myapp.favorites.v1";

const safeParse = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

export const getFavorites = () => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = safeParse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveFavorites = (items) => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(items || []));
    return true;
  } catch {
    return false;
  }
};

export const isFavorited = (id, media_type = "movie") => {
  if (!id) return false;
  const numeric = parseNumericId(id);
  if (!numeric) return false;
  const favs = getFavorites();
  return favs.some(
    (f) => Number(f.id) === numeric && (f.media_type || "movie") === media_type
  );
};

export const addFavorite = (item) => {
  if (!item || !item.id) return false;
  const media_type = item.media_type || "movie";
  const numeric = parseNumericId(item.id);
  if (!numeric) return false;
  const favs = getFavorites();
  const exists = favs.some(
    (f) => Number(f.id) === numeric && (f.media_type || "movie") === media_type
  );
  if (exists) return true; // idempotent
  const toSave = [
    ...favs,
    {
      id: numeric,
      title: item.title || item.name || "",
      poster_path: item.poster_path || item.posterPath || null,
      vote_average: item.vote_average != null ? item.vote_average : null,
      release_date: item.release_date || item.first_air_date || null,
      media_type,
    },
  ];
  return saveFavorites(toSave);
};

export const removeFavorite = (id, media_type = "movie") => {
  const numeric = parseNumericId(id);
  if (!numeric) return false;
  const favs = getFavorites();
  const filtered = favs.filter(
    (f) =>
      !(Number(f.id) === numeric && (f.media_type || "movie") === media_type)
  );
  return saveFavorites(filtered);
};
