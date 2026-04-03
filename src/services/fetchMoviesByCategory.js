/**
 * fetchMoviesByCategory.js
 * Fetches movie lists from TMDB by category, normalized to UI-ready cards.
 */

import { normalizeMovie } from "./tmdb";
import {
  formatDuration,
  getYearFromDate,
  formatRating,
  buildImageUrl,
} from "../utils/helpers";
import { fetchByCategory } from "./fetchByCategory";


// ── TMDB endpoints ────────────────────────────────────────────────────────────

const ENDPOINTS = {
  genres:      "/genre/movie/list",
  trending:    "/trending/movie/week",
  newReleases: "/movie/now_playing",
  mustWatch:   "/movie/top_rated",
};

// ── Card builder ──────────────────────────────────────────────────────────────

function buildMovieCard(movie, details) {
  try {
    const base = normalizeMovie(movie  ?? {});
    const det  = normalizeMovie(details ?? {});
    if (!base.id) return null;

    return {
      id:           base.id,
      movieId:      base.id,
      title:        base.title  || "Unknown",
      img:          base.posterUrl || buildImageUrl(movie?.poster_path, "w500"),
      rating:       formatRating(det.vote_average ?? base.vote_average),
      vote_average: det.vote_average ?? base.vote_average,
      duration:     formatDuration(det.runtime),
      year:         getYearFromDate(base.release_date) || "Unknown",
      genre:        det.genres?.[0]?.name ?? base.genres?.[0]?.name ?? "Movie",
      backdrop_path: base.backdrop_path,
      overview:     base.overview,
      release_date: base.release_date,
      poster_path:  base.poster_path,
      media_type:   "movie",
    };
  } catch (err) {
    console.error("[fetchMoviesByCategory] buildMovieCard:", err);
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function fetchMoviesByCategory(category, signal) {
  return fetchByCategory(
    {
      category,
      endpoints:  ENDPOINTS,
      mediaType:  "movie",
      buildCard:  buildMovieCard,
      labelField: "title",
    },
    signal
  );
}