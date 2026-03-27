import { apiClient, IMAGE_BASE_URL, normalizeMovie } from "./tmdb";
import {
  formatDuration,
  getYearFromDate,
  formatRating,
  buildImageUrl,
  createBoundedCache,
  WEEKLY_TTL_MS,
} from "../utils/helpers";


const detailsCache = createBoundedCache(100, WEEKLY_TTL_MS);


async function fetchMovieDetails(movieId, signal) {
  if (!movieId) return null;
  
  try {
    if (detailsCache.has(movieId)) {
      const cached = detailsCache.get(movieId);
      if (cached) return cached;
    }
    
    const { data } = await apiClient.get(`/movie/${movieId}`, { signal });
    
    if (data && data.id) {
      detailsCache.set(movieId, data);
      return data;
    }
    return null;
  } catch (error) {
    if (error?.name !== 'CanceledError' && error?.name !== 'AbortError') {
      console.debug(`Failed to fetch movie details for ID ${movieId}`);
    }
    return null;
  }
}


function buildMovieCard(movie, details) {
  try {
    const normalized = normalizeMovie(movie || {});
    const normalizedDetails = normalizeMovie(details || {});

    if (!normalized.id) return null;

    const genreName = 
      normalized.genres?.[0]?.name ||
      normalizedDetails.genres?.[0]?.name ||
      "Movie";

    const finalRating = normalizedDetails.vote_average ?? normalized.vote_average;

    return {
      id: normalized.id,
      title: normalized.title || "Unknown",
      img: normalized.posterUrl || buildImageUrl(movie?.poster_path, "w500"),
      rating: formatRating(finalRating),
      vote_average: finalRating,
      duration: formatDuration(normalizedDetails.runtime),
      year: getYearFromDate(normalized.release_date) || "Unknown",
      genre: genreName,
      backdrop_path: normalized.backdrop_path,
      overview: normalized.overview,
      release_date: normalized.release_date,
      poster_path: normalized.poster_path,
      media_type: "movie",
      movieId: normalized.id,
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

    if (!data) {
      console.warn(`Invalid response for category: ${category}`);
      return [];
    }

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

            return {
              ...card,
              genreId: genre.id,
              genre: genre.name,
              categoryMovie: true,
            };
          } catch (error) {
            const isCanceled = error?.name === 'CanceledError' || error?.name === 'AbortError';
            if (!isCanceled) {
              console.debug(`Error fetching genre ${genre.name}:`, error.message);
            }
            
            return {
              id: genre.id, 
              genreId: genre.id,
              title: genre.name,
              img: `https://via.placeholder.com/500x750/1a1a1a/ffffff?text=${encodeURIComponent(genre.name)}`,
              rating: "N/A",
              duration: "Unknown",
              year: "Unknown",
              genre: genre.name,
              categoryMovie: true,
              isFallback: true, 
            };
          }
        })
      );
      
      return genresWithImages.filter(g => g != null);
    }

    const results = Array.isArray(data.results)
      ? data.results
          .filter((movie) => movie && movie.id && !movie.adult && movie.poster_path)
          .slice(0, 50)
      : [];

    if (results.length === 0) {
      console.debug(`No valid results for category: ${category}`);
      return [];
    }

    const moviesWithDetails = await Promise.all(
      results.map(async (movie) => {
        try {
          const details = await fetchMovieDetails(movie.id, signal);
          const card = buildMovieCard(movie, details);
          
          if (import.meta?.env?.DEV) {
            console.log(`Movie: ${movie.title || 'Unknown'}, ID: ${movie.id}, Rating (API): ${movie.vote_average}, Rating (Details): ${details?.vote_average}, Final Rating: ${card?.vote_average}`);
          }
          
          return card;
        } catch (error) {
          const isCanceled = error?.name === 'CanceledError' || error?.name === 'AbortError';
          if (!isCanceled) {
            console.debug(`Error processing movie ${movie.id}:`, error.message);
          }
          
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
    
    return [];
  }
}