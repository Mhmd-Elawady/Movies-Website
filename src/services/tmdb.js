/**
 * tmdb.js
 * Centralized TMDB HTTP client, normalizers, and image helpers.
 */

import axios from "axios";

// ── Configuration ────────────────────────────────────────────────────────────

export const ACCESS_TOKEN  = import.meta?.env?.VITE_ACCESS_TOKEN;
export const API_KEY       = import.meta?.env?.VITE_TMDB_API_KEY || "4f5be434fbfbc3e5d1718cbf7b949777";
export const BASE_URL      = import.meta?.env?.VITE_API_BASE_URL  || "https://api.themoviedb.org/3";
export const IMAGE_BASE_URL = import.meta?.env?.VITE_IMAGE_BASE_URL || "https://image.tmdb.org/t/p";

const IS_DEV = import.meta?.env?.DEV;

// ── Axios instance ───────────────────────────────────────────────────────────

const authHeaders = ACCESS_TOKEN
  ? { Authorization: `Bearer ${ACCESS_TOKEN}` }
  : {};

const authParams = ACCESS_TOKEN
  ? { language: "en-US", include_adult: false }
  : { api_key: API_KEY, language: "en-US", include_adult: false };

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders },
  params: authParams,
  withCredentials: false,
  maxRedirects: 5,
});

// ── Rate-limit manager ───────────────────────────────────────────────────────

const rateLimit = {
  resetTime: null,
  queue: [],
  draining: false,

  isActive: () => rateLimit.resetTime && Date.now() < rateLimit.resetTime,

  set: (retryAfter) => {
    rateLimit.resetTime = Date.now() + Math.min(60_000, (retryAfter || 60) * 1_000);
  },

  enqueue: (resolve, reject, config) => {
    rateLimit.queue.push({ resolve, reject, config });
    rateLimit.drain();
  },

  drain: async () => {
    if (rateLimit.draining || !rateLimit.queue.length) return;
    if (rateLimit.isActive()) {
      const wait = rateLimit.resetTime - Date.now();
      IS_DEV && console.log(`[tmdb] Rate limited — retrying in ${Math.ceil(wait / 1000)}s`);
      rateLimit.draining = true;
      setTimeout(() => { rateLimit.draining = false; rateLimit.drain(); }, wait + 100);
      return;
    }
    const { resolve, reject, config } = rateLimit.queue.shift();
    try { resolve(await apiClient.request(config)); } catch (e) { reject(e); }
    if (rateLimit.queue.length) setTimeout(rateLimit.drain, 100);
  },
};

// ── Request interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    if (!config.baseURL) config.baseURL = BASE_URL;
    if (config.url && !config.url.startsWith("http") && !config.url.startsWith("/")) {
      config.url = `/${config.url}`;
    }
    if (IS_DEV) {
      const full = `${(config.baseURL || "").replace(/\/$/, "")}${config.url}`;
      console.log(`[tmdb] ${(config.method || "GET").toUpperCase()} ${full}`);
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Response interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    // Silent cancel / abort
    if (["CanceledError", "AbortError"].includes(err?.name) || err?.code === "ERR_CANCELED") {
      IS_DEV && console.debug("[tmdb] Request cancelled:", err.config?.url);
      return Promise.reject(err);
    }

    const status = err.response?.status;

    if (status === 429) {
      const retryAfter = parseInt(err.response.headers["retry-after"]) || 60;
      rateLimit.set(retryAfter);
      console.warn(`[tmdb] 429 — queued for retry after ${retryAfter}s`);
      return new Promise((res, rej) => rateLimit.enqueue(res, rej, err.config));
    }

    // Map common status codes to readable messages
    const messages = {
      401: "Authentication failed. Check your API configuration.",
      404: "Resource not found.",
    };

    if (status >= 500)       err.message = "Server error. Please try again later.";
    else if (messages[status]) err.message = messages[status];
    else if (err.request)    err.message = _networkMessage(err);
    else if (err.message?.includes("timeout")) err.message = "Request timed out. Please try again.";

    return Promise.reject(err);
  }
);

function _networkMessage(err) {
  const url = err.config?.url ?? "unknown";
  if (err.code === "ERR_NETWORK")       return `Network error reaching ${url}. Check connection and CORS.`;
  if (err.code === "ECONNABORTED")      return "Request timed out.";
  if (err.code?.startsWith("ERR_BLOCKED")) return "Request blocked by browser or CORS policy.";
  return `Network error reaching ${url}.`;
}

// ── Image helpers ────────────────────────────────────────────────────────────

/** Build a full TMDB image URL. Returns null if path is falsy. */
export function buildImageUrl(path, size = "w500") {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = IMAGE_BASE_URL.replace(/\/$/, "");
  const p    = path.startsWith("/") ? path : `/${path}`;
  return `${base}/${size}${p}`;
}

// ── Normalizers ──────────────────────────────────────────────────────────────

