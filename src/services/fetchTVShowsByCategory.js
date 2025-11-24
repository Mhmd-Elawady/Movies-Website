import { apiClient, normalizeTV } from "./tmdb";
import {
  buildImageUrl,
  getYearFromDate,
  formatRating,
  createBoundedCache,
  WEEKLY_TTL_MS,
} from "../utils/helpers";

// Bounded cache for TV show details — now using weekly TTL
const tvDetailsCache = createBoundedCache(100, WEEKLY_TTL_MS);

/**
 * Helper function to fetch TV show details with caching and validation
 */
async function fetchTVShowDetails(tvId, signal) {
  if (!tvId) return null;
  
  try {
    // Check cache first (with TTL expiration)
    if (tvDetailsCache.has(tvId)) {
      const cached = tvDetailsCache.get(tvId);
      if (cached) return cached;
    }
    
    const { data } = await apiClient.get(`/tv/${tvId}`, { signal });
    
    // Validate response has required fields
    if (data && data.id) {
      tvDetailsCache.set(tvId, data);
      return data;
    }
    return null;
  } catch (error) {
    // Log only non-canceled errors
    if (error?.name !== 'CanceledError' && error?.name !== 'AbortError') {
      console.debug(`Failed to fetch TV show details for ID ${tvId}`);
    }
    return null;
  }
}

/**
 * Format episodes info string
 */
function formatEpisodes(seasons, episodes) {
  if (!seasons || !episodes) return null;
  const seasonPlural = seasons > 1 ? "s" : "";
  const episodePlural = episodes > 1 ? "s" : "";
  return `${seasons} Season${seasonPlural} • ${episodes} Episode${episodePlural}`;
}

/**
 * Build consistent TV show card data from raw and detailed data
 */
function buildTVShowCard(show, details) {
  try {
    const normalized = normalizeTV(show || {});
    const normalizedDetails = normalizeTV(details || {});

    if (!normalized.id) return null; // Skip if no ID

    // Get genre name - try multiple sources
    const genreName =
      normalized.genres?.[0]?.name ||
      normalizedDetails.genres?.[0]?.name ||
      "TV Show";

    // Format episodes info
    const episodesInfo =
      formatEpisodes(
        normalizedDetails.number_of_seasons,
        normalizedDetails.number_of_episodes
      ) ||
      formatEpisodes(show?.number_of_seasons, show?.number_of_episodes);

    const duration = normalizedDetails.episode_run_time
      ? `${normalizedDetails.episode_run_time}m`
      : "Unknown";

    // Prefer detailed vote_average over basic, but use whichever is available
    const finalRating = normalizedDetails.vote_average ?? normalized.vote_average;

    return {
      id: normalized.id,
      title: normalized.name || "Unknown",
      img: normalized.posterUrl || buildImageUrl(show?.poster_path, "w500"),
      rating: formatRating(finalRating), // Formatted string for display (e.g., "8.5")
      vote_average: finalRating,         // Raw number for logic/storage (e.g., 8.5)
      duration,
      year: getYearFromDate(normalized.first_air_date) || "Unknown",
      genre: genreName,
      episodes: episodesInfo,
      type: "tvshow",
      backdrop_path: normalized.backdrop_path,
      overview: normalized.overview,
      first_air_date: normalized.first_air_date,
      last_air_date: normalized.last_air_date,
      number_of_seasons: normalized.number_of_seasons,
      number_of_episodes: normalized.number_of_episodes,
      tvShowId: normalized.id, // For navigation
    };
  } catch (error) {
    console.error('Error building TV show card:', error);
    return null;
  }
}

export async function fetchTVShowsByCategory(category, signal) {
  const endpoints = {
    genres: "/genre/tv/list",
    trending: "/trending/tv/week",
    newReleases: "/tv/on_the_air",
    mustWatch: "/tv/top_rated",
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

    // Handle genres - fetch one representative show per genre
    if (category === "genres") {
      const genresWithImages = await Promise.all(
        (data.genres || []).map(async (genre) => {
          try {
            const { data: showsData } = await apiClient.get(`/discover/tv`, {
              params: {
                with_genres: genre.id,
                sort_by: "popularity.desc",
                page: 1,
              },
              signal,
            });

            // Find first valid show for this genre
            const safeShow =
              (showsData.results || []).find((s) => s?.id && !s.adult && s.poster_path) ||
              (showsData.results || []).find((s) => s?.id && !s.adult) ||
              (showsData.results || [])[0];

            if (!safeShow?.id) {
              throw new Error(`No valid TV show found for genre ${genre.name}`);
            }

            const details = await fetchTVShowDetails(safeShow.id, signal);
            const card = buildTVShowCard(safeShow, details);
            
            if (!card) {
              throw new Error('Failed to build TV show card');
            }

            // Override genre and ID for category view
            return {
              ...card,
              genre: genre.name,
              id: genre.id, // Use genre ID for category identification
              categoryShow: true, // Mark as category genre
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
              type: "tvshow",
              categoryShow: true,
            };
          }
        })
      );
      
      return genresWithImages.filter(g => g != null);
    }

    // Handle other categories - trending, newReleases, mustWatch
    const shows = Array.isArray(data.results)
      ? data.results
          .filter((show) => show && show.id && !show.adult && show.poster_path)
          .slice(0, 50) // Limit to 50 items for performance
      : [];

    if (shows.length === 0) {
      console.debug(`No valid results for TV category: ${category}`);
      return [];
    }

    // Fetch details for all shows in parallel
    const showsWithDetails = await Promise.all(
      shows.map(async (show) => {
        try {
          const details = await fetchTVShowDetails(show.id, signal);
          const card = buildTVShowCard(show, details);

          // Debug: log show rating
          if (import.meta?.env?.DEV) {
            console.log(`Show: ${show.name || 'Unknown'}, ID: ${show.id}, Rating (API): ${show.vote_average}, Rating (Details): ${details?.vote_average}, Final Rating: ${card?.vote_average}`);
          }

          return card;
        } catch (error) {
          const isCanceled = error?.name === 'CanceledError' || error?.name === 'AbortError';
          if (!isCanceled) {
            console.debug(`Error processing show ${show.id}:`, error.message);
          }

          // Return basic card without details
          return buildTVShowCard(show, null);
        }
      })
    );

    return showsWithDetails.filter((show) => show != null && show.id);
  } catch (error) {
    const isCanceled = error?.name === 'CanceledError' || error?.name === 'AbortError';
    if (!isCanceled) {
      console.error(`Error fetching TV category ${category}:`, error.message || error);
    } else if (import.meta?.env?.DEV) {
      console.debug(`Fetch for TV category ${category} was canceled`);
    }
    
    // Return empty array on error to prevent UI crashes
    return [];
  }
}
