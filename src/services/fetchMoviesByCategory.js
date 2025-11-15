import { apiClient, IMAGE_BASE_URL, normalizeMovie } from "./tmdb";
import {
  formatDuration,
  getYearFromDate,
  formatRating,
  buildImageUrl,
  createBoundedCache,
} from "../utils/helpers";

// Bounded cache for movie details to prevent memory leaks
const detailsCache = createBoundedCache(100);

// Helper function to fetch movie details with caching
async function fetchMovieDetails(movieId, signal) {
  if (!movieId) return null;
  if (detailsCache.has(movieId)) return detailsCache.get(movieId);
  try {
    const { data } = await apiClient.get(`/movie/${movieId}`, { signal });
    detailsCache.set(movieId, data);
    return data;
  } catch {
    return null;
  }
}

export async function fetchMoviesByCategory(category, signal) {
  const endpoints = {
    genres: "/genre/movie/list",
    trending: "/trending/movie/week",
    newReleases: "/movie/now_playing",
    mustWatch: "/movie/top_rated",
  };

  const endpoint = endpoints[category];

  if (!endpoint) {
    console.warn(`Unknown category: ${category}`);
    return [];
  }

  try {
    const response = await apiClient.get(endpoint, { signal });
    const data = response?.data;

    // Validate response
    if (!data) {
      console.warn(`Invalid response for category: ${category}`);
      return [];
    }

    if (category === "genres") {
      // For each genre pick one representative movie (first non-adult if possible).
      // Use Promise.all but reuse cached movie details to reduce pressure.
      const genresWithImages = await Promise.all(
        (data.genres || []).map(async (genre) => {
          try {
            const { data: movies } = await apiClient.get(`/discover/movie`, {
              params: {
                with_genres: genre.id,
                sort_by: "popularity.desc",
                page: 1,
              },
              signal,
            });

            const safeMovie =
              (movies.results || []).find((m) => !m.adult && m.poster_path) ||
              (movies.results || []).find((m) => !m.adult) ||
              (movies.results || [])[0];

            if (!safeMovie) {
              throw new Error(`No valid movie found for genre ${genre.name}`);
            }

            const details = await fetchMovieDetails(safeMovie.id, signal);
            const normalized = normalizeMovie(safeMovie || {});
            const normalizedDetails = normalizeMovie(details || {});

            return {
              id: genre.id,
              title: genre.name,
              img:
                normalized.posterUrl ||
                buildImageUrl(
                  safeMovie?.poster_path,
                  "w500",
                  `https://via.placeholder.com/500x750/1a1a1a/ffffff?text=${encodeURIComponent(
                    genre.name
                  )}`
                ),
              rating: formatRating(normalized.vote_average),
              duration: formatDuration(normalizedDetails.runtime),
              year: getYearFromDate(normalized.release_date) || "Unknown",
              genre: genre.name,
              // Include movie ID for navigation
              movieId: normalized.id || safeMovie.id,
            };
          } catch {
            // return a safe fallback for this genre
            return {
              id: genre.id,
              title: genre.name,
              img: `https://via.placeholder.com/500x750/1a1a1a/ffffff?text=${encodeURIComponent(
                genre.name
              )}`,
              rating: "N/A",
              duration: "Unknown",
              year: "Unknown",
              genre: genre.name,
            };
          }
        })
      );
      return genresWithImages;
    }

    // Other categories - increase limit for better data display
    const results = Array.isArray(data.results)
      ? data.results
          .filter(
            (movie) => movie && movie.id && !movie.adult && movie.poster_path
          )
          .slice(0, 50) // Increased from 20 to 50 for better coverage
      : [];

    if (results.length === 0) {
      return [];
    }

    const moviesWithDetails = await Promise.all(
      results.map(async (movie) => {
        try {
          const details = await fetchMovieDetails(movie.id, signal);
          const normalized = normalizeMovie(movie || {});
          const normalizedDetails = normalizeMovie(details || {});

          // Extract first genre name if available, otherwise use "Movie"
          const genreName =
            (movie.genres && movie.genres.length > 0 && movie.genres[0].name) ||
            (normalized.genres &&
              normalized.genres.length > 0 &&
              normalized.genres[0].name) ||
            (normalizedDetails.genres &&
              normalizedDetails.genres.length > 0 &&
              normalizedDetails.genres[0].name) ||
            "Movie";

          return {
            id: normalized.id || movie.id,
            title: normalized.title || movie.title || movie.name || "Unknown",
            img:
              normalized.posterUrl || buildImageUrl(movie.poster_path, "w500"),
            rating: formatRating(normalized.vote_average || movie.vote_average),
            duration: formatDuration(
              normalizedDetails.runtime || details?.runtime
            ),
            year:
              getYearFromDate(normalized.release_date || movie.release_date) ||
              "Unknown",
            genre: genreName,
            // Include additional fields for better data handling
            backdrop_path: normalized.backdrop_path || movie.backdrop_path,
            overview: normalized.overview || movie.overview,
            release_date: normalized.release_date || movie.release_date,
          };
        } catch (error) {
          const isCanceled =
            error?.name === "CanceledError" ||
            error?.name === "AbortError" ||
            error?.code === "ERR_CANCELED" ||
            error?.message === "canceled";
          if (!isCanceled) {
            console.error(`Error processing movie ${movie.id}:`, error);
          } else if (import.meta?.env?.DEV) {
            console.debug(`Processing movie ${movie.id} canceled`);
          }

          // Return basic movie data even if details fail or were canceled
          const normalized = normalizeMovie(movie || {});
          const genreName =
            (movie.genres && movie.genres.length > 0 && movie.genres[0].name) ||
            (normalized.genres &&
              normalized.genres.length > 0 &&
              normalized.genres[0].name) ||
            "Movie";

          return {
            id: normalized.id || movie.id,
            title: normalized.title || movie.title || movie.name || "Unknown",
            img:
              normalized.posterUrl || buildImageUrl(movie.poster_path, "w500"),
            rating: formatRating(normalized.vote_average || movie.vote_average),
            duration: "Unknown",
            year:
              getYearFromDate(normalized.release_date || movie.release_date) ||
              "Unknown",
            genre: genreName,
            backdrop_path: normalized.backdrop_path || movie.backdrop_path,
            overview: normalized.overview || movie.overview,
            release_date: normalized.release_date || movie.release_date,
          };
        }
      })
    );

    return moviesWithDetails.filter((movie) => movie != null && movie.id);
  } catch (err) {
    const isCanceled =
      err?.name === "CanceledError" ||
      err?.name === "AbortError" ||
      err?.code === "ERR_CANCELED" ||
      err?.message === "canceled";
    if (isCanceled) {
      if (import.meta?.env?.DEV) {
        console.debug(`Fetch for category ${category} was canceled`);
      }
      return [];
    }
    console.error(`Error fetching ${category}:`, err.message || err);
    // Return empty array on error to prevent UI crashes
    return [];
  }
}