function normalizeGenres(raw) {
  if (Array.isArray(raw?.genres)) {
    return raw.genres
      .filter((g) => g && typeof g === "object")
      .map((g) => ({ id: parseInt(g.id, 10) || 0, name: String(g.name || "").trim() }))
      .filter((g) => g.id > 0 && g.name.length > 0);
  }
  if (Array.isArray(raw?.genre_ids)) {
    return raw.genre_ids
      .filter(Boolean)
      .map((id) => ({ id: parseInt(id, 10), name: `Genre ${id}` }));
  }
  return [];
}

function safePath(val) {
  return val && String(val).startsWith("/") ? val : null;
}

function safeDate(val) {
  return val && /^\d{4}-\d{2}-\d{2}$/.test(val) ? val : null;
}

function safeRating(val, fallback) {
  if (typeof val === "number" && val >= 0 && val <= 10)
    return parseFloat(val.toFixed(1));
  if (typeof fallback === "number")
    return parseFloat(fallback.toFixed(1));
  return null;
}

export function normalizeMovie(raw = {}) {
  if (typeof raw !== "object" || !raw) return _emptyMovie();
  try {
    const poster_path   = safePath(raw.poster_path);
    const backdrop_path = safePath(raw.backdrop_path);
    return {
      id:           parseInt(raw.id || raw.movie_id, 10)   || null,
      title:        String(raw.title || raw.name || "").trim(),
      overview:     String(raw.overview || raw.description || "").trim(),
      poster_path,
      backdrop_path,
      posterUrl:    buildImageUrl(poster_path, "w500"),
      backdropUrl:  buildImageUrl(backdrop_path, "original"),
      release_date: safeDate(raw.release_date),
      vote_average: safeRating(raw.vote_average, raw.rating),
      runtime:      parseInt(raw.runtime || raw.duration, 10) || null,
      budget:       parseInt(raw.budget,  10) || null,
      revenue:      parseInt(raw.revenue, 10) || null,
      status:       raw.status ? String(raw.status).trim() : null,
      genres:       normalizeGenres(raw),
      media_type:   "movie",
    };
  } catch (e) {
    console.error("[tmdb] normalizeMovie error:", e);
    return _emptyMovie();
  }
}

export function normalizeTV(raw = {}) {
  if (typeof raw !== "object" || !raw) return _emptyTV();
  try {
    const poster_path   = safePath(raw.poster_path);
    const backdrop_path = safePath(raw.backdrop_path);

    let episode_run_time = null;
    if (Array.isArray(raw.episode_run_time) && raw.episode_run_time.length)
      episode_run_time = parseInt(raw.episode_run_time[0], 10) || null;
    else if (typeof raw.episode_run_time === "number") episode_run_time = raw.episode_run_time;
    else if (typeof raw.runtime === "number")           episode_run_time = raw.runtime;

    return {
      id:                  parseInt(raw.id || raw.tv_id, 10) || null,
      name:                String(raw.name || raw.title || "").trim(),
      overview:            String(raw.overview || raw.description || "").trim(),
      poster_path,
      backdrop_path,
      posterUrl:           buildImageUrl(poster_path, "w500"),
      backdropUrl:         buildImageUrl(backdrop_path, "original"),
      first_air_date:      safeDate(raw.first_air_date),
      last_air_date:       safeDate(raw.last_air_date),
      vote_average:        safeRating(raw.vote_average, raw.rating),
      episode_run_time,
      number_of_seasons:   parseInt(raw.number_of_seasons,  10) || 0,
      number_of_episodes:  parseInt(raw.number_of_episodes, 10) || 0,
      status:              raw.status ? String(raw.status).trim() : null,
      genres:              normalizeGenres(raw),
      media_type:          "tv",
    };
  } catch (e) {
    console.error("[tmdb] normalizeTV error:", e);
    return _emptyTV();
  }
}

function _emptyMovie() {
  return { id: null, title: "", overview: "", poster_path: null, backdrop_path: null,
           posterUrl: null, backdropUrl: null, release_date: null, vote_average: null,
           runtime: null, budget: null, revenue: null, status: null, genres: [], media_type: "movie" };
}

function _emptyTV() {
  return { id: null, name: "", overview: "", poster_path: null, backdrop_path: null,
           posterUrl: null, backdropUrl: null, first_air_date: null, last_air_date: null,
           vote_average: null, episode_run_time: null, number_of_seasons: 0,
           number_of_episodes: 0, status: null, genres: [], media_type: "tv" };
}

// ── Dev diagnostics ──────────────────────────────────────────────────────────

/** @deprecated Use apiClient directly */
export function buildUrl(path) {
  const url = new URL(path, BASE_URL);
  if (API_KEY) url.searchParams.set("api_key", API_KEY);
  return url.toString();
}

export function verifyAPIConfig() {
  const cfg = {
    baseURL: BASE_URL,
    hasAccessToken: !!ACCESS_TOKEN,
    hasAPIKey: !!API_KEY,
    accessTokenLength: ACCESS_TOKEN?.length ?? 0,
    apiKeyLength: API_KEY?.length ?? 0,
  };
  IS_DEV && console.log("[tmdb] API config:", cfg);
  return cfg;
}

if (IS_DEV) verifyAPIConfig();