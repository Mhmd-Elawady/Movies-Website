/**
 * fetchTVShowsByCategory.js
 * Fetches TV-show lists from TMDB by category, normalized to UI-ready cards.
 */

import { normalizeTV } from "./tmdb";
import {
  buildImageUrl,
  getYearFromDate,
  formatRating,
} from "../utils/helpers";
import { fetchByCategory } from "./fetchByCategory";

// ── TMDB endpoints ────────────────────────────────────────────────────────────

const ENDPOINTS = {
  genres:      "/genre/tv/list",
  trending:    "/trending/tv/week",
  newReleases: "/tv/on_the_air",
  mustWatch:   "/tv/top_rated",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatEpisodes(seasons, episodes) {
  if (!seasons || !episodes) return null;
  return `${seasons} Season${seasons > 1 ? "s" : ""} • ${episodes} Episode${episodes > 1 ? "s" : ""}`;
}

// ── Card builder ──────────────────────────────────────────────────────────────

function buildTVShowCard(show, details) {
  try {
    const base = normalizeTV(show    ?? {});
    const det  = normalizeTV(details ?? {});
    if (!base.id) return null;

    const episodesInfo =
      formatEpisodes(det.number_of_seasons,  det.number_of_episodes)  ||
      formatEpisodes(show?.number_of_seasons, show?.number_of_episodes);

    const duration = det.episode_run_time ? `${det.episode_run_time}m` : "Unknown";

    return {
      id:                  base.id,
      tvShowId:            base.id,
      title:               base.name || "Unknown",
      img:                 base.posterUrl || buildImageUrl(show?.poster_path, "w500"),
      rating:              formatRating(det.vote_average ?? base.vote_average),
      vote_average:        det.vote_average ?? base.vote_average,
      duration,
      year:                getYearFromDate(base.first_air_date) || "Unknown",
      genre:               det.genres?.[0]?.name ?? base.genres?.[0]?.name ?? "TV Show",
      episodes:            episodesInfo,
      backdrop_path:       base.backdrop_path,
      overview:            base.overview,
      first_air_date:      base.first_air_date,
      last_air_date:       base.last_air_date,
      number_of_seasons:   base.number_of_seasons,
      number_of_episodes:  base.number_of_episodes,
      poster_path:         base.poster_path,
      media_type:          "tv",
    };
  } catch (err) {
    console.error("[fetchTVShowsByCategory] buildTVShowCard:", err);
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function fetchTVShowsByCategory(category, signal) {
  return fetchByCategory(
    {
      category,
      endpoints:  ENDPOINTS,
      mediaType:  "tv",
      buildCard:  buildTVShowCard,
      labelField: "name",
    },
    signal
  );
}