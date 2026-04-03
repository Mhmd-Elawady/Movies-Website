import { useMemo, useCallback } from "react";
import { apiClient, IMAGE_BASE_URL, normalizeMovie } from "../services/tmdb";
import { findTrailer, createBoundedCache } from "../utils/helpers";
import useFetch, { fetchWithRetry } from "./UseFetch";

const cache = createBoundedCache(50);

/** Fetch and normalize all movie-related data from TMDB */
async function fetchMovie(id, signal) {
  const get = (url) =>
    fetchWithRetry(() => apiClient.get(url, { signal }));

  const [
    { data: movie },
    { data: credits },
    { data: similar },
    { data: videos },
  ] = await Promise.all([
    get(`/movie/${id}`),
    get(`/movie/${id}/credits`),
    get(`/movie/${id}/similar`),
    get(`/movie/${id}/videos`),
  ]);

  if (!movie?.id) throw new Error("Invalid movie data received from API");

  return {
    movie: normalizeMovie(movie),
    cast: (credits?.cast ?? [])
      .filter((a) => a?.id)
      .slice(0, 12),
    crew: (credits?.crew ?? [])
      .filter((p) => p?.id)
      .slice(0, 6),
    similar: (similar?.results ?? [])
      .filter((m) => m?.id)
      .slice(0, 8)
      .map(normalizeMovie),
    trailer: findTrailer(videos?.results ?? []),
    allVideos: videos?.results ?? [],
  };
}

// ─────────────────────────────────────────────

const useMovie = (id) => {
  const { data, loading, error } = useFetch(id, fetchMovie, cache);

  const getTrailerUrl = useCallback(
    () => (data?.trailer?.key ? `https://www.youtube.com/embed/${data.trailer.key}` : null),
    [data?.trailer?.key]
  );

  const hasTrailer = useCallback(() => !!data?.trailer, [data?.trailer]);

  const getMainCast = useMemo(() => data?.cast?.slice(0, 8) ?? [], [data?.cast]);

  const getDirector = useMemo(
    () => data?.crew?.find((p) => p.job === "Director") ?? null,
    [data?.crew]
  );

  const getMovieInfo = useMemo(() => {
    const m = data?.movie;
    if (!m) return null;
    return {
      title:       m.title,
      overview:    m.overview,
      rating:      m.vote_average,
      genres:      m.genres,
      releaseDate: m.release_date,
      runtime:     m.runtime,
      budget:      m.budget,
      revenue:     m.revenue,
      status:      m.status,
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