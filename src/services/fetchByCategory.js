/**
 * fetchByCategory.js
 * Generic category-fetching engine shared by movies and TV shows.
 * Handles: details cache, card building, genre discovery, and result lists.
 */

import { apiClient } from "./tmdb";
import { createBoundedCache, WEEKLY_TTL_MS } from "../utils/helpers";

const IS_DEV = import.meta?.env?.DEV;

// ── Details cache (shared between movies & TV) ────────────────────────────────

const detailsCache = createBoundedCache(100, WEEKLY_TTL_MS);

/**
 * Fetch details for a single item, using the cache when available.
 * Returns null (never throws) so a missing detail never breaks a list.
 */
export async function fetchDetails(endpoint, id, signal) {
  if (!id) return null;
  const key = `${endpoint}/${id}`;

  if (detailsCache.has(key)) return detailsCache.get(key);

  try {
    const { data } = await apiClient.get(`/${endpoint}/${id}`, { signal });
    if (data?.id) detailsCache.set(key, data);
    return data?.id ? data : null;
  } catch (err) {
    if (!_isCanceled(err)) console.debug(`[fetchByCategory] Details failed for ${key}`);
    return null;
  }
}

// ── Genre discovery ───────────────────────────────────────────────────────────

/**
 * Fetch one representative item per genre via /discover.
 *
 * @param {"movie"|"tv"}  mediaType
 * @param {object[]}      genres        - Array of { id, name }
 * @param {Function}      buildCard     - (item, details) => card | null
 * @param {AbortSignal}   signal
 * @param {string}        cardFlag      - Extra flag to mark genre cards (e.g. "categoryMovie")
 */
export async function fetchGenreCards(mediaType, genres, buildCard, signal, cardFlag) {
  const discoverPath  = `/discover/${mediaType}`;
  const detailsPath   = mediaType;             // "movie" | "tv"
  const fallbackField = mediaType === "tv" ? "categoryShow" : "categoryMovie";
  const flag          = cardFlag ?? fallbackField;

  return Promise.all(
    genres.map(async (genre) => {
      try {
        const { data: discovered } = await apiClient.get(discoverPath, {
          params: { with_genres: genre.id, sort_by: "popularity.desc", page: 1 },
          signal,
        });

        const results = discovered?.results ?? [];
        const item =
          results.find((r) => r?.id && !r.adult && r.poster_path) ||
          results.find((r) => r?.id && !r.adult) ||
          results[0];

        if (!item?.id) throw new Error(`No item for genre "${genre.name}"`);

        const details = await fetchDetails(detailsPath, item.id, signal);
        const card    = buildCard(item, details);
        if (!card) throw new Error(`buildCard returned null for genre "${genre.name}"`);

        return { ...card, genreId: genre.id, genre: genre.name, [flag]: true };
      } catch (err) {
        if (!_isCanceled(err)) console.debug(`[fetchByCategory] Genre "${genre.name}":`, err.message);
        // Fallback placeholder so the UI always has something to render
        return {
          id: genre.id,
          genreId: genre.id,
          title: genre.name,
          img: `https://via.placeholder.com/500x750/1a1a1a/ffffff?text=${encodeURIComponent(genre.name)}`,
          rating: "N/A",
          duration: "Unknown",
          year: "Unknown",
          genre: genre.name,
          media_type: mediaType,
          [flag]: true,
          isFallback: true,
        };
      }
    })
  ).then((cards) => cards.filter(Boolean));
}

// ── Standard result list ──────────────────────────────────────────────────────

/**
 * Fetch a paginated result list, enrich each item with details, and build cards.
 *
 * @param {"movie"|"tv"}  mediaType
 * @param {object[]}      results
 * @param {Function}      buildCard
 * @param {AbortSignal}   signal
 * @param {string}        labelField   - Field used in dev log (e.g. "title" | "name")
 */
export async function fetchResultCards(mediaType, results, buildCard, signal, labelField = "title") {
  const detailsPath = mediaType;

  return Promise.all(
    results.map(async (item) => {
      try {
        const details = await fetchDetails(detailsPath, item.id, signal);
        const card    = buildCard(item, details);

        if (IS_DEV) {
          const label = item[labelField] || item.title || item.name || "Unknown";
          console.log(
            `[${mediaType}] "${label}" id=${item.id} ` +
            `rating=${item.vote_average} → details=${details?.vote_average} → card=${card?.vote_average}`
          );
        }

        return card;
      } catch (err) {
        if (!_isCanceled(err)) console.debug(`[fetchByCategory] Item ${item.id}:`, err.message);
        return buildCard(item, null);
      }
    })
  ).then((cards) => cards.filter((c) => c?.id));
}

// ── Shared entry point ────────────────────────────────────────────────────────

/**
 * Generic category fetcher used by both fetchMoviesByCategory and fetchTVShowsByCategory.
 *
 * @param {object}   config
 * @param {string}   config.category    - "genres" | "trending" | "newReleases" | "mustWatch"
 * @param {object}   config.endpoints   - Map of category → TMDB path
 * @param {"movie"|"tv"} config.mediaType
 * @param {Function} config.buildCard   - (item, details) => card | null
 * @param {string}   config.labelField  - "title" for movies, "name" for TV
 * @param {AbortSignal} signal
 */
export async function fetchByCategory({ category, endpoints, mediaType, buildCard, labelField }, signal) {
  const endpoint = endpoints[category];

  if (!endpoint) {
    console.warn(`[fetchByCategory] Unknown category: "${category}"`);
    return [];
  }

  try {
    const { data } = await apiClient.get(endpoint, { signal });

    if (!data) {
      console.warn(`[fetchByCategory] Empty response for "${category}"`);
      return [];
    }

    // ── Genres branch ──────────────────────────────────────────────────────
    if (category === "genres") {
      return fetchGenreCards(mediaType, data.genres ?? [], buildCard, signal);
    }

    // ── Standard list branch ───────────────────────────────────────────────
    const results = (data.results ?? [])
      .filter((item) => item?.id && !item.adult && item.poster_path)
      .slice(0, 50);

    if (!results.length) {
      console.debug(`[fetchByCategory] No valid results for "${category}"`);
      return [];
    }

    return fetchResultCards(mediaType, results, buildCard, signal, labelField);
  } catch (err) {
    if (_isCanceled(err)) {
      IS_DEV && console.debug(`[fetchByCategory] "${category}" cancelled`);
    } else {
      console.error(`[fetchByCategory] "${category}":`, err.message ?? err);
    }
    return [];
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function _isCanceled(err) {
  return (
    err?.name === "CanceledError" ||
    err?.name === "AbortError"    ||
    err?.code === "ERR_CANCELED"
  );
}