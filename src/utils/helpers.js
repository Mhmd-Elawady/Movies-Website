/**
 * helpers.js
 * Shared utility functions: formatting, caching, favorites, and media helpers.
 */

// ── Formatting ────────────────────────────────────────────────────────────────

/** "Xh Ym" from minutes, or "Unknown" if invalid. */
export const formatDuration = (runtime) => {
  if (!runtime || runtime <= 0) return "Unknown";
  const h = Math.floor(runtime / 60);
  const m = runtime % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
};

/** Year from "YYYY-MM-DD", or null if invalid. */
export const getYearFromDate = (dateString) => {
  if (!dateString) return null;
  const year = new Date(dateString).getFullYear();
  return isNaN(year) ? null : year;
};

/** Rating to 1 decimal place, or "N/A". */
export const formatRating = (rating) => {
  const n = typeof rating === "string" ? parseFloat(rating) : rating;
  return n == null || isNaN(n) ? "N/A" : n.toFixed(1);
};

// ── Image & video helpers ─────────────────────────────────────────────────────

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const PLACEHOLDER     = "https://via.placeholder.com/500x750/1a1a1a/666666?text=No+Image";

/** Full TMDB image URL. Returns fallback (or null if no fallback given) when path is absent. */
export const buildImageUrl = (path, size = "w500", fallback = PLACEHOLDER) => {
  if (!path) return fallback;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE}/${size}${p}`;
};

/** YouTube embed URL with optional autoplay. */
export const buildYouTubeEmbedUrl = (key, autoplay = false) => {
  if (!key) return null;
  return `https://www.youtube.com/embed/${key}${autoplay ? "?autoplay=1" : ""}`;
};

/** First YouTube Trailer, then Teaser, from a videos array. */
export const findTrailer = (videos) => {
  if (!Array.isArray(videos) || !videos.length) return null;
  const isYT   = (v) => v?.site === "YouTube";
  return (
    videos.find((v) => isYT(v) && v.type === "Trailer") ??
    videos.find((v) => isYT(v) && v.type === "Teaser")  ??
    null
  );
};

// ── ID helper ─────────────────────────────────────────────────────────────────

/** Returns a positive integer ID, or null. */
export const parseNumericId = (id) => {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// ── Bounded cache ─────────────────────────────────────────────────────────────

/** 7 days in ms — default TTL for API caches. */
export const WEEKLY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * LRU-style Map cache with optional TTL.
 * Evicts the oldest entry when the size limit is reached.
 */
export const createBoundedCache = (maxSize = 50, ttlMs = WEEKLY_TTL_MS) => {
  const store      = new Map(); // key → value
  const timestamps = new Map(); // key → set-time (ms)

  const expired = (key) =>
    ttlMs ? Date.now() - (timestamps.get(key) ?? 0) > ttlMs : false;

  const evictExpired = () => {
    for (const key of store.keys()) {
      if (expired(key)) { store.delete(key); timestamps.delete(key); }
    }
  };

  const drop = (key) => { store.delete(key); timestamps.delete(key); };

  return {
    has: (key) => { evictExpired(); if (expired(key)) { drop(key); return false; } return store.has(key); },
    get: (key) => { evictExpired(); if (expired(key)) { drop(key); return undefined; } return store.get(key); },
    set: (key, value) => {
      evictExpired();
      if (store.size >= maxSize && !store.has(key)) {
        drop(store.keys().next().value); // evict oldest
      }
      store.set(key, value);
      timestamps.set(key, Date.now());
    },
    invalidate: drop,
    clear: () => { store.clear(); timestamps.clear(); },
    size: () => store.size,
  };
};

// ── Favorites (localStorage) ──────────────────────────────────────────────────

const FAVORITES_KEY = "myapp.favorites.v1";

const readFavs = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const writeFavs = (items) => {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(items)); return true; }
  catch { return false; }
};

const matchFav = (f, id, media_type) =>
  Number(f.id) === id && (f.media_type ?? "movie") === media_type;

