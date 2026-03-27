import { apiClient, normalizeTV } from "./tmdb";
import {
  buildImageUrl,
  getYearFromDate,
  formatRating,
  createBoundedCache,
  WEEKLY_TTL_MS,
} from "../utils/helpers";

const tvDetailsCache = createBoundedCache(100, WEEKLY_TTL_MS);

async function fetchTVShowDetails(tvId, signal) {
  if (!tvId) return null;
  
  try {
    if (tvDetailsCache.has(tvId)) {
      const cached = tvDetailsCache.get(tvId);
      if (cached) return cached;
    }
    
    const { data } = await apiClient.get(`/tv/${tvId}`, { signal });
    
    if (data && data.id) {
      tvDetailsCache.set(tvId, data);
      return data;
    }
    return null;
  } catch (error) {
    if (error?.name !== 'CanceledError' && error?.name !== 'AbortError') {
      console.debug(`Failed to fetch TV show details for ID ${tvId}`);
    }
    return null;
  }
}

function formatEpisodes(seasons, episodes) {
  if (!seasons || !episodes) return null;
  const seasonPlural = seasons > 1 ? "s" : "";
  const episodePlural = episodes > 1 ? "s" : "";
  return `${seasons} Season${seasonPlural} • ${episodes} Episode${episodePlural}`;
}

function buildTVShowCard(show, details) {
  try {
    const normalized = normalizeTV(show || {});
    const normalizedDetails = normalizeTV(details || {});

    if (!normalized.id) return null;

    const genreName =
      normalized.genres?.[0]?.name ||
      normalizedDetails.genres?.[0]?.name ||
      "TV Show";

    const episodesInfo =
      formatEpisodes(
        normalizedDetails.number_of_seasons,
        normalizedDetails.number_of_episodes
      ) ||
      formatEpisodes(show?.number_of_seasons, show?.number_of_episodes);

    const duration = normalizedDetails.episode_run_time
      ? `${normalizedDetails.episode_run_time}m`
      : "Unknown";

    const finalRating = normalizedDetails.vote_average ?? normalized.vote_average;

    return {
      id: normalized.id,
      title: normalized.name || "Unknown",
      img: normalized.posterUrl || buildImageUrl(show?.poster_path, "w500"),
      rating: formatRating(finalRating),
      vote_average: finalRating,
      duration,
      year: getYearFromDate(normalized.first_air_date) || "Unknown",
      genre: genreName,
      episodes: episodesInfo,
      backdrop_path: normalized.backdrop_path,
      overview: normalized.overview,
      first_air_date: normalized.first_air_date,
      last_air_date: normalized.last_air_date,
      number_of_seasons: normalized.number_of_seasons,
      number_of_episodes: normalized.number_of_episodes,
      poster_path: normalized.poster_path,
      media_type: "tv",
      tvShowId: normalized.id,
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

    if (!data) {
      console.warn(`Invalid response for category: ${category}`);
      return [];
    }

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

            
            return {
              ...card,
              genreId: genre.id,
              genre: genre.name,
              categoryShow: true,
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
              media_type: "tv",
              categoryShow: true,
              isFallback: true,
            };
          }
        })
      );
      
      return genresWithImages.filter(g => g != null);
    }

    const shows = Array.isArray(data.results)
      ? data.results
          .filter((show) => show && show.id && !show.adult && show.poster_path)
          .slice(0, 50)
      : [];

    if (shows.length === 0) {
      console.debug(`No valid results for TV category: ${category}`);
      return [];
    }

    const showsWithDetails = await Promise.all(
      shows.map(async (show) => {
        try {
          const details = await fetchTVShowDetails(show.id, signal);
          const card = buildTVShowCard(show, details);

          if (import.meta?.env?.DEV) {
            console.log(`Show: ${show.name || 'Unknown'}, ID: ${show.id}, Rating (API): ${show.vote_average}, Rating (Details): ${details?.vote_average}, Final Rating: ${card?.vote_average}`);
          }

          return card;
        } catch (error) {
          const isCanceled = error?.name === 'CanceledError' || error?.name === 'AbortError';
          if (!isCanceled) {
            console.debug(`Error processing show ${show.id}:`, error.message);
          }

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
    
    return [];
  }
}