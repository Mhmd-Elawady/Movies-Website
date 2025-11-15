import { apiClient, IMAGE_BASE_URL, normalizeTV } from "./tmdb";
import {
  buildImageUrl,
  getYearFromDate,
  formatRating,
  createBoundedCache,
} from "../utils/helpers";

// Bounded cache for TV show details
const tvDetailsCache = createBoundedCache(100);

// Helper function to fetch TV show details with caching
async function fetchTVShowDetails(tvId, signal) {
  if (!tvId) return null;
  if (tvDetailsCache.has(tvId)) return tvDetailsCache.get(tvId);
  try {
    const { data } = await apiClient.get(`/tv/${tvId}`, { signal });
    tvDetailsCache.set(tvId, data);
    return data;
  } catch {
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

    if (category === "genres") {
      const genresWithImages = await Promise.all(
        (data.genres || []).map(async (genre) => {
          try {
            const { data: shows } = await apiClient.get(`/discover/tv`, {
              params: {
                with_genres: genre.id,
                sort_by: "popularity.desc",
                page: 1,
              },
              signal,
            });

            const safeShow =
              (shows.results || []).find((s) => !s.adult && s.poster_path) ||
              (shows.results || []).find((s) => !s.adult) ||
              (shows.results || [])[0];

            if (!safeShow) {
              throw new Error(`No valid TV show found for genre ${genre.name}`);
            }

            const details = await fetchTVShowDetails(safeShow.id, signal);
            const normalized = normalizeTV(safeShow || {});
            const normalizedDetails = normalizeTV(details || {});

            // Format episodes info if available
            const episodesInfo =
              details?.number_of_seasons && details?.number_of_episodes
                ? `${details.number_of_seasons} Season${
                    details.number_of_seasons > 1 ? "s" : ""
                  } • ${details.number_of_episodes} Episode${
                    details.number_of_episodes > 1 ? "s" : ""
                  }`
                : undefined;

            return {
              id: genre.id,
              title: genre.name,
              img:
                normalized.posterUrl ||
                buildImageUrl(
                  safeShow?.poster_path,
                  "w500",
                  `https://via.placeholder.com/500x750/1a1a1a/ffffff?text=${encodeURIComponent(
                    genre.name
                  )}`
                ),
              rating: formatRating(
                normalized.vote_average || safeShow?.vote_average
              ),
              duration: normalizedDetails.episode_run_time?.[0]
                ? `${normalizedDetails.episode_run_time[0]}m`
                : details?.episode_run_time?.[0]
                ? `${details.episode_run_time[0]}m`
                : "Unknown",
              year:
                getYearFromDate(
                  normalized.first_air_date || safeShow?.first_air_date
                ) || "Unknown",
              genre: genre.name,
              episodes: episodesInfo,
              type: "tvshow",
              // Include TV show ID for navigation
              tvShowId: normalized.id || safeShow.id,
            };
          } catch {
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
              type: "tvshow",
            };
          }
        })
      );
      return genresWithImages;
    }

    const shows = Array.isArray(data.results)
      ? data.results
          .filter((show) => show && show.id && !show.adult && show.poster_path)
          .slice(0, 50)
      : [];

    if (shows.length === 0) {
      return [];
    }

    // Fetch details for shows in parallel batches to optimize performance
    const showsWithDetails = await Promise.all(
      shows.map(async (show) => {
        try {
          const details = await fetchTVShowDetails(show.id, signal);
          const normalized = normalizeTV(show || {});
          const normalizedDetails = normalizeTV(details || {});

          // Extract first genre name if available, otherwise use "TV Show"
          const genreName =
            (show.genres && show.genres.length > 0 && show.genres[0].name) ||
            (normalized.genres &&
              normalized.genres.length > 0 &&
              normalized.genres[0].name) ||
            (normalizedDetails.genres &&
              normalizedDetails.genres.length > 0 &&
              normalizedDetails.genres[0].name) ||
            "TV Show";

          // Format episodes info if available
          const episodesInfo =
            normalizedDetails.number_of_seasons &&
            normalizedDetails.number_of_episodes
              ? `${normalizedDetails.number_of_seasons} Season${
                  normalizedDetails.number_of_seasons > 1 ? "s" : ""
                } • ${normalizedDetails.number_of_episodes} Episode${
                  normalizedDetails.number_of_episodes > 1 ? "s" : ""
                }`
              : details?.number_of_seasons && details?.number_of_episodes
              ? `${details.number_of_seasons} Season${
                  details.number_of_seasons > 1 ? "s" : ""
                } • ${details.number_of_episodes} Episode${
                  details.number_of_episodes > 1 ? "s" : ""
                }`
              : undefined;

          return {
            id: normalized.id || show.id,
            title: normalized.name || show.name || "Unknown",
            img:
              normalized.posterUrl || buildImageUrl(show.poster_path, "w500"),
            rating: formatRating(normalized.vote_average || show.vote_average),
            duration: normalizedDetails.episode_run_time?.[0]
              ? `${normalizedDetails.episode_run_time[0]}m`
              : details?.episode_run_time?.[0]
              ? `${details.episode_run_time[0]}m`
              : "Unknown",
            year:
              getYearFromDate(
                normalized.first_air_date || show.first_air_date
              ) || "Unknown",
            genre: genreName,
            episodes: episodesInfo,
            type: "tvshow",
            // Include additional fields for better data handling
            backdrop_path: normalized.backdrop_path || show.backdrop_path,
            overview: normalized.overview || show.overview,
            first_air_date: normalized.first_air_date || show.first_air_date,
            number_of_seasons:
              normalizedDetails.number_of_seasons ||
              details?.number_of_seasons ||
              show.number_of_seasons,
            number_of_episodes:
              normalizedDetails.number_of_episodes ||
              details?.number_of_episodes ||
              show.number_of_episodes,
          };
        } catch (error) {
          const isCanceled =
            error?.name === "CanceledError" ||
            error?.name === "AbortError" ||
            error?.code === "ERR_CANCELED" ||
            error?.message === "canceled";
          if (!isCanceled) {
            console.error(`Error processing TV show ${show.id}:`, error);
          } else if (import.meta?.env?.DEV) {
            console.debug(`Processing TV show ${show.id} canceled`);
          }

          // Return basic show data even if details fail or were canceled
          const genreName =
            show.genres && show.genres.length > 0
              ? show.genres[0].name
              : "TV Show";

          return {
            id: show.id,
            title: show.name || "Unknown",
            img: buildImageUrl(show.poster_path, "w500"),
            rating: formatRating(show.vote_average),
            duration: "Unknown",
            year: getYearFromDate(show.first_air_date) || "Unknown",
            genre: genreName,
            type: "tvshow",
            backdrop_path: show.backdrop_path,
            overview: show.overview,
            first_air_date: show.first_air_date,
            number_of_seasons: show.number_of_seasons,
            number_of_episodes: show.number_of_episodes,
          };
        }
      })
    );

    return showsWithDetails.filter((show) => show != null && show.id);
  } catch (err) {
    const isCanceled =
      err?.name === "CanceledError" ||
      err?.name === "AbortError" ||
      err?.code === "ERR_CANCELED" ||
      err?.message === "canceled";
    if (isCanceled) {
      if (import.meta?.env?.DEV) {
        console.debug(`Fetch for TV category ${category} was canceled`);
      }
      return [];
    }
    console.error(`Error fetching TV shows ${category}:`, err.message || err);
    // Return empty array on error to prevent UI crashes
    return [];
  }
}
