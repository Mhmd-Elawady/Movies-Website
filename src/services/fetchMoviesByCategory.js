import { apiClient, IMAGE_BASE_URL, normalizeMovie } from "./tmdb";
import {
  formatDuration,
  getYearFromDate,
  formatRating,
  buildImageUrl,
  createBoundedCache,
  WEEKLY_TTL_MS,
} from "../utils/helpers";

// Bounded cache for movie details — now using weekly TTL
const detailsCache = createBoundedCache(100, WEEKLY_TTL_MS);

/**
 * Helper function to fetch movie details with caching and validation
 */
async function fetchMovieDetails(movieId, signal) {
  if (!movieId) return null;
  
  try {
    // Check cache first (with TTL expiration)
    if (detailsCache.has(movieId)) {
      const cached = detailsCache.get(movieId);
      if (cached) return cached;
    }
    
    const { data } = await apiClient.get(`/movie/${movieId}`, { signal });
    
    // Validate response has required fields
    if (data && data.id) {
      detailsCache.set(movieId, data);
      return data;
    }
    return null;
  } catch (error) {
    // Log only non-canceled errors
    if (error?.name !== 'CanceledError' && error?.name !== 'AbortError') {
      console.debug(`Failed to fetch movie details for ID ${movieId}`);
    }
    return null;
  }
}

/**
 * Build consistent movie card data from raw and detailed data
 */
function buildMovieCard(movie, details) {
  try {
    const normalized = normalizeMovie(movie || {});
    const normalizedDetails = normalizeMovie(details || {});

    if (!normalized.id) return null; // Skip if no ID

    // Get genre name - try multiple sources
    const genreName = 
      normalized.genres?.[0]?.name ||
      normalizedDetails.genres?.[0]?.name ||
      "Movie";

    // Prefer detailed vote_average over basic, but use whichever is available
    const finalRating = normalizedDetails.vote_average ?? normalized.vote_average;

    return {
      id: normalized.id,
      title: normalized.title || "Unknown",
      img: normalized.posterUrl || buildImageUrl(movie?.poster_path, "w500"),
      rating: formatRating(finalRating), // Formatted string for display (e.g., "8.5")
      vote_average: finalRating,         // Raw number for logic/storage (e.g., 8.5)
      duration: formatDuration(normalizedDetails.runtime),
      year: getYearFromDate(normalized.release_date) || "Unknown",
      genre: genreName,
      backdrop_path: normalized.backdrop_path,
      overview: normalized.overview,
      release_date: normalized.release_date,
      movieId: normalized.id, // For navigation
    };
  } catch (error) {
    console.error('Error building movie card:', error);
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

    // Handle genres - fetch one representative movie per genre
    if (category === "genres") {
      const genresWithImages = await Promise.all(
        (data.genres || []).map(async (genre) => {
          try {
            const { data: moviesData } = await apiClient.get(`/discover/movie`, {
              params: {
                with_genres: genre.id,
                sort_by: "popularity.desc",
                page: 1,
              },
              signal,
            });

            // Find first valid movie for this genre
            const safeMovie =
              (moviesData.results || []).find((m) => m?.id && !m.adult && m.poster_path) ||
              (moviesData.results || []).find((m) => m?.id && !m.adult) ||
              (moviesData.results || [])[0];

            if (!safeMovie?.id) {
              throw new Error(`No valid movie found for genre ${genre.name}`);
            }

            const details = await fetchMovieDetails(safeMovie.id, signal);
            const card = buildMovieCard(safeMovie, details);
            
            if (!card) {
              throw new Error('Failed to build movie card');
            }

            // Override genre for category view
            return {
              ...card,
              genre: genre.name,
              id: genre.id, // Use genre ID for category identification
              categoryMovie: true, // Mark as category genre
            };
          } catch (error) {
            // Return fallback for this genre
            const isCanceled = error?.name === 'CanceledError' || error?.name === 'AbortError';
            if (!isCanceled) {
              console.debug(`Error fetching genre ${genre.name}:`, error.message);
            }
            
            return {
              id: genre.id,
              title: genre.name,
              img: `https://via.placeholder.com/500x750/1a1a1a/ffffff?text=${encodeURIComponent(genre.name)}`,
              rating: "N/A",
              duration: "Unknown",
              year: "Unknown",
              genre: genre.name,
              categoryMovie: true,
            };
          }
        })
      );
      
      return genresWithImages.filter(g => g != null);
    }

    // Handle other categories - trending, newReleases, mustWatch
    const results = Array.isArray(data.results)
      ? data.results
          .filter((movie) => movie && movie.id && !movie.adult && movie.poster_path)
          .slice(0, 50) // Limit to 50 items for performance
      : [];

    if (results.length === 0) {
      console.debug(`No valid results for category: ${category}`);
      return [];
    }

    // Fetch details for all movies in parallel
    const moviesWithDetails = await Promise.all(
      results.map(async (movie) => {
        try {
          const details = await fetchMovieDetails(movie.id, signal);
          const card = buildMovieCard(movie, details);
          
          // Debug: log movie rating
          if (import.meta?.env?.DEV) {
            console.log(`Movie: ${movie.title || 'Unknown'}, ID: ${movie.id}, Rating (API): ${movie.vote_average}, Rating (Details): ${details?.vote_average}, Final Rating: ${card?.vote_average}`);
          }
          
          return card;
        } catch (error) {
          const isCanceled = error?.name === 'CanceledError' || error?.name === 'AbortError';
          if (!isCanceled) {
            console.debug(`Error processing movie ${movie.id}:`, error.message);
          }
          
          // Return basic card without details
          return buildMovieCard(movie, null);
        }
      })
    );

    return moviesWithDetails.filter((movie) => movie != null && movie.id);
  } catch (error) {
    const isCanceled = error?.name === 'CanceledError' || error?.name === 'AbortError';
    if (!isCanceled) {
      console.error(`Error fetching category ${category}:`, error.message || error);
    } else if (import.meta?.env?.DEV) {
      console.debug(`Fetch for category ${category} was canceled`);
    }
    
    // Return empty array on error to prevent UI crashes
    return [];
  }
}
