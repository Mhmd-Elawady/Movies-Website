import { useEffect, useState, useCallback, useMemo } from "react";
import { apiClient, IMAGE_BASE_URL, normalizeTV } from "../services/tmdb";
import {
  findTrailer,
  parseNumericId,
  createBoundedCache,
} from "../utils/helpers";

// Bounded cache to prevent memory leaks
const tvCache = createBoundedCache(50);

const useTVShow = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trailers, setTrailers] = useState([]);

  useEffect(() => {
    const numericId = parseNumericId(id);
    if (!numericId) {
      setLoading(false);
      setError("Invalid TV show ID");
      return;
    }

    // Check cache first
    if (tvCache.has(numericId)) {
      const cached = tvCache.get(numericId);
      setData(cached.data || null);
      setTrailers(cached.trailers || []);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const fetchTVShowData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add retry mechanism for network failures
        const fetchWithRetry = async (url, retries = 2) => {
          for (let i = 0; i <= retries; i++) {
            try {
              const response = await apiClient.get(url, {
                signal: controller.signal,
              });
              return response;
            } catch (err) {
              // If it's the last retry or not a network error, throw
              if (
                i === retries ||
                (err.response && err.response.status < 500)
              ) {
                throw err;
              }
              // Wait before retrying (exponential backoff)
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * (i + 1))
              );
            }
          }
        };

        const [
          { data: tvShowData },
          { data: creditsData },
          { data: videosData },
        ] = await Promise.all([
          fetchWithRetry(`/tv/${numericId}`),
          fetchWithRetry(`/tv/${numericId}/credits`),
          fetchWithRetry(`/tv/${numericId}/videos`),
        ]);

        if (!isMounted) return;

        // Validate API responses
        if (!tvShowData || !tvShowData.id) {
          throw new Error("Invalid TV show data received from API");
        }

        // Extract trailer videos with validation
        const trailerVideos = Array.isArray(videosData?.results)
          ? videosData.results.filter(
              (video) =>
                video &&
                video.type === "Trailer" &&
                video.site === "YouTube" &&
                video.key
            )
          : [];

        // Validate and normalize data
        const normalizedShow = normalizeTV(tvShowData || {});
        const normalizedCast = Array.isArray(creditsData?.cast)
          ? creditsData.cast.filter((actor) => actor && actor.id).slice(0, 12)
          : [];
        const normalizedCrew = Array.isArray(creditsData?.crew)
          ? creditsData.crew.filter((person) => person && person.id).slice(0, 6)
          : [];

        const normalized = {
          tvShow: normalizedShow,
          cast: normalizedCast,
          crew: normalizedCrew,
        };

        setData(normalized);
        setTrailers(trailerVideos);
        tvCache.set(numericId, { data: normalized, trailers: trailerVideos });
      } catch (err) {
        if (err.name !== "AbortError" && isMounted) {
          console.error("Error fetching TV show data:", err);
          setError(err.message || "Failed to fetch TV show data");
          setData(null);
          setTrailers([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTVShowData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id]);

  // Memoized helper functions to prevent unnecessary re-renders
  const getTrailerUrl = useCallback(() => {
    if (trailers.length > 0 && trailers[0]?.key) {
      return `https://www.youtube.com/embed/${trailers[0].key}`;
    }
    return null;
  }, [trailers]);

  const hasTrailer = useCallback(() => {
    return trailers.length > 0;
  }, [trailers.length]);

  const getAllTrailers = useMemo(() => {
    return trailers.map((trailer) => ({
      id: trailer.id,
      key: trailer.key,
      name: trailer.name,
      url: `https://www.youtube.com/embed/${trailer.key}`,
    }));
  }, [trailers]);

  const getMainCast = useMemo(() => {
    return data?.cast?.slice(0, 8) || [];
  }, [data?.cast]);

  const getShowInfo = useMemo(() => {
    if (!data?.tvShow) return null;

    return {
      title: data.tvShow.name,
      overview: data.tvShow.overview,
      rating: data.tvShow.vote_average,
      genres: data.tvShow.genres,
      firstAirDate: data.tvShow.first_air_date,
      lastAirDate: data.tvShow.last_air_date,
      episodes: data.tvShow.number_of_episodes,
      seasons: data.tvShow.number_of_seasons,
      status: data.tvShow.status,
    };
  }, [data?.tvShow]);

  return {
    data,
    loading,
    error,
    IMG: IMAGE_BASE_URL,
    getTrailerUrl,
    hasTrailer,
    getAllTrailers,
    getMainCast,
    getShowInfo,
    trailers,
  };
};

export default useTVShow;
