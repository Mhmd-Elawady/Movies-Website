import { useEffect, useState, useMemo, useCallback } from "react";
import { apiClient, IMAGE_BASE_URL, normalizeMovie } from "../services/tmdb";
import {
  findTrailer,
  parseNumericId,
  createBoundedCache,
} from "../utils/helpers";

// Bounded cache to prevent memory leaks
const movieCache = createBoundedCache(50);

const useMovie = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const numericId = parseNumericId(id);
    if (!numericId) {
      setLoading(false);
      setError("Invalid movie ID");
      return;
    }

    // Check cache first
    if (movieCache.has(numericId)) {
      setData(movieCache.get(numericId));
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const fetchMovieData = async () => {
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
          { data: movieData },
          { data: creditsData },
          { data: similarData },
          { data: videosData },
        ] = await Promise.all([
          fetchWithRetry(`/movie/${numericId}`),
          fetchWithRetry(`/movie/${numericId}/credits`),
          fetchWithRetry(`/movie/${numericId}/similar`),
          fetchWithRetry(`/movie/${numericId}/videos`),
        ]);

        if (!isMounted) return;

        // Validate API responses
        if (!movieData || !movieData.id) {
          throw new Error("Invalid movie data received from API");
        }

        const trailer = findTrailer(videosData?.results || []);

        // Validate and normalize data
        const normalizedMovieData = normalizeMovie(movieData || {});
        const normalizedSimilar = Array.isArray(similarData?.results)
          ? similarData.results
              .filter((m) => m && m.id)
              .slice(0, 8)
              .map((m) => normalizeMovie(m))
          : [];

        const normalized = {
          movie: normalizedMovieData,
          cast: Array.isArray(creditsData?.cast)
            ? creditsData.cast.filter((actor) => actor && actor.id).slice(0, 12)
            : [],
          crew: Array.isArray(creditsData?.crew)
            ? creditsData.crew
                .filter((person) => person && person.id)
                .slice(0, 6)
            : [],
          similar: normalizedSimilar,
          trailer: trailer,
          allVideos: Array.isArray(videosData?.results)
            ? videosData.results
            : [],
        };

        setData(normalized);
        movieCache.set(numericId, normalized);
      } catch (err) {
        if (err.name !== "AbortError" && isMounted) {
          console.error("Error fetching movie data:", err);
          setError(err.message || "Failed to fetch movie data");
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMovieData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id]);

  // Memoized helper functions to prevent unnecessary re-renders
  const getTrailerUrl = useCallback(() => {
    if (data?.trailer?.key) {
      return `https://www.youtube.com/embed/${data.trailer.key}`;
    }
    return null;
  }, [data?.trailer?.key]);

  const hasTrailer = useCallback(() => {
    return !!data?.trailer;
  }, [data?.trailer]);

  const getMainCast = useMemo(() => {
    return data?.cast?.slice(0, 8) || [];
  }, [data?.cast]);

  const getDirector = useMemo(() => {
    return data?.crew?.find((person) => person.job === "Director") || null;
  }, [data?.crew]);

  const getMovieInfo = useMemo(() => {
    if (!data?.movie) return null;

    return {
      title: data.movie.title,
      overview: data.movie.overview,
      rating: data.movie.vote_average,
      genres: data.movie.genres,
      releaseDate: data.movie.release_date,
      runtime: data.movie.runtime,
      budget: data.movie.budget,
      revenue: data.movie.revenue,
      status: data.movie.status,
    };
  }, [data?.movie]);

  return {
    data,
    loading,
    error,
    IMG: IMAGE_BASE_URL,
    getTrailerUrl,
    hasTrailer,
    getMainCast,
    getDirector,
    getMovieInfo,
  };
};

export default useMovie;