export const getFavorites = () => readFavs();

export const saveFavorites = (items) => writeFavs(items ?? []);

export const isFavorited = (id, media_type = "movie") => {
  const n = parseNumericId(id);
  return n ? readFavs().some((f) => matchFav(f, n, media_type)) : false;
};

export const addFavorite = (item) => {
  if (!item?.id) return false;
  const media_type = item.media_type ?? "movie";
  const n = parseNumericId(item.id);
  if (!n) return false;

  const favs = readFavs();
  if (favs.some((f) => matchFav(f, n, media_type))) return true; // idempotent

  return writeFavs([
    ...favs,
    {
      id:           n,
      title:        item.title || item.name || "",
      poster_path:  item.poster_path || item.posterPath || null,
      vote_average: item.vote_average ?? null,
      release_date: item.release_date || item.first_air_date || null,
      media_type,
    },
  ]);
};

export const removeFavorite = (id, media_type = "movie") => {
  const n = parseNumericId(id);
  if (!n) return false;
  return writeFavs(readFavs().filter((f) => !matchFav(f, n, media_type)));
};

// ── API response helpers ──────────────────────────────────────────────────────

/** True if the response matches expectedType. */
export const validateApiResponse = (response, expectedType = "object") => {
  if (response == null) return false;
  switch (expectedType) {
    case "array":  return Array.isArray(response);
    case "object": return typeof response === "object" && !Array.isArray(response);
    case "string": return typeof response === "string";
    case "number": return typeof response === "number" && !isNaN(response);
    default:       return response != null;
  }
};

/** Safely pull `results` (or another key) from an API response. */
export const extractResults = (response, key = "results") => {
  if (!response || typeof response !== "object") return [];
  if (Array.isArray(response)) return response;
  return Array.isArray(response[key]) ? response[key] : [];
};

/** True if item has id and title/name. */
export const validateMediaItem = (item) =>
  !!(item?.id && (item.title || item.name));

/** Lightweight normalization for search / list contexts. */
export const normalizeMediaItem = (item) => {
  if (!validateMediaItem(item)) return null;
  return {
    id:           item.id,
    title:        item.title || item.name,
    overview:     item.overview || "",
    poster_path:  item.poster_path   ?? null,
    backdrop_path: item.backdrop_path ?? null,
    vote_average: typeof item.vote_average === "number" ? item.vote_average : 0,
    release_date: item.release_date || item.first_air_date || null,
    media_type:   item.media_type || (item.title ? "movie" : "tv"),
    adult:        item.adult || false,
  };
};

/** Human-readable error message from an Axios-style error. */
export const getErrorMessage = (error) => {
  if (!error) return "An unexpected error occurred.";
  if (error.message) return error.message;
  const status = error.response?.status;
  if (status === 429) return "Too many requests. Please try again later.";
  if (status === 401) return "Authentication failed. Please check your API key.";
  if (status === 404) return "Resource not found.";
  if (status >= 500)  return "Server error. Please try again later.";
  if (status)         return error.response.data?.status_message || `Error ${status}`;
  if (error.request)  return "Network error. Please check your internet connection.";
  if (error.code === "ECONNABORTED") return "Request timeout. Please try again.";
  return "An unexpected error occurred.";
};

/** True if the error is worth retrying. */
export const isRetryableError = (error) => {
  if (!error) return false;
  if (error.code === "ECONNABORTED") return true;
  if (error.request && !error.response) return true;
  const s = error.response?.status;
  return s >= 500 || s === 429;
};

/** Retry delay in ms (exponential back-off, respects Retry-After for 429). */
export const getRetryDelay = (error, attempt = 1) => {
  if (error.response?.status === 429) {
    const ra = error.response.headers?.["retry-after"];
    if (ra) return parseInt(ra) * 1000;
    return Math.min(1000 * 2 ** attempt, 30_000) + Math.random() * 1000;
  }
  return Math.min(1000 * 2 ** attempt, 10_000);
};