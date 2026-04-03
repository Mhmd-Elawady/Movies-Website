/**
 * movieSearch.js
 * Search for a movie by name and return normalized data.
 */

import { apiClient, normalizeMovie } from "../services/tmdb";

/**
 * Search TMDB for a movie by name.
 * Returns the top result normalized, or throws if not found.
 *
 * @param {string} movieName
 * @returns {Promise<object>} Normalized movie with `searchMatch: true`
 */
export const getMovieData = async (movieName) => {
  if (!movieName || typeof movieName !== "string") {
    throw new Error("Movie name must be a non-empty string");
  }

  const { data } = await apiClient.get("/search/movie", {
    params: { query: movieName.trim(), page: 1 },
  });

  const result = data?.results?.[0];
  if (!result) throw new Error(`Movie "${movieName}" not found`);

  return { ...normalizeMovie(result), searchMatch: true };
};